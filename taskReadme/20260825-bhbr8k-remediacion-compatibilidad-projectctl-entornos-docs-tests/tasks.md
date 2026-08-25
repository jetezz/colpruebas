# TASKS-1 — Desglose de unidades de trabajo (fase 2) — Remediación compatibilidad /projectctl (entornos, docs, tests)

> Lane: `sdd-tasks` (fase 2, unit `TASKS-1`). Basado en propuesta aprobada (`proposal.md`,
> PROPOSE-1), specs delta (`spec.md`, SPEC-1, 30 REQs / 5 dominios) y diseño técnico
> (`design.md`, DESIGN-1, AD-01..AD-10, orden de rollout AC-004→AC-005→AC-002→AC-001→AC-003).
> Estándar inyectado: `projectctl-requirements` v10.0.0 / binding `task-flow-binding` v9.0.0
> (`references/{standard,tareas}.md`). Helper skills seleccionadas por la task: NINGUNA
> (snapshot congelado `{"skills": []}`). Write autorizado: únicamente este artifact (`tasks`).
> No modifica código, docs, config ni tests.

---

## 1. Scope (dentro / fuera)

### Dentro de alcance (fase 2)

- **AC-004 (TAREAS)**: pin del locator `.agents/sdd-workflow.json` a `binding_version: "9.0.0"`
  (resto de campos preservados) + regeneración de projections client
  (`frontend/src/views/projectctl/data/tareas-tab.view-model.ts`,
  `frontend/src/shared/sdd/task-flow.generated.ts`) vía `taskflow:generate` (owner
  `sdd-apply-code-high`, maintenance §8) + retiro de estados del frontmatter de los 4 fixtures
  `taskReadme/2026-04-17-test-task-for-state-{branching,pushing,ready-for-branch,verified}.md`
  a `status: done` (AD-04, REQ-TSK-003).
- **AC-005 (CROSS)**: creación de `frontend/playwright.config.ts` (target del symlink raíz,
  AD-05) + archivos cross `AGENTS.md`, `README.md`, `docs/00-context/agents_skills.md`,
  `docs/04-process/task.md` + archivo inicial `.atl/skill-registry.md` (regen formal
  coordinator-only, WU-REG).
- **AC-002 (DOCS)**: bundle `docs/app-map/views/projectctl/{index.md,index.mmd}` (5 secciones
  MUST + frontmatter `criteria[]` con IDs `PCT-*`), registro en `docs/app-map/navigation.yaml`,
  eliminación de `docs/01-product/quality-plan.md` + `quality-status.md` (PCT-86/TST-03/TST-12).
- **AC-001 (ENTORNO)**: `.env`/`.env.dev` con `FRONTEND_PORT=4321` (working tree local,
  `exclude from commit`, AD-03), `.env.example` (commit, `FRONTEND_PORT=4323→4321`), overlays
  `compose.yml`/`compose.dev.yml` canónicos (`frontend` `target: prod|dev`, red
  `mis-proyectos-edge` `external: true` + aliases `colpruebas-origin`/`test-colpruebas-origin`
  preservados), `git rm` de `docker-compose.yml`/`docker-compose.dev.yml` (AD-01), stages
  `AS prod`/`AS dev` en Dockerfiles frontend (AD-07), docs `docs/00-context/{entornos,architecture}.md`
  + `docs/02-features/tunnel.md`, instalación de la skill `sandbox-runtime-policy` (REQ-ENT-006).
- **AC-003 (TEST)**: `scripts/test-runner.ts` (runner unificado, AD-06), gate
  `"test:check"` en `package.json` raíz (AD-08), `playwright/TEST_PLAN.md`, política
  `.gitignore` (`.runtime/`, `frontend/test-results/` — AD-02). Los archivos de test
  (`projectctl-*-bundle.test.ts`, `sot-coherence.test.ts`) y la verificación del gate son
  **diferidos a fase 3** (lanes `sdd-apply-unit-tests`/`sdd-verify-units`, owner_phase
  `fase_3_verificacion`).

### Fuera de alcance (fase 2)

- No cambiar UI SolidJS de `/projectctl` (gobierna `frontend-policy` + `fsd-architecture`).
- No reescribir `docs/app-map/views/home/**` ni `project-workspace/**`.
- No gestionar tunnel/hostname ni red/alias (solo se preservan).
- No tocar working tree en `main` durante planificación; rama feature activa ya creada desde
  `main`/HEAD `8805218` (desviación documentada §18/§19 del índice).
- No crear tests unit/PW-AUTO en fase 2 (diferidos; ver §6 tabla 2).

---

## 2. Criterios de aceptación (prosa, por AC)

### AC-001 (ENTORNO) — C1, C2

- `.env` (raíz, NEW) y `.env.dev` (MODIFIED `FRONTEND_PORT=4324→4321`) declaran
  `FRONTEND_PORT=4321` en el working tree local; `.env.example` (commit) declara
  `FRONTEND_PORT=4321` como referencia canónica instalable (REQ-ENT-001/AD-03).
- `compose.yml` (prod) y `compose.dev.yml` (dev) son los únicos overlays operativos con
  servicios `frontend`/`api`; `frontend` usa `build.target: prod|dev` y `ports:
  "${FRONTEND_PORT}:4321"`; red `mis-proyectos-edge` `external: true` con aliases
  `colpruebas-origin` (prod) / `test-colpruebas-origin` (dev) sin cambios de valor
  (REQ-ENT-002/003/AD-07/AD-01).
- `docker-compose.yml`/`docker-compose.dev.yml` eliminados del árbol; ninguna ruta operativa
  los referencia como overlays canónicos (REQ-ENT-004).
