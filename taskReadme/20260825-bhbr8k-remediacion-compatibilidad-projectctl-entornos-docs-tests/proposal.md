# PROPOSE-1 — Propuesta SDD — Remediación compatibilidad /projectctl (entornos, docs, tests)

> Lane: `sdd-propose` (fase 1, planning). Basada en la exploración reconciliada
> (`explore-code.md` + índice §4) y alineada con el estándar canónico `projectctl-requirements`
> (binding `task-flow-binding` v9.0.0) y el WorkflowRuntimeContextV1. No modifica código,
> docs, config ni tests (write autorizado: únicamente este artifact).

---

## 1. Intent

Remediar la incompatibilidad del proyecto `colpruebas` con el estándar canónico
`/projectctl` (`projectctl-requirements` v10.0.0 / binding `task-flow-binding` v9.0.0)
en las 4 superficies con incumplimiento detectado (ENTORNO, DOCS, TEST, TAREAS) más los
prerrequisitos CROSS, de modo que: `projectctl env validate` reporte ok, `projectctl status`
levante prod y dev con overlays canónicos, `bun run test:check` pase con el runner unificado
y persistencia atómica, el bundle `views/projectctl` se renderice (5 secciones MUST +
`navigation.yaml`), el locator pinnee binding v9 con projections presentes, y
`projectctl doctor` no reporte drifts críticos.

## 2. Scope (dentro / fuera)

### Dentro de alcance

- **AC-001 (ENTORNO)**: crear `.env` y corregir `.env.dev`/`.env.example` a `FRONTEND_PORT=4321`;
  renombrar/recrear overlays a `compose.yml` (prod, `frontend` `target: prod`) y
  `compose.dev.yml` (dev, `frontend` `target: dev`) con servicios canónicos `frontend`/`api`;
  agregar `docs/00-context/{entornos,architecture}.md` y `docs/02-features/tunnel.md`;
  instalar skill `sandbox-runtime-policy`. Preservar alias edge existentes
  (`colpruebas-origin` / `test-colpruebas-origin`) y red `mis-proyectos-edge` `external: true`
  (PCT-96/97/98/99).
- **AC-002 (DOCS)**: crear bundle `docs/app-map/views/projectctl/{index.md,index.mmd}` con las
  5 secciones MUST y frontmatter `criteria[]` (IDs `PCT-*`); registrar la vista en
  `docs/app-map/navigation.yaml`; eliminar superficies legacy
  `docs/01-product/quality-plan.md` y `docs/01-product/quality-status.md` per
  PCT-86 / TST-03 / TST-12 (sin restaurarlas como SoT).
- **AC-003 (TEST)**: crear `scripts/test-runner.ts` (runner unificado), agregar gate
  `bun run test:check` en `package.json` raíz (TST-13), crear `playwright/TEST_PLAN.md` y
  layout canónico de specs, **completar** la persistencia atómica `.runtime/test-results/`
  (ya parcialmente presente: 46 runs, 29 con `unit/junit.xml`) con write-back
  `patchBundleCoverage`; crear `projectctl-*-bundle.test.ts` y
  `projectctl-requirements.sot-coherence.test.ts`; contratos AC `// @ac <ID>` +
  `test.info().annotations.push`.
- **AC-004 (TAREAS)**: actualizar `.agents/sdd-workflow.json` a `binding_version: 9.0.0`;
  regenerar projections client `frontend/src/views/projectctl/data/tareas-tab.view-model.ts`
  y `frontend/src/shared/sdd/task-flow.generated.ts` (via `taskflow:generate`,
  owner `sdd-apply-code-high`); retirar estados `branching`/`pushing`/`ready_for_branch`/
  `verified` de `taskReadme/*.md` (dejarlos fuera de taskReadme sin borrar historial).
- **AC-005 (CROSS)**: crear/verificar `AGENTS.md`, `README.md`,
  `docs/00-context/agents_skills.md`, `docs/04-process/task.md`, `.atl/skill-registry.md`;
  restaurar `playwright.config.ts` (crear `frontend/playwright.config.ts` o repuntar).

