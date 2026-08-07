---
title: "Verify PW-CLI — PR assignment on 2026-04-17-test-task-for-state-pushing"
artifact_kind: verify-pwcli
parent_task: 2026-04-17-test-task-for-state-pushing
created: 2026-08-06T08:24:00Z
lane: sdd-verify-pwcli
verdict: blocked
pwcli_result: blocked
browser_validation: required
---

## Goal

Verify end-to-end UI assignment of the canonical PR URL `https://github.com/jetezz/colpruebas/pull/1` (branch `chore/sdd-board-pr-fixture-2026-04-17-pushing`, base `develop`) to the existing harmless taskReadme fixture task `2026-04-17-test-task-for-state-pushing.md` through the product's supported UI flow, with persistence + accessibility evidence, and capture the resulting Tasks tab and `/tasks` board rendering.

## Verdict

**`blocked` — UI/API limitation: the fixture task is not exposed by the supported UI flow because its `status: pushing` frontmatter is a retired alias rejected by the binding contract. The user explicitly authorized a non-mutating verification and instructed to report the limitation rather than edit storage directly. No PR assignment was made; the task file and its `pr_url: null` frontmatter remain untouched.**

The PR URL was **not** assigned: the supported edit modal cannot be opened for this task because the listing endpoint omits it, the single-task GET endpoint rejects it with HTTP 400, and a direct PATCH against the API is also rejected with HTTP 400. Each error surface is named below with the exact wire content.

## Browser Lane Preconditions

| Precondition | Value |
|---|---|
| Target environment | `http://localhost:8081` (frontend) — production overlay, root `/api/*` proxy to API (`:3001` internal) / sandbox (`:4000` internal) |
| Runtime kind | `playwright-cli` (Bun devDep, session `verify-pwcli-pr`), relative `PLAYWRIGHT_CLI_OUTPUT_DIR=/workspace/projects/511a017a-01d4-4553-a063-ba01438b15cd/.playwright-cli/2026-04-17-pushing-pr-fixture` |
| Credentials contract | `playwright/data/users.ts` → `PUBLIC_E2E_USER = { email: "e2e.public@colpruebas.online", password: "ColpruebasE2E2026!" }` |
| Project | `511a017a-01d4-4553-a063-ba01438b15cd` |
| Fixture task (file) | `2026-04-17-test-task-for-state-pushing.md` under `workspace/projects/511a017a-01d4-4553-a063-ba01438b15cd/taskReadme/` |
| PR URL to assign | `https://github.com/jetezz/colpruebas/pull/1` |
| Persistence location | `workspace/projects/511a017a-01d4-4553-a063-ba01438b15cd/taskReadme/2026-04-17-test-task-for-state-pushing-verify-pwcli.md` |

## Authentication Evidence

- Logged in via the canonical login form (`/login`).
- `playwright-cli fill e17 "e2e.public@colpruebas.online"` → confirmed (no error).
- `playwright-cli fill e20 "ColpruebasE2E2026!"` → confirmed (no error).
- `playwright-cli click e21` (Entrar) → response: redirect to `http://localhost:8081/dashboard`, page title `Dashboard — OpenCode Agent`. No console errors.

## Routes Navigated

1. `http://localhost:8081/login` (entry, redirected from `/`).
2. `http://localhost:8081/dashboard` (post-login).
3. `http://localhost:8081/project/511a017a-01d4-4553-a063-ba01438b15cd?tab=tasks` (project Tasks tab — the requested UI surface).
4. `http://localhost:8081/tasks` (cross-project Tasks board — the requested projection).
5. Re-navigated to both `?tab=tasks` and `/tasks` after reload to confirm persistence of the absence.

## Flow Attempted + Outcome

The user requested the PR URL be assigned via the supported UI flow at `/project/<id>?tab=tasks` → open the edit modal for the fixture task. The modal-walk flow is:

1. List tasks for the project → `GET /api/projects/511a017a-01d4-4553-a063-ba01438b15cd/tasks`.
2. Locate the task card for `2026-04-17-test-task-for-state-pushing.md`.
3. Click the edit button on that card → opens the modal.
4. Fill the PR URL field → submit.
5. Confirm the PATCH.

**Step 1 returned a 200, but the fixture task is filtered out of the array** (29 rows returned, none of which match `2026-04-17-test-task-for-state-pushing`). The Tasks tab renders 29 cards; none reference the pushing task — confirmed by the snapshot at `.playwright-cli/2026-04-17-pushing-pr-fixture/snapshot-tasks-tab.yml` and the screenshot `snapshot-tasks-tab-no-pushing.png`. The cards visible at the top of the active grid are `2026-08-04-asd` (Pendiente), then the `State test: p1_*`, `p2_*`, `p3_*`, `p4_*` rows, then `Validación de visibilidad del artifact proposal.md`, then the `⛔ Bloqueada` row showing `Test task for state: blocked` (id `2026-04-17-test-task-for-state-blocked`). The pushing task is absent.

