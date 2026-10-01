# Apply evidence — WU-SERIE-V14

- **Unit**: `WU-SERIE-V14` · **apply_lane**: `doc` · **Lane**: `sdd-apply-doc`
- **Task**: `20261001-sdd14-regen-taskreadme-binding-v14` · binding `projectctl-requirements.task-flow` v14.0.0
- **Status devuelto**: `done`
- **Artifact**: `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/apply-WU-SERIE-V14.md` (este fichero)

## Objetivo

Recabecerar 22 ficheros `taskReadme/20260727-p*.md` de v8 a plantilla v14, sin renombrar paths ni dirs `*/`, preservando `status`/`phase`/`state`.

## Ficheros modificados (22: frontmatter en todos; cuerpo normalizado en `p1draft`, receipt + comillas en `p1await`)

`20260727-p1strt-state-p1-started.md`, `20260727-p1xplor-state-p1-exploring.md`,
`20260727-p1draft-state-p1-drafting.md`, `20260727-p1await-state-p1-awaiting-acceptance.md`,
`20260727-p1revis-state-p1-revision-requested.md`, `20260727-p1accpt-state-p1-accepted.md`,
`20260727-p2plan-state-p2-planning.md`, `20260727-p2impl-state-p2-implementing.md`,
`20260727-p2review-state-p2-code-review.md`, `20260727-p2await-state-p2-awaiting-acceptance.md`,
`20260727-p2revis-state-p2-revision-requested.md`, `20260727-p2accpt-state-p2-accepted.md`,
`20260727-p3prep-state-p3-test-preparing.md`, `20260727-p3run-state-p3-test-running.md`,
`20260727-p3fix-state-p3-test-fixing.md`, `20260727-p3cover-state-p3-coverage-pending.md`,
`20260727-p3done-state-p3-complete.md`, `20260727-p4start-state-p4-started.md`,
`20260727-p4doc-state-p4-documenting.md`, `20260727-p4review-state-p4-reviewing.md`,
`20260727-p4revis-state-p4-revision-requested.md`, `20260727-p4done-state-p4-complete.md`.

## Mutación aplicada por fichero

- `binding_version`: `"8.0.0"` → `"14.0.0"`.
- `binding_path`: path fantasma `…/projectctl-requirements/references/tareas.md` → `.agents/skills/projectctl-sdd/references/tasks/binding.md`.
- `branch_name`: `null` → `"feature/<task_id>-<task_slug>"` (patrón `binding.delivery.branch_pattern`).
- `pr_url`: `null` → `""`.
- `blocked_reason`: `null` → `""`.
- REMOVED `error_message` (clave inexistente en plantilla v14).
- REMOVED `proposal_authored_at`/`proposal_lane`/`proposal_topic_key`/`proposal_state` en `p1draft` (claves fuera de plantilla).
- `sdd_change_id: null` → `""` en `p1await` (único fichero con null).
- Preservados: `title`, `task_id`, `task_slug`, `sdd_change_id`, `status`/`phase`/`state`, `priority`, `type`, `area`, `created`/`updated`, `source_branch`/`target_branch`, validaciones, `docs_impact`. Cuerpos de los otros 20 ficheros byte-idénticos (frontmatter-only).
- Fix F-01 (verify-code) — `20260727-p1draft-state-p1-drafting.md`: cuerpo reescrito a las 9 secciones de la plantilla v14 con ownership `sdd-orchestrator` por `binding.task.heading_owners` + bloque de origen v14 (`mirrors: []`); eliminadas la cita al binding v8/path fantasma, las menciones a Engram como evidencia SDD y la descripción de claves `proposal_*` ya removidas del frontmatter. Valores `phase`/`state`/`status` (`fase_1_propuesta`/`p1_drafting`/`planning`) sin cambio.
- Fix F-01 (verify-code) — `20260727-p1await-state-p1-awaiting-acceptance.md`: receipt `approved_revision` actualizado de `projectctl-requirements.task-flow@10.0.0` a `@14.0.0` con path SDD (`.agents/skills/projectctl-sdd/references/tasks/binding.md`).
- Fix F-03 (verify-code) — `20260727-p1await-state-p1-awaiting-acceptance.md`: frontmatter normalizado a estilo citado de plantilla (claves normativas entrecomilladas; valores `status`/`phase`/`state` sin cambio).
- Barrido serie 22: 0 menciones en cuerpos al path fantasma / `tareas.md` / pins v8/v10 residuales / Engram como evidencia.

## Spec/design criteria satisfechos

- SPEC-03-A (mapeo campo-a-campo, incluido cuerpo a 9 secciones v14 + bloque de origen) + SPEC-05 (YAML válido, `status ∈ writable`, `status` = status de fase, 0 `retired_aliases`).
- Verificado por lectura: 22/22 con `binding_version 14.0.0`; 0 `error_message` en la serie; 0 aliases retirados como `status`/`state`; 0 citas al path fantasma / `tareas.md` / pins v8/v10 en cuerpos de la serie.

## Documentación actualizada (para reflejo del orchestrator en índice §4/§5)

Serie `20260727-p*` migrada a cabecera v14; lista para deduplicación AD-03 contra los 28 nuevos (decisión y borrado: owner `sdd-orchestrator`, WU-LEGACY-DEL).

## Desviaciones (`none` salvo las declaradas)

1. **Cuerpos: desviación original RESUELTA por fix F-01/F-03 de verify-code** (esta revisión): `p1draft` reescrito a 9 secciones v14 + bloque origen (único cuerpo de la serie que contenía las 2 citas al path fantasma / Engram-evidencia / `proposal_*`); `p1await` con receipt a `@14.0.0` + comillas de plantilla. Los otros 20 cuerpos ya eran mínimos v8-compatibles sin drift (`## Purpose`/`## Expected` sin citas fantasma) y quedan intactos. Barrido final de la serie: 0 drift de cuerpo.
2. **`20260727-prpdemo-*` NO tocado** (pregunta QQ6/design §9): queda en v8 con `error_message` y path fantasma. Decisión pendiente del orchestrator (SERIE-V14 vs LEGACY-DEL). Barridos futuros de `retired_aliases`/v8 deben excluirlo o resolver QQ6.

## Follow-up no resuelto

- QQ6 (`prpdemo`): pendiente de veredicto en `tasks.md` §9 por `sdd-orchestrator`.
- Tabla de deduplicación AD-03: colisiones `p1_accepted`/`p4_reviewing` serie-vs-nuevos pendientes de retiro vía WU-LEGACY-DEL (owner orchestrator).

## Summary

Recabecerados los 22 ficheros de la serie `20260727-p*` a frontmatter v14 (versión, path SDD, branch patrón, vacíos normalizados, claves intrusas eliminadas), con valores `status`/`phase`/`state` preservados; más fix F-01/F-03 de verify-code (`p1draft` a 9 secciones v14, `p1await` receipt `@14.0.0` + comillas, barrido serie a 0 drift). `prpdemo` excluido a la espera de QQ6.
