# EXPLORE-1 — Exploración de código (fase 1) — compatibilidad /projectctl

> Lane: `sdd-explore-code` (read-only). Documenta el estado REAL del repo `colpruebas`
> contra el estándar canónico `/projectctl` (`projectctl-requirements` v10.0.0 / binding
> `task-flow-binding` v9.0.0). Cada afirmación se apoya en evidencia de archivo
> (path + línea o snippet exacto). No se modificó código, docs, config ni tests.
> Único write autorizado: este artefacto.

## 0. Contexto

- Artifact primario leído: `taskReadme/20260825-bhbr8k-remediacion-compatibilidad-projectctl-entornos-docs-tests.md`
  (objetivo: remediación AC-001..AC-005; drift detectados en §14/§18).
- Estándar inyectado y cargado íntegro: `projectctl-requirements/SKILL.md` + `references/{doc,test,entorno,tareas,standard}.md`.
- El problema actual declarado en el primario (§2) se CONFIRMA con la evidencia, con
  MATICES en TEST (persistencia `.runtime/test-results` SÍ tiene parcialmente `junit.xml`/`unit/`).

---

## 1. ENTORNO (references/entorno.md) — INCUMPLE

### 1.1 `.env` y `.env.dev`

- `.env` **AUSENTE** (`compose`/runtime canónicos lo exigen, entorno.md PCT-95/97).
  Raíz solo contiene: `.env.example`, `.env.dev`, `.env.dev.example`, `.env-dev`
  (evidencia: `ls` de root, glob `.env*`).
- `.env.dev` **PRESENTE** (raíz), pero su `FRONTEND_PORT=4324` (línea 5) ≠ canónico `4321`.
- `.env-dev` (copia legacy) también `FRONTEND_PORT=4324` (línea 5).
- `.env.example` `FRONTEND_PORT=4323` (línea 5) — no-canónico.
- Verificación explícita de ausencia: `compose.yml`/`compose.dev.yml` NO existen; tampoco
  `.env.prod`/`.env.production`. **Conclusión**: `projectctl env validate` (PCT-97) falla
  por `.env` ausente y puertos no canónicos.

### 1.2 Overlays compose (PCT-96)

- **Canónicos AUSENTES**: `compose.yml` (prod) y `compose.dev.yml` (dev) NO existen.
- **Legacy presentes**: `docker-compose.yml` y `docker-compose.dev.yml` (raíz).
- `docker-compose.yml` declara servicios `frontend-prod` (línea 2) y `api-prod` (línea 26)
  → NO canónicos (`frontend`/`api` por rol, standard.md §3).
- `docker-compose.dev.yml` declara `frontend-dev` (línea 2) y `api-dev` (línea 34).
- `frontend-prod` usa `Dockerfile.prod` (build arg, docker-compose.yml línea 6) en lugar de
  `target: prod`; `frontend-dev` usa `Dockerfile.dev` (línea 6) en vez de `target: dev`.
  → Requisito PCT-96 (target prod/dev) incumplido.
- Puerto de contenedor `4321` SÍ correcto (`"${FRONTEND_PORT}:4321"` en ambos archivos,
  líneas 11/8) — pero el FRONTEND_PORT del host no es 4321 (ver 1.1).
- Alias edge SÍ correctos: `colpruebas-origin` (docker-compose.yml línea 23) y
  `test-colpruebas-origin` (docker-compose.dev.yml línea 23); red `mis-proyectos-edge`
  `external: true` correcta (docker-compose.yml líneas 46-47, dev 58-59). → PCT-98 alias OK.

### 1.3 Docs prerrequisitos (PCT-95)

- `docs/00-context/` **AUSENTE** → `entornos.md` y `architecture.md` NO existen.
- `docs/02-features/` **AUSENTE** → `tunnel.md` NO existe.
- (Evidencia: `ls docs/` solo muestra `01-product`, `app-map`, `diagrams`.)

### 1.4 Skill `sandbox-runtime-policy` (PCT-99)

- **NO instalada**: `ls .agents/skills/` no contiene `sandbox-runtime-policy/`.
- (Se listan 22 skills SDD/coord; falta la runtime policy citada.)

---

## 2. DOCS (references/doc.md) — INCUMPLE

### 2.1 Bundle `views/projectctl`

- `docs/app-map/views/projectctl/` **AUSENTE** (no existe `index.md`).
- `docs/app-map/views/` solo contiene `home/` y `project-workspace/` (evidencia `ls`).
- → No hay bundle con las 5 secciones MUST (URL, Tab, Objetivo, Criterios, Diagrama Mermaid)
  ni `criteria[]` inline (PCT-84/85/88).

### 2.2 `navigation.yaml`

- `docs/app-map/navigation.yaml` **NO registra `projectctl`**: raíz `home`, hijos
  `home-status-summary`, `home-runtime-metadata`, `project-workspace`, y un solo feature
  `project-workspace-test-tab` (líneas 1-27). PCT-86 (SoT `navigation.yaml`) incumplido
  para la vista projectctl.

### 2.3 Superficie legacy (PCT-86)

