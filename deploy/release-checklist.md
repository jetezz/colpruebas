# Release checklist

Owner: **Platform / release**. Run this checklist from the repository root and record the
command output and exit code for each gate. The checklist documents existing gates; it does not
introduce CI, deployment manifests, or secret values.

## Gates

- [ ] **Environment validation**

  ```text
  projectctl env validate
  ```

  Expected: the active production/development environment configuration is valid. Do not paste
  secret values into the release record.

- [ ] **Runtime diagnosis**

  ```text
  projectctl doctor
  ```

  Expected: no critical runtime drift is reported.

- [ ] **Contractual test gate**

  ```text
  bun run test:check
  ```

  Expected: the repository test runner completes successfully.

- [ ] **Frontend build**

  ```text
  bun --cwd frontend run build
  ```

  Expected: the Astro frontend build completes successfully.

- [ ] **Compose validation**

  ```text
  docker compose -f compose/compose.yml -f compose/compose.dev.yml config
  docker compose -f compose/compose.yml -f compose/compose.prod.yml config
  ```

  Expected: both overlay combinations resolve without configuration errors. Docker Compose is a
  host/platform operation; the managed sandbox deliberately does not expose Docker.

- [ ] **Structure validation**

  ```text
  projectctl local structure check . --mapping 1.0.0 --json
  ```

  Expected: the local structure envelope reports `success: true` with no error or warning
  findings. A managed check may only be declared PASS when the managed filesystem capability is
  available; otherwise retain its fail-closed result.

## Execution order

Run the gates in the order shown: environment validation, diagnosis, tests, frontend build,
Compose validation, and structure validation. A failed gate blocks release until the cause is
resolved and the gate is rerun.

## Evidence record

For every gate, record:

1. the exact command;
2. the environment (`prod` or `dev`, where applicable);
3. the exit code;
4. the relevant success/failure summary; and
5. any non-applicable condition with its reason.

Never record `DEPLOY_JWT_SECRET`, `CENTRAL_TUNNEL_WEBHOOK_URL`, tokens, or other secret values.

## Traceability

- `docs/00-context/entornos.md` — environment validation, managed lifecycle, and Compose overlays.
- `docs/00-context/architecture.md` — frontend build/runtime layout and test gate context.
- `docs/02-features/tunnel.md` — managed tunnel operations and secret-variable handling.
- `README.md` and `AGENTS.md` — `projectctl` and Bun commands allowed by this repository.
- `compose/compose.yml`, `compose/compose.dev.yml`, and `compose/compose.prod.yml` — Compose
  validation targets.
- `../../../../taskReadme/20260919-rf511-refactor-511a-estructura/tasks.md` — the exact
  regression and structure-check commands for this refactor.
