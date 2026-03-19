---
name: doc-finder
description: Documentation lookup skill for the doc-finder subagent. Use when any other agent needs internal project context from docs, AGENTS files, README files, or clearly documented source locations before planning, implementing, testing, or updating docs.
metadata:
  id: doc-finder
  version: 1.0.0
---

# Doc Finder Policy

Delegate repository documentation lookup to `.opencode/agents/doc-finder.md`.

## Search order

1. `docs/`
2. `AGENTS.md` files
3. `README.md` files
4. Source files only if the documentation trail is insufficient

## Expected result

- One short summary
- Exact file paths
- The most relevant headings or sections
- Open questions if the docs are incomplete