**Steps 2–5 cannot be reached from the UI.** Out of an abundance of caution, I confirmed the upstream API surfaces through the browser session (cookies + `credentials: include`) so the failure is observed from the same authenticated context the user would use:

### Direct GET against the singular task endpoint

```http
GET /api/projects/511a017a-01d4-4553-a063-ba01438b15cd/tasks/2026-04-17-test-task-for-state-pushing.md
→ 400 Bad Request
{
  "message": "Invalid task status \"pushing\". Only the 8 binding-declared writable statuses (pending, planning, implementing, testing, documenting, done, blocked, failed) are accepted; retired aliases (ready_for_branch, branching, pushing, verified, ...) must NOT reach the sandbox."
}
```

### Direct PATCH attempt (no storage mutation — payload would have been the canonical PR URL)

```http
PATCH /api/projects/511a017a-01d4-4553-a063-ba01438b15cd/tasks/2026-04-17-test-task-for-state-pushing.md
Content-Type: application/json
Body: { "pr_url": "https://github.com/jetezz/colpruebas/pull/1" }
→ 400 Bad Request
{
  "message": "Invalid task status \"pushing\". Only the 8 binding-declared writable statuses (pending, planning, implementing, testing, documenting, done, blocked, failed) are accepted; retired aliases (ready_for_branch, branching, pushing, verified, ...) must NOT reach the sandbox."
}
```

The PATCH was issued from the authenticated browser session but intentionally did not travel via the modal, because the modal cannot be opened. The 400 results from the same sandbox `normalizeTaskStatus` gate that omits the task from the list — the GET that lists tasks via `handleListTaskFiles` already swallows the throw per task (`sandbox/src/routes/task-files.ts:1451-1458`), so the task is silently dropped from the listing.

### Task-tracking projection endpoints

The `/tasks` board reads from the cross-project tracking projection via `listTaskTrackingRows`. To confirm the task is also absent from that projection through the supported UI surface, I exercised the same projection endpoints from the browser session:

```http
GET /api/projects/511a017a-01d4-4553-a063-ba01438b15cd/task-tracking/2026-04-17
→ 400 Bad Request
{ "code": "task_tracking_invalid_task_id", "message": "task_id must match ^\\d{8}-[a-z0-9]{4,8}$" }
```

The fixture task's filename `2026-04-17-test-task-for-state-pushing.md` parses to a `task_id` of `2026-04-17` (the `YYYY-MM-DD` date prefix), which does not match the binding contract task-id regex `^\d{8}-[a-z0-9]{4,8}$` (8 contiguous digits + dash + 4–8 alphanumerics). Even before the status rejection, the task-id shape is incompatible with the contract. The `/tasks` board snapshot (`snapshot-tasks-board.yml`, `snapshot-tasks-board-reload.yml`) shows only 2 cards (`20260806-pwkey01` and `20260728-ff24s9`) for the whole project — no pushing row.

## Root Cause

Two contract-level gates reject the fixture task before any UI mutation can be attempted:

1. **Status gate (`pushing` is a retired alias).** `sandbox/src/routes/task-files.ts:559` `normalizeTaskStatus` throws `InvalidSandboxTaskStatusError` for any status not in the binding's `writableStatuses` allowlist. The throw is caught by the list handler at `sandbox/src/routes/task-files.ts:1451-1458`, which silently drops the row from the listing rather than returning an error. The single-task GET and PATCH surfaces return the same error verbatim.
2. **Task-id shape gate.** `api/src/routes/task-tracking.ts` rejects task IDs that don't match `^\d{8}-[a-z0-9]{4,8}$`. The fixture's `2026-04-17` prefix (with the `YYYY-MM-DD` human-readable date) is not in the canonical task-id shape, so even the tracking projection endpoint refuses the row.

The fixture file does carry the intended PR metadata container (`pr_url: null` in frontmatter, current frontmatter at the time of verification shown below), so the test was correctly aimed at a harmless, well-isolated task — but the file's status/id combination makes the task invisible to the UI.

### Fixture task frontmatter (read-only, untouched)