- `docs/00-context/entornos.md`, `docs/00-context/architecture.md` y
  `docs/02-features/tunnel.md` existen; `tunnel.md` declara alias por entorno y el guardrail
  `TUNNEL_NOT_PUBLISHABLE` (REQ-ENT-005).
- `.agents/skills/sandbox-runtime-policy/SKILL.md` existe (sandbox sin docker CLI/socket;
  runtime exclusivo vía `projectctl`) (REQ-ENT-006).
- Validación runtime (fase 3, coordinator-owned, WU-CLI-VAL): `projectctl env validate` ok;
  `projectctl status` levanta prod y dev; `projectctl doctor` sin drifts críticos
  (REQ-ENT-007/008).

### AC-002 (DOCS) — C3

- `docs/app-map/views/projectctl/index.md` con las 5 secciones MUST (URL, Tab, Objetivo,
  Criterios de calidad, Diagrama Mermaid) y frontmatter `criteria[]` de estructura
  `{id, title, functional, coverage}` con IDs prefijados `PCT-*` (prefix discipline
  PCT-88); `docs/app-map/views/projectctl/index.mmd` sibling Mermaid válido
  (REQ-DOC-001/002/005).
- `docs/app-map/navigation.yaml` registra `{id: projectctl, kind: view, bundle:
  views/projectctl/index}` (REQ-DOC-003).
- `docs/01-product/quality-plan.md` y `quality-status.md` eliminados; su superficie NO se
  restaura como SoT (REQ-DOC-004).

### AC-003 (TEST) — C4

- `scripts/test-runner.ts` implementa `run --method=<unit|pwauto|all> --target=<view>[:<feature>]
  [--persist]` + `check`, con contrato 1:1 con `projectctl test *`, helpers de header AC,
  rechazo de cobertura sin AC y persistencia canónica (REQ-TST-001/004).
- `package.json` raíz declara `"test:check": "bun run scripts/test-runner.ts check"` como gate
  contractual TST-13 (REQ-TST-002/AD-08).
- `playwright/TEST_PLAN.md` con mapping archivo↔criterio y tiers PW-AUTO/PW-CLI (REQ-TST-003).
- Persistencia `.runtime/test-results/<projectId>/<run-id>/{unit,pwauto}/{junit.xml,results.json,summary.json}`
  completada sobre el layout existente (46 runs legacy preservados, REQ-TST-005).
- `.gitignore` ignora `.runtime/` y `frontend/test-results/` (AD-02).
- Verificación del gate y tests (fase 3): `bun run test:check` verde (WU-VER-UNITS).

### AC-004 (TAREAS) — C5, C6

- `.agents/sdd-workflow.json` pinnea `binding_version: "9.0.0"`; `contract_version`,
  `binding_path`, `machine_block_id`, `expected_binding_id` y `projections` preservados
  (REQ-TSK-001).
- `frontend/src/views/projectctl/data/tareas-tab.view-model.ts` y
  `frontend/src/shared/sdd/task-flow.generated.ts` presentes (generadas, REQ-TSK-002).
- Escaneo de `taskReadme/*.md` sin `branching`/`pushing`/`ready_for_branch`/`verified` como
  `status`; fixtures conservados como historial con `status: done` (REQ-TSK-003/AD-04).
- Gate R-007 (`sot-coherence.test.ts`, fase 3) pasa (REQ-TSK-004).

### AC-005 (CROSS) — C7

- `AGENTS.md`, `README.md`, `docs/00-context/agents_skills.md`, `docs/04-process/task.md`,
  `.atl/skill-registry.md` (inicial) presentes (REQ-CRS-001..005).
- `playwright.config.ts` (symlink raíz) resuelve a `frontend/playwright.config.ts` existente;
  la config declara `PWAUTO_VIEWS` y el discovery canónico (REQ-CRS-006/REQ-TST-008/AD-05).

---

## 3. Archivos owned por unidad (resumen)

| WU | Archivos owned |
|---|---|
| WU-TSK-1 | `.agents/sdd-workflow.json`; `frontend/src/views/projectctl/data/tareas-tab.view-model.ts` (generado); `frontend/src/shared/sdd/task-flow.generated.ts` (generado) |
| WU-TSK-2 | `taskReadme/2026-04-17-test-task-for-state-{branching,pushing,ready-for-branch,verified}.md` (4) |
| WU-CRS-1 | `frontend/playwright.config.ts` (NEW, target del symlink) |
| WU-CRS-2 | `AGENTS.md`; `README.md`; `docs/00-context/agents_skills.md`; `docs/04-process/task.md`; `.atl/skill-registry.md` (inicial) |
| WU-DOC-1 | `docs/app-map/views/projectctl/index.md`; `docs/app-map/views/projectctl/index.mmd`; `docs/app-map/navigation.yaml`; `docs/01-product/quality-plan.md` (RM); `docs/01-product/quality-status.md` (RM) |
| WU-ENT-1 | `.env` (local); `.env.dev` (local); `.env.example`; `compose.yml`; `compose.dev.yml`; `docker-compose.yml` (RM); `docker-compose.dev.yml` (RM); `frontend/Dockerfile.prod`; `frontend/Dockerfile.dev` |
| WU-ENT-2 | `docs/00-context/entornos.md`; `docs/00-context/architecture.md`; `docs/02-features/tunnel.md` |
| WU-ENT-3 | `.agents/skills/sandbox-runtime-policy/SKILL.md` (+ árbol de la skill si aplica, copy-tree-no-mods) |
| WU-TST-1 | `scripts/test-runner.ts`; `package.json`; `playwright/TEST_PLAN.md`; `.gitignore` |
| WU-TST-2 (diferida) | `frontend/__tests__/projectctl-bundle.test.ts`; `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` |
| WU-REG (coord) | `.atl/skill-registry.md` (regen formal) |
| WU-CLI-VAL (coord) | sin archivos (runtime CLI) |
| WU-DELIVERY (coord) | sin archivos (git/PR) |

