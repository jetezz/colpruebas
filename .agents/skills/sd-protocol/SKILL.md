---
name: sd-protocol
description: "Trigger: sd-protocol, sdd phase common, skill resolver, persistence contract, workflow runtime context. Repo-local SDD protocol library providing universal mechanism conventions used by coordinated SDD workflows across project overlays."
metadata:
  version: 4.0.0
  categories:
    - sdd
license: MIT
---

# SDD Protocol — Repo-Local SDD Workflow Library

This library defines the **universal mechanism contracts** used by every repo-local SDD phase skill. Every file in `.agents/skills/sd-protocol/` describes a mechanism (skill loading, retrieval, persistence, gate evaluation, work-unit schema, formal runtime context shape) whose **values** are configured per project overlay through the binding the project locator points at.

Concrete values are NEVER hardcoded in this library. The coordinator resolves them from the active project binding and publishes them through the formal `WorkflowRuntimeContextV1`; protocol consumers use only those bounded accessors.

This library was renamed from `_shared` during ecosystem reorganization. Earlier versions predate the parametric-formal contract split; reading the current `workflow-runtime-context.md` is mandatory for any lane that needs the bounded shape.

## Reference files

### Boilerplate (loaded by every `sdd-*` phase)

- **`workflow-runtime-context.md`** — the **single formal contract** for `WorkflowRuntimeContextV1` (the bounded shape every coordinator hands to an SDD lane). Defines cross-cutting invariants, the binding-shape requirement, the TypeScript shape, all closed failure modes, the bounded hand-off, and the portability expectations. **Loaded whenever any lane needs to consume a runtime context.**
- **`sdd-phase-common.md`** — universal mechanism: skill loading (§A), full retrieval over search previews (§B), primary-before-mirror persistence (§C), return envelope base + mandatory file-surface check (§D), the Injected Project Rules parametric block template (§E), and lane boilerplate incl. the index-primary / phase-artifact / knowledge-note pointer (§F.5). Every phase loads this.
- **`persistence-contract.md`** — universal mechanism: filesystem-only and mirrored branches, optional compact-index split, and mirror failure/availability fields required only when mirrors exist.
- **`skill-resolver.md`** — universal injection protocol. Coordinated SDD lanes consume only the mandatory coordinator-resolved `lane_context.lane_skill_path`, required `surface_skill_paths`, and their ordered aggregate in `skill_paths`; every path is readable before launch and `injected-paths` is the only successful SDD resolution state. Non-SDD delegation behavior is explicitly separate.

### Orchestration boundary

- The coordinator launches SDD executor lanes and injects their exact lane and surface-policy skill paths.
- Executor lanes read and apply those skills themselves. A policy skill is a policy document, never an agent or delegation target.
- Executor lanes may report the owning lane needed for rework or evidence, but only the coordinator launches that lane.
- An explicit orchestration mechanism such as `judgment-day` may launch only the internal actors declared by its own skill.

### Single-source-of-truth contracts (referenced, never duplicated)

- **`workflow-runtime-context.md`** — the formal `WorkflowRuntimeContextV1` shape; the only authoritative source of the bounded context that lanes receive. Reference this file from any lane that needs to read or pass context.
- **`apply-work-unit-schema.md`** — 13-column apply work unit contract + 4 mandatory contract fields + complexity evaluation + per-lane parallel-safety rules + pre-implementation gate. Use this instead of restating the schema in `sdd-tasks` or `coordinador`.
- **`acceptance-criteria-gates.md`** — three parametric evaluators (`envelope_gate`, `transition_gate`, `close_gate`) plus the `revision_gate`, `evidence` and `hard_gate` hook kinds; AC-006-style criteria coverage, the Fase 1→2 acceptance boundary, and APP-MAP close-gate. Use this instead of restating the gate logic in `coordinador` or any phase skill.
- **`explorer-rules.md`** — common Hard Rules for the three `sdd-explore-*` lanes plus their lane-specific additions. Use this instead of restating the Hard Rules in each explorer lane.
- **`strict-tdd.md`** — Strict TDD cycle rules (RED/GREEN/TRIANGULATE/REFACTOR). Loaded only when Strict TDD mode is active on the assigned work unit.

## Authoritative precedence

1. The active binding is the source of every concrete value (paths, headings, store adapters, mirror keys, lane names, gate ids, branch names, close rules, status set, terminal value).
2. `workflow-runtime-context.md` is the source of the bounded shape lanes consume.
3. The other files in this library are the source of the universal mechanisms; they never assert concrete values.

If a binding value disagrees with anything in this library, the binding's value wins **for the concrete value**; this library wins **for the mechanism** (i.e. the rule that the value is read from the binding, the rule that three availability values are preserved, the rule that primary precedes mirror, the rule that the bounded context is the only artefact handed to a lane, the rule that gate evaluators never invent IDs).

## Rule

This library is the only place where SDD mechanism contracts live in detail. Every other skill that needs to mention one of these contracts MUST reference the file by path. No skill restates the contract text.

## Note

This library depends on the project locator and binding defined by each overlay; it does not ship a binding itself. The mis-proyectos overlay's binding lives at `.agents/skills/projectctl-requirements/references/tareas.md` (block delimited by `<!-- task-flow-binding:start -->` / `<!-- task-flow-binding:end -->`); another overlay may declare any other binding path or none.