- `docs/01-product/quality-plan.md` **PRESENTE** (raíz legacy, debe eliminarse per TST-03/TST-12).
- `docs/01-product/quality-status.md` **PRESENTE**.
- No hay subárbol `docs/01-product/quality/**` (solo los dos .md en `01-product/`).

### 2.4 Archivos reales bajo `docs/app-map/` y `docs/01-product/`

```
docs/app-map/index.md
docs/app-map/navigation.yaml
docs/app-map/views/home/index.md, index.mmd
docs/app-map/views/home/features/status-summary.{md,mmd}
docs/app-map/views/home/features/runtime-metadata.{md,mmd}
docs/app-map/views/project-workspace/index.md, index.mmd
docs/app-map/views/project-workspace/features/test-tab.{md,mmd}
docs/01-product/quality-plan.md
docs/01-product/quality-status.md
```
- `docs/app-map/views/project-workspace/index.md` lleva frontmatter `criteria[]`-like
  (id/summary) y secciones, sirviendo como ejemplo de formato bundle presente.

---

## 3. TEST (references/test.md) — INCUMPLE (parcial)

### 3.1 Runner y gate (PCT-89/91/93)

- `scripts/` **AUSENTE** → `scripts/test-runner.ts` **NO existe**.
- `package.json` (raíz) scripts SÓLO: `test`, `test:back`, `test:front` — **NO hay `test:check`**
  (queue `bun run test:check`, PCT-93/TST-13, AUSENTE).
- `playwright/` **AUSENTE** → `playwright/TEST_PLAN.md` **NO existe** (PCT-94).

### 3.2 Config Playwright (PCT-93)

- `playwright.config.ts` es **symlink roto**: `playwright.config.ts -> frontend/playwright.config.ts`
  y `frontend/playwright.config.ts` **NO existe** (evidencia `ls -la`).
- Existen `playwright.config.cjs` y `playwright.config.js` reales (raíz) como fallback.

### 3.3 Persistencia `.runtime/test-results/` (PCT-92) — MATIZ

- `.runtime/test-results/<projectId>/` EXISTE con 46 run-dirs (UUID).
- TODOS (46) tienen `summary.json`; **29** tienen `unit/junit.xml` + `unit/results.json` +
  `pwauto/results.json` (layout canónico TST-08 presente en esos).
- 17 run-dirs NO tienen `unit/` (solo `summary.json` + `pwauto/results.json`; ej.
  `09fdbc4f-...`).
- **Conclusión**: la persistencia parcial EXISTE (contradice literalmente el §2 del primario
  "sin junit.xml ni carpeta unit"); el gate/runner canónico sigue ausente. No es una
  superficie a crear desde cero, sino completar/validar.

### 3.4 Layout de tests y `@ac` (PCT-90/93)

- **NO existe** `projectctl-*-bundle.test.ts` ni `projectctl-requirements.sot-coherence.test.ts`
  bajo `frontend/__tests__/` ni `tests/` (evidencia `find`).
- Layout real existente:
  - `frontend/__tests__/home/home.test.ts` — header `// @ac HOME-01..HOME-05,...` (línea 1).
  - `frontend/__tests__/project-workspace-test-tab/proxy.test.ts` — header
    `// @ac PWT-01..PWT-12` (línea 1). Es "proxy mirror" (comentario líneas 3-5).
  - `frontend/tests/workspace-projects-colpruebas-{home,test-tab}.spec.ts`.
  - `tests/back/{endpoints,coverage-endpoints,test-status}.test.ts`.
  - `tests/front/tests/{index,test-tab}.spec.ts`.
- Primitivas de infra backend presentes: `backend/src/ac-header.ts`,
  `backend/src/coverage-writer.ts`, `backend/src/test-inventory.ts`
  (referencian `patchBundleCoverage`/AC, coherentes con PCT-92 alcance).

---

## 4. TAREAS (references/tareas.md binding) — INCUMPLE (drift)

### 4.1 `.agents/sdd-workflow.json` (locator)

```
contract_version: 1
binding_path: .agents/skills/projectctl-requirements/references/tareas.md
machine_block_id: task-flow-binding
expected_binding_id: projectctl-requirements.task-flow
binding_version: 8.0.0   <-- DRIFT: binding canónico declaration = 9.0.0
```
- (Archivo `read`, líneas 2-6.) → AC-004 repara el pin a `9.0.0`.

### 4.2 Projections (`projections` del locator)

| key | path | estado |
|---|---|---|
| `state_model` | `.agents/skills/projectctl-requirements/generated/phase-state-schema.json` | **PRESENTE** |
| `task_template` | `.agents/skills/projectctl-requirements/assets/task-template.md` | **PRESENTE** |
| `client_view_model` | `frontend/src/views/projectctl/data/tareas-tab.view-model.ts` | **AUSENTE** |
| `client_generated_ts` | `frontend/src/shared/sdd/task-flow.generated.ts` | **AUSENTE** |

- `frontend/src/views/` y `frontend/src/shared/` **no existen** → ambas projections client AUSENTES.

### 4.3 Estados retirados en `taskReadme/*.md`

