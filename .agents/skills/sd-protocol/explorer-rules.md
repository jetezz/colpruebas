# Explorer Common Rules

> **Single source of truth** for the rules shared by all three `sdd-explore-*` lanes (`sdd-explore-code`, `sdd-explore-research`, `sdd-explore-pwcli`). Each explorer lane adds its lane-specific rules on top of these.
>
> Concrete headings, store identifiers and mirror keys are resolved from `WorkflowRuntimeContextV1` (`task_ref.path`, `task_ref.heading_owners`, `artifact_context.mirrors[]`); no value in this file is bound to a specific project overlay.

## Common Hard Rules (apply to every explorer lane)

1. Read the active primary artefact first (`WorkflowRuntimeContextV1.task_ref.path`) to frame the question precisely.
2. Do NOT modify code, docs, config, or tests. Exploration is read-only.
3. Do NOT launch sub-agents or call `delegate`/`task`. Exploration is single-agent.
4. Do NOT run shell, runtime, test, Git/GitHub, build, or Supabase/data commands. If evidence requires those, report the correct lane or coordinator owner instead.
5. Return findings with file evidence (paths, line numbers, repo files only). Never infer behavior without evidence.
6. Persist the lane-owned exploration detail. When `WorkflowRuntimeContextV1.artifact_context.primary.role == "index"`, write the full exploration analysis to the resolved phase-artifact path (`artifact_context.phase_artifacts.path_pattern` with `task_ref.task_id` and the lane's key: `explore-code` / `explore-research` / `explore-pwcli`) and return a bounded `summary` + `artifact_ref` through the envelope; do NOT write the primary index (the coordinator is its single writer). When `primary.role` is `ledger`/absent, write the summary to the exploration heading resolved from `WorkflowRuntimeContextV1.task_ref.heading_owners` instead. See `sdd-phase-common.md` §F.5.
7. Persist exploration evidence only in the assigned canonical phase artifact. Optional support-tool output is not SDD evidence.

## Lane-specific decision gates

| Need | Lane to use |
|---|---|
| Repo behavior or structure is unknown | `sdd-explore-code` |
| External API/library guidance is the main unknown | `sdd-explore-research` |
| Browser/runtime behavior must be observed in a browser | `sdd-explore-pwcli` |
| Browser context is not actually required | return `not_required` from `sdd-explore-pwcli` |
| The question is about code structure, not runtime behavior | route to `sdd-explore-code` |
| The question is about external docs or APIs | route to `sdd-explore-research` |

## Lane-specific Hard Rules (apply only to the named lane)

### sdd-explore-code
- Read repo files only. Do NOT use browser tooling, Context7, web research, or external docs fetches.
- Ground every claim in actual repository files; never infer behavior without file evidence.

### sdd-explore-research
- External research first: prefer Context7 or authoritative docs before anything else.
- Do NOT turn this lane into broad repository exploration; read local files only when the task path or a small config snippet is needed to frame the research question.
- Do NOT use browser tooling.
- Separate sourced facts from repo-specific recommendations.

### sdd-explore-pwcli
- Before any browser action, verify the **Browser lane preconditions** (target environment + credentials contract + runtime kind) declared by the coordinator in the delegation prompt and in the active primary artefact's validation-requirements section (resolved from `WorkflowRuntimeContextV1.task_ref.heading_owners`, or its `### Browser target` sub-section). The coordinator owns this gate; this lane consumes its resolution as authoritative. The shared precondition contract lives in `.agents/skills/sd-protocol/sdd-verify-common.md` §Browser lane preconditions.
- If any precondition is missing (`browser-target-missing`, `browser-credentials-missing`, `runtime-kind-unknown`), stop and return `blocked` with the named failure mode.
- Use `playwright-cli` for exploration only; do NOT create persistent tests and do NOT claim verification closure.
- Do NOT broaden into general code-reading or external research beyond the minimal task/route context needed to drive the browser.
- Do NOT invent `BASE_URL`, commands, credentials, or runtime ownership; consume the resolved context from the delegation prompt and the active primary artefact only.

## Sources

- `sdd-explore-code/SKILL.md` §Hard Rules + Decision Gates
- `sdd-explore-research/SKILL.md` §Hard Rules + Decision Gates
- `sdd-explore-pwcli/SKILL.md` §Hard Rules + Decision Gates

If any of those sources disagree with this file, this file wins.
