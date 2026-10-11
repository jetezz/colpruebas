# `sdd-verify` modes (`verification_type` × scope)

What each verification type of the `sdd-verify` skill covers. The orchestrator assigns a single type and scope per delegation.

| `verification_type` | Phase | Scope and procedure |
|---|---|---|
| `code_review` | `p2_code_review` | Compares actual changes against proposal, specs, design, tasks, and criteria; inspects the diff and files; returns verdict **pass**, **findings**, or **inconclusive** with the gap. Fixes or implements nothing. Pass allows continuing to await acceptance; errors return to `p2_implementing`. |
| `unit_tests` | `p3_test_running` | Runs applicable unit tests with the project or orchestrator commands; reports command, outcome, counts, and failures. Writes or updates no tests. |
| `pwauto` | `p3_test_running` | Reads `Task.ui_url` as the target/base URL; when missing or empty after `trim`, runs nothing, substitutes no target, and reports an incomplete check. Runs the assigned Playwright suite and reports command, outcome, and failures linked to scenarios/criteria. Creates or updates no tests during the run. |
| `pwcli` | `p3_test_running` | Reads `Task.ui_url` as the target; same empty rule as `pwauto`. Validates the assigned flow in a browser with the provided runtime/browser and data; invents no URL or credentials. Returns observed steps and behavior or the environment limitation. |

In `p3_test_running` the orchestrator decides how many invocations it needs, which tasks/criteria each one covers, and which type it assigns. There is no fixed rule of one invocation per task or a single mandatory invocation. It chooses parallel or serial after checking that commands, runtime, browser, data, and resources do not interfere; on overlap or uncertainty, run serially. It reconciles all results; all applicable tests must run and pass before advancing to Phase 4. A failure or an incomplete check blocks the advance and requires a block per the graph.
