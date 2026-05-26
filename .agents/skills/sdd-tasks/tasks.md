# Tasks: projectctl-releases-rollback

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 400–550 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Full implementation: migration + API + webhook + CLI + tests + docs | Single PR to develop | All phases; single PR fits within budget |

---

## Phase 1: Database Migration

- [ ] 1.1 Create `supabase/migrations/TIMESTAMP_create_project_releases.sql`
  - Table: `id uuid PK`, `project_id uuid FK→projects`, `user_id uuid FK→auth.users`, `environment text CHECK IN('prod')`, `commit_ref text`, `deployment_dir text`, `status text CHECK IN('success','failed','rollback')`, `rollback_of uuid FK→project_releases`, `created_at timestamptz DEFAULT now()`, `metadata_json jsonb DEFAULT '{}'`
  - Indexes: `project_releases_project_id_idx`, `project_releases_created_at_idx`
  - RLS enabled; SELECT policy for project owners; INSERT policy for service role
- [ ] 1.2 Apply migration to test Supabase instance and verify schema

---

## Phase 2: API Routes (`api/src/routes/environment/releases.ts`)

- [ ] 2.1 Create `api/src/routes/environment/releases.ts`
  - `GET /projects/:id/releases` — list releases, `ORDER BY created_at DESC`, project-scoped via `assertProjectOwner`
  - `GET /projects/:id/releases/:releaseId` — single release; 404 if not found or not owned; 403 if wrong project
  - `GET /projects/:id/releases/diff?from=:id&to=:id` — compare operative metadata (actor_email, commit_message trunc, runtime_port); return JSON diff; 403 if releases from different projects
- [ ] 2.2 Apply secret redaction: before storing or returning `metadata_json`, replace values matching credential patterns (`token`, `password`, `secret`, `key`, `api_key`, `Bearer`, etc.) with `***REDACTED***`
- [ ] 2.3 Wire releases router in `api/src/index.ts` at `/projects/:id/releases`
- [ ] 2.4 In `api/src/routes/environment/runtime.ts`: after `promote-prod` webhook returns success, insert a `project_releases` record with `status='success'` and populate `commit_ref` and `metadata_json` (redacted); wrap in try/catch and surface actionable error if insert fails
- [ ] 2.5 Add error responses matching spec: `RELEASE_NOT_FOUND` (404), `RELEASE_FORBIDDEN` (403), `ROLLBACK_NOT_ALLOWED` (422)

---

## Phase 3: Webhook Handler

- [ ] 3.1 Add `rollback-prod` entry in `api/src/routes/environment/shared/action-map.ts` with permission tier `prod-sensitive`
- [ ] 3.2 In `webhook-listener/src/handlers/prod.js`: implement `handleRollbackProd(releaseId)` — fetch `deployment_dir` from `project_releases` by releaseId + projectId; call `cloneOrUpdateDeploymentDir(target_dir)`; execute `docker compose up`; insert new release record with `status='rollback'` and `rollback_of=<releaseId>`
- [ ] 3.3 Validate in handler that source release `status='success'` before allowing rollback; return `ROLLBACK_NOT_ALLOWED` (422) otherwise

---

## Phase 4: CLI Commands

- [ ] 4.1 In `sandbox/src/bin/projectctl.ts`: add command family handlers for `releases list`, `releases show <id>`, `releases diff <a> <b>`, `rollback prod <id> --yes`
- [ ] 4.2 Local confirmation guard: `rollback prod <id>` without `--yes` in non-TTY context exits with code 1 and outputs `{ "code": "CONFIRMATION_REQUIRED", "message": "Run with --yes to confirm rollback." }` — NO API call made
- [ ] 4.3 Wire `rollback prod` to `POST /projects/:id/runtime/action { action:'rollback-prod', releaseId }` via existing runtime action path
- [ ] 4.4 In `sandbox/src/lib/projectctl-registry.ts`: register four new commands with correct `category`, `permission`, `minArgs`, `maxArgs`:
  - `projectctl releases list` — `runtime`, `read-only`, minArgs=0, maxArgs=0
  - `projectctl releases show <id>` — `runtime`, `read-only`, minArgs=1, maxArgs=1
  - `projectctl releases diff <a> <b>` — `runtime`, `read-only`, minArgs=2, maxArgs=2
  - `projectctl rollback prod <id>` — `runtime`, `prod-sensitive`, minArgs=2, maxArgs=3 (allow optional `--yes` flag)
