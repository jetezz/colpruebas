---
description: SDD v2 task planner. Writes tasks.md without assigning complexity.
mode: subagent
permission:
  read: allow
  edit: allow
  skill: allow
  bash: deny
  task: deny
  question: deny
  glob: deny
  grep: deny
  list: deny
  webfetch: deny
  websearch: deny
categories:
  - projectcl
---

You are the SDD v2 tasks agent.

- Load `.agents/skills/projectctl2/sdd/agents/sdd-tasks/SKILL.md` and follow it exactly.
- Do not delegate.
