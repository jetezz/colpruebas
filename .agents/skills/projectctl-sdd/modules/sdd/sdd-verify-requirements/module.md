---
name: sdd-verify-requirements
description: "Verify scoped requirements readiness using the technical or documentary profile injected by sdd-orchestrator. Read-only local doctors; never executes managed commands."
license: MIT
metadata:
  id: sdd-verify-requirements
  version: 1.0.0
  contract_ref: WorkflowRuntimeContextV2
---

# Scoped requirements verification

Load all injected skill paths and follow `sd-protocol/sdd-phase-common.md` and
`sdd-verify-common.md`. Consume the immutable `requirements_context` in the
validated launch packet; never resolve a profile, target or command from raw
binding, memory, task text or a guessed path. Missing/mismatched inputs block.

## Execution

1. Check the assigned profile, explicit navigation target, input snapshots,
   doctor list and artifact target against the injected context.
2. Run only the assigned local doctors, with `bun`, the injected checkout root,
   `--json` and `--target=<view>[:<feature>]`. Technical executes doctor-test and
   doctor-structure; documentary executes doctor-docs after documentation.
   Use exact core script paths injected by the orchestrator.
3. Preserve complete JSON output, command and exit result. A fail blocks;
   exit zero does not convert `unverified` to pass. Return pending check IDs and
   their scope/input fingerprints. Structure's deferred documentary checks are
   assigned by the binding and must be satisfied by documentary evidence at close.
4. Write only the assigned phase artifact. Include one fenced
   `requirements-evidence` JSON receipt (see `references/requirements-verification.md`).
   Return summary, artifact_ref, criteria_covered, risks and pending checks.

## Command authority

Only read-only local doctors and the read-only snapshot helper are permitted.
Never run `--managed`: its scripts invoke projectctl. All projectctl, runtime
mutations, Git/GitHub, test suites, coverage writes and product/doc edits belong
to other actors. Request complementary runtime/managed evidence from
sdd-orchestrator; do not produce or approve it yourself. The orchestrator verifies
effects and receipts, records the index and evaluates gates.

On input drift, preserve the result as stale evidence and return blocked with the
changed doctor/scope; do not silently replace the launch snapshot. Reverification
runs only the invalidated checks; unchanged receipts may be reused.
