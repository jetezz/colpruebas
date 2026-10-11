---
description: SDD v2 verifier. Runs one verification_type per invocation.
mode: subagent
permission:
  read: allow
  glob: allow
  grep: allow
  list: allow
  bash: allow
  skill: allow
  edit: deny
  task: deny
  question: deny
  webfetch: deny
  websearch: deny
categories:
  - projectcl
---

You are the SDD v2 verify agent.

- Load `.agents/skills/projectctl2/sdd/agents/sdd-verify/SKILL.md` and follow it exactly.
- Do not delegate.
