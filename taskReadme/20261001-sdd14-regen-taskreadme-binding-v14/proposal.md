# Proposal — Regenerar taskReadme de ejemplo a binding SDD v14

- **Task**: `20261001-sdd14-regen-taskreadme-binding-v14` · binding `projectctl-requirements.task-flow` v14.0.0 (`TaskFlowBindingV2`, model 2)
- **Fase/State**: `fase_1_propuesta` / `p1_started` · **Lane**: `sdd-propose` · **Owner aprobación**: usuario vía `sdd-orchestrator` (gate `AC-010.explicit_approval`)
- **Plantilla**: `.agents/skills/projectctl-sdd/assets/task-template.md` v14 · **Machine**: bloque `task-flow-binding` en `.agents/skills/projectctl-sdd/references/tasks/binding.md`

## Intent

Los taskReadme de ejemplo del repo pinean bindings inexistentes (v8/v10), usan aliases retirados
(`branching`, `pushing`, `ready_for_branch`, `verified`, …) y dejan el locator
`.agents/sdd-workflow.json` inválido (binding_path fantasma + `expected_binding_version` 10.0.0).
Esta proposal solicita: (a) regenerar **28 ejemplos canónicos v14** con cobertura 1:1 de
`binding.phases[]` + `binding.controls[]`; (b) **borrar legacy + huérfanos + incoherentes**;
(c) **recabecerar la serie `20260727-p*`** (22 archivos) de plantilla v8 a v14; (d) **migrar el
locator** (path/version/proyecciones) más sus consumidores (`.atl/skill-registry.md`,
`docs/04-process/task.md`, `AGENTS.md`). **NO se elimina** `.agents/sdd-workflow.json`
(justificación en § Approach). Trabajo mecánico-documental: ningún comportamiento de producto
cambia, ningún criterio de aceptación se añade/modifica/elimina.

## Assigned view/feature, canonical bundles and baseline revision

- **Target SDD**: ninguno de producto. Es mantenimiento mecánico de assets SDD (`taskReadme/`,
  locator, proyecciones, docs de proceso). No hay vista/feature de `docs/app-map/navigation.yaml`
  afectada.
- **Bundles leídos como contexto** (verificación de no-impacto, revisión vigente en disco):
  `views/home/index` (`HOME-01`, `HOME-05`), `views/home/features/status-summary`
  (`HSS-01`…`HSS-04`), `views/home/features/runtime-metadata` (`HRM-01`, `HRM-02`).
- **Baseline machine**: no existe `references/app-map/criteria.yaml` en el core instalado ni
  manifiesto con revisiones (`glob **/criteria.yaml` → 0 resultados); los bundles tampoco portan
  campo `revision`. Sin fuente de `revision`/`retired` no se puede construir un `baseline[]`
  verificable por `tasks.ts proposal check`, así que se declara delta vacío con
  `no_criteria_reason` (fence de plantilla mecánica), y los 8 IDs se listan abajo como
  *maintained por contexto*, fuera del fence. No se inventa ningún ID canónico ni local.

```criteria-change
{
  "schema": "criteria-change/v1",
  "targets": ["tooling"],
  "baseline": [],
  "changes": [],
  "no_criteria_reason": "Trabajo mecanico-documental sin cambio de aceptacion: regenera taskReadme de ejemplo a plantilla/binding v14, borra legacy con aliases retirados, recabecera serie 20260727-p* y migra el locator .agents/sdd-workflow.json sin alterar ningun comportamiento de producto ni ningun criterio de los bundles home/status-summary/runtime-metadata (HOME-01, HOME-05, HSS-01..HSS-04, HRM-01..HRM-02 intactos). Sin tasks.ts criteria baseline disponible en el repo (scripts/project/tasks.ts inexistente), el baseline verificable se reconstruye en fase 2 contra los bundles citados antes de materializar."
}
```

## Criterios delta (app-map)

| Operación | ID canónico | Bundle owner | Antes | Después | Justificación |
| --- | --- | --- | --- | --- | --- |
| *(ninguna — delta vacío, ver fence `criteria-change/v1` arriba)* | — | — | — | — | `no_criteria_reason`: sin cambio de aceptación |

