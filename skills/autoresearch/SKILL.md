---
name: autoresearch
description: Wrapper skill for karpathy/autoresearch, an autonomous single-GPU LLM experimentation workflow driven by program.md instructions.
---

# autoresearch

This skill installs a local wrapper for the upstream project at:
`https://github.com/karpathy/autoresearch`

Use this skill when the user wants to:
- run or adapt the autoresearch workflow,
- understand the setup steps for karpathy/autoresearch,
- use the upstream `program.md` guidance inside Codex.

## What this skill contains

- `program.md`: a copy of the upstream agent instructions from the repository.
- This wrapper `SKILL.md`: brief usage notes for Codex.

## Important constraints

- The upstream project expects a **single NVIDIA GPU**.
- Python 3.10+ and `uv` are expected.
- The training/evaluation workflow assumes the project repository itself is available locally.
- The agent should treat `prepare.py` as read-only and only modify `train.py`, matching the upstream workflow.

## Recommended workflow

1. Clone or open `karpathy/autoresearch` locally.
2. Read `program.md` from this skill and the repo's `README.md`.
3. In the repo, follow the upstream setup:
   - `uv sync`
   - `uv run prepare.py`
   - `uv run train.py`
4. When running autonomous experiments, use a dedicated `autoresearch/<tag>` branch.

## Source

This skill was created from the public upstream repository's `README.md` and `program.md` on the `master` branch.
