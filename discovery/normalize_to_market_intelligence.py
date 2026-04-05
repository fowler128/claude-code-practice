#!/usr/bin/env python3
"""Normalize discovery raw JSON into output/market_intelligence.csv."""

from __future__ import annotations

import argparse
import csv
import json
import logging
import re
import sys
from pathlib import Path
from typing import Any, Dict, Iterable, List

LOGGER = logging.getLogger("discovery.normalize")

DEFAULT_HEADER = [
    "creator_name",
    "platform",
    "video_title_or_topic",
    "source_url",
    "transcript",
    "views",
    "likes",
    "comments",
    "shares",
    "posting_date",
    "niche",
    "target_audience",
    "opening_hook",
    "cta",
    "tone",
    "credibility_markers",
    "performance_notes",
    "inferred_intent_match",
    "likely_audience_segment_attracted",
    "buyer_value",
    "buyer_value_rationale",
    "recruiter_value",
    "recruiter_value_rationale",
    "authority_signal",
    "authority_signal_rationale",
    "saturation_risk",
    "saturation_risk_rationale",
    "differentiation_potential",
    "differentiation_potential_rationale",
    "observation_vs_inference",
]

EXTRA_FIELDS = ["needs_review", "confidence_score"]


def read_existing_header(csv_path: Path) -> List[str]:
    if not csv_path.exists():
        return []
    with csv_path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.reader(f)
        try:
            return next(reader)
        except StopIteration:
            return []


def derive_niche(lane: str, title: str) -> str:
    if lane:
        return lane.replace("_", " ")
    title_l = title.lower()
    if "ai" in title_l:
        return "ai governance"
    if "compliance" in title_l or "risk" in title_l:
        return "grc"
    if "legal" in title_l:
        return "legal ops"
    return ""


def derive_opening_hook(title: str) -> str:
    clean = re.sub(r"\s+", " ", title).strip()
    return clean[:120] if clean else ""


def parse_record(raw: Dict[str, Any]) -> Dict[str, str]:
    title = str(raw.get("video_title_or_topic") or "").strip()
    record: Dict[str, str] = {
        "creator_name": str(raw.get("creator_name") or "").strip(),
        "platform": str(raw.get("platform") or "").strip(),
        "video_title_or_topic": title,
        "source_url": str(raw.get("source_url") or "").strip(),
        "transcript": str(raw.get("transcript") or "").strip(),
        "views": str(raw.get("views") or "").strip(),
        "likes": str(raw.get("likes") or "").strip(),
        "comments": str(raw.get("comments") or "").strip(),
        "shares": str(raw.get("shares") or "").strip(),
        "posting_date": str(raw.get("posting_date") or "").strip(),
        "niche": derive_niche(str(raw.get("lane") or ""), title),
        "target_audience": str(raw.get("target_audience") or "").strip(),
        "opening_hook": str(raw.get("opening_hook") or derive_opening_hook(title)).strip(),
        "cta": str(raw.get("cta") or "").strip(),
        "tone": str(raw.get("tone") or "").strip(),
        "credibility_markers": str(raw.get("credibility_markers") or "").strip(),
        "performance_notes": str(raw.get("performance_notes") or "").strip(),
        "inferred_intent_match": str(raw.get("inferred_intent_match") or "").strip(),
        "likely_audience_segment_attracted": str(raw.get("likely_audience_segment_attracted") or "").strip(),
        "buyer_value": str(raw.get("buyer_value") or "").strip(),
        "buyer_value_rationale": str(raw.get("buyer_value_rationale") or "").strip(),
        "recruiter_value": str(raw.get("recruiter_value") or "").strip(),
        "recruiter_value_rationale": str(raw.get("recruiter_value_rationale") or "").strip(),
        "authority_signal": str(raw.get("authority_signal") or "").strip(),
        "authority_signal_rationale": str(raw.get("authority_signal_rationale") or "").strip(),
        "saturation_risk": str(raw.get("saturation_risk") or "").strip(),
        "saturation_risk_rationale": str(raw.get("saturation_risk_rationale") or "").strip(),
        "differentiation_potential": str(raw.get("differentiation_potential") or "").strip(),
        "differentiation_potential_rationale": str(raw.get("differentiation_potential_rationale") or "").strip(),
        "observation_vs_inference": str(raw.get("observation_vs_inference") or "observation").strip(),
    }

    critical_missing = [k for k in ("creator_name", "source_url", "platform") if not record[k]]
    has_summary = bool(record["transcript"] or title)
    record["needs_review"] = "yes" if critical_missing or not has_summary or not record["cta"] else "no"

    confidence = 1.0
    if critical_missing:
        confidence -= 0.45
    if not record["transcript"]:
        confidence -= 0.2
    if not record["opening_hook"]:
        confidence -= 0.15
    if not record["cta"]:
        confidence -= 0.1
    record["confidence_score"] = f"{max(0.0, confidence):.2f}"
    return record


def iter_raw_records(raw_payload: Dict[str, Any]) -> Iterable[Dict[str, Any]]:
    records = raw_payload.get("records", [])
    if isinstance(records, list):
        for record in records:
            if isinstance(record, dict):
                yield record


def run(raw_json_path: Path, output_csv_path: Path) -> int:
    if not raw_json_path.exists():
        LOGGER.error("Raw file not found: %s", raw_json_path)
        return 1

    with raw_json_path.open("r", encoding="utf-8") as f:
        raw_payload = json.load(f)

    existing_header = read_existing_header(output_csv_path)
    if existing_header:
        header = existing_header.copy()
    else:
        header = DEFAULT_HEADER.copy()

    for field in EXTRA_FIELDS:
        if field not in header:
            header.append(field)

    normalized_rows = [parse_record(raw) for raw in iter_raw_records(raw_payload)]

    output_csv_path.parent.mkdir(parents=True, exist_ok=True)
    with output_csv_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=header, extrasaction="ignore")
        writer.writeheader()
        for row in normalized_rows:
            output_row = {column: row.get(column, "") for column in header}
            writer.writerow(output_row)

    LOGGER.info("Wrote %s normalized rows to %s", len(normalized_rows), output_csv_path)
    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Normalize raw candidate JSON into market intelligence CSV")
    parser.add_argument("--raw", default="data/raw_candidates.json", help="Raw candidates JSON path")
    parser.add_argument("--output", default="output/market_intelligence.csv", help="Market intelligence CSV path")
    parser.add_argument("--log-level", default="INFO", choices=["DEBUG", "INFO", "WARNING", "ERROR"], help="Log verbosity")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    logging.basicConfig(level=getattr(logging, args.log_level), format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    return run(Path(args.raw), Path(args.output))


if __name__ == "__main__":
    sys.exit(main())