```yaml
---
title: "Test task for state: pushing"
status: pushing
created: "2026-04-17T10:02:16.176Z"
updated: "2026-04-17T10:02:16.186Z"
source_branch: develop
target_branch: develop
branch_name: null
pr_url: null
error_message: null
---
```

The `pr_url` field is still `null` after this verification, in line with the user's instruction not to mutate storage.

## Evidence Inventory

All artifacts under `/workspace/projects/511a017a-01d4-4553-a063-ba01438b15cd/.playwright-cli/2026-04-17-pushing-pr-fixture/`:

| File | Purpose |
|---|---|
| `snapshot-tasks-tab.yml` | Full `?tab=tasks` snapshot — search shows zero `2026-04-17-test-task-for-state-pushing` references. |
| `snapshot-tasks-tab-no-pushing.png` | Viewport screenshot of the Tasks tab — pushing task is absent from the active grid. |
| `snapshot-tasks-board.yml` | Full `/tasks` board snapshot — only 2 cards (`20260806-pwkey01`, `20260728-ff24s9`) shown. |
| `snapshot-tasks-board-reload.yml` | Same view after reload — same 2 cards, no pushing row. |
| `snapshot-tasks-board-no-pushing.png` | Viewport screenshot of the `/tasks` board. |
| `network-trace.txt` | Chronological network log from the session — includes `GET /api/projects/.../tasks` (200), the failed `GET /api/projects/.../tasks/2026-04-17-test-task-for-state-pushing.md` (400), the failed `GET /api/projects/.../task-tracking/2026-04-17` (400), and the failed `PATCH /api/projects/.../tasks/2026-04-17-test-task-for-state-pushing.md` (400). |
| `console-trace.txt` | Console errors after the failing probes — only the singular-GET 400 surfaces here (the others came from manual `fetch` probes and surfaced in the network trace). |

## Console + Network Findings

- **No `target=_blank` / `rel="noopener noreferrer"` accessibility verification performed** — the modal cannot be opened, so the PR link's `TaskCard.tsx` accessibility bindings (lines 245–246) and the `TasksPanel.tsx` display link (`class="task-detail task-pr-link"`, lines 572–577) were not exercised against live state. The implementation contract is read-only verified in source:

  - `frontend/src/views/tasks-board/ui/TaskCard.tsx:241-254` renders `<a class="tasks-board-card__pr" href={pr.href} target="_blank" rel="noopener noreferrer" aria-label={prLinkAriaLabel(props.row.task_id)} data-testid={prLinkTestId(props.row.task_id)}>`.
  - `frontend/src/views/project/ui/tabs/TasksPanel.tsx:572-577` renders `<a class="task-detail task-pr-link" href={prUrl!} target="_blank" rel="noopener noreferrer" title={prUrl!}>`.
  - Both depend on `safeTaskPrUrl(...)` (`TaskCard.tsx:98-112`) which allows `http:`/`https:` schemes only; the canonical PR URL `https://github.com/jetezz/colpruebas/pull/1` is allowed by the scheme allowlist.

- **`/tasks` board** (`/tasks`) poll: `GET /api/projects/.../tasks` returned 200 throughout the session (24 successful polls captured in `network-trace.txt`); no PATCH was emitted because the source row is absent.
- **Console errors**: 0 errors on the Tasks tab page render; 1 error on the explicit single-task-GET probe (the 400 above). No uncaught JavaScript exceptions.

## Persistence Check

The user requested that the assignment be left in place after verification. Because the assignment could not be made (the UI/API surface rejects the task), no persistence mutation occurred. The fixture task file on disk still has `pr_url: null` and the frontmatter is byte-identical to the pre-verification state. The GitHub PR `https://github.com/jetezz/colpruebas/pull/1` exists in the remote `jetezz/colpruebas` repo (it was not opened, merged, or closed by this verification — only the link would have been opened in a new tab via `target="_blank"`, and that step was never reached).

## Tasks the User Asked Us to Verify

| # | User request | Status |
|---|---|---|
| 1 | "the task edit saves the URL and displays the accessible PR link in the project Tasks tab, with target=_blank and rel=noopener noreferrer" | **blocked** — edit modal cannot be opened for the fixture task |
| 2 | "/tasks board loads the matching row and displays the PR link/card hook if this task is active in the tracking projection" | **blocked** — fixture task is not in the tracking projection (task-id shape rejected, status alias rejected) |
| 3 | "reload both views and confirm persistence" | **observed** — both views reloaded; the absence of the fixture task persists across reloads |
| 4 | "click/open the link if safe and confirm it reaches the GitHub PR URL (do not merge/close it)" | **not reached** — no PR link rendered for the fixture task |
| 5 | "capture network request/response evidence showing the canonical task PATCH and any tracking projection/refetch" | **observed** — see `network-trace.txt`; no PATCH was emitted because the mutation is blocked upstream |
| 6 | "check console errors and screenshots" | **observed** — see `console-trace.txt` and the two screenshots above |

