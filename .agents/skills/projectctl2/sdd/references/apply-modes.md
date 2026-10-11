# `sdd-apply` modes (`apply_type` × phase)

What each mode of the generic `sdd-apply` skill does. Concurrency and assignment live in their own source; here only scope per mode.

| `apply_type` | Phase / state | What it does | Limits |
|---|---|---|---|
| `code_implementation` | `fase_2_implementacion / p2_implementing` | Implements only the assigned task per `spec.md`, `design.md`, and `tasks.md`, following project patterns. | Does not coordinate with other invocations; creates or modifies no tests; runs only focused technical checks, without presenting them as formal verification. |
| `unit_tests` | `fase_3_verificacion / p3_test_preparing` | Creates or updates only the assigned unit tests, linked to scenarios/criteria. | Prepares files but does not run suites as final verification; that belongs to `sdd-verify` in `p3_test_running`. |
| `pwauto_tests` | `fase_3_verificacion / p3_test_preparing` | Creates or updates only the assigned automated Playwright tests, linked to scenarios/criteria. | Same as `unit_tests`: prepare, do not run as the final verdict. |
| `documentation` | `fase_4_documentacion / p4_documenting` | Updates only the assigned documents and sections to reflect the implemented behavior. | Changes no code or tests under this type. |

The valid combination is `code_implementation` in `p2_implementing`, `unit_tests` or `pwauto_tests` in `p3_test_preparing`, and `documentation` in `p4_documenting`. When phase/state and `apply_type` do not match, make no changes and request a coherent assignment.

Do not impose TDD, RED/GREEN, threat matrices, estimates or line limits, harnesses, rollback plans, or PR strategies as universal rules: the v2 flow does not define them. Follow explicit project requirements included in the scope and record their source.
