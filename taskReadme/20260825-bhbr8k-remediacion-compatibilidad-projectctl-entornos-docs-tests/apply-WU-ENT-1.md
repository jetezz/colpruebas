# APPLY-WU-ENT-1 — Evidencia de implementación (AC-001 ENTORNO)

> Lane: `sdd-apply-code-medium` · Unit: `WU-ENT-1` · apply_lane: `code-medium`
> Objetivo: AC-001 — env con FRONTEND_PORT=4321 + overlays canónicos compose + git rm legacy +
> stages Dockerfile (topología runtime atómica, AD-01/AD-03/AD-07).
> Estado de la unit: `done` · Archivo de evidencia: este artifact.
> Estándar inyectado: `projectctl-requirements` v10.0.0 / binding `task-flow-binding` v9.0.0.
> Product policies (frontend-policy, backend-api-policy, sandbox-runtime-policy): **NO instaladas
> en este repo** (gap conocido, sandbox-runtime-policy se instala en WU-ENT-3). Contrato aplicable
> a esta unit: `references/entorno.md` (PCT-95..100) + `references/standard.md` §3 + design
> AD-01/AD-03/AD-07.

---

## 1. Pre-implementation gate (code-medium — full 5-check)

| Gate | Resultado | Evidencia |
| --- | --- | --- |
| **Scope** | PASS | Unit `WU-ENT-1`, `apply_lane: code-medium`, archivos owned exactos: `.env` (local), `.env.dev` (local), `.env.example`, `compose.yml`, `compose.dev.yml`, `docker-compose.yml` (RM), `docker-compose.dev.yml` (RM), `frontend/Dockerfile.prod`, `frontend/Dockerfile.dev`. Nada más tocado. |
| **Spec linkage** | PASS | REQ-ENT-001 (`.env`/`.env.dev` FRONTEND_PORT=4321; `.env.example` alineado; puerto mapeado `"${FRONTEND_PORT}:4321"`); REQ-ENT-002 (compose.yml servicios `frontend`/`api`, `target: prod`, red/alias `colpruebas-origin` preservados); REQ-ENT-003 (compose.dev.yml `target: dev`, alias `test-colpruebas-origin`); REQ-ENT-004 (legacy fuera de uso canónico); REQ-ENT-007 (env validate ok). |
| **Implementation target** | PASS | Concreto: `.env` NEW local (copia de `.env.example` con `ENVIRONMENT=production` y `FRONTEND_PORT=4321`); `.env.dev` local `4324→4321`; `.env.example` commit `4323→4321`; `compose.yml`/`compose.dev.yml` NEW con servicios `frontend`/`api` (`target: prod|dev`), `ports: "${FRONTEND_PORT}:4321"`, redes `internal` + `edge` (`external: true`, `name: mis-proyectos-edge`, alias `colpruebas-origin`/`test-colpruebas-origin`); borrado físico de `docker-compose*.yml`; Dockerfiles `FROM oven/bun:1-alpine AS prod|dev`. |
| **Verification target** | PASS | File inspection: servicios `frontend`/`api` en ambos overlays, `target: prod|dev`, `ports "${FRONTEND_PORT}:4321"`, `networks.edge.external: true` + `name: mis-proyectos-edge` + aliases; `docker-compose*.yml` ausentes; Dockerfiles con `AS prod`/`AS dev`; `.env.example` con `FRONTEND_PORT=4321`; (fase 3) `projectctl env validate` ok + `projectctl status` levanta prod/dev (WU-CLI-VAL) + R-007 valida `compose.yml`/`compose.dev.yml`/`.env.example`. |
| **Failure routing** | PASS | `code_issue` en caso de fallo. |

Cross-cutting (topología runtime): **rollback awareness requerido** (ver §6). Sin surfaces
migration/security/auth (red/alias preservados sin cambios de valor; sin tunnels nuevos). Contract
fields todos presentes y concretos. Dependencia `WU-TSK-1` resuelta (done). Conflict group
`runtime-env`, modo serial, sin dependencias sin resolver.

