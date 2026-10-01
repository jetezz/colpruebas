# Spec — Regenerar taskReadme de ejemplo a binding SDD v14

- **Task**: `20261001-sdd14-regen-taskreadme-binding-v14` · binding `projectctl-requirements.task-flow` v14.0.0 (`TaskFlowBindingV2`, model `2`)
- **Fase/State**: `fase_1_propuesta` / `p1_started` (redacción temprana, proposal aprobada) · **Lane**: `sdd-spec`
- **Proposal ref**: `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/proposal.md` (aprobada, delta vacío con `no_criteria_reason` mecánico-documental)
- **Índice ref**: `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14.md`

> Esta spec es delta-documental puro: fija listas cerradas, valores literales y
> escenarios de verificación. No añade, modifica ni elimina ningún criterio de
> aceptación ni ningún comportamiento de producto. La definición vigente de
> criterios vive en los bundles App Map propietarios; esta spec no crea AC locales.

```criteria-links/v1
{
  "criteria": [],
  "scenarios": []
}
```

- El fence `criteria-links/v1` es único en este artifact y enumera exactamente el
  conjunto canónico aprobado por la proposal: conjunto vacío + `no_criteria_reason`
  no vacío. No existe ningún link `criteria → scenario` autorizado por esta proposal.
- Los 8 IDs leídos como contexto (`HOME-01`, `HOME-05`, `HSS-01`…`HSS-04`,
  `HRM-01`, `HRM-02`) están **mantenidos fuera del fence**: ningún escenario los
  cita como cobertura. Si fase 2 detecta que un ejemplo debe citar cobertura `@ac`,
  se SHALL abrir un circuito de proposal nuevo con baseline real; esta spec MUST NOT
  autorizarlo.

## SPEC-01 — Lista cerrada de 28 ejemplos canónicos v14 (FULL SPEC, sin spec previa)

Todos los frontmatter de ejemplo SHALL usar la plantilla
`.agents/skills/projectctl-sdd/assets/task-template.md` v14 con
`binding_id: "projectctl-requirements.task-flow"`, `binding_version: "14.0.0"`,
`binding_path: ".agents/skills/projectctl-sdd/references/tasks/binding.md"`,
`sdd_persistence: "taskReadme index + phase artifacts"` y
`phase_artifacts_dir: "taskReadme/<task_id>-<task_slug>/"`.
Cada `task_id` SHALL cumplir `binding.task.id_pattern` (`^\d{8}-[a-z0-9]{4,8}$`) y
cada `task_slug` SHALL cumplir `binding.task.slug_pattern`.
Ningún ejemplo SHALL contener un valor de `binding.retired_aliases[]`
(`ready_for_branch`, `branching`, `pushing`, `verified`, `completed`, `paused`,
`sdd-apply`, `sdd-apply-code`, `sdd-explore`, `sdd-verify`, `phase1_generating`,
`phase2_branching`, `phase3_implementing`, `phase4_pushing`, `sdd-browser-runtime-context`, …).

### SPEC-01-A — 22 ejemplos de fase (status = status de su fase, `binding.phases[]`)