---

## 4. Validación (subsecciones por AC)

### 4.1 AC-001 — Validación ENTORNO

- **Método**: Unit (presencia, fase 3 vía `sot-coherence.test.ts` R-007: `compose.yml`,
  `compose.dev.yml`, `.env.example` existentes) + Runtime CLI coordinator-owned (WU-CLI-VAL):
  `projectctl env validate` ok, `projectctl status` levanta prod/dev, `projectctl doctor` sin
  drifts críticos.
- **Evidencia**: file inspection en code-review (servicios `frontend`/`api`, `target:
  prod|dev`, `ports "${FRONTEND_PORT}:4321"`, red/alias preservados, `docker-compose*.yml`
  ausentes, `AS prod`/`AS dev` en Dockerfiles); salida CLI en fase 3.
- **Browser**: NO requerida (`pw_enabled: false`, `browser_validation: optional`).

### 4.2 AC-002 — Validación DOCS

- **Método**: Unit (fase 3, `frontend/__tests__/projectctl-bundle.test.ts` — WU-TST-2
  diferida): 5 secciones MUST, `criteria[]` `PCT-*` con estructura
  `{id,title,functional,coverage}`, `index.mmd` presente, entry en `navigation.yaml`,
  ausencia de `quality-plan.md`/`quality-status.md`.
- **Evidencia**: read-only code-review del bundle (`sdd-verify-code`, clase
  `code_review` — doc/policy review) + gate `AC-009.app_map_close` en cierre
  (`criteria[].coverage` sincronizado, sin deuda documental).

### 4.3 AC-003 — Validación TEST

- **Método**: Unit + gate (fase 3, `sdd-verify-units`): `bun run test:check` verde (TST-13);
  `bun run scripts/test-runner.ts run --method=unit --target=projectctl --persist` produce
  `summary.json` con `criteria[]` poblado y `{unit,pwauto}/{junit.xml,results.json,summary.json}`
  bajo `.runtime/test-results/<projectId>/<run-id>/` preservando los 46 runs legacy; headers
  `// @ac` obligatorios; write-back `patchBundleCoverage` sobre
  `docs/app-map/views/projectctl/index.md`.
- **Evidencia**: read-only code-review del runner (`sdd-verify-code`) + resultados de corrida
  en fase 3 (`sdd-verify-units`).

### 4.4 AC-004 — Validación TAREAS

- **Método**: Unit (fase 3, `sot-coherence.test.ts` R-007 — WU-TST-2 diferida): locator pin
  `9.0.0`, projections presentes, fuentes activas/excluidas coherentes, sin catálogos
  duplicados, escaneo de `taskReadme/*.md` sin estados retirados.
- **Evidencia**: file inspection del locator (5 campos preservados, solo `binding_version`
  cambiado) + projections presentes + 4 fixtures con `status: done`.

### 4.5 AC-005 — Validación CROSS

- **Método**: Unit (presence, fase 3 vía R-007/inventory) + read-only code-review.
- **Evidencia**: 5 archivos cross presentes; `docs/04-process/task.md` cita el bloque
  `task-flow-binding` v9.0.0 sin catálogos paralelos; symlink `playwright.config.ts` resuelve
  (target `frontend/playwright.config.ts` existe); `frontend/playwright.config.ts` exporta
  `PWAUTO_VIEWS` (smoke `bunx playwright test --list` opcional, coordinator-owned, sin browser).

## 5. Tabla de unidades de trabajo — FASE 2 ACTIVAS (13 columnas + Scheduling)

> Columnas 1-13 del `apply-work-unit-schema` (`.agents/skills/sd-protocol/apply-work-unit-schema.md`);
> columna adicional `Fase / Scheduling` (permitida por el schema) para fijar la fase de
> scheduling sin alterar el set de Estados unit-level. `Mirror topic` = **N/A** para todas las
> filas (`artifact_context.mirrors: []` → `write_order: ["primary"]`). `Depende de` sigue el
> orden de rollout AD-10 (AC-004 → AC-005 → AC-002 → AC-001 → AC-003). Los 4 campos
> contractuales (columnas 10-13) están completos en todas las unidades no-`none`.

