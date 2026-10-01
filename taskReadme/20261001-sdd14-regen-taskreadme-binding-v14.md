---
title: "Regenerar taskReadme de ejemplo — cobertura total binding SDD v14"
task_id: "20261001-sdd14"
task_slug: "regen-taskreadme-binding-v14"
sdd_change_id: ""
binding_id: "projectctl-requirements.task-flow"
binding_version: "14.0.0"
binding_path: ".agents/skills/projectctl-sdd/references/tasks/binding.md"
sdd_persistence: "taskReadme index + phase artifacts"
phase_artifacts_dir: "taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/"
status: planning
phase: fase_1_propuesta
state: p1_started
priority: medium
type: feature
area: fullstack
created: 2026-10-01T00:00:00Z
updated: 2026-10-01T00:00:00Z
source_branch: develop
target_branch: develop
branch_name: "feature/20261001-sdd14-regen-taskreadme-binding-v14"
pr_url: ""
browser_validation: required
docker_validation: required
docs_impact: pending
blocked_reason: ""
---

# Task: Regenerar taskReadme de ejemplo — cobertura total binding SDD v14

> **Origen de los valores**: este índice es un **asset derivado del binding `projectctl-requirements.task-flow` v14.0.0**. Todo valor escribible se valida contra el binding canónico `TaskFlowBindingV2` (model `2`).
>
> **Modelo de persistencia v11.** Este archivo es el índice compacto de coordinación y el detalle completo vive en los phase artifacts referenciados. Ambos son la fuente canónica y suficiente de persistencia y recuperación. El binding configura `mirrors: []`; herramientas opcionales de soporte no son evidencia ni fuente de verdad SDD.
>
> **Bootstrap por sdd-init (2026-10-01).** `scripts/project/tasks.ts init` NO existe en el repo (solo `scripts/taskflow.ts`, `scripts/sdd-doctor.ts`, `scripts/test-runner.ts`, `scripts/projectctl-*.ts`); se aplica la excepción mínima de shell canónico: índice creado manualmente desde `.agents/skills/projectctl-sdd/assets/task-template.md` v14 con locator+binding ya resueltos por sdd-explore-code/research. Sin projectctl CLI, sin push/PR/merge, sin branch creation (propiedad de sdd-orchestrator).

## 1. Objetivo

