#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import shutil
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Install the local workflow-use Codex skill")
    parser.add_argument(
        "--source",
        default=Path(__file__).resolve().parents[1] / "skills" / "workflow-use",
        type=Path,
        help="Path to the workflow-use skill source directory",
    )
    parser.add_argument(
        "--dest-root",
        default=Path(os.environ.get("CODEX_HOME", Path.home() / ".codex")) / "skills",
        type=Path,
        help="Root skills directory (defaults to $CODEX_HOME/skills)",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite an existing installation",
    )
    args = parser.parse_args()

    source = args.source.resolve()
    dest = args.dest_root.resolve() / source.name

    if not source.is_dir():
        raise SystemExit(f"Source skill directory not found: {source}")

    if dest.exists():
        if not args.force:
            raise SystemExit(
                f"Destination already exists: {dest}. Re-run with --force to overwrite."
            )
        shutil.rmtree(dest)

    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(source, dest)
    print(f"Installed {source.name} to {dest}")
    print("Restart Codex to pick up new skills.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