| Unit | Estado | apply_lane | Objetivo | Archivos owned | Depende de | Conflict group | Modo | Mirror topic | Spec scenarios linked | Implementation contract | Verify expects | Routing tag on failure | Fase / Scheduling |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| WU-TSK-1 | pending | code-high | AC-004: pin locator a binding v9.0.0 + regenerar projections client vía `taskflow:generate` (estabiliza base de workflow antes de producto) | `.agents/sdd-workflow.json`; `frontend/src/views/projectctl/data/tareas-tab.view-model.ts` (generado); `frontend/src/shared/sdd/task-flow.generated.ts` (generado) | none | workflow-locator | serial | N/A | REQ-TSK-001 (locator 8.0.0→9.0.0, resto preservado); REQ-TSK-002 (`taskflow:generate` produce ambas projections); REQ-TSK-004 (R-007 pasa con pin v9 + projections presentes) | `.agents/sdd-workflow.json`: `binding_version` → `"9.0.0"` preservando `contract_version: 1`, `binding_path`, `machine_block_id: "task-flow-binding"`, `expected_binding_id: "projectctl-requirements.task-flow"`, `projections` (design §5.8); ejecutar `taskflow:generate` (owner code-high, maintenance §8) para generar las 2 projections | `.agents/sdd-workflow.json` con `binding_version == "9.0.0"` y los otros 5 campos byte-iguales; ambas projections existen bajo `frontend/src/views/projectctl/data/` y `frontend/src/shared/sdd/`; (fase 3) `sot-coherence.test.ts` R-007 verde | code_issue | phase-2-active |
| WU-TSK-2 | pending | code-low | AC-004: retirar estados del frontmatter de los 4 fixtures taskReadme a `status: done` (AD-04) sin mover a carpeta histórica ni borrar contenido | `taskReadme/2026-04-17-test-task-for-state-{branching,pushing,ready-for-branch,verified}.md` (4) | none | taskreadme-fixtures | parallel-safe | N/A | REQ-TSK-003 (frontmatter con estado válido del `status.writable`; archivo conservado como historial; escaneo sin `branching/pushing/ready_for_branch/verified` como status) | En cada uno de los 4 fixtures: `status: <retirado>` → `status: done` y bump de `updated` al timestamp del apply (AD-04); sin mover archivos, sin borrar trabajo | Grep de `taskReadme/*.md`: cero ocurrencias de `^status: (branching\|pushing\|ready_for_branch\|verified)`; los 4 archivos siguen existiendo con contenido intacto y frontmatter `status: done` | code_issue | phase-2-active |
| WU-CRS-1 | pending | code-medium | AC-005: crear `frontend/playwright.config.ts` (target del symlink raíz) — repara symlink roto y habilita discovery canónico para runner/gate (AD-05) | `frontend/playwright.config.ts` (NEW) | WU-TSK-1 | playwright-config | serial | N/A | REQ-CRS-006 (symlink resuelve a target existente); REQ-TST-008 (config resoluble por runner/`bunx playwright test`, declara `PWAUTO_VIEWS`) | Crear `frontend/playwright.config.ts` derivado del contrato canónico de `playwright.config.cjs` (projects `pwauto-home`/`pwauto-test-tab` + `pwauto-projectctl`, `metadata.bundle_path`, `base_url`, `outputDir: 'playwright/test-results'`, JUnit reporter) + export `PWAUTO_VIEWS: Record<view[:feature], {project, bundle_path, grep}>` con al menos `projectctl`, `home`, `project-workspace:test-tab` (design §5.6) | Symlink `playwright.config.ts` resuelve (target es archivo regular existente); `frontend/playwright.config.ts` exporta `PWAUTO_VIEWS` con las 3 claves de vista y cada project declara `metadata.bundle_path`; (coordinator, opcional) `bunx playwright test --list` sin error de target inexistente | code_issue | phase-2-active |