- [ ] 4.5 All JSON output uses stable keys matching API contract; human text uses existing `formatJson` / `fail` helpers

---

## Phase 5: Tests

- [ ] 5.1 Extend `sandbox/__tests__/projectctl-parser.test.ts`:
  - Test `releases list --json` → correct API path called
  - Test `releases show <id>` → 404 for unknown release, 403 for non-owned
  - Test `releases diff <a> <b>` → 403 when releases from different projects
  - Test `rollback prod <id>` without `--yes` → exits code 1, `CONFIRMATION_REQUIRED`
  - Test `rollback prod <id> --yes` → API call made with correct payload
- [ ] 5.2 Add contract tests for `api/src/routes/environment/releases.ts`:
  - GET `/projects/:id/releases` → 403 for non-owner
  - GET `/projects/:id/releases/:rid` → 404 unknown, 403 wrong project
  - GET `/projects/:id/releases/diff` → 403 mismatched projects
  - Response shapes match spec JSON

---

## Phase 6: Documentation

- [ ] 6.1 Update `docs/02-features/api.md`: document new `GET /projects/:id/releases`, `GET /projects/:id/releases/:rid`, `GET /projects/:id/releases/diff` endpoints with request/response shapes and error codes
- [ ] 6.2 Update `.agents/skills/projectctl-operator/SKILL.md`: add `releases list`, `releases show`, `releases diff`, `rollback prod` command entries with description and examples
- [ ] 6.3 Update `docs/01-product/quality/views/**` if Terminal Ops / Environments UI is affected by new commands; reflect actual coverage without overclaims

---

## Phase 7: Verification

- [ ] 7.1 Run `bun test sandbox/__tests__/projectctl-parser.test.ts` — all releases + rollback tests pass
- [ ] 7.2 Docker validation: start stack with `docker compose -f compose.dev.yml up -d --build`; verify `projectctl releases list` returns JSON array; verify `projectctl rollback prod <id> --yes` executes without Docker raw exposure
- [ ] 7.3 Browser/Playwright validation on ProjectctlPanel if tab rendering changed — validate releases list renders correctly
- [ ] 7.4 Verify deploy/promote prod writes a release record: check `project_releases` table after successful promote

---

## Implementation Order

1. **Phase 1 (Migration)** — foundation for everything; must exist before API insert
2. **Phase 2 (API)** — builds on migration; insert part depends on migration existing
3. **Phase 3 (Webhook)** — action-map entry needed before runtime action dispatch works
4. **Phase 4 (CLI)** — can be developed in parallel with Phase 2/3 once contract is clear
5. **Phase 5 (Tests)** — runs after all code is written
6. **Phase 6 (Docs)** — docs updated as each phase completes
7. **Phase 7 (Verify)** — final gate before marking done

---

## Delivery Risks

- **Risk**: `deployment_dir` path reference stored in `project_releases` points to a filesystem location that may be pruned before a rollback is executed.
  - **Mitigation**: v1 no auto-cleanup; follow-up ticket for prune job; document that `deployment_dir` must exist for rollback to succeed.
- **Risk**: `rollback-prod` webhook handler needs access to `project_releases` DB — service role credentials in webhook-listener.
  - **Mitigation**: webhook-listener already has DB access for `cloneOrUpdateDeploymentDir`; reuse existing connection pattern.
- **Risk**: `projectctl` runs inside sandbox with no direct DB access — releases list/show/diff must all go through API.
  - **Mitigation**: confirmed architecture; API is the only path.
- **Risk**: `metadata_json` redaction logic may miss some credential patterns.
  - **Mitigation**: start with a denylist of common patterns; can be extended; spec explicitly limits v1 to metadata-only diff (no env file comparison).
