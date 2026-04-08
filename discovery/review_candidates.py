#!/usr/bin/env python3
"""Review normalized market intelligence rows for missing critical fields."""

from __future__ import annotations

import argparse
import csv
import logging
import sys
from pathlib import Path
from typing import Dict, List, Tuple

LOGGER = logging.getLogger("discovery.review")


def is_missing(value: str) -> bool:
    return not str(value or "").strip()


def evaluate_row(row: Dict[str, str]) -> Tuple[bool, List[str]]:
    issues: List[str] = []

    for field in ["creator_name", "platform", "source_url"]:
        if is_missing(row.get(field, "")):
            issues.append(f"missing_{field}")

    if is_missing(row.get("transcript", "")) and is_missing(row.get("video_title_or_topic", "")):
        issues.append("missing_transcript_or_summary")

    if is_missing(row.get("opening_hook", "")):
        issues.append("missing_opening_hook")

    if is_missing(row.get("cta", "")):
        issues.append("missing_cta")

    return (len(issues) > 0, issues)


def run(csv_path: Path, limit: int) -> int:
    if not csv_path.exists():
        LOGGER.error("CSV not found: %s", csv_path)
        return 1

    with csv_path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    total = len(rows)
    flagged = []
    issue_counts: Dict[str, int] = {}

    for idx, row in enumerate(rows, start=2):  # account for header row
        needs_review, issues = evaluate_row(row)
        if needs_review:
            flagged.append((idx, row, issues))
            for issue in issues:
                issue_counts[issue] = issue_counts.get(issue, 0) + 1

    print("=== Review Summary ===")
    print(f"Total records: {total}")
    print(f"Flagged records: {len(flagged)}")
    print("Issue breakdown:")
    if issue_counts:
        for key in sorted(issue_counts):
            print(f"- {key}: {issue_counts[key]}")
    else:
        print("- none")

    if flagged:
        print("\nSample flagged records:")
        for row_no, row, issues in flagged[:limit]:
            print(f"- row {row_no}: creator='{row.get('creator_name', '')}' platform='{row.get('platform', '')}' issues={','.join(issues)}")

    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Review market intelligence CSV and flag incomplete records")
    parser.add_argument("--csv", default="output/market_intelligence.csv", help="Path to normalized CSV")
    parser.add_argument("--sample-limit", type=int, default=20, help="Number of flagged rows to print")
    parser.add_argument("--log-level", default="INFO", choices=["DEBUG", "INFO", "WARNING", "ERROR"], help="Log verbosity")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    logging.basicConfig(level=getattr(logging, args.log_level), format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    return run(Path(args.csv), args.sample_limit)


if __name__ == "__main__":
    sys.exit(main())