| WU-CRS-2 | pending | doc | AC-005: prerrequisitos cross documentales + archivo inicial del skill-registry | `AGENTS.md`; `README.md`; `docs/00-context/agents_skills.md`; `docs/04-process/task.md`; `.atl/skill-registry.md` (inicial) | WU-TSK-1 | docs | parallel-safe | N/A | REQ-CRS-001 (AGENTS.md existe); REQ-CRS-002 (README.md existe); REQ-CRS-003 (agents_skills.md documenta skills, coherente con .atl); REQ-CRS-004 (task.md cita `task-flow-binding` v9.0.0 como única SoT, sin catálogo paralelo); REQ-CRS-005 (.atl/skill-registry.md inicial con skills instaladas) | Crear `AGENTS.md` (directrices de operación de agentes), `README.md` (descripción + entry points `/projectctl`, docs, tests), `docs/00-context/agents_skills.md` (registro de skills: `projectctl-requirements` + `sandbox-runtime-policy`), `docs/04-process/task.md` (guía del flujo que CITA el bloque `task-flow-binding` v9.0.0 en `.agents/skills/projectctl-requirements/references/tareas.md` sin publicar estados/lanes/gates propios), `.atl/skill-registry.md` inicial (inventory de skills) | Los 5 archivos existen; `docs/04-process/task.md` referencia `task-flow-binding`/`tareas.md` y NO contiene tablas duplicadas de fases/estados/lanes/gates (anti-drift); `docs/00-context/agents_skills.md` y `.atl/skill-registry.md` nombran `projectctl-requirements` y `sandbox-runtime-policy` | doc_issue | phase-2-active |
| WU-DOC-1 | pending | doc | AC-002: bundle `views/projectctl` (5 secciones MUST + `criteria[]` PCT-*) + `navigation.yaml` + eliminación de superficie legacy quality | `docs/app-map/views/projectctl/index.md` (NEW); `docs/app-map/views/projectctl/index.mmd` (NEW); `docs/app-map/navigation.yaml`; `docs/01-product/quality-plan.md` (RM); `docs/01-product/quality-status.md` (RM) | WU-TSK-1 | docs | parallel-safe | N/A | REQ-DOC-001 (bundle con 5 secciones MUST + criteria[] `{id,title,functional,coverage}` prefijo PCT-*); REQ-DOC-002 (index.mmd sibling Mermaid válido); REQ-DOC-003 (navigation.yaml registra `projectctl` con `bundle: views/projectctl/index`); REQ-DOC-004 (quality-*.md eliminados, no restaurables como SoT); REQ-DOC-005 (prefix discipline PCT-88, sin prefijo inventado) | Crear `docs/app-map/views/projectctl/index.md` con 5 secciones MUST (URL, Tab, Objetivo, Criterios de calidad, Diagrama Mermaid) + frontmatter `criteria[]` con IDs PCT-* aplicables al repo (cli PCT-79..82, doc PCT-83..88, test PCT-89..94, entorno PCT-95..100, tareas PCT-106..121; no aplicables → `not-applicable`; estados/métodos del contrato design §5.5); crear sibling `index.mmd` (Mermaid); añadir nodo `{id: projectctl, kind: view, bundle: views/projectctl/index}` a `docs/app-map/navigation.yaml`; `git rm` de `docs/01-product/quality-plan.md` + `quality-status.md` | (fase 3, WU-TST-2) `projectctl-bundle.test.ts` valida 5 secciones MUST + `criteria[]` PCT-* + `index.mmd` + entry `navigation.yaml` + ausencia de quality-*.md; read-only: `patchBundleCoverage(bundle_path='docs/app-map/views/projectctl/index.md')` sin `error` (IDs estables); `docs/01-product/quality-plan.md`/`quality-status.md` ausentes del árbol | doc_issue | phase-2-active |
| WU-ENT-1 | pending | code-medium | AC-001: env con FRONTEND_PORT=4321 + overlays canónicos compose + git rm legacy + stages Dockerfile (topología runtime atómica, AD-01/AD-03/AD-07) | `.env` (local, exclude); `.env.dev` (local, exclude); `.env.example`; `compose.yml`; `compose.dev.yml`; `docker-compose.yml` (RM); `docker-compose.dev.yml` (RM); `frontend/Dockerfile.prod`; `frontend/Dockerfile.dev` | WU-TSK-1 | runtime-env | serial | N/A | REQ-ENT-001 (`.env`/`.env.dev` FRONTEND_PORT=4321; `.env.example` alineado; puerto mapeado `"${FRONTEND_PORT}:4321"`); REQ-ENT-002 (compose.yml servicios `frontend`/`api`, `target: prod`, red/alias `colpruebas-origin` preservados); REQ-ENT-003 (compose.dev.yml `target: dev`, alias `test-colpruebas-origin`); REQ-ENT-004 (legacy fuera de uso canónico); REQ-ENT-007 (env validate ok) | Crear `.env` local (copia de `.env.example` con `ENVIRONMENT=production`, `FRONTEND_PORT=4321`) y corregir `.env.dev` local `4324→4321` (ambos `exclude from commit`, AD-03); `.env.example` commit `4323→4321`; crear `compose.yml` (servicios `frontend` [context `./frontend`, dockerfile `Dockerfile.prod`, `target: prod`, `ports: "${FRONTEND_PORT}:4321"`, networks `internal` + `edge` `external: true` name `mis-proyectos-edge` alias `colpruebas-origin`] + `api`) y `compose.dev.yml` (frontend `target: dev` HMR, alias `test-colpruebas-origin`; sin service `tunnel` como camino principal, open Q3 design); `git rm docker-compose.yml` + `docker-compose.dev.yml`; `frontend/Dockerfile.prod` → `FROM oven/bun:1-alpine AS prod` y `frontend/Dockerfile.dev` → `FROM oven/bun:1-alpine AS dev` | File inspection: `compose.yml`/`compose.dev.yml` con servicios `frontend`/`api`, `target: prod\|dev`, `ports "${FRONTEND_PORT}:4321"`, `networks.edge.external: true` + `name: mis-proyectos-edge` + aliases `colpruebas-origin`/`test-colpruebas-origin`; `docker-compose*.yml` ausentes; Dockerfiles con `AS prod`/`AS dev`; `.env.example` con `FRONTEND_PORT=4321`; (fase 3) `projectctl env validate` ok + `projectctl status` levanta prod/dev (WU-CLI-VAL); (fase 3) R-007 valida presencia de `compose.yml`/`compose.dev.yml`/`.env.example` | code_issue | phase-2-active |
| WU-ENT-2 | pending | doc | AC-001: documentación de entorno, arquitectura y tunnel gestionado | `docs/00-context/entornos.md` (NEW); `docs/00-context/architecture.md` (NEW); `docs/02-features/tunnel.md` (NEW) | WU-TSK-1 | docs | parallel-safe | N/A | REQ-ENT-005 (docs existen y referenciables desde `references/entorno.md`; `tunnel.md` declara alias por entorno + guardrail `TUNNEL_NOT_PUBLISHABLE` con accionables) | Crear `docs/00-context/entornos.md` (overlays canónicos `compose.yml`/`compose.dev.yml`, `FRONTEND_PORT` obligatorio, contrato edge, runtime vía `projectctl`), `docs/00-context/architecture.md` (arquitectura del repo), `docs/02-features/tunnel.md` (tunnel gestionado central vía `CENTRAL_TUNNEL_WEBHOOK_URL` + `DEPLOY_JWT_SECRET`, alias prod `colpruebas-origin` / dev `test-colpruebas-origin`, guardrail `TUNNEL_NOT_PUBLISHABLE` con acciones) | Los 3 archivos existen; `docs/02-features/tunnel.md` declara ambos alias (`colpruebas-origin`, `test-colpruebas-origin`) y el literal `TUNNEL_NOT_PUBLISHABLE` con accionables; `docs/00-context/entornos.md` documenta `FRONTEND_PORT` obligatorio y los nombres canónicos de overlay | doc_issue | phase-2-active |
| WU-ENT-3 | pending | code-low | AC-001: instalar skill `sandbox-runtime-policy` (copy-tree-no-mods; sandbox sin docker, runtime exclusivo `projectctl`) | `.agents/skills/sandbox-runtime-policy/SKILL.md` (NEW, + árbol de la skill si aplica) | WU-TSK-1 | skills | parallel-safe | N/A | REQ-ENT-006 (SKILL.md existe; sandbox sin docker CLI/socket; control exclusivo vía `projectctl`; `sot-coherence.test.ts` la resuelve) | Instalar `.agents/skills/sandbox-runtime-policy/SKILL.md` (contrato de instalación `copy-tree-no-mods`; la skill declara que el sandbox NO expone `docker` CLI ni `docker.sock` y que el runtime se controla exclusivamente vía `projectctl` — `env *`, `tunnel *`, `start\|stop\|restart\|rebuild\|promote\|deploy\|doctor`) | `.agents/skills/sandbox-runtime-policy/SKILL.md` existe y declara las reglas no-docker + projectctl-only (grep por `projectctl`, ausencia de exposición docker); (fase 3) `sot-coherence.test.ts` R-007 resuelve el path de la skill; `docs/00-context/agents_skills.md` (WU-CRS-2) y `.atl/skill-registry.md` (WU-REG) la listan | code_issue | phase-2-active |
| WU-TST-1 | pending | code-medium | AC-003: runner unificado + gate `test:check` + `TEST_PLAN.md` + política `.gitignore` (nace último: bundle/config/base ya presentes, AD-10) | `scripts/test-runner.ts` (NEW); `package.json`; `playwright/TEST_PLAN.md` (NEW); `.gitignore` | WU-TSK-1; WU-CRS-1; WU-DOC-1 | test-pipeline | serial | N/A | REQ-TST-001 (runner CLI `run`/`check`, assertAcHeader, rechazo de cobertura sin AC, exit codes); REQ-TST-002 (gate `test:check` TST-13); REQ-TST-003 (`TEST_PLAN.md` mapping archivo↔criterio + tiers); REQ-TST-004 (contrato AC mandatorio, rechazo sin header); REQ-TST-005 (persistencia canónica completada preservando 46 runs; política .gitignore) | Crear `scripts/test-runner.ts` (CLI `run --method=<unit\|pwauto\|all> --target=<view>[:<feature>] [--persist]` + `check`; importa de `backend/src/`: `ac-header.ts` (`AC_HEADER_LINE_RE`, `extractAcTokensFromBun/Playwright`), `coverage-writer.ts` (`patchBundleCoverage`), `test-inventory.ts` (`buildInventory`); header-discovery primeras 10-12 líneas; rechazo exit code 2; `--persist` escribe `.runtime/test-results/<projectId>/<run-id>/{unit,pwauto}/{junit.xml,results.json,summary.json}` con shape canónico de `summary.json` y `criteria[]` poblado; write-back `patchBundleCoverage` con `bundle_path` explícito — contratos design §5.1/5.3/5.4); `package.json` raíz: `"test:check": "bun run scripts/test-runner.ts check"` (AD-08); crear `playwright/TEST_PLAN.md` (mapping archivo↔criterio, tiers PW-AUTO/PW-CLI); añadir `.runtime/` y `frontend/test-results/` a `.gitignore` (AD-02) | `bun run test:check` exit 0 sin criterios `implemented` con Unit y PW-AUTO ambos `missing`; exit != 0 identificando bundle+criterio en violación (fase 3, WU-VER-UNITS); `bun run scripts/test-runner.ts run --method=unit --target=projectctl --persist` produce `summary.json` con `criteria[]` y `{unit,pwauto}/{junit.xml,results.json,summary.json}` bajo `.runtime/test-results/<projectId>/<run-id>/` SIN borrar los 46 runs legacy; un `.test.ts` sin `// @ac` en las primeras 10 líneas es rechazado (exit 2); write-back actualiza `criteria[].coverage` en `docs/app-map/views/projectctl/index.md`; `.gitignore` contiene `.runtime/` y `frontend/test-results/` | code_issue | phase-2-active |

