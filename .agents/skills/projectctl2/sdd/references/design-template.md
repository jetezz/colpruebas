# `design.md` template for `sdd-design`

Design artifact format. The skill retains purpose, input, and method; this file holds only the template.

```markdown
# Design: {task_id} — {task_name}

## Context and scope
{Summary of the intent, relevant behaviors, and limits supported by the proposal, spec, and Task.}

## Inspected sources
- `{path}` — {observed symbol, pattern, or behavior and its relevance}

## Technical approach
{Proposed strategy and relation to the identified specs.}

## Design decisions
### DEC-001 — {Title}
- Decision: {proposed or pending choice}
- Evidence and rationale: {paths/symbols and why}
- Alternatives: {viable options and trade-offs, or "N/A"}
- Consequences: {impacts, risks, or trade-offs}
- Related specs/criteria: {IDs}

## Components and flows
{Responsibilities and interactions; use a simple diagram only when it improves clarity.}

## Interfaces and contracts
{Relevant contracts or "No interface changes identified."}

## Proposed affected files
| Path | Proposed action | Reason/evidence |
|---|---|---|
| `{path}` | Create/Modify/Delete | {concrete justification} |

## Verification strategy
{Layers or behaviors worth verifying, linked to SPEC-*; do not create tests here.}

## Risks, dependencies, and migration
{Risks and handling when applicable; state "No migration identified" when appropriate.}

## Pending decisions
- {Question, impact, and affected SPEC; or "None."}

## Out of scope
- {Explicit limits; or "None stated."}
```

Adapt or remove sections that do not apply; never fill them with assumptions. Distinguish recommended decisions from confirmed ones.