### Fuera de alcance

- No cambiar la UI SolidJS de `/projectctl` (gobierna `frontend-policy` + `fsd-architecture`;
  solo se consumen bundles declarativos).
- No implementar características nuevas de testing/entorno más allá de alcanzar el estándar.
- No tocar el working tree en `main` durante fase 1 (reconciliar en `branch_creation_pending`).
- No gestionar tunnel/hostname ni cambiar red/alias de runtime (solo se preservan).
- No reescribir `docs/app-map/views/home/**` ni `project-workspace/**` (fuera del cambio).

## 3. Capabilities

Frente al estándar `projectctl-requirements` (references/{standard,entorno,test,doc}.md), el
cambio debe entregar las siguientes capacidades (mapeadas a AC y a criterios PCT):

| # | Capacidad | Área / AC | Criterio estándar |
|---|---|---|---|
| C1 | Entornos prod y dev levantables: `.env`/`.env.dev` con `FRONTEND_PORT=4321`, overlays `compose.yml`/`compose.dev.yml` canónicos, servicio `frontend` `target: prod/dev`, runtime controlado vía `projectctl` (sin Docker raw en sandbox) | ENTORNO / AC-001 | PCT-95, PCT-96, PCT-97, PCT-98, PCT-99 |
| C2 | `projectctl env validate` reporta ok (`.env` presentes + puertos válidos) y `projectctl status` levanta ambos modos | ENTORNO / AC-001 | PCT-97, PCT-38 |
| C3 | Documentación canónica: bundle `views/projectctl` con 5 secciones MUST, `criteria[]` inline (IDs prefijados), sole SoT `docs/app-map/` + `navigation.yaml`; superfície legacy `quality/*` eliminada y no restaurable | DOCS / AC-002 | PCT-83, PCT-84, PCT-85, PCT-86, PCT-87, PCT-88 |
| C4 | Sistema de testing canónico: runner unificado `scripts/test-runner.ts`, gate `bun run test:check`, `playwright/TEST_PLAN.md`, contrato AC mandatorio, persistencia atómica `.runtime/test-results/` completa con write-back `patchBundleCoverage`, layout canónico de specs | TEST / AC-003 | PCT-89, PCT-90, PCT-91, PCT-92, PCT-93, PCT-94 |
| C5 | Convivencia de proyecciones: `task-flow.generated.ts` + `tareas-tab.view-model.ts` regeneradas, verificación `sot-coherence.test.ts` (gate R-007) | TAREAS / AC-004 | PCT-106..121, gate R-007 |
| C6 | Coherencia de workflow: locator pinnea binding v9.0.0, solo estados del `status.writable` del binding (sin aliases retirados) en `taskReadme` | TAREAS / AC-004 | `task-flow-binding` v9.0.0, guardrail estados |
| C7 | Prerrequisitos cross presentes y funcionales (`AGENTS.md`, `README.md`, `docs/00-context/agents_skills.md`, `docs/04-process/task.md`, `.atl/skill-registry.md`, `playwright.config.ts` symlink válido) | CROSS / AC-005 | standard §1 (fuentes de revisión) |

## 4. Approach

- **Dentro de fase 2 (implementación)**: aplicar cambios por WU ordenados por AC.
  - AC-004 primero (locator pin + projections + retiro de estados) para estabilizar la base
    de workflow antes de tocar superficie de producto.
  - AC-005 (prerrequisitos cross) y AC-002 (bundle docs) en paralelo con la lógica canalizada
    por `sdd-apply-doc` (único owner documental por binding).
  - AC-001 (entorno/compose) y AC-003 (runner/persistencia) con `sdd-apply-code-medium`
    (config/runtime/scripts/runner); generación de projections con `sdd-apply-code-high`.
- **Persistencia**: `mirrors: []` → `write_order: ["primary"]`; fase 2 exige spec delta +
  design + tasks (plan v9). Cada lane escribe solo su phase artifact; el coordinador escribe
  el índice.