---

## 2. Implementación

### 2.1 Contexto leído (source of truth)

- Overlays legacy (fuente del contrato API/edge a preservar): `docker-compose.yml` (prod,
  servicios `frontend-prod`/`api-prod`, red `internal` `colpruebas-prod-internal` + `edge`
  `external: true` `mis-proyectos-edge`, alias `colpruebas-origin`, mapeo `${FRONTEND_PORT}:4321`)
  y `docker-compose.dev.yml` (dev, `frontend-dev`/`api-dev`, alias `test-colpruebas-origin`,
  watch/HMR vía `develop.watch`, volumes `./frontend/src:/app/src` y `./backend/src:/app/src`).
- Env actual: `.env` AUSENTE; `.env.dev` con `FRONTEND_PORT=4324`; `.env.example` con
  `FRONTEND_PORT=4323`. Ambos `.env`/`.env.dev` gitignored y no trackeados (confirmado:
  `.gitignore` líneas 1/22/23; `git ls-files` no los lista); `.env.example` trackeado.
- Diseño: AD-01 (recrear no `git mv`; `git rm` explícito de legacy), AD-03 (`.env`/`.env.dev`
  `exclude from commit`; `.env.example` = firma commitada), AD-07 (stages `AS prod`/`AS dev`).

### 2.2 Archivos env (working tree local / commit)

| Archivo | Estado | Cambio |
| --- | --- | --- |
| `.env` | NEW (local, `exclude from commit`) | Copia de `.env.example` (tras fijar el puerto) con `ENVIRONMENT=production` y `FRONTEND_PORT=4321`. |
| `.env.dev` | MODIFIED (local, `exclude from commit`) | `FRONTEND_PORT=4324` → `4321`. |
| `.env.example` | MODIFIED (commit normal) | `FRONTEND_PORT=4323` → `4321` — referencia canónica instalable (AD-03, REQ-ENT-001). |

### 2.3 Overlays canónicos (commit normal)

**`compose.yml` (prod, NEW)** — preserva el contrato prod legacy renombrando servicios a los
nombres canónicos por rol (`frontend`/`api`), añadiendo `build.target: prod` y conservando el
mapeo de puertos, redes, aliases, `container_name` y `restart`:

- `frontend`: `build: {context: ./frontend, dockerfile: Dockerfile.prod, target: prod}` + args
  `PUBLIC_ENVIRONMENT`/`PUBLIC_API_URL`; `ports: "${FRONTEND_PORT}:4321"`; env `NODE_ENV`,
  `APP_NAME`, `PUBLIC_ENVIRONMENT`, `PUBLIC_API_URL`; `depends_on: [api]`; networks `internal` +
  `edge` (alias `colpruebas-origin`); `restart: unless-stopped`.
- `api`: `build: {context: ., dockerfile: ./backend/Dockerfile.prod}`; `ports: "${API_PORT}:3000"`;
  env idem legacy; network `internal`; `restart: unless-stopped`. API no expuesta al host salvo
  el mapeo documentado del overlay (excepción operativa del `compose.yml` raíz, standard §3).
- `networks`: `internal` (`colpruebas-prod-internal`) + `edge` (`external: true`,
  `name: mis-proyectos-edge`).

**`compose.dev.yml` (dev, NEW)** — preserva el contrato dev legacy (HMR/watch, volumes) con
servicios canónicos y `build.target: dev`:

- `frontend`: `target: dev`; `ports: "${FRONTEND_PORT}:4321"`; volumen `./frontend/src:/app/src`;
  env idem legacy incl. `API_URL=http://colpruebas-api-dev:3000` y `CHOKIDAR_USEPOLLING=true`;
  `depends_on: [api]`; networks `internal` + `edge` (alias `test-colpruebas-origin`);
  `develop.watch` (sync `./frontend/src`, rebuild `package.json` + `astro.config.mjs`).