- Presentes con estados **retirados** (retired_aliases del binding):
  - `2026-04-17-test-task-for-state-branching.md` (`branching`)
  - `2026-04-17-test-task-for-state-pushing.md` (`pushing`)
  - `2026-04-17-test-task-for-state-ready-for-branch.md` (`ready_for_branch`)
  - `2026-04-17-test-task-for-state-verified.md` (`verified`)
  - (también `blocked`/`failed`, que están en `status.writable`, no retirados)

---

## 5. CROSS — INCUMPLE

- `AGENTS.md` **AUSENTE** (raíz).
- `README.md` **AUSENTE** (raíz).
- `docs/00-context/agents_skills.md` **AUSENTE** (no existe `docs/00-context/`).
- `docs/04-process/task.md` **AUSENTE** (no existe `docs/04-process/`).
- `.atl/skill-registry.md` **AUSENTE** (no existe `.atl/`).
- `playwright.config.ts` symlink **ROTO** (ver §3.2).
- Rama git: reportado en el primario (§14/§18) como `main` con working tree con cambios
  preexistentes fuera de scope; **NO se ejecutó git** (regla de lane) — se marca como
  riesgo de entrega y se reconciliará en `branch_creation_pending`.

---

## 6. Síntesis por AC propuesto (mapeo a evidencia)

| AC | Área | Estado detectado |
|---|---|---|
| AC-001 | ENTORNO | `.env` ausente; `FRONTEND_PORT` 4323/4324 ≠ 4321; `compose.yml`/`compose.dev.yml` ausentes; servicios `*-prod`/`*-dev` no canónicos |
| AC-002 | DOCS | bundle `views/projectctl` ausente; `navigation.yaml` no registra; `quality-plan/status.md` presentes (a eliminar) |
| AC-003 | TEST | sin `scripts/test-runner.ts`; sin `test:check`; sin `playwright/TEST_PLAN.md`; symlink roto; persistencia `.runtime/` parcialmente presente; sin `projectctl-*-bundle.test.ts` ni `sot-coherence.test.ts` |
| AC-004 | TAREAS | locator pin `8.0.0` (drift→9.0.0); projections client ausentes; estados retirados en taskReadme |
| AC-005 | CROSS | `AGENTS.md`, `README.md`, `docs/00-context/agents_skills.md`, `docs/04-process/task.md`, `.atl/skill-registry.md` ausentes; symlink roto |

---

## 7. Riesgos / matices para la propuesta

1. **Persistencia test parcial (matiz crítico)**: `.runtime/test-results/<projectId>/` ya
   contiene 46 runs con `summary.json`; 29 con `unit/junit.xml`. AC-003 debe "completar"
   el pipeline canónico (runner + gate + TEST_PLAN), NO asumir directorio vacío.
2. **`.env`/`.env.dev` gitignored** (`.gitignore` líneas 1 y 22-23). Los archivos env
   creados/corregidos NO serán stageables por flujo normal → `force-add required` o
   `policy review required` al entregar AC-001.
3. **`.runtime/`, `test-results/`, `frontend/test-results/` NO están en `.gitignore`**
   (solo `playwright/test-results/`, `test/test-results/`). Si el runner nuevo escribe ahí,
   decidir política de ignorado durante diseño (riesgo de commit de artefactos runtime).
4. **Symlink `playwright.config.ts` roto** apunta a target inexistente; su restauración
   (AC-005) debe crear `frontend/playwright.config.ts` o repuntar.
5. **Branches con estados retirados** en `taskReadme/` son historial; AC-004 debe
   dejarlos "fuera de taskReadme" sin borrar historial de trabajo (a confirmar en propuesta).
6. **Drift locator** 8.0.0→9.0.0 ya registrado en el primario (§18 ítem #1); evidencia OK.

---

## 8. Evidencia — archivos inspeccionados

- `taskReadme/20260825-bhbr8k-remediacion-compatibilidad-projectctl-entornos-docs-tests.md`
- `.agents/sdd-workflow.json`
- `.agents/skills/projectctl-requirements/SKILL.md` + `references/{doc,test,entorno,tareas,standard}.md`
- `.agents/skills/sd-protocol/{sdd-phase-common,workflow-runtime-context,explorer-rules}.md`
- `.agents/skills/sdd-explore-code/SKILL.md`
- `package.json`, `frontend/package.json`
- `docker-compose.yml`, `docker-compose.dev.yml`
- `.env.example`, `.env.dev`, `.env.dev.example`, `.env-dev`
- `playwright.config.ts` (symlink), `playwright.config.cjs`, `playwright.config.js`
- `docs/app-map/index.md`, `docs/app-map/navigation.yaml`
- `docs/app-map/views/project-workspace/index.md`
- `docs/01-product/quality-plan.md`, `docs/01-product/quality-status.md`
- `frontend/__tests__/home/home.test.ts`, `frontend/__tests__/project-workspace-test-tab/proxy.test.ts`
- `.gitignore`
- Directory listings: `docs/`, `docs/app-map/views/`, `.agents/skills/`, `scripts/`,
  `playwright/`, `.runtime/test-results/`, `frontend/`, `frontend/src/`
