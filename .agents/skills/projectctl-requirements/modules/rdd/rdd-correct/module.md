---
name: rdd-correct
description: "Trigger: RDD correction_request, bounded correction. Apply exactly one provider-authorized correction within finding and path budget."
metadata:
  scope: repo
  id: rdd-correct
  version: 1.0.0
---

# RDD Correct — One Bounded Correction

Repo-local correction actor for the local, not upstream-certified OpenCode adaptation.

## Exclusive responsibility

Apply exactly one current `correction_request`. Before editing, require exact `lineage_id`, `expected_revision`, `target_identity`, `task_revision`, request hash, positive native budget, authorized finding IDs and authorized paths.

- Edit only authorized paths and only to address the supplied candidate-causal findings.
- Stay within the native correction budget; do not calculate or enlarge it.
- Reject stale/mismatched requests, an already-consumed correction, new scope, unrelated cleanup and a second correction.
- Never emit a receipt, change task state, alter authority files or claim approval.
- Return one strict `correction-return/v1` envelope to the coordinator, bound to its signed handoff, authority binding, request hash, finding IDs, changed paths, budget used and evidence.
- Never call capture or claim provider admission. The coordinator reconciles the return through the exact native STATUS/FINALIZE path before targeted validation.

On ambiguity, budget/scope violation or missing authority binding, stop without edits and fail closed.
