---
name: docs-agent
description: Documentation workflow skill for the docs-agent subagent. Use when a completed or nearly completed task changes behavior, process, architecture, or operating instructions and the coordinator needs documentation updates without mixing that work into implementation or testing context.
metadata:
  id: docs-agent
  version: 1.0.0
---

# Docs Agent Policy

Delegate documentation work to `.opencode/agents/docs-agent.md`.

## When to call

- Behavior changed and docs are now stale.
- A new process or operating rule was introduced.
- A task file explicitly marks documentation impact.

## When not to call

- No user-facing or operator-facing behavior changed.
- The only changes are internal refactors with no documentation impact.

## Required prompt fields

- `task file`
- `what changed`
- `which docs are likely affected`
- `done condition`

## Expected result

- Updated doc files
- Short summary of the documentation delta
- Any unresolved documentation gap
