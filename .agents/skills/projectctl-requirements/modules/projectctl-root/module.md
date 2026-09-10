---
name: projectctl-root
description: "Trigger: projectctl local, projectctl root, comandos desde el host, wrapper root, SANDBOX_INTERNAL_TOKEN, sin credenciales. Operar el CLI projectctl autenticado desde la terminal del host root vía el bridge interno."
license: Apache-2.0
metadata:
  id: projectctl-root
  version: 1.0.0
  author: gentleman-programming
  layer: repo
  type: operational-guide
---

# projectctl-root

## Activation Contract

Cargar cuando haya que ejecutar comandos `projectctl` desde la **terminal del host root** (el propio repo `mis-proyectos`), diagnosticar errores root-mode, o decidir si un comando es *bridged*. No aplica dentro del sandbox (allí el CLI ya trae su bridge de terminal por PTY).

## Objetivo

El bridge root (task `20260906-pctlrt`, PR #172) permite operar `projectctl` autenticado desde el host **sin credenciales por uso**: trust anchor = posesión de la máquina + `SANDBOX_INTERNAL_TOKEN` ya presente en `.env`. Aplica las mismas condiciones que el terminal del proyecto (ownership server-side, confirmaciones, auditoría al owner real). En sandbox el modelo fail-closed por usuario (JWT corto + capability revocable) queda intacto y ortogonal.

## Hard Rules

- Invocación canónica: `SANDBOX_INTERNAL_TOKEN=<env> bun scripts/projectctl-root.ts <comando> [args]`. El wrapper inyecta env-only: `OPENCODE_ROOT_BRIDGE=1`, `OPENCODE_INTERNAL_TOKEN`, `OPENCODE_API_URL=http://localhost:3001`, `PROJECT_ID` (repo raíz). Nunca pasar el token por argv.
- El token **nunca** se imprime, commitea ni registra en outputs (fail-closed del guard: 403).
- En flujo SDD, el `coordinador` es el único caller del CLI; esta skill documenta el CÓMO operativo, no cambia ese ownership.
- Comandos destructivos mantienen su gate: sin `--yes` → `CONFIRMATION_REQUIRED` (no confirmar sin pedido explícito del operador).
- Stack vivo requerido: el API debe estar rebuilt con el módulo puente (`docker compose -f compose.yml up -d --build` tras cambios de código).

## Decision Gates

| Necesito... | Comando (bridged) |
|---|---|
| Estado runtime | `status [env]`, `ps [env]`, `logs [env] --tail N`, `metrics` |
| Diagnóstico | `doctor`, `runtime preflight dev`, `runtime plan dev`, `runtime readiness dev`, `runtime check`, `env validate` |
| Docs | `docs lint` |
| Tablero | `tasks-status get/set <id>` (NOTA: `tasks-status list` tiene gap pre-existente) |
| Ciclo de vida (con `--yes` explícito) | `start/stop/restart [env]` |

| Señal | Significado | Acción |
|---|---|---|
| `token_mismatch` / `missing_header` / `empty_env` (403) | Guard fail-closed | Verificar `SANDBOX_INTERNAL_TOKEN` en `.env` host; token vacío = kill-switch |
| `ROOT_BRIDGE_MISSING_TOKEN` | Wrapper sin token en env | Exportar token antes de invocar |
| `HTTP 404 — not bridged in root mode` | Familia no bridged (`tunnel *`, `sdd *`, `releases`, `users`, env writes, tasks CRUD, secrets) | Usar el terminal del proyecto (sandbox) |
| `INVALID_ENV` en preflight/plan | Esos comandos son dev-only por diseño | Usarlos con `dev` |

## Dónde encontrar

- **Wrapper canónico**: `scripts/projectctl-root.ts` (bun, código fresco) · `scripts/projectctl-local` (dist compilado + `.env.projectctl.local`, gitignored).
- **Catálogo SoT**: `sandbox/src/lib/projectctl-registry.ts` (backend) + `frontend/src/views/projectctl/data/projectctl-commands.ts` (UI, 95 visibles).
- **UI**: `/projectctl?tab=cli`.
- **Contratos normativos**: `docs/02-features/api.md` §3.8 (familia interna, 14 subpaths) · `docs/00-context/security.md` §15 (trust anchor + kill-switch + loopback) · `docs/02-features/sandbox.md` §3.2 (root lane).
- **Evidencia de origen**: `taskReadme/20260906-pctlrt-projectctl-root-bridge/verify-report.md`.

## Output Contract

Reportar comando ejecutado, entorno, exit code y envelope (`✓`/`✗ [categoría]`) sin exponer nunca el token. Errores root-mode se diagnostican con la tabla de señales; nunca reimplementar auth ni llamar endpoints `/internal` a mano.

## Related skills (frontera)

- `projectctl-requirements` — requisitos de compatibilidad `/projectctl` y flujo de tareas; esta skill NO copia sus checklists.
- `coordinador` — ownership del CLI en flujo SDD.
- `sandbox-runtime-policy` / `backend-api-policy` — invariantes de las superficies que el bridge reutiliza; esta skill solo operacionaliza el uso desde root.

## Capa y duplicaciones evitadas

- **Capa**: repo (cita rutas normativas de `docs/`, `scripts/` y `taskReadme/` de este proyecto).
- Evita duplicar: contratos del bridge (viven en `docs/02-features/api.md` §3.8 y security §15), catálogo de comandos (SoT en el registry), requisitos `/projectctl` (en `projectctl-requirements`).