- **Delivery**: branch `feature/20260825-bhbr8k-remediacion-compatibilidad-projectctl-entornos-docs-tests`
  desde `develop` → PR único target `develop` (nunca `main`). Close evidence: branch_name,
  pr_url, verification_revision, documentation_revision, criteria_covered_complete,
  all_work_units_terminal.
- **Validación**: para AC-001/AC-003, evidencia runtime vía CLI `projectctl`
  (`env validate`, `status`, `doctor`) + `bun run test:check` (gate de cobertura contractual)
  + verificación unit/R-007. Browser validation NO requerida (`pw_enabled: false`,
  `browser_validation: optional`).
- **Eliminación legacy**: `docs/01-product/quality-*.md` se eliminan per TST-03/TST-12;
  cobertura se escribe en `criteria[].coverage`, nunca en archivos paralelos (PCT-86).

## 5. Affected Areas

- **Config / runtime**: `.env`, `.env.dev`, `.env.example`, `compose.yml`, `compose.dev.yml`,
  `.agents/sdd-workflow.json`.
- **Docs**: `docs/app-map/views/projectctl/{index.md,index.mmd}`, `docs/app-map/navigation.yaml`,
  `docs/00-context/{entornos,architecture,agents_skills}.md`, `docs/02-features/tunnel.md`,
  `docs/04-process/task.md`, `AGENTS.md`, `README.md`, `.atl/skill-registry.md`; eliminación
  de `docs/01-product/quality-plan.md` + `quality-status.md`.
- **Testing**: `scripts/test-runner.ts`, `package.json` (root, `test:check`),
  `playwright/TEST_PLAN.md`, `playwright.config.ts`, `.runtime/test-results/**` (completar),
  `frontend/__tests__/projectctl-*-bundle.test.ts` + `sot-coherence.test.ts`,
  layouts canónicos de specs, primitivas backend (`src/ac-header.ts`,
  `coverage-writer.ts`, `test-inventory.ts`).
- **Skills**: instalación de `sandbox-runtime-policy`, regeneración de projections client
  (`frontend/src/views/projectctl/data/*`, `frontend/src/shared/sdd/*`).
- **TaskReadme**: retiro de estados en `taskReadme/*.md` (historial preservado).

## 6. Risks

1. **Env files gitignored** (`.gitignore`): `.env`/`.env.dev` creados/corregidos no son
   stageables por flujo normal → `force-add required` o `policy review required` al entregar
   AC-001. Clasificación: `policy review required` hasta confirmar política.
2. **Persistencia test parcial (matiz)**: `.runtime/test-results/` ya contiene 46 runs (29 con
   `unit/junit.xml`); AC-003 debe COMPLETAR el pipeline canónico, no asumir directorio vacío.
3. **`.runtime/` / `test-results/` no gitignored**: el runner nuevo que escribe ahí puede
   colar artefactos runtime en el commit → decidir política de ignorado durante diseño.
4. **Symlink `playwright.config.ts` roto**: restaurar requiere crear `frontend/playwright.config.ts`
   o repuntar (AC-005); riesgo intermedio en fase 2 si el runner asume config válida.
5. **Working tree en `main` sucio** (cambios fuera de scope preexistentes): reconciliar en
   `branch_creation_pending` al crear branch desde `develop`; no tocar durante fase 1.
6. **States retirados en taskReadme**: son historial; retirar sin borrar trabajo (a confirmar
   granularidad en spec).
7. **Drift locator** 8.0.0→9.0.0: ya registrado; AC-004 lo repara y verifica con
   `sot-coherence.test.ts` (gate R-007).

## 7. Rollback Plan

- Todo el cambio vive en un único branch feature desde `develop`; el PR único a `develop`
  permite revertir el merge completo sin afectar `main`.