Regenerar los taskReadme de ejemplo para cubrir todos los estados/fases vigentes del binding SDD v14 (`TaskFlowBindingV2`), con actualizaciones de `projectctl-sdd` y `projectctl-requirements`: 28 ejemplos canónicos, borrado de legacy con aliases retirados, recabecerado de la serie 20260727-p* a plantilla v14, y resolución documentada del locator `.agents/sdd-workflow.json`.

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["1_objetivo"]`).

## 2. Contexto operativo

- **Origen del pedido**: mejora / deuda técnica (ejemplos de estados desactualizados, binding v14 vigente).
- **Motivación**: los ejemplos actuales pinean binding v8/v10 inexistente y usan aliases retirados; se necesita cobertura canónica 1:1 con `binding.phases[]` + `binding.controls[]`.
- **Restricciones** (el detalle va a los phase artifacts):
  - El índice es la única fuente operativa de coordinación (`binding.artifact_store.primary.path_pattern = taskReadme/<task_id>-<task_slug>.md`, `role: "index"`); el detalle de cada fase vive en `binding.artifact_store.phase_artifacts` (`taskReadme/<task_id>-<task_slug>/<artifact>.md`).
  - `binding.artifact_store.mirrors` está vacío; ninguna herramienta opcional participa en recovery, evidencia o cierre.
  - Cierre exitoso siempre en `status.terminal` (`done`, forma única `{ phase: null, state: "done", status: "done" }`).
  - `phase`/`state` se resuelven desde `binding.phases[]` y `binding.controls[]`; los `retired_aliases` **no** son escribibles.
- **Decisiones vinculantes del usuario**:
  - 28 ejemplos: 22 states de fase (6 p1 + 6 p2 + 5 p3 + 5 p4) + 4 controles acción (`branch_creation_pending`, `final_commit_pending`, `final_push_pending`, `final_pr_pending`) + 1 terminal `done` (`phase:null,state:done,status:done`) + 1 par blocked/failed con phase/state preservados (ej. `p2_code_review`+blocked, `p3_test_running`+failed).
  - Borrar legacy: 7 archivos `2026-04-17-test-task-for-state-*` (aliases `branching`/`pushing`/`ready_for_branch`/`verified`, etc.), dir huérfano `20260728-ff24s9-*`, archivos incoherentes `20260706-testtab-*`, `20260825-bhbr8k-*`, `20260913-vn3n31-*`; recabecerar/deduplicar serie `20260727-p*` (22 archivos v8 con valores válidos pero cabecera obsoleta) hacia plantilla v14.
  - Locator: evaluar propuesta de ELIMINAR `.agents/sdd-workflow.json` contra binding v14 antes de tocar nada (ver §8).
- **Static readiness (sdd-init)**: `bun scripts/taskflow.ts --check` → ✅ passed; `bun scripts/sdd-doctor.ts` → ✅ passed (home-only). Bootstrap incompleto solo por `scripts/project/tasks.ts` inexistente + locator inválido (ver §8); índice creado por excepción mínima documentada.
- **Testing capabilities (persistencia obligatoria sdd-init)**:
  - unit: Bun (`bun run scripts/test-runner.ts run --method=unit --target=home` / `bun test` por archivo) — FOUND.
  - pwauto: Playwright persistente (`bun run scripts/test-runner.ts run --method=pwauto --target=home`, `frontend/playwright.config.ts`) — FOUND.
  - gate contractual: `bun run test:check` (coverage gate `scripts/test-runner.ts check`) — FOUND.
  - docs-lint: `bun scripts/projectctl-docs.ts lint` — FOUND.
  - Regla: todo test declara `// @ac <ID>` en las primeras 10 líneas; excluidos de commit `.env`/`.runtime/`/`frontend/test-results/` (firma ambiente commitada: `.env.example`).
  - Strict TDD: test runner existe y no hay marcador contrario → `strict_tdd: true`.
- **Project context (persistencia obligatoria sdd-init)**: colpruebas, monorepo Bun 1.4.2 (`frontend` Astro + `backend`/`api` Express 4.18 + `shared` + `tests/{unit,front,e2e}` + `scripts/` + `compose/` + `docs/app-map/**` SoT funcional); runtime gestionado solo vía `projectctl`, sandbox sin docker CLI; task states solo `status.writable` v14; entrega en rama feature + PR único desde `develop`.
- **Skills locales resueltas en disco** (`.agents/skills/`, sin binario externo): `projectctl-sdd` (binding/lanes/protocolo), `projectctl-requirements` (criterios/App Map/tests/estructura), `projectctl-rdd` + `projectctl-judgment-day` (extensiones), `projectcl-enviorement` (entornos), `engram-policy`, `find-skill`, `skill-creator`. Registry destino no exigido ni escrito por esta lane.

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["2_contexto_operativo"]`).

## 3. Criterios de aceptación

Solo IDs canónicos + veredicto + método. La definición vigente vive en el bundle App Map propietario; proposal contiene su delta aprobado y spec desarrolla escenarios. No crear AC locales ni otro catálogo.

| Criterion-ID | Veredicto | Método |
| --- | --- | --- |
| `TBD (sdd-propose resuelve bundle App Map propietario)` | `pending` | `not_required` |

- `criteria_covered` enumera los mismos IDs canónicos aprobados, sin renumeración. `AC-006.criteria_covered` es un control del workflow, no el catálogo del cambio.

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["3_criterios_de_aceptacion"]`).

## 4. Fases

Una fila por fase ejecutada. `summary` ≤ `index_budget.max_phase_summary_lines` (10). `artefacto` apunta al phase artifact con el detalle full. sdd-orchestrator copia aquí el `summary` + `artifact_ref` que devuelve cada lane; nunca inlina el detalle.

