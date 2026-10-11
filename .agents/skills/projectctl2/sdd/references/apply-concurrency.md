# `sdd-apply` concurrency and assignment

Full complexity, individual assignment, and parallelism rules. The router keeps only the golden rules.

- Evaluate the difficulty of each TASK-ID individually by scope and files, components and relationships, dependencies and integrations, technical uncertainty, and regression risk. Do not assign one global level reused across all tasks.
- Assign and record in `tasks.md` before delegating: `low` for bounded, localized work; `medium` for related multi-component changes or non-trivial analysis; `high` for broad, cross-cutting, architectural work or work with significant uncertainty/risk. Use contextual judgment, not a line- or file-count formula.
- `sdd-tasks` assigns or recommends no levels. When a task is too broad, ambiguous, or cannot be evaluated safely, return the plan to `sdd-tasks` or resolve the gap before planning; do not assign arbitrary complexity.
- Complexity determines the profile (`low` → `sdd-apply-low`, `medium` → `sdd-apply-medium`, `high` → `sdd-apply-high`). The three load the same skill; the choice belongs to the orchestrator.
- Launch exactly one delegation per task in `tasks.md`, with a single TASK-ID and scope exclusive to that task. Do not group several tasks, nor replace or skip tasks without updating the plan through the authorized flow.
- Do not change complexity to fit an agent. When a re-evaluation justifies another level, update `tasks.md` first and then delegate with the matching profile.
- Before the first `sdd-apply` delegation in `p2_implementing`, run this mandatory ordered gate and emit a wave plan; launch no delegation until the plan exists. The parallel unit is the TASK-ID; SPEC-* IDs are traceability references inside tasks, not parallel units.
- (a) Confirm Complexity is recorded per TASK-ID in `tasks.md`. When any task lacks a recorded level, record it first per the complexity rules above; do not delegate unrated tasks.
- (b) Build the dependency DAG from the `Dependencies` field of each task in `tasks.md` (TASK-IDs; `None` means a root with no predecessors). Order tasks so dependencies precede consumers.
- (c) Run the overlap check on `Proposed scope` paths plus mutable zones (generation, migration, configuration, or any other interfering resource), using SPEC-* references and design paths as guidance only, never as edit authorization. Flag shared files and shared mutable zones as conflicts.
- (d) Emit Wave-0 as the parallel set (satisfied dependencies plus independent writes: no shared files and no shared mutable zones) versus chained serial sets for the remainder (overlap, unsatisfied dependency, required order, or uncertainty). Record the wave assignment before delegating.
- (e) Launch Wave-0 in parallel via `delegate`, one delegation per TASK-ID. Reconcile each result before treating it as complete; launch dependents only after their predecessors succeed. A failure affects dependents; follow the orchestrator block and correction rules.
- With overlap, dependency, required order, or uncertainty, run serially in dependency order. The orchestrator decides parallelism; skills do not coordinate with each other.
- Reconcile each result before treating it as complete. Launch dependents only after predecessors succeed. A failure affects dependents; follow the orchestrator block and correction rules.
- When a delegation returns content that is not valid for the goal, re-delegate with corrected instructions. After three invalid results for the same goal, declare a block and wait for instructions. Count only invalid attempts per goal; add no retry counter or history to Task.
- For code review, require an explicit verdict per [verify-modes](verify-modes.md): pass allows continuing to `p2_awaiting_acceptance`; errors return to `p2_implementing`. Without a clear verdict, re-delegate with concrete instructions; when it persists, block.