## 6. Unidades DIFERIDAS a fase 3 (out-of-phase — NO dependency-ready en fase 2)

> Lanes `sdd-apply-unit-tests`/`sdd-verify-units`/`sdd-verify-pwauto`/`sdd-verify-pwcli` tienen
> `owner_phase: fase_3_verificacion` (binding v9.0.0). Se registran aquí como **deferred**:
> NO participan del orden serial de fase 2, NO son dependency-ready y NO se emiten como unidades
> activas. Solo una transición del binding a `fase_3_verificacion` (gate
> `functional_acceptance_recorded`) autoriza su scheduling. `Mirror topic` = N/A (mirrors: []).

| Unit | Estado | apply_lane | Objetivo | Archivos owned | Depende de | Conflict group | Modo | Mirror topic | Spec scenarios linked | Implementation contract | Verify expects | Routing tag on failure | Fase / Scheduling |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| WU-TST-2 | pending | unit-tests | AC-003/AC-004: crear tests bundle projectctl + sot-coherence R-007 (layout flat AD-09; header `// @ac` obligatorio) | `frontend/__tests__/projectctl-bundle.test.ts` (NEW); `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` (NEW) | WU-TST-1; WU-DOC-1; WU-TSK-1 | test-pipeline | serial | N/A | REQ-TST-006 (layout canónico 1 archivo/criterio, 2 segmentos view/feature); REQ-TST-007 (`projectctl-*-bundle.test.ts` valida bundle; `sot-coherence.test.ts` gate R-007); REQ-TSK-004 (R-007 valida locator v9, projections, fuentes, sin catálogos duplicados) | Crear `frontend/__tests__/projectctl-bundle.test.ts` (satisface glob `projectctl-*-bundle.test.ts`; valida 5 secciones MUST + `criteria[]` PCT-* `{id,title,functional,coverage}` + `index.mmd` presente + entry `navigation.yaml` + ausencia de quality-*.md; header `// @ac PCT-83..PCT-88` en primeras 10 líneas) y `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` (gate R-007: paths canónicos, locator pin `9.0.0`, projections presentes, fuentes activas/excluidas coherentes, sin catálogos duplicados, escaneo taskReadme sin estados retirados; header `// @ac`) | `bun test frontend/__tests__/projectctl-bundle.test.ts` verde; `bun test frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` verde; ambos archivos declaran `// @ac <ID>` en las primeras 10 líneas (si no, el runner las rechaza, exit 2) | unit_test_issue | phase-3-deferred |
| WU-VER-UNITS | pending | none | AC-003: verificación unit + gate de cobertura (`sdd-verify-units`, lane de verificación fase 3) | — (sin archivos de apply) | WU-TST-2; WU-TST-1 | test-pipeline | serial | N/A | REQ-TST-002 (gate `test:check` verde); REQ-TST-005 (persistencia canónica con `criteria[]`); gate `coverage_gate_passed` (required_unit_or_pwauto_coverage_green + comando/resultado registrado) | Verificación report-only: ejecutar `bun run test:check` y `bun test frontend/__tests__/**`; verificar `summary.json`/write-back de una corrida `--persist`; reportar al coordinador (sin crear/modificar archivos de test) | `bun run test:check` exit 0; `bun test frontend/__tests__/**` verde; evidencia `coverage_gate_passed`: comando + resultado + archivo de cobertura registrados en el índice | unit_test_issue | phase-3-deferred |
| WU-VER-PWCLI | pending | none | AC-003/AC-005: validación browser exploratoria (`sdd-verify-pwcli`) — **no_required** (`pw_enabled: false`, `browser_validation: optional`) | — | WU-CRS-1 | test-pipeline | serial | N/A | no_required (binding: `pw_enabled: false`) | Sin ejecución: la validación de entorno es CLI `projectctl` (WU-CLI-VAL), no browser; registrar `no_required` como decisión | Evidencia: registro de `no_required` con la causa (`pw_enabled: false`) en el índice de fase 3; sin corrida PW-CLI | none | phase-3-deferred |
| WU-VER-PWAUTO | pending | none | AC-003: regresión Playwright persistente (`sdd-verify-pwauto`) — **no_required** (`pw_enabled: false`) | — | WU-CRS-1 | test-pipeline | serial | N/A | no_required (binding: `pw_enabled: false`) | Sin ejecución: no existe cobertura PW-AUTO obligatoria para esta task; `playwright/TEST_PLAN.md` (WU-TST-1) documenta tiers por si nace cobertura futura | Evidencia: registro de `no_required` con la causa (`pw_enabled: false`) en el índice de fase 3; sin corrida PW-AUTO | none | phase-3-deferred |