| # | task_id | slug | phase | state | status |
| --- | --- | --- | --- | --- | --- |
| 01 | `20261001-sdd1401` | `ex-p1-started` | `fase_1_propuesta` | `p1_started` | `planning` |
| 02 | `20261001-sdd1402` | `ex-p1-exploring` | `fase_1_propuesta` | `p1_exploring` | `planning` |
| 03 | `20261001-sdd1403` | `ex-p1-drafting` | `fase_1_propuesta` | `p1_drafting` | `planning` |
| 04 | `20261001-sdd1404` | `ex-p1-awaiting-acceptance` | `fase_1_propuesta` | `p1_awaiting_acceptance` | `planning` |
| 05 | `20261001-sdd1405` | `ex-p1-revision-requested` | `fase_1_propuesta` | `p1_revision_requested` | `planning` |
| 06 | `20261001-sdd1406` | `ex-p1-accepted` | `fase_1_propuesta` | `p1_accepted` | `planning` |
| 07 | `20261001-sdd1407` | `ex-p2-planning` | `fase_2_implementacion` | `p2_planning` | `implementing` |
| 08 | `20261001-sdd1408` | `ex-p2-implementing` | `fase_2_implementacion` | `p2_implementing` | `implementing` |
| 09 | `20261001-sdd1409` | `ex-p2-code-review` | `fase_2_implementacion` | `p2_code_review` | `implementing` |
| 10 | `20261001-sdd1410` | `ex-p2-awaiting-acceptance` | `fase_2_implementacion` | `p2_awaiting_acceptance` | `implementing` |
| 11 | `20261001-sdd1411` | `ex-p2-revision-requested` | `fase_2_implementacion` | `p2_revision_requested` | `implementing` |
| 12 | `20261001-sdd1412` | `ex-p2-accepted` | `fase_2_implementacion` | `p2_accepted` | `implementing` |
| 13 | `20261001-sdd1413` | `ex-p3-test-preparing` | `fase_3_verificacion` | `p3_test_preparing` | `testing` |
| 14 | `20261001-sdd1414` | `ex-p3-test-running` | `fase_3_verificacion` | `p3_test_running` | `testing` |
| 15 | `20261001-sdd1415` | `ex-p3-test-fixing` | `fase_3_verificacion` | `p3_test_fixing` | `testing` |
| 16 | `20261001-sdd1416` | `ex-p3-coverage-pending` | `fase_3_verificacion` | `p3_coverage_pending` | `testing` |
| 17 | `20261001-sdd1417` | `ex-p3-complete` | `fase_3_verificacion` | `p3_complete` | `testing` |
| 18 | `20261001-sdd1418` | `ex-p4-started` | `fase_4_documentacion` | `p4_started` | `documenting` |
| 19 | `20261001-sdd1419` | `ex-p4-documenting` | `fase_4_documentacion` | `p4_documenting` | `documenting` |
| 20 | `20261001-sdd1420` | `ex-p4-reviewing` | `fase_4_documentacion` | `p4_reviewing` | `documenting` |
| 21 | `20261001-sdd1421` | `ex-p4-revision-requested` | `fase_4_documentacion` | `p4_revision_requested` | `documenting` |
| 22 | `20261001-sdd1422` | `ex-p4-complete` | `fase_4_documentacion` | `p4_complete` | `documenting` |

Cada fichero vive en `taskReadme/<task_id>-<task_slug>.md` (p. ej.
`taskReadme/20261001-sdd1401-ex-p1-started.md`). El `status` de cada ejemplo MUST
ser exactamente el `status` de su fase en `binding.phases[]` (`planning` /
`implementing` / `testing` / `documenting`); cualquier otro emparejamiento es drift
y SHALL ser rechazado (en particular, `pending` + `p1_started` es inválido:
`pending` es `status.pre_bootstrap`, mientras `p1_started` exige `planning`).

### SPEC-01-B — 4 controles de acción (valores literales de `binding.controls[]`)

| # | task_id | slug | phase (value.phase) | state (value.state) | status (value.status) |
| --- | --- | --- | --- | --- | --- |
| 23 | `20261001-sdd1423` | `ex-branch-creation-pending` | `fase_1_propuesta` | `branch_creation_pending` | `planning` |
| 24 | `20261001-sdd1424` | `ex-final-commit-pending` | `fase_4_documentacion` | `final_commit_pending` | `documenting` |
| 25 | `20261001-sdd1425` | `ex-final-push-pending` | `fase_4_documentacion` | `final_push_pending` | `documenting` |
| 26 | `20261001-sdd1426` | `ex-final-pr-pending` | `fase_4_documentacion` | `final_pr_pending` | `documenting` |

Los 4 controles son `kind: "action"`, `writes_state: true`, `owner: "sdd-orchestrator"`.
Su `phase`/`state`/`status` MUST copiar literalmente `binding.controls[].value`;
el fichero de ejemplo MUST documentar además `kind`, `writes_state` y `owner` en el
cuerpo (no en frontmatter) para evitar confusión con states de fase.

### SPEC-01-C — 1 terminal `done` en forma única

| # | task_id | slug | phase | state | status |
| --- | --- | --- | --- | --- | --- |
| 27 | `20261001-sdd1427` | `ex-done` | `null` (YAML real) | `done` | `done` |

El ejemplo #27 MUST usar `{ phase: null, state: "done", status: "done" }` con
`phase: null` YAML real, nunca el string `"null"` entrecomillado. Es `kind:
"terminal"`, `writes_state: true`, `owner: "sdd-orchestrator"`, sin transiciones.

### SPEC-01-D — Slot 28: par blocked/failed con phase/state preservados

| # | task_id | slug | phase (preservada) | state (preservado) | status (outcome) |
| --- | --- | --- | --- | --- | --- |
| 28a | `20261001-sdd1428` | `ex-blocked-p2-code-review` | `fase_2_implementacion` | `p2_code_review` | `blocked` |
| 28b | `20261001-sdd1429` | `ex-failed-p3-test-running` | `fase_3_verificacion` | `p3_test_running` | `failed` |