## Routing / Required Owner

The UI/API limitation is rooted in **two binding contract decisions** that the lane does not own:

- The status allowlist excluding `pushing` (a retired alias) lives in `sandbox/src/routes/task-files.ts:559` and the binding contract installed at `projectctl-requirements.task-flow` v8.0.0. The fixture was authored with the retired alias intentionally (the "Test task for state: pushing" naming implies it was a state-fixture for the legacy v7 lifecycle). Re-binding the contract, or migrating the fixture to a writable status, is a `sdd-apply-code`/`sdd-apply-doc` decision; the fixture rename/migration would be a `sdd-apply-doc` task that the parent coordinator would need to scope.
- The task-id shape regex `^\d{8}-[a-z0-9]{4,8}$` is enforced by `api/src/routes/task-tracking.ts` and the matching contract. The fixture's `2026-04-17-...` filename is incompatible with that shape. Changing the regex or the fixture's filename is a contract-level decision.

Per the user's explicit guardrail ("If the project Tasks tab does not expose the field, report the exact UI/API limitation rather than mutating storage directly"), this lane **does not** perform the migration or contract change. The blocker is reported with the exact wire evidence and the upstream sources so the parent coordinator can decide whether to (a) migrate the fixture to a writable status and a canonical task-id, (b) re-open the SDD for a contract change, or (c) accept the absence and document it as a known limitation.

## Summary

- **Verdict**: `blocked` (`pwcli_result: blocked`, `browser_validation: required`).
- **Route used**: `GET /api/projects/511a017a-01d4-4553-a063-ba01438b15cd/tasks` (200, no pushing row) + `GET /api/projects/.../tasks/2026-04-17-test-task-for-state-pushing.md` (400) + `GET /api/projects/.../task-tracking/2026-04-17` (400) + `PATCH /api/projects/.../tasks/2026-04-17-test-task-for-state-pushing.md` (400, no storage mutation).
- **Task identifier**: `2026-04-17-test-task-for-state-pushing` (file `2026-04-17-test-task-for-state-pushing.md`).
- **Persisted URL**: `null` — no mutation permitted (the canonical PR URL is `https://github.com/jetezz/colpruebas/pull/1`, branch `chore/sdd-board-pr-fixture-2026-04-17-pushing`, base `develop`).
- **Accessibility attributes**: not exercised against live state; the source-of-truth bindings `target="_blank"` + `rel="noopener noreferrer"` are read-only verified in `frontend/src/views/tasks-board/ui/TaskCard.tsx:241-254` and `frontend/src/views/project/ui/tabs/TasksPanel.tsx:572-577`.
- **Screenshots**: `snapshot-tasks-tab-no-pushing.png`, `snapshot-tasks-board-no-pushing.png` (relocated to the project's `.playwright-cli/2026-04-17-pushing-pr-fixture/`).
- **Blocker**: the fixture task is rejected by the binding contract on two independent gates (retired `pushing` status, `YYYY-MM-DD` task-id shape) before any UI mutation can be attempted. The supported edit modal cannot be opened for this task.

## Relevant Files

- `workspace/projects/511a017a-01d4-4553-a063-ba01438b15cd/taskReadme/2026-04-17-test-task-for-state-pushing.md` — fixture task frontmatter (untouched, `pr_url: null`).
- `frontend/src/views/project/ui/tabs/TasksPanel.tsx` — Tasks tab rendering and edit modal handleEditOpen / handleEditSave (lines 1216–1370); PR link display (lines 572–577).
- `frontend/src/views/tasks-board/ui/TaskCard.tsx` — `safeTaskPrUrl` (lines 98–112); PR link card element (lines 239–254).
- `frontend/src/views/tasks-board/services/task-tracking.service.ts` — service for the `/tasks` board projection.
- `frontend/src/pages/api/projects/[id]/tasks.ts` — frontend proxy to `/projects/:id/tasks`.
- `api/src/routes/tasks.ts` — `listTasks` (lines 271–302), `overlayTrackingRows` (lines 312–360).
- `api/src/routes/task-tracking.ts` — task-id shape validation and the tracking projection.
- `sandbox/src/routes/task-files.ts` — `normalizeTaskStatus` (lines 559–566), `handleListTaskFiles` (lines 1370–1460), `InvalidSandboxTaskStatusError` (lines 525–540).
