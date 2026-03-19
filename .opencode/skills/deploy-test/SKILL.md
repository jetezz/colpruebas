---
name: deploy-test
description: Browser automation agent that deploys a feature branch to the test environment on colproyects.online and waits for the deploy to complete. Use when the coordinator state is `deploying` and a task has `project_id` and `project_url` in its frontmatter.
allowed-tools: Bash(playwright-cli:*)
metadata:
  id: deploy-test
  version: 1.0.0
---

# deploy-test Skill

Automate the deployment of a branch to the test environment via the colproyects.online UI.

## Required inputs

- `project_url` — Full URL of the project page
- `branch` — The git branch to deploy

## Login credentials

- **Email**: `admin@opencode.local`
- **Password**: `Admin1234!`

## CRITICAL: Efficiency rules

The deploy takes **1-3 minutes** to complete (docker compose rebuild). You must manage your step budget wisely:

1. **Batch actions** — Chain related commands in a single step: `playwright-cli -s=deploy-session click eXX && sleep 2 && playwright-cli -s=deploy-session snapshot`
2. **Minimize snapshots** — Only take snapshots when you need to read refs or check status. Never take a snapshot "just to see" without acting on it.
3. **Use long sleeps during polling** — Use `sleep 60` (not `sleep 30`) between deploy status checks. The deploy takes 1-3 min, so 3-4 polls is enough.
4. **Skip unnecessary steps** — If the branch already matches, skip directly to triggering deploy. Don't take extra snapshots to "confirm".
5. **Do NOT reload the page** — The frontend auto-polls deploy status every 3 seconds internally. Just take snapshots.

## Procedure

### Phase 1 — Open and authenticate (1-3 steps)

Open the project page with a persistent session:

```bash
playwright-cli -s=deploy-session open {project_url} --persistent --isolated
```

> **IMPORTANT**: Always use `--isolated` to avoid "Browser is already in use" errors from stale daemon state. Never omit this flag.

Check the snapshot output in the command response:
- If **page URL contains `/login`** → authenticate (fill email, password, click "Entrar"), then navigate to `{project_url}`
- If **page shows the project** → proceed to Phase 2

For login, batch all three fills + click in quick succession:

```bash
playwright-cli -s=deploy-session fill <ref-email> "admin@opencode.local"
playwright-cli -s=deploy-session fill <ref-password> "Admin1234!"
playwright-cli -s=deploy-session click <ref-entrar-button>
```

Then navigate to the project:

```bash
playwright-cli -s=deploy-session goto {project_url}
```

### Phase 2 — Navigate to Entornos and check branch (1-3 steps)

Click the **"Entornos"** tab button and take a snapshot:

```bash
playwright-cli -s=deploy-session click <ref-entornos-tab>
```

Then take a snapshot to see the environment cards:

```bash
playwright-cli -s=deploy-session snapshot
```

In the snapshot, look at the Test card for `Rama: <code>BRANCH</code>`:
- If **branch matches** `{branch}` → skip to Phase 3
- If **branch differs** → change it (Phase 2b)

#### Phase 2b — Change branch (only if needed, 3-4 steps)

1. Click "Configuracion Docker centralizada" to expand config
2. Find the "Rama Test" input, fill it with `{branch}`:
   ```bash
   playwright-cli -s=deploy-session fill <ref-rama-test-input> "{branch}"
   ```
3. Click "Guardar configuracion Docker" save button
4. Take snapshot to confirm save succeeded (toast: "Configuracion guardada")

### Phase 3 — Trigger deploy (1-2 steps)

Click **"🧪 Deploy Test"** button:

```bash
playwright-cli -s=deploy-session click <ref-deploy-test-button>
```

Take ONE snapshot to confirm deploy started (button shows "Desplegando...", status shows "● Desplegando..."):

```bash
playwright-cli -s=deploy-session snapshot
```

### Phase 4 — Wait for completion (3-5 steps)

The deploy takes 1-3 minutes. Use `sleep 60` between polls:

```bash
sleep 60 && playwright-cli -s=deploy-session snapshot
```

Check the snapshot for terminal statuses:
- **"● Éxito"** → Deploy succeeded → go to Phase 5
- **"● Fallido"** → Deploy failed → go to Phase 5
- **"● Desplegando…"** or **"Desplegando…"** → Still in progress → sleep and poll again

Repeat polling up to 5 times (5 minutes max). If still deploying after 5 polls, return `deploy_status: timeout`.

### Phase 5 — Close and return (1 step)

```bash
playwright-cli -s=deploy-session close
```

Return the result immediately.

## Output contract

```
result: done | failed
deploy_status: success | failed | timeout
summary: <one paragraph>
next_state: testing | failed
```

- `success` → `result: done`, `next_state: testing`
- `failed` → `result: failed`, `next_state: failed`
- `timeout` → `result: failed`, `deploy_status: timeout`, `next_state: failed`

## Error handling

| Condition                    | Action                                              |
| ---------------------------- | --------------------------------------------------- |
| Login page shown             | Authenticate with credentials, then navigate        |
| Deploy button disabled       | Deploy already in progress — poll for its result    |
| Deploy button not found      | Return `failed` — UI may have changed               |
| Deploy times out (> 5 min)   | Return `failed` with `deploy_status: timeout`       |

## Key facts

- Always use `-s=deploy-session` and `--persistent` on the first `open`
- Use `sleep N` for waiting (NOT `timeout`)
- Refs (e.g. `e55`, `e233`) change between snapshots — always read from the LATEST snapshot
- The deploy branch config is inside the collapsible "Configuracion Docker centralizada" section
- After saving config, the section auto-collapses — take a new snapshot to find the Deploy Test button
