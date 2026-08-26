# APPLY-WU-ENT-2 — Evidencia de implementación documental (AC-001 ENTORNO — docs)

> Lane: `sdd-apply-doc` (apply_lane `doc`, phase artifact `apply-WU-ENT-2`).
> Task: `20260825-bhbr8k-remediacion-compatibilidad-projectctl-entornos-docs-tests`
> Criterio de aceptación: **AC-001** — documentación de entorno, arquitectura y tunnel
> gestionado (REQ-ENT-005 / PCT-95, PCT-96, PCT-98).
> Estándar inyectado: `projectctl-requirements` v10.0.0 / binding `task-flow-binding` v9.0.0
> (`references/{entorno,standard}.md`, PCT-95..PCT-100).
> Index-primary: esta lane NO escribe el índice; escribe este artifact y retorna
> `summary` + `artifact_ref` + `unit_status` (sdd-phase-common §F.5).

---

## 1. Scope / work unit ejecutada

Fila exacta de `taskReadme/.../tasks.md` (WU-ENT-2, tabla fase 2 §5):

| Campo | Valor |
| --- | --- |
| Unit | `WU-ENT-2` |
| apply_lane | `doc` |
| Objetivo | AC-001: documentación de entorno, arquitectura y tunnel gestionado |
| Archivos owned | `docs/00-context/entornos.md` (NEW); `docs/00-context/architecture.md` (NEW); `docs/02-features/tunnel.md` (NEW) |
| Depende de | WU-TSK-1 (done) + WU-ENT-1 (done — overlays canónicos ya existen) |
| Conflict group | docs |
| Modo | parallel-safe |
| Spec scenarios linked | REQ-ENT-005 (docs existen y referenciables desde `references/entorno.md`; `tunnel.md` declara alias por entorno + guardrail `TUNNEL_NOT_PUBLISHABLE` con accionables) |
| Verify expects | Los 3 archivos existen; `docs/02-features/tunnel.md` declara ambos alias (`colpruebas-origin`, `test-colpruebas-origin`) y el literal `TUNNEL_NOT_PUBLISHABLE` con accionables; `docs/00-context/entornos.md` documenta `FRONTEND_PORT` obligatorio y los nombres canónicos de overlay |
| Routing tag on failure | `doc_issue` |

Gate de ownership: archivos modificados = solo los 3 del `Archivos owned`. Nada más tocado.
`docs/00-context/agents_skills.md` (WU-CRS-2) y el bundle `views/projectctl` (WU-DOC-1) NO se
tocaron.

## 2. Documentación actualizada (evidencia "documentación actualizada")

### 2.1 `docs/00-context/entornos.md` (NEW)

Documento de contexto sobre cómo arrancan los entornos prod/dev. Documenta la **realidad del
repo** generada por WU-ENT-1 (overlays canónicos reales):

- **Overlays canónicos**: `compose.yml` (prod, `build.target: prod`) y `compose.dev.yml` (dev,
  `build.target: dev`), servicios `frontend`/`api`, overlay raíz con excepción operativa del
  api y service `tunnel` como fallback legacy opt-in (NO camino principal).
- **`FRONTEND_PORT` obligatorio**: en `.env` y `.env.dev`; mapeo `"${FRONTEND_PORT}:4321"`;
  valor canónico `4321`; `.env`/`.env.dev` locales excluidos del commit; `.env.example` como
  referencia commitada; `projectctl env validate` reporta `missing/invalid FRONTEND_PORT`.
- **Contrato edge `mis-proyectos-edge`**: red externa, alias por entorno (`colpruebas-origin`
  prod / `test-colpruebas-origin` dev), regla "alias edge first, `host.docker.internal:<PORT>`
  solo legacy".
- **Runtime vía `projectctl`**: sandbox sin Docker CLI/socket; control exclusivo con
  `projectctl env * / tunnel * / start|stop|...|doctor`; `webhook-listener` única superficie
  privilegiada.
- **Cómo arrancar**: pasos concretos (`env validate` → `start dev|prod` → `status`/`logs` →
  `doctor`).

### 2.2 `docs/00-context/architecture.md` (NEW)

Vista de contexto de la arquitectura del repo (REQ-ENT-005 — "arquitectura del repo"):

- Frontend **Astro** (`frontend/`, SSR, puerto `4321`, `allowedHosts`, páginas index/project/
  `/projectctl`, view `projectctl` con projection `tareas-tab.view-model.ts`, Dockerfiles
  `AS prod`/`AS dev`).
- Backend **API Express + Bun** (`backend/`, endpoints informativos + coverage/test-inventory,
  primitivos `ac-header.ts`/`coverage-writer.ts`/`test-inventory.ts`, puerto `3000`).