`blocked` y `failed` son `kind: "outcome"`, `writes_state: false`,
`owner: "sdd-orchestrator"`, con `preserves: ["phase", "state"]`. El `status` del
frontmatter MUST ser `blocked` / `failed` (valores de `binding.status.writable`),
mientras `phase`/`state` MUST conservar el state de fase interrumpido. El slot 28
cuenta como **un slot didáctico** (el "par blocked/failed" del índice §2 y la
proposal § Scope-1); su materialización son **2 ficheros** (28a/28b). Conteo total:
28 slots numerados = 22 fase + 4 controles + 1 terminal + 1 par; ficheros
materializados = 29. Si `sdd-design` exige exactamente 28 ficheros, SHALL fusionar
retirando el duplicado que indique la tabla de deduplicación (ver SPEC-03), nunca
alterando los valores literales de esta tabla.

### Escenarios SPEC-01

- **Given** un ejemplo de la tabla SPEC-01-A **When** se lee su frontmatter
  **Then** `status` SHALL ser el `status` de su `phase` en `binding.phases[]` y
  `state` SHALL pertenecer a `phases[].states` de esa fase.
- **Given** un ejemplo de la tabla SPEC-01-B **When** se compara contra
  `binding.controls[]` **Then** `phase`/`state`/`status` SHALL ser idénticos a
  `controls[].value` del control correspondiente.
- **Given** el ejemplo #27 **When** se parsea el YAML **Then** `phase` SHALL ser
  `null` real (no string) y el triple SHALL ser `{ phase: null, state: "done",
  status: "done" }`.
- **Given** los ejemplos 28a/28b **When** se inspeccionan **Then** `status` SHALL
  ser `blocked` / `failed`, `phase`/`state` SHALL ser un state de fase válido y el
  cuerpo SHALL declarar `writes_state: false` + `preserves: ["phase", "state"]`.
- **Given** cualquiera de los 28 slots **When** se valida contra
  `binding.retired_aliases[]` **Then** ningún campo (`status`, `phase`, `state`,
  owner, lane) SHALL contener un alias retirado.

## SPEC-02 — Borrado legacy + huérfanos + incoherentes (REMOVED)

El borrado es el único cambio destructivo. `sdd-orchestrator` SHALL registrar
inventario (lista de paths + SHA) en el artifact `tasks` antes de borrar, y el
rollback SHALL ser `git checkout develop -- <paths>` ejecutado por el owner de
entrega. Solo `sdd-orchestrator` (WU-LEGACY-DEL, `apply_lane: none`) SHALL ejecutar
el borrado.

### SPEC-02-A — 7 legacy `2026-04-17-test-task-for-state-*` (ADDED como lista de borrado, REMOVED del repo)

Cada fichero usa aliases retirados como state/status (`branching`, `pushing`,
`ready_for_branch`, `verified`, …) y MUST ser eliminado:

1. `taskReadme/2026-04-17-test-task-for-state-done.md`
2. `taskReadme/2026-04-17-test-task-for-state-pushing.md`
3. `taskReadme/2026-04-17-test-task-for-state-blocked.md`
4. `taskReadme/2026-04-17-test-task-for-state-verified.md`
5. `taskReadme/2026-04-17-test-task-for-state-ready-for-branch.md`
6. `taskReadme/2026-04-17-test-task-for-state-branching.md`
7. `taskReadme/2026-04-17-test-task-for-state-failed.md`

### SPEC-02-B — Dir huérfano + incoherentes (REMOVED del repo con sus dirs `*/` asociados)

8. `taskReadme/20260728-ff24s9-pw-e2e-test-1785240291958/` (dir huérfano; observado:
   `verify-pwcli.md` + artifacts asociados — se elimina el dir completo).
9. `taskReadme/20260706-testtab-test-tab-funcional-colpruebas.md` (+ dir asociado si existe).
10. `taskReadme/20260825-bhbr8k-remediacion-compatibilidad-projectctl-entornos-docs-tests.md`
    + `taskReadme/20260825-bhbr8k-remediacion-compatibilidad-projectctl-entornos-docs-tests/`
    (17 artifacts observados: `proposal.md`, `spec.md`, `design.md`, `tasks.md`,
    `explore-code.md`, `verify-code.md`, `verify-units.md`, `apply-WU-*.md`).
