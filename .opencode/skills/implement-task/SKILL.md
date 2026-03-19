---
name: implement-task
description: Execution skill for the implement-task subagent. Use when the coordinator delegates one bounded implementation slice from a taskReadme plan and needs local code changes without builds, installs, or broad re-analysis of the entire task.
metadata:
  id: implement-task
  version: 1.0.0
---

# Implement Task Policy

Delegate one concrete implementation slice to `.opencode/agents/implement-task.md`.

## Input contract

Each prompt should include:

- `task file`
- `work unit title`
- `exact files or areas to inspect`
- `expected code change`
- `done condition`
- `test hint` if any

## Rules

- Use one subagent call per bounded work unit.
- Do not send the whole task if it contains multiple unrelated actions.
- Prefer sequential handoffs when later work depends on earlier edits.
- Ask for a blocked result instead of letting the worker improvise outside scope.

## Non-negotiable constraints

- Never build.
- Never start servers.
- Never install dependencies.
- Never branch, commit, or open PRs.

## Expected result

The worker should return:

- `result: done | blocked | failed`
- `files changed`
- `summary of the change`
- `follow-up needed for testing or docs`