## 7. Unidades coordinator-only (`apply_lane: none`)

> Trabajo mecánico del coordinador; no consume ninguna `sdd-apply-*` lane. `Mirror topic` = N/A.

| Unit | Estado | apply_lane | Objetivo | Archivos owned | Depende de | Conflict group | Modo | Mirror topic | Spec scenarios linked | Implementation contract | Verify expects | Routing tag on failure | Fase / Scheduling |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| WU-REG | pending | none | AC-005: regeneración formal de `.atl/skill-registry.md` (`gentle-ai skill-registry refresh --force`, maintenance §10) | `.atl/skill-registry.md` (regen) | WU-CRS-2; WU-ENT-3 | skills | coordinator-only | N/A | REQ-CRS-005 (registro con skills instaladas, incl. `sandbox-runtime-policy`) | Coordinator ejecuta `gentle-ai skill-registry refresh --force` tras WU-ENT-3 (skill instalada) y WU-CRS-2 (archivo inicial); formal en fase 4 | `.atl/skill-registry.md` regenerado incluye `projectctl-requirements` y `sandbox-runtime-policy`; coherente con `docs/00-context/agents_skills.md` | none | coordinator (fase 4) |
| WU-CLI-VAL | pending | none | AC-001/AC-004: validación runtime CLI coordinator-owned (fase 3) | — (sin archivos) | WU-ENT-1; WU-TSK-1 | runtime-env | coordinator-only | N/A | REQ-ENT-007 (env validate ok); REQ-ENT-008 (status levanta prod/dev; doctor sin drifts críticos) | Coordinator ejecuta en fase 3: `projectctl env validate` → ok; `projectctl status` → prod y dev levantables con `frontend` target prod/dev; `projectctl doctor` → sin drifts críticos (solo warnings no bloqueantes) | Salida `env validate` ok (sin missing/invalid FRONTEND_PORT); `status` lista ambos modos con overlays canónicos; `doctor` sin drifts críticos; evidencia registrada en índice fase 3 | none | coordinator (fase 3) |
| WU-DELIVERY | pending | none | Delivery: commit → push → PR único (mecánica git/PR del cierre) | — (sin archivos) | todos los WU activos + diferidos aplicables | none | coordinator-only | N/A | none (mecánica pura; sin contrato de comportamiento) | Coordinator: commit de cierre (excluyendo `.env`/`.env.dev` y `.runtime/` — AD-02/AD-03), push, PR único target a resolver en `final_pr_pending` (desviación documentada §18/§19: branch desde `main`/HEAD `8805218`, binding declara `develop`) | Close evidence: `branch_name`, `pr_url`, `verification_revision`, `documentation_revision`, `criteria_covered_complete`, `all_work_units_terminal`; PR no contiene `.env`/`.env.dev` ni `.runtime/**` | none | coordinator (delivery) |

## 8. Orden de rollout y notas de dependencia (AD-10)

1. **WU-TSK-1** (`sdd-apply-code-high`, serial) — pin locator + projections: base de workflow
   estable antes de tocar producto.
2. **WU-TSK-2** (`sdd-apply-code-low`, parallel-safe con WU-TSK-1) — limpieza de estados
   retirados.
3. **WU-CRS-1** (`sdd-apply-code-medium`, serial) — config Playwright resoluble (prerrequisito
   del runner) + **WU-CRS-2** (`sdd-apply-doc`, parallel-safe) — archivos cross.
