---
name: rdd-review
description: "Trigger: RDD reviewer, review lens, refuter. Produce strict read-only candidate-bound JSON for Gentle-AI capture."
metadata:
  scope: repo
  id: rdd-review
  version: 1.0.0
---

# RDD Review — Local OpenCode Adapter

Repo-local policy for the four Gentle-AI v2.2.4 reviewer lenses and the detached local refuter. It is a **local adaptation, not upstream-certified** transport.

## Exclusive responsibility

Inspect only the immutable subject supplied by the provider and return one strict JSON object. Never edit, delegate, publish a receipt, mutate task state or inspect the live worktree as a substitute.

## Result contract

- Echo the exact `subject_hash`.
- Report `inspection: { status: "completed", paths: [...] }` only after all ordered manifest paths were inspected.
- Preserve each `finding_id`/`id`, lens, location, `severity`, claim and proof references. Severe findings include evidence class and candidate causality.
- Refutation is not a fifth lens or reviewer artifact. It preserves every input finding ID and returns one `refutation/v1` envelope to the coordinator, bound to the signed handoff and authority hashes; it adds no findings, carries no `artifact_subject`/reviewer lens/capture tokens, and never calls capture.
- Empty findings remain valid strict JSON with evidence. Access failure is incomplete, never clean.

Medium/high review with unavailable transport, malformed JSON, missing paths, a mismatched subject, or partial results blocks as `review_transport_unavailable`. It never degrades risk or claims equivalence with the certified transport.

Native `review.capture-result` admission applies only to the four real reviewer lenses. Refuter output is coordinator/controller-bound and never claims capture or receipt authority; see `third_party/gentle-ai/internal/reviewtransaction/reviewer_envelope.go` and the vendored review-integration contracts.
