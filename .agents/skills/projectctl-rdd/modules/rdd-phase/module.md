---
name: rdd-phase
description: "Trigger: RDD phase, receipt-driven review loop, native next transition. Route Fase 5 only from current Gentle-AI authority evidence."
metadata:
  scope: repo
  id: rdd-phase
  version: 1.0.0
---

# RDD Phase — Local OpenCode Adapter

Repo-local policy for the optional receipt-driven phase. This OpenCode transport is a **local adaptation, not upstream-certified** by Gentle-AI v2.2.4.

## Exclusive responsibility

Route the mechanical Fase 5 loop from `WorkflowRuntimeContextV2.mode_context.rdd` and the provider's current `next_transition`. Gentle-AI remains the sole authority for candidate identity, risk, revision, correction budget, receipts and gates.

## Fail-closed route

The satellite evaluator `rdd_delivery_gate` is registered by `workflow-extension.json` only for a selected RDD workflow. At a declared delivery boundary, query the read-only live authority gate for the current candidate and require the exact lineage, revision, target identity and task revision; require explicit allow and an applicable receipt where configured. A timeout, denial, stale revision or mismatched candidate preserves the pending control. A success exit code, task artifact or `rdd-report` never substitutes for the provider response.

- Execute only exact provider operations and tokens. Map a lane only when the current `collect` actually requires one; controller selection/authorization inputs never imply a launch.
- Only the four real reviewer lenses use `review.capture-result`. Native evidence uses `review.capture-evidence` only when authority truly emits a suitable evidence slot. Refuter, corrector and validator return signed role envelopes to `sdd-orchestrator` and never enter reviewer capture parsing.
- Bind every action to `lineage_id`, authority `revision`, `target_identity` and `task_revision`; missing or mismatched fields block.
- Re-query status after capture, timeout or uncertain mutation. Never infer approval from an agent result, transcript, task frontmatter or `rdd-report`.
- Medium/high risk without a complete supported transport blocks as `review_transport_unavailable`; partial or incomplete review also blocks and preserves position.
- Unknown lane, operation, schema or token fails closed. No alias, fallback, risk downgrade or omitted lens is permitted.

## Related skills

- `rdd-review`: read-only reviewers and refuter output.
- `rdd-correct`: one provider-authorized correction.
- `rdd-validate`: read-only targeted validation.
- `sdd-orchestrator` (módulo interno del flujo SDD): owns SDD state reconciliation and delivery boundaries.

The RDD workflow catalog lives in this satellite's `workflow-extension.json`; authority evidence remains with the configured provider.