| Fase | Estado | Resumen (≤10 líneas) | Artefacto |
| --- | --- | --- | --- |
| Exploración | `done` | Reutilizada de sdd-explore-code/research previo: binding único v14, locator inválido v10, plantilla y proyección localizados. Sin redescubrimiento. | `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/explore-code.md` (pendiente de materializar por lane explore si orchestrator lo exige) |
| Propuesta | `pending` | Siguiente lane: sdd-propose. No redactada en bootstrap. | `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/proposal.md` |
| Specs | `pending` | Se define en fase 2. | `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/spec.md` |
| Design | `pending` | Se define en fase 2. | `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/design.md` |
| Tasks | `pending` | Desglose full en artifact `tasks` cuando sdd-tasks ejecute. | `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/tasks.md` |
| Bootstrap sdd-init | `done` | Índice creado por excepción mínima; preflights verdes; carpeta de artifacts creada; listo para routing a propose. | Este índice + `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/` |

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["4_fases"]`). Las lanes escriben su phase artifact y devuelven `summary`+`artifact_ref`; sdd-orchestrator (single writer) rellena esta tabla.

## 5. Work units

El desglose full (13 columnas + 4 campos contractuales, complejidad, parallel-safety) vive en el phase artifact `tasks` (`taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/tasks.md`) — schema en `.agents/skills/projectctl-sdd/modules/sd-protocol/apply-work-unit-schema.md`. Aquí solo la tabla de estado que mantiene sdd-orchestrator:

| WU-id | Lane | apply_lane | Estado | Artefacto de evidencia |
| --- | --- | --- | --- | --- |
| `WU-LEGACY-DEL` | `sdd-orchestrator` (borrado legacy + huérfanos) | `none` | `pending` | `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/apply-WU-LEGACY-DEL.md` |
| `WU-SERIE-V14` | `sdd-apply-doc` (recabecerar 22 serie 20260727-p*) | `doc` | `pending` | `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/apply-WU-SERIE-V14.md` |
| `WU-EXAMPLES-28` | `sdd-apply-doc` (28 ejemplos canónicos v14) | `doc` | `pending` | `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/apply-WU-EXAMPLES-28.md` |
| `WU-LOCATOR` | `sdd-orchestrator` + apply-doc (migración mínima locator, NO borrado) | `doc` | `pending` | `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/apply-WU-LOCATOR.md` |

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["5_work_units"]`). Cada apply lane escribe su evidencia en `apply-<unit_id>.md` y devuelve estado + `artifact_ref`; sdd-orchestrator actualiza esta tabla.

## 6. Verificación

Veredicto consolidado + refs a los phase artifacts `verify-*`. El detalle de cada lane vive en su artefacto; sdd-orchestrator consolida aquí.

- **Estado consolidado**: `pending`
- **Lanes requeridos / ejecutados**: `ninguno aún (bootstrap solo)`
- **Cobertura contra specs**: `n/a en p1_started`
- **Refs**:
  - Code review → `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/verify-code.md`
  - Unit tests → `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/verify-units.md`
  - PW-AUTO → `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/verify-pwauto.md`
  - PW-CLI → `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/verify-pwcli.md`
  - Requirements → artifacts del perfil y targets resueltos de `binding.requirements_verification`; índice operativo `requirements` conserva refs y huellas scope/global.
  - Consolidado → `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/verify-report.md`