- `api`: `build: {context: ./backend, dockerfile: Dockerfile.dev}`; volumen `./backend/src:/app/src`;
  env idem legacy; network `internal`; `develop.watch` (sync `./backend/src`).
- `networks`: `internal` (`colpruebas-dev-internal`) + `edge` (`external: true`,
  `name: mis-proyectos-edge`).

> **Decisiones de preservación (contrato API/edge, PCT-98)**: (1) `container_name` de los 4
> servicios legacy se conserva (`colpruebas-frontend-prod`, `colpruebas-api-prod`,
> `colpruebas-frontend-dev`, `colpruebas-api-dev`) — preserva la identidad de contenedor
> existente y el DNS `colpruebas-api-dev` que `API_URL` referencia en dev (el servicio renombrado
> a `api` también resuelve como alias de red). (2) Alias edge y red `mis-proyectos-edge` sin
> cambios de valor (REQ-ENT-002/003: preservación). (3) Sin `service: tunnel` como camino
> principal — **decisión open Q3 del design aplicada: NO se incluye**; el tunnel gestionado
> central vía `CENTRAL_TUNNEL_WEBHOOK_URL` + `DEPLOY_JWT_SECRET` es el camino principal
> (standard §3, PCT-96). El legacy dev tampoco declaraba `tunnel`, así que no hay regresión de
> overlay.

### 2.4 Legacy removidos (RM — borrado físico)

`docker-compose.yml` y `docker-compose.dev.yml` eliminados del árbol (AD-01/REQ-ENT-004). El
staging de la eliminación (`git rm`) lo ejecuta el coordinador en el cierre (mecánica git fuera
de authority de esta lane). Ninguna ruta operativa del repo referencia los nombres legacy como
overlays canónicos.

### 2.5 Dockerfiles frontend (commit normal, AD-07)

- `frontend/Dockerfile.prod`: `FROM oven/bun:1-alpine` → `FROM oven/bun:1-alpine AS prod` (stage
  nombrado que `build.target: prod` selecciona). Resto del build preservado.
- `frontend/Dockerfile.dev`: `FROM oven/bun:1-alpine` → `FROM oven/bun:1-alpine AS dev` (HMR/
  watch). Resto preservado.

---

## 3. Verificación (file inspection, narrow — permitida)

| Check | Resultado | Evidencia |
| --- | --- | --- |
| `docker-compose*.yml` ausentes | PASS | `ls docker-compose*` → No such file or directory. |
| `compose.yml` servicios `frontend`/`api` | PASS | `frontend:` (línea 2), `api:` (línea 27); `target: prod` (línea 7). |
| `compose.yml` ports | PASS | `"${FRONTEND_PORT}:4321"` (línea 12). |
| `compose.yml` red edge | PASS | `external: true` (47), `name: mis-proyectos-edge` (48), alias `colpruebas-origin` (24). |
| `compose.dev.yml` servicios `frontend`/`api` | PASS | `frontend:` (2), `api:` (35); `target: dev` (7). |
| `compose.dev.yml` ports | PASS | `"${FRONTEND_PORT}:4321"` (9). |
| `compose.dev.yml` red edge | PASS | `external: true` (59), `name: mis-proyectos-edge` (60), alias `test-colpruebas-origin` (24). |
| Dockerfiles stages | PASS | `Dockerfile.prod:1` `FROM oven/bun:1-alpine AS prod`; `Dockerfile.dev:1` `FROM oven/bun:1-alpine AS dev`. |
| `.env.example` puerto | PASS | `FRONTEND_PORT=4321` (línea 5). |
| `.env` / `.env.dev` puerto | PASS | Ambos `FRONTEND_PORT=4321` (copia de `.env.example` + fix `.env.dev`); `.env` con `ENVIRONMENT=production`. |
| (fase 3) `projectctl env validate` ok / `projectctl status` prod+dev / R-007 | DIFERIDO | Coordinator-owned (WU-CLI-VAL, fase 3); no ejecutable desde esta lane (runtime/projectctl forbiddden). |

