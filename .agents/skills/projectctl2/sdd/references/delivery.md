# SDD v2 delivery before `p4_done`

Canonical source of the Phase 4 delivery sequence. No `SKILL.md` duplicates it.

## Contents

- [Sequence](#sequence)
- [Rules](#rules)
- [Failures](#failures)
- [After `p4_done`](#after-p4_done)

## Sequence

Pre-condition: when `requirements_fix==true`, `p4_requirements_docs` must be green (`status: green` in scope) BEFORE the commit step; the commit includes the fixer's docs/test repairs. With `requirements_fix==false` there is no additional pre-condition.

On the task's active branch, in this order:

1. Create a commit with the completed changes.
2. Push that same branch.
3. Create a Pull Request targeting `develop`.
4. Register the URL with `bun .agents/skills/projectctl2/sdd/task/scripts/update-task.ts <task-index> '{"pr":"<URL>"}'`.
5. Run `bun .agents/skills/projectctl2/sdd/task/scripts/set-state.ts <task-index> p4_done`.

## Rules

- The PR target is always `develop`; never select another base.
- Never switch silently to another branch to deliver; the active branch must be the task's `branch`.
- Set `p4_done` only after the four previous steps succeed.
- Mechanical guard for `p4_done`: see [flow-guards](flow-guards.md#set-statets).
- Git and GitHub retain the commit and push history; never record copies in Task.

## Failures

- When commit, push, PR creation, `pr` registration, or the final setter fails, declare a block, stop execution, and report the problem.
- Never declare delivery done or complete `p4_done` until the whole sequence succeeds.
- When a command fails, do not continue with dependent operations. Never re-read routinely after successes.

## After `p4_done`

- `p4_done` closes the SDD work after creating the PR and storing its link.
- The user reviews and accepts the PR on GitHub; that action is no additional gate for `p4_done` and never reverts it.

## Engram — note (outside the sequence)

- `mem_save` / `mem_session_summary` allowed best-effort BEFORE replying or AFTER `p4_done`, outside steps 1-5. Never a pre-condition for commit, push, PR, `pr` registration, or `set-state p4_done`.
- Optional `mem_session_summary` AFTER established `p4_done`, without blocking delivery. Suggested format Goal/Instructions/Discoveries/Accomplished/Next Steps/Relevant Files only when it contributes a reusable lesson, with `capture_prompt: false` when it summarizes SDD artifacts.
- Saving ≠ replying: saving never counts as replying. Slow memory failure never blocks, truncates, or replaces the reply; report it and continue.