- Añadidos: ninguno. · Modificados: ninguno. · Eliminados: ninguno. · Mantenidos (fence): ninguno.
- Fence, tabla y retorno son idénticos: conjunto vacío + `no_criteria_reason` no vacío.

## Relevant maintained criteria

Contexto leído, **no tocado** (todos `functional: implemented`, cobertura declarada en sus bundles;
esta tarea no los re-verifica ni los reescribe):

- `HOME-01`, `HOME-05` (bundle `views/home/index`)
- `HSS-01`, `HSS-02`, `HSS-03`, `HSS-04` (bundle `views/home/features/status-summary`)
- `HRM-01`, `HRM-02` (bundle `views/home/features/runtime-metadata`)

Si fase 2 detecta que algún ejemplo debe citar cobertura `@ac`, se abrirá circuito de proposal
nuevo con baseline real; esta proposal no autoriza ningún link `criteria-links/v1`.

## Scope (in/out)

**In**:

1. **28 ejemplos canónicos v14** (`taskReadme/<task_id>-<task_slug>.md` cada uno, frontmatter de
   `assets/task-template.md` v14, `binding_version: 14.0.0`, `binding_path` SDD-satélite):
   - 22 de fase: 6×`fase_1_propuesta` (`p1_started`, `p1_exploring`, `p1_drafting`,
     `p1_awaiting_acceptance`, `p1_revision_requested`, `p1_accepted`) + 6×`fase_2_implementacion`
     (`p2_planning`, `p2_implementing`, `p2_code_review`, `p2_awaiting_acceptance`,
     `p2_revision_requested`, `p2_accepted`) + 5×`fase_3_verificacion` (`p3_test_preparing`,
     `p3_test_running`, `p3_test_fixing`, `p3_coverage_pending`, `p3_complete`) +
     5×`fase_4_documentacion` (`p4_started`, `p4_documenting`, `p4_reviewing`,
     `p4_revision_requested`, `p4_complete`), cada uno con el `status` de su fase
     (`planning`/`implementing`/`testing`/`documenting` de `binding.phases[]`).
   - 4 controles acción: `branch_creation_pending`, `final_commit_pending`, `final_push_pending`,
     `final_pr_pending` (con su `value.{phase,state,status}` de `binding.controls[]`).
   - 1 terminal `done` en forma única `{ phase: null, state: "done", status: "done" }`
     (`phase: null` real, nunca string `"null"`).
   - 1 par blocked/failed con phase/state preservados (ej. `fase_2_implementacion`/`p2_code_review`
     + `blocked`, `fase_3_verificacion`/`p3_test_running` + `failed`; `writes_state: false`).
2. **Borrado**: 7 legacy `2026-04-17-test-task-for-state-*` (aliases `branching`/`pushing`/
   `ready_for_branch`/`verified`/…), dir huérfano `20260728-ff24s9-*`, incoherentes
   `20260706-testtab-*`, `20260825-bhbr8k-*`, `20260913-vn3n31-*` (+ sus dirs `*/` asociados).
3. **Recabecerado serie `20260727-p*`** (22 archivos, valores phase/state válidos pero cabecera
   v8): frontmatter a plantilla v14 + deduplicación contra los 28 nuevos (p. ej. `p1_accepted`,
   `p4_reviewing` duplicados con dir `*/`).
4. **Migración locator** `.agents/sdd-workflow.json`: `binding_path` →
   `.agents/skills/projectctl-sdd/references/tasks/binding.md`, `expected_binding_version` →
   `14.0.0`, proyecciones `state_model` →
   `.agents/skills/projectctl-sdd/generated/phase-state-schema.json` y `task_template` →
   `.agents/skills/projectctl-sdd/assets/task-template.md` (verificar/regenerar proyección y
   `client_view_model`/`client_generated_ts` en fase 2); actualizar `.atl/skill-registry.md`
   (fila `projectctl-requirements/tareas` → path del satélite SDD), `docs/04-process/task.md`
   (pins v10.0.0 → v14.0.0, path fantasma → path SDD) y `AGENTS.md` si pinea versión.

