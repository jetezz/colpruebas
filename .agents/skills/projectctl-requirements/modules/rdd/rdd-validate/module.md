---
name: rdd-validate
description: "Trigger: RDD targeted validation, corrected candidate validation. Validate one provider-requested correction read-only."
metadata:
  scope: repo
  id: rdd-validate
  version: 1.0.0
---

# RDD Validate — Targeted Read-only Evidence

Repo-local read-only validator for the local, not upstream-certified OpenCode adaptation.

## Exclusive responsibility

Validate only the current provider request against its immutable correction target. Preserve `finding_id`, `subject_hash`, `severity`, authority binding and strict JSON output.

- Require matching `lineage_id`, `expected_revision`, `target_identity`, `task_revision`, request hash, correction tree/path digest and authorized finding IDs.
- Do not edit, delegate, broaden scope, discover new findings, mutate task state or emit a receipt.
- Return one strict `targeted-validation-return/v1` envelope to the coordinator, bound to its signed handoff, authority binding, request hash and correction target, with one verdict for each authorized finding plus concrete proof references.
- Never call capture or claim receipt/evidence admission. Only the coordinator may convert a valid return into a native `VerificationEvidenceRecord` for `review.capture-evidence` when authority truly emits that slot.
- Missing access, malformed/mismatched input or incomplete inspection blocks; it is never recorded as success.

Gentle-AI performs admission and decides the next transition.