- **Docs funcionales** (`docs/app-map/**` + `navigation.yaml` como única superficie funcional).
- **Sistema de testing** canónico (runner `scripts/test-runner.ts`, `test:check`, persistencia
  `.runtime/`, `// @ac`).
- **Runtime/entornos** + **coordinación de tareas** (taskReadme + binding v9.0.0).

### 2.3 `docs/02-features/tunnel.md` (NEW)

Documento de feature del tunnel gestionado (REQ-ENT-005 / PCT-98):

- **Tunnel gestionado central** vía `CENTRAL_TUNNEL_WEBHOOK_URL` + `DEPLOY_JWT_SECRET`; service
  `tunnel` de compose solo fallback legacy opt-in (decisión design OQ3 aplicada, coherente con
  WU-ENT-1: NO incluido como camino principal).
- **Alias por entorno**: tabla con prod `colpruebas-origin` (overlay `compose.yml`) y dev
  `test-colpruebas-origin` (overlay `compose.dev.yml`) — ambos literales declarados.
- **Guardrail `TUNNEL_NOT_PUBLISHABLE`**: literal presente; formato de reporte
  (`publishability: not_publishable` + `channels`/`services`/`remediation`) y **acciones
  concretas** (verificar aliases/overlay, verificar red `mis-proyectos-edge`, `env validate`,
  tunnel `set-domain`/`set`, `rebuild`).

## 3. Verificación (file inspection, narrow — permitida)

| Verify expect | Resultado | Evidencia |
| --- | --- | --- |
| 3 archivos existen | PASS | `ls docs/00-context/entornos.md docs/00-context/architecture.md docs/02-features/tunnel.md` → 3 archivos. |
| `tunnel.md` declara ambos alias | PASS | `colpruebas-origin` (línea 29), `test-colpruebas-origin` (línea 30). |
| `tunnel.md` declara literal `TUNNEL_NOT_PUBLISHABLE` | PASS | Líneas 37, 49. |
| `tunnel.md` incluye accionables (`remediation`) | PASS | Sección "Acciones concretas (remediation)" líneas 51+ (5 acciones). |
| `entornos.md` documenta `FRONTEND_PORT` obligatorio | PASS | Sección "`FRONTEND_PORT` obligatorio" (líneas 28-40) con `FRONTEND_PORT=4321` y mapeo `"${FRONTEND_PORT}:4321"`. |
| `entornos.md` documenta nombres canónicos de overlay | PASS | Tabla con `compose.yml` (prod) y `compose.dev.yml` (dev) (líneas 18-19). |
| Referenciable desde `references/entorno.md` (REQ-ENT-005) | PASS | `references/entorno.md` PCT-95/96/97/98/99 citan `docs/00-context/entornos.md`, `docs/00-context/architecture.md`, `docs/02-features/tunnel.md` como SoT — rutas ahora existen y coinciden literalmente. |

## 4. Devueltos / entregables

- **Archivos modificados**: `docs/00-context/entornos.md` (NEW), `docs/00-context/architecture.md`
  (NEW), `docs/02-features/tunnel.md` (NEW). **Nada más.**
- **Spec/design criteria satisfied**: REQ-ENT-005 (PCT-95/96/98); design §4 AC-001 docs rows
  (3 filas `NEW`); refleja la realidad de WU-ENT-1 (overlays canónicos reales, aliases reales).
- **Verify expects**: cumplidos (§3). Los 3 archivos existen; `tunnel.md` declara ambos alias y
  `TUNNEL_NOT_PUBLISHABLE` con accionables; `entornos.md` documenta `FRONTEND_PORT` obligatorio
  y los nombres canónicos de overlay.
- **Deviations del diseño**: ninguna.
- **Unresolved follow-up**: validación CLI runtime (`projectctl env validate`/`status`/`doctor`)
  diferida a fase 3 (coordinator-owned, WU-CLI-VAL). Referencia a
  `projectctl-entorno-bundle.test.ts` (citada en `references/sources.md` PCT-98) — test de fase
  3/AC-003, fuera de scope de esta lane documental.

## 5. File-surface check (§D sdd-phase-common) — obligatorio

| Path | Clasificación |
| --- | --- |
| `docs/00-context/entornos.md`, `docs/00-context/architecture.md`, `docs/02-features/tunnel.md` | commit normal (archivos documentales nuevos bajo `docs/`, trackeables). |
| `apply-WU-ENT-2.md` (este artifact) | commit normal (phase artifact bajo `taskReadme/`). |

Sin rutas gitignored/generadas/local-only tocadas por esta lane. La verificación mecánica de
stageo/commit la ejecuta el coordinador en el cierre (mecánica git fuera de authority de esta
lane).

---

**criteria_covered**: AC-001
**next_recommended**: por AD-10, `sdd-apply-code-low` WU-ENT-3 (skill `sandbox-runtime-policy`)
y luego WU-TST-1 (serial, último, para que `test:check` nazca verde).