---

## 4. Devueltos / entregables

- **Archivos modificados**: `.env` (NEW, local), `.env.dev` (MODIFIED, local), `.env.example`
  (MODIFIED), `compose.yml` (NEW), `compose.dev.yml` (NEW), `docker-compose.yml` (RM, borrado
  físico), `docker-compose.dev.yml` (RM, borrado físico), `frontend/Dockerfile.prod` (MODIFIED),
  `frontend/Dockerfile.dev` (MODIFIED). **Nada más.**
- **Spec/design criteria satisfied**: REQ-ENT-001/002/003/004/007; AD-01 (recrear + legacy RM),
  AD-03 (env locales excluidos, `.env.example` firma), AD-07 (stages `AS prod`/`AS dev`);
  PCT-96 (overlays canónicos), PCT-97 (`FRONTEND_PORT` obligatorio y canónico), PCT-98 (red edge
  external + alias por entorno preservados).
- **Task contract fields satisfied**: implementación contract + verify expects (ver §1/§3).
- **Deviations del diseño**: ninguna. Open Q3 del design resuelta como decisión de apply: `tunnel`
  NO incluido en `compose.dev.yml` (camino principal = tunnel gestionado central; sin regresión
  respecto al legacy dev que no lo declaraba).
- **Unresolved follow-up**: validación CLI runtime (env validate / status / doctor) y gate R-007
  diferidas a fase 3 (coordinator-owned, WU-CLI-VAL). Product policies `sandbox-runtime-policy`
  (WU-ENT-3) no presente en esta unit — la unit no toca superficie sandbox; si el coordinador
  requiere contrato sandbox para validación runtime, debe instalarse antes de WU-CLI-VAL.

---

## 5. File-surface check (§D sdd-phase-common) — obligatorio

| Path | Clasificación |
| --- | --- |
| `.env`, `.env.dev` | `exclude from commit` (gitignored, AD-03 — confirmado: `.gitignore` líneas 1/22/23 y no trackeados). Sin `force-add` (AD-03: la firma commitada es `.env.example` + validación runtime). |
| `.env.example`, `compose.yml`, `compose.dev.yml`, `frontend/Dockerfile.prod`, `frontend/Dockerfile.dev` | commit normal (trackeados / nuevos). |
| `docker-compose.yml`, `docker-compose.dev.yml` | `git rm` — borrados físicamente por esta lane; staging de la eliminación lo ejecuta el coordinador en el cierre (mecánica git fuera de authority de esta lane). |
| `apply-WU-ENT-1.md` (este artifact) | commit normal (phase artifact bajo `taskReadme/`). |

---

## 6. Rollback plan (cross-cutting: topología runtime)

1. **PR único (design §7.3)**: revertir el merge revierte la topología completa (overlays
   canónicos + Dockerfiles + `.env.example`).
2. **Si `projectctl` no levanta tras el cambio** (fase 3): restaurar los overlays legacy
   `docker-compose.yml`/`docker-compose.dev.yml` desde el commit previo (`git checkout <prev> --
   docker-compose*.yml`) y revertir `compose.yml`/`compose.dev.yml`; red/alias NO requieren
   rollback externo (valores preservados sin cambios, PCT-98).
3. **Dockerfiles**: revertir `AS prod`/`AS dev` (git revert de los 2 archivos) restaura el build
   single-stage previo si `build.target` fallara.
4. **Env locales** (`.env`/`.env.dev`): gitignored, no viajan en el PR; regenerables localmente
   (copia de `.env.example` + `FRONTEND_PORT=4321`). Sin secretos en git.

---

**criteria_covered**: AC-001
**next_recommended**: por AD-10, `sdd-apply-doc` WU-ENT-2 (docs entorno/arquitectura/tunnel) y
`code-low` WU-ENT-3 (skill `sandbox-runtime-policy`); luego WU-TST-1 (serial, último).
