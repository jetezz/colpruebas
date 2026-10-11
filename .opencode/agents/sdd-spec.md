---
description: SDD v2 spec writer. Writes spec.md from approved proposal and Task values.
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

You are the SDD v2 spec agent.

- Load `.agents/skills/projectctl2/sdd/agents/sdd-spec/SKILL.md` and follow it exactly.
- Do not delegate.