11. `taskReadme/20260913-vn3n31-state-test-p1-started.md` (+ dir asociado si existe).

### Escenarios SPEC-02

- **Given** la lista SPEC-02-A/B registrada con SHA en el artifact `tasks`
  **When** `sdd-orchestrator` ejecuta WU-LEGACY-DEL **Then** ninguno de los paths
  SHALL existir en el árbol y `docs/app-map/**` SHALL tener 0 diffs.
- **Given** cualquier dir `taskReadme/<task_id>-<task_slug>/` cuyo índice haya sido
  borrado **When** termina WU-LEGACY-DEL **Then** el dir asociado tampoco SHALL existir
  (no quedan huérfanos).

## SPEC-03 — Recabecerado serie `20260727-p*` v8→v14 (MODIFIED)

Alcance: 22 ficheros de la serie con valores `phase`/`state` válidos pero cabecera
obsoleta v8 (observados en disco: `p1strt`, `p1xplor`, `p1draft`, `p1await`,
`p1revis`, `p1accpt`, `p2plan`, `p2impl`, `p2review`, `p2await`, `p2revis`,
`p2accpt`, `p3prep`, `p3run`, `p3fix`, `p3cover`, `p3done`, `p4start`, `p4doc`,
`p4review`, `p4revis`, `p4done` + demo `prpdemo`; los dirs `*/` con `proposal.md` /
`apply-*.md` observados en `p1strt`, `p1xplor`, `p1draft`, `p1await`, `p1revis`,
`p1accpt`, `p2impl`, `p4review` se conservan y NO se renombran).

### SPEC-03-A — Mapeo campo-a-campo v8→v14 (cada fichero de la serie SHALL aplicar todas las filas)

| Campo frontmatter | Valor v8 observado (antes) | Valor v14 exigido (después) |
| --- | --- | --- |
| `binding_version` | `"8.0.0"` | `"14.0.0"` |
| `binding_path` | `".agents/skills/projectctl-requirements/references/tareas.md"` (path fantasma retirado) | `".agents/skills/projectctl-sdd/references/tasks/binding.md"` |
| `sdd_persistence` | `"taskReadme index + phase artifacts"` | SIN CAMBIO (ya v14) |
| `phase_artifacts_dir` | `"taskReadme/<task_id>-<task_slug>/"` | SIN CAMBIO (verificar que coincide con el nombre real del fichero) |
| `binding_id` | `"projectctl-requirements.task-flow"` | SIN CAMBIO |
| `status` / `phase` / `state` | valores válidos preservados | SIN CAMBIO de valores (solo revalidados contra `binding.phases[]`; `status` = status de su fase) |
| `branch_name` | `null` | `"feature/<task_id>-<task_slug>"` (patrón `binding.delivery.branch_pattern`) |
| `pr_url` | `null` | `""` (vacío hasta delivery real, propiedad de `sdd-orchestrator`) |
| `blocked_reason` | `null` | `""` (vacío) |
| `error_message` | `null` (campo inexistente en plantilla v14) | REMOVED (eliminar la clave; no existe en `assets/task-template.md` v14) |
| Cuerpo — secciones | `## Purpose` / `## Expected` mínimos v8 | REESCRIBIR a las 9 secciones de la plantilla v14 con ownership `sdd-orchestrator` por `binding.task.heading_owners` (`1_objetivo`…`9_git_y_pr`) |
| Cuerpo — citas | sin bloque de origen | AÑADIR bloque de origen v14 (asset del binding v14.0.0, persistencia índice+artifacts, `mirrors: []`) |

### SPEC-03-B — Regla de deduplicación (los 28 nuevos mandan)

La serie recabecerada MUST NOT duplicar ningún `state` ya cubierto por los 28 slots
de SPEC-01 cuando el duplicado aporte el mismo `phase`/`state` (colisiones
conocidas: `p1_accepted`, `p4_reviewing` y cualquier otro solape detectado en fase 2
con dirs `*/` asociados). **Given** una colisión **When** `sdd-design` la confirma
**Then** la serie SHALL aportar solo states sin colisión o el fichero duplicado
SHALL retirarse (vía WU-LEGACY-DEL, con inventario previo), y la tabla de
deduplicación definitiva SHALL vivir en el artifact `design`.

### Escenarios SPEC-03

- **Given** un fichero de la serie **When** termina WU-SERIE-V14 **Then** su
  frontmatter SHALL ser byte-comparable en las claves normativas con la plantilla
  v14 y `binding_version` SHALL ser `"14.0.0"`.