- **Validación browser/runtime**: contrato (target_environment, runtime_kind, credentials) en el phase artifact `tasks`; gate **Browser lane preconditions** en `.agents/skills/projectctl-sdd/modules/sdd/sdd-orchestrator/module.md`.

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["6_verificacion"]`). Las verify lanes escriben su `verify-<kind>.md` y devuelven veredicto + `artifact_ref`.

## 7. Estado actual / Siguiente paso / Handoff

- **Estado actual**: `planning`
- **Fase / State**: `fase_1_propuesta` / `p1_started`
- **Siguiente paso**: `sdd-propose` (vía sdd-orchestrator; explore lanes opcionales si exige evidencia fresca). No redactar proposal en bootstrap.
- **Handoff para resume**: tarea de regeneración de ejemplos v14 con 28 casos + limpieza legacy + recabecerado serie + locator documentado como NO eliminable sin migración. Índice canónico creado, preflights verdes, carpeta de artifacts lista.
- **Resume checkpoint**: lane en curso `null` (bootstrap sdd-init terminado); unit/ronda in-flight `null`; última acción confirmada: índice `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14.md` + dir artifacts creados, `taskflow:check`/`sdd-doctor` verdes; siguiente acción atómica pendiente: sdd-orchestrator invoca `sdd-propose` con este índice; phase artifact a releer con full-retrieval antes de continuar: este índice (único artifact existente).

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["7_estado_actual_siguiente_paso_handoff"]`).

## 8. Problemas / Blockers

Solo blockers activos. Registrar aquí `browser-target-missing` / `browser-credentials-missing` / `runtime-kind-unknown` / `index_budget_exceeded` u otros modos de fallo antes de bloquear.

| Severidad | Problema | Resolución / siguiente paso |
| --- | --- | --- |
| `warning` | `scripts/project/tasks.ts init` inexistente → bootstrap canónico por CLI no disponible. | Aplicada excepción mínima documentada: índice manual desde plantilla v14. sdd-orchestrator puede proveer el helper o mantener excepción. |
| `critical` | Locator `.agents/sdd-workflow.json` inválido: `binding_path` fantasma (`.agents/skills/projectctl-requirements/references/tasks/binding.md` no existe), `expected_binding_version` 10.0.0 inexistente, proyecciones a rutas inexistentes. | NO eliminar. Migración mínima propuesta (no aplicada: fuera de autoridad sdd-init) — ver evaluación abajo. |
| `info` | Propuesta de usuario de ELIMINAR locator evaluada contra binding v14: eliminación ROMPE resolución determinista. | Evidencia: `binding.bootstrap_locator` exige `exactly_one` accessor versionado; `active_sources.include` lista `.agents/sdd-workflow.json`; `Source identity` y `Navigation` lo citan como locator. Sin locator versionado y auditable no hay `WorkflowRuntimeContextV1.source` válido ni anti-drift. Resolución: conservar + migrar (binding_path → `.agents/skills/projectctl-sdd/references/tasks/binding.md`, expected `14.0.0`, proyecciones SDD `generated/phase-state-schema.json` + `assets/task-template.md`), actualizar `.atl/skill-registry.md` fila tareas + `docs/04-process/task.md` + `AGENTS.md` que pinean v10. Solo si el resolver portable documenta un accessor alternativo versionado/auditable podría retirarse; hoy no existe tal evidencia. |

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["8_problemas_blockers"]`).

## 9. Git y PR

- **Rama actual**: `feature/20261001-sdd14-regen-taskreadme-binding-v14` (per `binding.delivery.branch_pattern`; NO creada en bootstrap — propiedad de sdd-orchestrator; ambiguo → bloqueado y reportado)
- **PR URL**: `` (vacío)
- **Base target**: `develop` (per `binding.delivery.target_branch`)
- **Estado de PR**: `not_created`

### Checklist de cierre (gate antes de pasar a `done`)

- [ ] Todas las unidades `apply_lane: code-*` en `done` o `blocked` (tabla §5)
- [ ] Las lanes de verificación requeridas en `passed` o `not_required` (mapping en `apply-work-unit-schema.md`)
- [ ] Branch + PR registrados arriba
- [ ] Documentación actualizada registrada en el phase artifact `apply-<unit>` de doc y reflejada en §4/§5
- [ ] Gate `AC-009.app_map_close` verificado si hay criterios `modificar`/`eliminar`/`añadir` en §3 (ver `acceptance-criteria-gates.md`)
- [ ] Receipts técnicos y documentales vigentes para todos los targets; pending_environment resuelto (per `binding.gates["documentation_gate_passed"]`).
- [ ] Forma terminal única: `status: done`, `phase: null`, `state: "done"` (per `binding.controls["done"].value`)

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["9_git_y_pr"]`).