**Out**: cambios de producto/criterios/bundles App Map; crear `scripts/project/tasks.ts` o
cualquier CLI; crear rama/push/PR/merge (propiedad de `sdd-orchestrator`); verificación
browser/runtime; tests nuevos (los ejemplos no son evidencia de cobertura); tocar mirrors
(`binding.artifact_store.mirrors: []`); escribir el índice (single-writer `sdd-orchestrator`).

## Capabilities

- Redacción documental v14 + borrado/recabecerado de taskReadme (lanes `sdd-apply-doc`,
  `sdd-orchestrator` para borrados).
- Migración versionada de locator + proyecciones + consumidores (anti-drift
  `references/maintenance.md`, `references/sources.md`).
- Sin capability de código/runtime/browser: no hay `apply-code-*` ni verify con comandos;
  verificación = revisión documental + `sdd-verify-code` sobre diffs de docs si el
  orchestrator lo exige.

## Approach

1. **Spec**: fijar lista cerrada 28 (ids/slugs/phase/state/status por ejemplo), lista de borrado
   con ruta exacta, mapeo 22 serie v8→v14 (campo a campo: `binding_version`, `binding_path`,
   `sdd_persistence`, `phase_artifacts_dir`, owners por `heading_owners`), y diff del locator.
2. **Design**: regla de deduplicación (28 nuevos mandan; serie aporta solo states sin colisión o
   se retira), convención de nombres de ejemplo, y plan de actualización de los 3 consumidores.
3. **Tasks** (ya esbozadas en índice §5): `WU-LEGACY-DEL` (borrado, `apply_lane: none`,
   owner `sdd-orchestrator`), `WU-SERIE-V14` + `WU-EXAMPLES-28` (`sdd-apply-doc`),
   `WU-LOCATOR` (`sdd-orchestrator` + apply-doc).
4. **Por qué NO se elimina `sdd-workflow.json`** (evaluación contra binding v14, índice §8):
   - `binding.bootstrap_locator` exige `candidate_cardinality: exactly_one` con accessor
     `workflow_binding_locator/v1`: sin locator no hay `WorkflowRuntimeContextV1.source`
     válido y el resolver falla antes de routing.
   - `binding.active_sources.include` lista `.agents/sdd-workflow.json`: es allow-list
     normativa; eliminarlo deja al binding sin su propio locator versionado y auditable.
   - `binding.md` §§ *Machine block identity* / *Source identity* / *Navigation* lo citan como
     locator canónico del binding. Solo podría retirarse si el resolver portable documenta un
     accessor alternativo versionado/auditable; hoy no existe tal evidencia.
   - Conclusión: conservar + migrar (contenido corregido, mismo path), nunca borrar.

## Affected Areas

- **Tareas (surface SDD, única surface tocada)**: `taskReadme/` (28 creaciones, ~11 borrados +
  dirs `*/`, 22 recabecerados), `.agents/sdd-workflow.json`,
  `.agents/skills/projectctl-sdd/generated/phase-state-schema.json` (regenerar),
  `.atl/skill-registry.md`, `docs/04-process/task.md`, `AGENTS.md` (solo si pinea versión).
- **No tocadas**: `docs/app-map/**` (solo lectura), `frontend/`, `backend/`/`api/`, `shared/`,
  `tests/`, `scripts/`, `compose/`, bundles ni navigation.

## Risks

- **Aliases retirados** (`binding.retired_aliases[]`: `branching`, `pushing`,
  `ready_for_branch`, `verified`, `completed`, `paused`, `sdd-apply`, `sdd-verify`, …):
  cualquier ejemplo/WU que los reintroduzca como `status`, `owner` o lane rompe el gate
  anti-drift. Mitigación: validar cada frontmatter contra `status.writable` (8 valores) y
  `lanes` del bloque machine; spec lista los 28 con valores literales.
- **`phase: null` como string**: el terminal `done` exige `phase: null` YAML real; `"null"`
  entrecomillado es drift. Mitigación: design fija el snippet literal + revisión que lo comprueba.