- **Given** un fichero de la serie **When** se valida **Then** NO SHALL existir la
  clave `error_message` y `branch_name` SHALL seguir el patrón
  `feature/<task_id>-<task_slug>`.
- **Given** dos ficheros (uno SPEC-01, uno serie) con igual `phase`/`state`
  **When** se aplica la regla SPEC-03-B **Then** solo uno SHALL permanecer como
  ejemplo canónico y el otro SHALL estar inventariado como retirado.

## SPEC-04 — Migración del locator `.agents/sdd-workflow.json` + consumidores (MODIFIED)

`sdd-workflow.json` MUST conservarse en su path (NO se elimina: `binding.bootstrap_locator`
exige `candidate_cardinality: exactly_one` con accessor `workflow_binding_locator/v1`,
`binding.active_sources.include` lo lista, y `binding.md` §§ Machine/Source/Navigation
lo citan como locator canónico). Solo migración de contenido (WU-LOCATOR,
`sdd-orchestrator` + apply-doc).

### SPEC-04-A — Diff exigido del locator (antes → después)

| Clave | Antes (inválido, observado) | Después (v14 exigido) |
| --- | --- | --- |
| `binding_path` | `".agents/skills/projectctl-requirements/references/tasks/binding.md"` (fantasma, no existe) | `".agents/skills/projectctl-sdd/references/tasks/binding.md"` |
| `expected_binding_version` | `"10.0.0"` (inexistente) | `"14.0.0"` |
| `projections.state_model` | `".agents/skills/projectctl-requirements/generated/phase-state-schema.json"` (fantasma) | `".agents/skills/projectctl-sdd/generated/phase-state-schema.json"` (verificar/regenerar proyección en fase 2) |
| `projections.task_template` | `".agents/skills/projectctl-requirements/assets/task-template.md"` (fantasma) | `".agents/skills/projectctl-sdd/assets/task-template.md"` |
| `projections.client_view_model` | `"frontend/src/views/projectctl/data/tareas-tab.view-model.ts"` | SIN CAMBIO en esta spec (verificar existencia en fase 2; si no existe, `design` SHALL proponer tratamiento sin inventar accessor alternativo) |
| `projections.client_generated_ts` | `"frontend/src/shared/sdd/task-flow.generated.ts"` | SIN CAMBIO en esta spec (misma verificación que arriba) |
| `contract_version` / `machine_block_id` / `expected_binding_id` | `2` / `"task-flow-binding"` / `"projectctl-requirements.task-flow"` | SIN CAMBIO |

WU-LOCATOR SHALL incluir regeneración de `phase-state-schema.json` + check
(`taskflow:generate` y checks relacionados verdes) tras editar el locator; editar el
locator sin regenerar la proyección es drift y SHALL bloquear el cierre.

### SPEC-04-B — Consumidores que pinean v10/path fantasma (MODIFIED, solo citas, nunca catálogos)

1. `.atl/skill-registry.md` — la fila `projectctl-requirements/tareas` SHALL apuntar
   al path del satélite SDD (`.agents/skills/projectctl-sdd/references/tasks/binding.md`)
   y a la versión `14.0.0`.
2. `docs/04-process/task.md` — los pins `v10.0.0` SHALL pasar a `v14.0.0` y el path
   fantasma SHALL pasar al path SDD; el doc SHALL enlazar al binding y explicar uso,
   sin publicar su propia lista de fases/estados/lanes/gates.
3. `AGENTS.md` — SOLO SI pinea versión: actualizar a `14.0.0`; si no pinea versión,
   NO tocar.

### Escenarios SPEC-04

- **Given** el locator migrado **When** el resolver lo consume **Then**
  `binding_path` SHALL existir en disco, `expected_binding_version` SHALL ser
  `"14.0.0"` y ambas proyecciones SDD SHALL existir.
- **Given** los 3 consumidores **When** termina WU-LOCATOR **Then** ninguno SHALL
  contener `10.0.0` ni el path fantasma `projectctl-requirements/references/tasks/binding.md`.
- **Given** una propuesta de eliminar `.agents/sdd-workflow.json` **When** se evalúa
  contra el binding v14 **Then** SHALL ser rechazada salvo que el resolver portable
  documente un accessor alternativo versionado/auditable (hoy no existe tal evidencia).

## SPEC-05 — Escenarios de verificación documental (verificación = revisión, sin comandos)

