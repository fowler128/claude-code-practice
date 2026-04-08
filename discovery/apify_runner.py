#!/usr/bin/env python3
"""Discovery runner for candidate creator/video/post sourcing.

- Reads seed queries by lane from discovery/seed_queries.yaml
- Uses Apify actors when configured and token is present
- Falls back to public sources (YouTube RSS + DuckDuckGo HTML search)
- Supports --dry-run mode
- Writes unified raw JSON to data/raw_candidates.json
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple
import xml.etree.ElementTree as ET

LOGGER = logging.getLogger("discovery.apify_runner")


def parse_scalar(value: str) -> Any:
    value = value.strip()
    if value.lower() in {"true", "false"}:
        return value.lower() == "true"
    if re.fullmatch(r"-?\d+", value):
        return int(value)
    if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
        return value[1:-1]
    return value


def load_simple_yaml(path: Path) -> Dict[str, Any]:
    """Very small YAML subset parser supporting dict/list, enough for config files here."""
    lines = path.read_text(encoding="utf-8").splitlines()
    root: Dict[str, Any] = {}
    stack: List[Tuple[int, Any]] = [(-1, root)]

    for i, raw in enumerate(lines):
        if not raw.strip() or raw.strip().startswith("#"):
            continue

        indent = len(raw) - len(raw.lstrip(" "))
        line = raw.strip()

        while len(stack) > 1 and indent <= stack[-1][0]:
            stack.pop()

        parent = stack[-1][1]

        if line.startswith("- "):
            if not isinstance(parent, list):
                raise ValueError(f"Invalid YAML structure near line: {raw}")
            parent.append(parse_scalar(line[2:].strip()))
            continue

        if ":" not in line:
            raise ValueError(f"Invalid YAML key/value near line: {raw}")

        key, remainder = line.split(":", 1)
        key = key.strip()
        remainder = remainder.strip()

        if remainder == "":
            next_container: Any
            next_nonempty = ""
            for nxt in lines[i + 1 :]:
                if nxt.strip() and not nxt.strip().startswith("#"):
                    next_nonempty = nxt.strip()
                    break
            next_container = [] if next_nonempty.startswith("- ") else {}
            if isinstance(parent, dict):
                parent[key] = next_container
            else:
                raise ValueError(f"Cannot assign key to non-dict near line: {raw}")
            stack.append((indent, next_container))
        else:
            if isinstance(parent, dict):
                parent[key] = parse_scalar(remainder)
            else:
                raise ValueError(f"Cannot assign scalar key to non-dict near line: {raw}")

    return root


@dataclass
class DiscoveryConfig:
    seed_path: Path
    rules_path: Path
    output_path: Path
    dry_run: bool


def flatten_queries(seed_data: Dict[str, Any]) -> List[Dict[str, str]]:
    lanes = seed_data.get("lanes", {})
    flattened: List[Dict[str, str]] = []
    for lane, queries in lanes.items():
        for query in queries or []:
            flattened.append({"lane": lane, "query": str(query)})
    return flattened


def http_json(url: str, method: str = "GET", payload: Optional[Dict[str, Any]] = None, timeout: int = 90) -> Dict[str, Any]:
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:  # nosec B310
        return json.loads(resp.read().decode("utf-8"))


def http_text(url: str, timeout: int = 30) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:  # nosec B310
        return resp.read().decode("utf-8", errors="ignore")


def call_apify_actor(actor_id: str, input_payload: Dict[str, Any], token: str) -> Optional[Dict[str, Any]]:
    base = "https://api.apify.com/v2"
    run_url = f"{base}/acts/{actor_id}/runs?token={urllib.parse.quote(token)}&waitForFinish=60"

    LOGGER.debug("Calling Apify actor=%s payload=%s", actor_id, input_payload)
    try:
        run_response = http_json(run_url, method="POST", payload=input_payload, timeout=90)
        run_data = run_response.get("data", {})
        dataset_id = run_data.get("defaultDatasetId")
        if not dataset_id:
            LOGGER.warning("Apify actor %s returned no dataset id", actor_id)
            return None

        items_url = f"{base}/datasets/{dataset_id}/items?token={urllib.parse.quote(token)}&clean=true"
        items = json.loads(http_text(items_url, timeout=90))
        return {"source": "apify", "actor_id": actor_id, "items": items}
    except Exception as exc:  # noqa: BLE001
        LOGGER.exception("Apify call failed for actor=%s: %s", actor_id, exc)
        return None


def youtube_rss_search(query: str, limit: int) -> List[Dict[str, Any]]:
    encoded = urllib.parse.quote_plus(query)
    url = f"https://www.youtube.com/feeds/videos.xml?search_query={encoded}"
    LOGGER.debug("YouTube RSS query=%s", query)

    try:
        xml_content = http_text(url, timeout=20).encode("utf-8")
    except Exception as exc:  # noqa: BLE001
        LOGGER.warning("YouTube RSS failed for query=%s error=%s", query, exc)
        return []

    ns = {"atom": "http://www.w3.org/2005/Atom", "yt": "http://www.youtube.com/xml/schemas/2015"}
    root = ET.fromstring(xml_content)
    results: List[Dict[str, Any]] = []

    for entry in root.findall("atom:entry", ns)[:limit]:
        title = entry.findtext("atom:title", default="", namespaces=ns)
        video_id = entry.findtext("yt:videoId", default="", namespaces=ns)
        author = entry.findtext("atom:author/atom:name", default="", namespaces=ns)
        published = entry.findtext("atom:published", default="", namespaces=ns)
        if video_id:
            results.append(
                {
                    "platform": "youtube",
                    "query": query,
                    "creator_name": author,
                    "video_title_or_topic": title,
                    "source_url": f"https://www.youtube.com/watch?v={video_id}",
                    "posting_date": published,
                    "raw": {"video_id": video_id},
                }
            )
    return results


def duckduckgo_site_search(query: str, site: str, limit: int, platform: str) -> List[Dict[str, Any]]:
    final_query = f"site:{site} {query}"
    encoded = urllib.parse.quote_plus(final_query)
    url = f"https://duckduckgo.com/html/?q={encoded}"
    LOGGER.debug("DuckDuckGo query=%s", final_query)

    try:
        html = http_text(url, timeout=30)
    except Exception as exc:  # noqa: BLE001
        LOGGER.warning("DuckDuckGo failed for platform=%s query=%s error=%s", platform, query, exc)
        return []

    results: List[Dict[str, Any]] = []
    marker = 'class="result__a"'
    chunks = html.split(marker)[1 : limit + 1]

    for chunk in chunks:
        href_tag = "href=\""
        href_start = chunk.find(href_tag)
        if href_start == -1:
            continue
        href_start += len(href_tag)
        href_end = chunk.find("\"", href_start)
        href = chunk[href_start:href_end]

        text_start = chunk.find(">", href_end)
        text_end = chunk.find("</a>", text_start)
        title = chunk[text_start + 1 : text_end].replace("<b>", "").replace("</b>", "").strip()

        results.append(
            {
                "platform": platform,
                "query": query,
                "creator_name": "",
                "video_title_or_topic": title,
                "source_url": href,
                "posting_date": "",
                "raw": {"search_engine": "duckduckgo", "site": site},
            }
        )

    return results


def build_dry_run_records(queries: Iterable[Dict[str, str]]) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    for item in queries:
        rows.append(
            {
                "platform": "youtube",
                "lane": item["lane"],
                "query": item["query"],
                "creator_name": "DryRun Creator",
                "video_title_or_topic": f"Dry run candidate for {item['query']}",
                "source_url": "https://example.com/dry-run",
                "posting_date": "",
                "discovery_source": "dry_run",
            }
        )
    return rows


def discover_platform(platform: str, query: str, max_results: int, actor_id: Optional[str], token: Optional[str]) -> List[Dict[str, Any]]:
    if actor_id and token:
        payload = {"query": query, "maxResults": max_results}
        apify_data = call_apify_actor(actor_id=actor_id, input_payload=payload, token=token)
        if apify_data and apify_data.get("items"):
            normalized = []
            for item in apify_data["items"]:
                normalized.append(
                    {
                        "platform": platform,
                        "query": query,
                        "creator_name": item.get("authorName") or item.get("author") or "",
                        "video_title_or_topic": item.get("title") or item.get("text") or "",
                        "source_url": item.get("url") or item.get("videoUrl") or "",
                        "posting_date": item.get("publishedAt") or item.get("createTimeISO") or "",
                        "raw": item,
                        "discovery_source": "apify",
                    }
                )
            return normalized

    if platform == "youtube":
        rows = youtube_rss_search(query=query, limit=max_results)
        for r in rows:
            r["discovery_source"] = "youtube_rss"
        return rows
    if platform == "tiktok":
        rows = duckduckgo_site_search(query=query, site="www.tiktok.com", limit=max_results, platform=platform)
        for r in rows:
            r["discovery_source"] = "duckduckgo"
        return rows
    if platform == "linkedin":
        rows = duckduckgo_site_search(query=query, site="www.linkedin.com", limit=max_results, platform=platform)
        for r in rows:
            r["discovery_source"] = "duckduckgo"
        return rows
    return []


def run(config: DiscoveryConfig) -> int:
    seed_data = load_simple_yaml(config.seed_path)
    rules_data = load_simple_yaml(config.rules_path)

    query_items = flatten_queries(seed_data)
    if not query_items:
        LOGGER.error("No queries found in %s", config.seed_path)
        return 1

    if config.dry_run:
        raw_payload = {"generated_at": int(time.time()), "dry_run": True, "records": build_dry_run_records(query_items)}
        config.output_path.parent.mkdir(parents=True, exist_ok=True)
        config.output_path.write_text(json.dumps(raw_payload, indent=2), encoding="utf-8")
        LOGGER.info("Dry run complete. Wrote %s records to %s", len(raw_payload["records"]), config.output_path)
        return 0

    platforms_cfg = seed_data.get("platforms", {})
    platform_rules = rules_data.get("platforms", {})

    token = os.getenv("APIFY_TOKEN")
    all_records: List[Dict[str, Any]] = []

    for query_item in query_items:
        lane = query_item["lane"]
        query = query_item["query"]

        for platform, p_cfg in platforms_cfg.items():
            if not p_cfg.get("enabled", True):
                continue

            max_results = int(p_cfg.get("max_results_per_query", 10))
            actor_env_name = platform_rules.get(platform, {}).get("actor_env", "")
            actor_id = os.getenv(actor_env_name) if actor_env_name else None

            rows = discover_platform(platform=platform, query=query, max_results=max_results, actor_id=actor_id, token=token)
            if not rows:
                LOGGER.warning("No results platform=%s lane=%s query=%s", platform, lane, query)
                continue

            for row in rows:
                row["lane"] = lane
            all_records.extend(rows)

    payload = {"generated_at": int(time.time()), "dry_run": False, "record_count": len(all_records), "records": all_records}
    config.output_path.parent.mkdir(parents=True, exist_ok=True)
    config.output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    LOGGER.info("Discovery complete. Wrote %s records to %s", len(all_records), config.output_path)
    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run discovery and save raw candidate JSON.")
    parser.add_argument("--seed", default="discovery/seed_queries.yaml", help="Path to seed query YAML")
    parser.add_argument("--rules", default="configs/platform_rules.yaml", help="Path to platform rules YAML")
    parser.add_argument("--output", default="data/raw_candidates.json", help="Raw JSON output path")
    parser.add_argument("--dry-run", action="store_true", help="Generate synthetic records only")
    parser.add_argument("--log-level", default="INFO", choices=["DEBUG", "INFO", "WARNING", "ERROR"], help="Log level")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    logging.basicConfig(level=getattr(logging, args.log_level), format="%(asctime)s %(levelname)s %(name)s: %(message)s")

    cfg = DiscoveryConfig(seed_path=Path(args.seed), rules_path=Path(args.rules), output_path=Path(args.output), dry_run=args.dry_run)
    return run(cfg)


if __name__ == "__main__":
    sys.exit(main())