- **`pending` + `p1_started`**: `status.pre_bootstrap = pending` vs fase inicial `p1_started`
  con `status: planning`; no mezclar (el índice activo ya usa `planning`/`p1_started`
  correctamente; los ejemplos deben replicarlo, no el par inválido).
- **Mirror Engram**: `mirrors: []` — ninguna herramienta opcional (incluida memoria Engram) es
  evidencia ni fuente de verdad; recovery solo índice + phase artifacts. Mitigación: no
  registrar topics de memoria como artifact; el handoff vive en índice §7.
- **Proyección desincronizada**: editar locator sin regenerar `phase-state-schema.json` deja
  `taskflow:generate` en rojo. Mitigación: `WU-LOCATOR` incluye regeneración + check.
- **Colisión con serie**: ejemplos nuevos vs `20260727-p*` recabecerados pueden duplicar
  state. Mitigación: tabla de deduplicación en spec (28 nuevos mandan).
- **Delivery-surface**: todos los paths tocados son commitables (docs/taskReadme/locator);
  excluidos de commit (`.env`, `.runtime/`, `frontend/test-results/`) no se tocan. Sin
  `force-add` previsto; si aparece un path generado, se reporta a `sdd-orchestrator`.

## Rollback Plan

- Antes de aplicar, `sdd-orchestrator` registra inventario (lista de paths + SHA) en el artifact
  `tasks`; el borrado es el único cambio destructivo y se revierte restaurando desde la rama
  base `develop` (`git checkout develop -- <paths>`, ejecutado por el owner de entrega, no por
  esta lane).
- Recabecerados y locator se revierten por re-apply del frontmatter/contenido previo guardado
  en el artifact de evidencia `apply-<unit_id>.md`.
- Si la migración del locator rompe resolución, rollback = restaurar el JSON previo (aunque
  inválido) y re-bloquear con warning crítico del índice §8; nunca dejar el path ausente.

## Dependencies

- Aprobación explícita de esta proposal (gate `AC-010.explicit_approval`) antes de fase 2.
- `sdd-orchestrator` como single-writer del índice y owner de rama/entrega
  (`feature/20261001-sdd14-regen-taskreadme-binding-v14` desde `develop`, PR único; rama aún
  no creada — bloqueado hasta `branch_creation_pending`).
- Lanes fase 2 (`sdd-spec`, `sdd-design`, `sdd-tasks`) para cerrar listas literales antes de
  cualquier apply; `WU-LEGACY-DEL`/`WU-LOCATOR` requieren autoridad `sdd-orchestrator`.
- Sin dependencias de runtime/browser/tests; `scripts/project/tasks.ts` inexistente → se mantiene
  la excepción mínima documentada (índice manual), no se implementa el motor en esta tarea.

## Success Criteria

Done condition verificable (cierre en forma terminal única
`{ phase: null, state: "done", status: "done" }`):

1. Existen 28 taskReadme de ejemplo con frontmatter válido contra `TaskFlowBindingV2` v14
   (22 phases + 4 controles acción + terminal `done` + par blocked/failed con phase/state
   preservados), sin ningún valor de `binding.retired_aliases`.
2. Borrados los 7 legacy `2026-04-17-*`, el huérfano `20260728-ff24s9-*` y los 3 incoherentes
   (`20260706-*`, `20260825-bhbr8k-*`, `20260913-vn3n31-*` + dirs asociados); serie
   `20260727-p*` recabecerada a v14 sin duplicados contra los 28.
3. `.agents/sdd-workflow.json` resuelve el binding v14 (`binding_path` satélite SDD,
   `expected_binding_version` 14.0.0, proyecciones existentes) y los 3 consumidores ya no
   pinean v10/path fantasma; `taskflow:generate`/checks relacionados verdes.
4. `docs/app-map/**` intacto (0 diffs) y delta de criterios vacío con `no_criteria_reason`
   aprobado; `criteria_covered: []` coherente con §3 del índice.
5. Branch + PR único registrados en índice §9; gates de cierre (`pending_environment_close_block`,
   `requirements_current_close_block`) sin bloqueos pendientes.