La verificación de esta tarea es documental (`sdd-verify-code` sobre diffs de docs si
el orchestrator lo exige). Ninguna lane de esta tarea SHALL ejecutar `projectctl`,
`git`, tests, builds ni browser/runtime; los gates de cobertura contractual
(`bun run test:check`, `// @ac` en tests nuevos) aplican al repo, pero esta tarea no
crea tests nuevos (los 28 ejemplos no son evidencia de cobertura).

- **Given** cualquier frontmatter creado o recabecerado **When** se valida **Then**
  SHALL parsear como YAML válido, `status` SHALL pertenecer a `binding.status.writable`
  (8 valores: `pending`, `planning`, `implementing`, `testing`, `documenting`, `done`,
  `blocked`, `failed`) y `phase`/`state` SHALL resolverse desde `binding.phases[]` /
  `binding.controls[]`.
- **Given** cualquier artifact de la tarea **When** se inspecciona **Then** NO SHALL
  contener ningún valor de `binding.retired_aliases[]` como `status`, `phase`,
  `state`, owner o lane.
- **Given** el ejemplo terminal **When** se parsea **Then** `phase` SHALL ser `null`
  real (el string `"null"` SHALL ser rechazado como drift).
- **Given** cualquier ejemplo de fase **When** se cruza con `binding.phases[]`
  **Then** `status` SHALL ser exactamente el status de su fase.
- **Given** el índice activo **When** se mide **Then** SHALL respetar
  `binding.artifact_store.primary.index_budget` (`max_lines: 400`,
  `max_phase_summary_lines: 10`).
- **Given** la persistencia de la tarea **When** se audita **Then** la única SoT SHALL
  ser índice + phase artifacts (`taskReadme/<task_id>-<task_slug>.md` +
  `taskReadme/<task_id>-<task_slug>/<artifact>.md`), `mirrors` SHALL ser `[]` y
  ninguna herramienta opcional (incluida memoria Engram) SHALL figurar como
  evidencia ni fuente de verdad.
- **Given** `docs/app-map/**` **When** termina cualquier WU **Then** el diff SHALL
  ser 0 (solo lectura en esta tarea).

## SPEC-06 — Reglas compactas de persistencia, superficies y testing

- **Persistencia (única SoT)**: el índice compacto de coordinación + los phase
  artifacts referenciados (`proposal`, `spec`, `design`, `tasks`, `apply-<unit_id>`,
  `verify-*`, `archive`) son la fuente canónica y suficiente de persistencia y
  recuperación. `sdd-spec` escribe ÚNICAMENTE el artifact `spec`; el índice lo escribe
  únicamente `sdd-orchestrator` (single writer). Las lanes NUNCA inlinan el detalle
  en el índice: devuelven `summary` + `artifact_ref` y el orchestrator copia el resumen.
- **Superficies prohibidas**: `proposals/**`, `specs/**`, `designs/**`, `tasks/**`,
  `openspec/**`, `.agents/skills/projectctl-requirements/references/tareas.md` y
  `.agents/skills/sdd-tasks/tasks.md` están en `binding.active_sources.exclude`; esta
  tarea MUST NOT crear ni escribir en ninguna de ellas. Tampoco SHALL tocar mirrors
  (`mirrors: []`).
- **Testing**: estándar Bun (`bun test`, `bun run test:check` como gate contractual,
  runner `bun run scripts/test-runner.ts`); todo test nuevo declara `// @ac <ID>` en
  las primeras 10 líneas. Esta tarea no crea tests nuevos (ver SPEC-05); si fase 3+
  detecta necesidad de tests, SHALL abrirse circuito con proposal que los autorice.
- **Excluidos de commit**: `.env`, `.env.dev`, `.runtime/`, `frontend/test-results/`
  MUST NOT commitarse (firma ambiente commitada: `.env.example`). No commitar
  secretos ni tokens. Todos los paths tocados por esta spec (taskReadme, locator,
  proyección generada, `.atl/skill-registry.md`, `docs/04-process/task.md`,
  `AGENTS.md` si aplica) son commitables; si aparece un path generado inesperado, se
  SHALL reportar a `sdd-orchestrator` (sin `force-add`).
- **Delivery**: rama feature `feature/20261001-sdd14-regen-taskreadme-binding-v14`
  desde `develop` + PR único (propiedad de `sdd-orchestrator`; rama aún no creada →
  bloqueado hasta `branch_creation_pending`). Cierre solo en forma terminal única
  `{ phase: null, state: "done", status: "done" }` con gates
  `pending_environment_close_block` y `requirements_current_close_block` verdes.