- Por AC:
  - **AC-001**: overlays/env se restauran a los legacy `docker-compose*.yml` si `projectctl`
    no levanta; `.env*` se reversionan/repuntean al estado previo. Compat: alias edge y red
    se preservan, no requieren reconfiguración externa.
  - **AC-002/AC-005**: bundle `views/projectctl` y archivos cross se revierten por el mismo
    PR; superfície legacy `quality/*` queda restaurable solo si el gate `AC-009.app_map_close`
    lo exige (no restaurar como SoT).
  - **AC-003**: runner/gate se desactivan revirtiendo `package.json` + `scripts/` +
    `playwright/TEST_PLAN.md`; persistencia existente queda intacta (solo se completa).
  - **AC-004**: locator vuelve a pin previo y projections se regeneran/marcan ausentes sin
    romper resolución (proyección derivada no autoritativa).
- Pre-close: verificar que `bun run test:check` y `projectctl env validate/status/doctor`
  reporten estado esperado; si fallan, revertir el merge antes del cierre.

## 8. Dependencies

- **Bloqueo de fase**: requiere aprobación explícita AC-010 (gate en la frontera de aceptación)
  para pasar de `p1_awaiting_acceptance` → `p1_accepted` → `branch_creation_pending`; no corre
  antes durante drafting.
- **Binding**: `task-flow-binding` v9.0.0 (`.agents/skills/projectctl-requirements/references/tareas.md`)
  como única SoT normativa; `sdd-workflow.json` pinchado a 9.0.0 como deliverable de AC-004.
- **Skills**: `projectctl-requirements` (canónico) + `sandbox-runtime-policy` (a instalar,
  AC-001) + surfaces por lane (sdd-apply-doc / sdd-apply-code / sdd-verify-code / sdd-apply-unit-tests / sdd-verify-units).
- **Lanes/fases**: spec+design+tasks (fase 2), apply-code/apply-doc (fase 2),
  apply-unit-tests + verify-units + verify-code (fase 2/3), apply-doc (fase 4);
  validación CLI `projectctl` coordinator-owned.
- **Artifact store**: `taskReadme/<task_id>-<task_slug>/<artifact>.md` para fase artifacts;
  `mirrors: []`.
- **Ambiente**: overlays compose canónicos + red edge `mis-proyectos-edge` existente + tunnel
  gestionado (`CENTRAL_TUNNEL_WEBHOOK_URL` + `DEPLOY_JWT_SECRET`).

## 9. Success Criteria

- **AC-001**: `projectctl env validate` reporta ok; `projectctl status` levanta prod y dev con
  `compose.yml`/`compose.dev.yml`, servicio `frontend` `target: prod/dev`, `FRONTEND_PORT=4321`.
- **AC-002**: bundle `views/projectctl` con 5 secciones MUST + `criteria[]` y
  `navigation.yaml` lo registra; `docs/01-product/quality-plan.md` y `quality-status.md`
  eliminados.
- **AC-003**: `bun run test:check` pasa; `scripts/test-runner.ts`, `playwright/TEST_PLAN.md`,
  persistencia atómica `.runtime/test-results/` completa con `junit.xml`; specs bajo layout
  canónico; `projectctl-*-bundle.test.ts` y `sot-coherence.test.ts` presentes.
- **AC-004**: `.agents/sdd-workflow.json` pinnea binding v9.0.0; projections client presentes;
  estados `branching`/`pushing`/`ready_for_branch`/`verified` fuera de `taskReadme`.
- **AC-005**: `AGENTS.md`, `README.md`, `docs/00-context/agents_skills.md`,
  `docs/04-process/task.md`, `.atl/skill-registry.md` presentes; symlink `playwright.config.ts`
  válido.
- **Cierre**: `bun run test:check` verde, `projectctl doctor` sin drifts críticos, PR único a
  `develop`, close evidence completa, `AC-009.app_map_close` aprobado, estado terminal `done`.

---

**criteria_covered**: AC-001..AC-005
**next_recommended**: `p1_awaiting_acceptance` (registrar evidencia de aprobación AC-010 antes
de avanzar a `branch_creation_pending`; si auto-aprobado → `sdd-spec`).