4. **WU-DOC-1** (`sdd-apply-doc`, parallel-safe) — bundle destino del write-back.
5. **WU-ENT-1** (`sdd-apply-code-medium`, serial) + **WU-ENT-2** (`sdd-apply-doc`) +
   **WU-ENT-3** (`sdd-apply-code-low`).
6. **WU-TST-1** (`sdd-apply-code-medium`, serial, último) — runner + gate + TEST_PLAN +
   gitignore; nace verde porque bundle (WU-DOC-1), config (WU-CRS-1) y base (WU-TSK-1) ya
   existen.

Notas de parallel-safety:

- Unidades `doc` con archivos owned **disjuntos** (WU-CRS-2 / WU-DOC-1 / WU-ENT-2): comparten
  conflict group `docs` pero no solapan archivos ni globs — parallel-safe per schema §4 (doc
  lane: "owned files rarely overlap unless multiple units update the same doc").
- Unidades `code-medium` (WU-CRS-1, WU-ENT-1, WU-TST-1): default **serial** per schema §4
  (no confirmadas como parallel por el coordinador). WU-ENT-1 y WU-CRS-1 tienen archivos
  disjuntos; el coordinador podría confirmar parallel si lo desea, pero el rollout AD-10 es
  secuencial por AC.
- `code-high` (WU-TSK-1): **siempre serial**.
- WU-TST-2 (fase 3) depende de WU-TST-1 (runner que exige headers), WU-DOC-1 (bundle a
  validar) y WU-TSK-1 (locator v9 a validar); queda **deferred** hasta la transición del
  binding a `fase_3_verificacion`.

## 9. Workload Forecast (Step 4b)

| WU | Descripción | Líneas autoredas estimadas (add+del) |
|---|---|---|
| WU-TSK-1 | locator 1 línea + regeneración projections (**generadas excluidas** del count autoredo) | ~5 |
| WU-TSK-2 | 4 fixtures × ~2 líneas frontmatter (status + updated) | ~8 |
| WU-CRS-1 | `frontend/playwright.config.ts` (projects + `PWAUTO_VIEWS`) | ~150 |
| WU-CRS-2 | `AGENTS.md` + `README.md` + `agents_skills.md` + `task.md` + `.atl/skill-registry.md` inicial | ~330 |
| WU-DOC-1 | `index.md` bundle (5 secciones + `criteria[]`) + `index.mmd` + `navigation.yaml` + `git rm` quality | ~280 |
| WU-ENT-1 | `.env*` + `compose.yml` + `compose.dev.yml` + `git rm` legacy + stages Dockerfile | ~220 |
| WU-ENT-2 | `entornos.md` + `architecture.md` + `tunnel.md` | ~270 |
| WU-ENT-3 | `sandbox-runtime-policy/SKILL.md` | ~60 |
| WU-TST-1 | `scripts/test-runner.ts` (runner+gate) + `package.json` + `TEST_PLAN.md` + `.gitignore` | ~420 |
| **Total** | | **~1.743** |

- **400-line budget risk: HIGH** (≈1.743 líneas autoredas ≫ 400).
- **Chained PRs recommended: Yes** (advisory; bajo el default `single-pr` el coordinador
  mantiene un único PR a `develop` — con desviación documentada §18/§19 —; si se optara por
  `work-unit-commits` (opt-in), el forecast High dispara el slicing `chained-pr` por WU con
  `pr_line_budget: 400`).
- Las projections generadas (`tareas-tab.view-model.ts`, `task-flow.generated.ts`) se
  **excluyen** del count autoredo pero **permanecen en el cambio** (son deliverable de
  WU-TSK-1 y validadas por R-007).

## 10. File-surface check (obligatorio §D sdd-phase-common)

Único archivo tocado por esta lane: `taskReadme/20260825-bhbr8k-remediacion-compatibilidad-projectctl-entornos-docs-tests/tasks.md`
(phase artifact canónico bajo `taskReadme/`, superficie de commit normal del repo). Sin riesgo
de delivery-surface para este write.

Riesgos de delivery-surface de fases posteriores (apply), clasificados para el coordinador:

- `.env` / `.env.dev` (WU-ENT-1) → `exclude from commit` (gitignored; AD-03: se entrega vía
  `.env.example` commitado + validación runtime). No `force-add`.
- `.runtime/` y `frontend/test-results/` (WU-TST-1) → `exclude from commit` tras AD-02; **si
  `.runtime/test-results/**` estuviera trackeado hoy, el ignore no lo destrackea** — el
  coordinador debe verificar y, si aplica, `git rm -r --cached` (policy review; no verificado
  en esta lane por autoridad read-only).
- `docker-compose*.yml` (WU-ENT-1) y `docs/01-product/quality-*.md` (WU-DOC-1) → `git rm`
  explícito (commit normal, visible en PR).
- Desviación delivery: branch feature desde `main`/HEAD `8805218` (no `develop`); PR target a
  resolver en `final_pr_pending` con evidencia del board (§18/§19 índice).

---

## 11. Done condition de esta lane

`tasks.md` escrito con: breakdown completo (scope §1, criterios de aceptación prosa §2,
archivos owned §3, validación §4) + tabla de work units de 13 columnas (fase 2 activas §5,
diferidas fase 3 §6, coordinator-only §7) + orden de rollout AD-10 (§8) + workload forecast
(§9) + file-surface check (§10); conforme al `apply-work-unit-schema.md`; nada más modificado.

---

**criteria_covered**: AC-001..AC-005
**next_recommended**: transición `p2_planning` → `p2_implementing` (gate `planning_artifacts_complete` =
spec + design + tasks) y lanzar la primera unidad de apply según AD-10: `sdd-apply-code-high`
(WU-TSK-1).



