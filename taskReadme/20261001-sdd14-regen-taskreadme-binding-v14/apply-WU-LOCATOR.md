# Apply evidence — WU-LOCATOR

- **Unit**: `WU-LOCATOR` · **apply_lane**: `doc` · **Lane**: `sdd-apply-doc` (+ `sdd-orchestrator` como co-owner del locator)
- **Task**: `20261001-sdd14-regen-taskreadme-binding-v14` · binding `projectctl-requirements.task-flow` v14.0.0
- **Status devuelto**: `done`
- **Artifact**: `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/apply-WU-LOCATOR.md` (este fichero)

## Objetivo

Migrar el locator a v14 + actualizar los 3 consumidores, sin eliminar el locator.

## Ficheros modificados (5, uno verificado-sin-cambio)

1. `.agents/sdd-workflow.json` (mismo path, solo contenido; diff exacto design §5.4): `binding_path` → `.agents/skills/projectctl-sdd/references/tasks/binding.md`; `expected_binding_version` → `"14.0.0"`; `projections.state_model` → `.agents/skills/projectctl-sdd/generated/phase-state-schema.json`; `projections.task_template` → `.agents/skills/projectctl-sdd/assets/task-template.md`. `contract_version`/`machine_block_id`/`expected_binding_id` y proyecciones cliente sin cambio.
2. `.agents/skills/projectctl-sdd/generated/phase-state-schema.json`: SIN reescritura — ya declara `source.binding_version 14.0.0` + `source_path` SDD (verificado). `bun scripts/taskflow.ts --generate` es no-op documentado en este repo (`taskflow:generate requires the canonical task-flow-binding source; no source is installed in this home-only repo`), luego no hay regeneración disponible ni drift que corregir.
3. `.atl/skill-registry.md`: fila `projectctl-requirements/tareas` → satélite SDD (path actualizado, versión implícita por path canónico v14).
4. `docs/04-process/task.md`: `v10.0.0` → `v14.0.0` (todas) + path fantasma → path SDD (todas). Sin catálogos propios (solo enlaza el bloque).
5. `AGENTS.md` (condicional CONFIRMADO: pineaba v10 en 4 puntos): bloque SoT (versión + path), §1 (`binding v14.0.0`), §2 (`status.writable` v14.0.0), §5 (`task-flow-binding` v14.0.0).

## Spec/design criteria satisfechos

- SPEC-04-A (diff locator + proyección coherente; generate no disponible documentado como no-op, no como fallo).
- SPEC-04-B (0 `10.0.0` y 0 path fantasma en los 3 consumidores + AGENTS.md; verificado por barrido).
- SPEC-04 no-eliminación: `.agents/sdd-workflow.json` conservado en su path.
- SPEC-05/06: `docs/app-map/**` 0 diffs; sin secretos; paths commitables; sin `force-add`.

## Extracción del bloque machine (verificación)

Bloque `task-flow-binding` (`TaskFlowBindingV2`) extraído de `.agents/skills/projectctl-sdd/references/tasks/binding.md` (marcadores `<!-- task-flow-binding:start/end -->`, `binding_version 14.0.0`): 4 fases con 6+6+5+5 states y statuses `planning`/`implementing`/`testing`/`documenting`; 7 controles (`branch_creation_pending`, `final_commit_pending`, `final_push_pending`, `final_pr_pending`, `done`, `blocked`, `failed`); `status.writable` de 8 valores; 34 `retired_aliases`. Los 29 ejemplos y la serie recabecerada se validaron contra este bloque.

## Documentación actualizada (para reflejo del orchestrator en índice §4/§5)

Locator resuelve binding v14 (path existente, expected `14.0.0`, proyecciones SDD existentes incluyendo las 2 de cliente verificadas en disco); consumidores sin pins v10/fantasma.

## Desviaciones

- `none` de contenido. Nota operativa: la "regeneración de proyección" del contrato se resolvió como verificación (proyección ya vigente + generador no-op en este repo); si el orchestrator dispone de un generador canónico externo, puede re-ejecutarlo sin cambios esperados (`source_sha256` ya apunta al binding SDD).

## Follow-up no resuelto

- `none`. `taskflow --check` / `sdd-doctor` / `docs-lint` post-migración: propiedad de verify lanes / orchestrator (esta lane no ejecuta comandos de verificación).

## Summary

Locator migrado a binding SDD v14.0.0 con proyecciones SDD existentes y coherentes (regeneración no aplicable: generador no-op + schema ya vigente), y 3 consumidores + `AGENTS.md` actualizados a v14/path SDD con 0 restos v10/fantasma. `docs/app-map/**` intacto.
