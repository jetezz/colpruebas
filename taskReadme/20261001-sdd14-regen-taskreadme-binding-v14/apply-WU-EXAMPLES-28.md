# Apply evidence — WU-EXAMPLES-28

- **Unit**: `WU-EXAMPLES-28` · **apply_lane**: `doc` · **Lane**: `sdd-apply-doc`
- **Task**: `20261001-sdd14-regen-taskreadme-binding-v14` · binding `projectctl-requirements.task-flow` v14.0.0
- **Status devuelto**: `done`
- **Artifact**: `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/apply-WU-EXAMPLES-28.md` (este fichero)

## Objetivo

Crear 29 ficheros canónicos v14 (`slots: 28, files: 29`, decisión SEPARAR AD-02) con convención `20261001-sdd14XX/ex-*` (AD-01).

## Ficheros creados (29)

- Fase (22): `20261001-sdd1401-ex-p1-started.md` … `20261001-sdd1406-ex-p1-accepted.md` (p1/`planning`) · `20261001-sdd1407-ex-p2-planning.md` … `20261001-sdd1412-ex-p2-accepted.md` (p2/`implementing`) · `20261001-sdd1413-ex-p3-test-preparing.md` … `20261001-sdd1417-ex-p3-complete.md` (p3/`testing`) · `20261001-sdd1418-ex-p4-started.md` … `20261001-sdd1422-ex-p4-complete.md` (p4/`documenting`).
- Controles acción (4): `20261001-sdd1423-ex-branch-creation-pending.md` (`fase_1_propuesta`/`planning`) · `20261001-sdd1424-ex-final-commit-pending.md`, `20261001-sdd1425-ex-final-push-pending.md`, `20261001-sdd1426-ex-final-pr-pending.md` (`fase_4_documentacion`/`documenting`). Valores literales de `binding.controls[].value`; `kind: "action"`, `writes_state: true`, `owner` documentados en cuerpo.
- Terminal (1): `20261001-sdd1427-ex-done.md` con `phase: null` YAML real (sin comillas), `{ phase: null, state: "done", status: "done" }`; `kind: "terminal"`, `writes_state: true` en cuerpo.
- Outcomes (2): `20261001-sdd1428-ex-blocked-p2-code-review.md` (`blocked`, preserva `fase_2_implementacion`/`p2_code_review`) · `20261001-sdd1429-ex-failed-p3-test-running.md` (`failed`, preserva `fase_3_verificacion`/`p3_test_running`). `writes_state: false`, `preserves: ["phase","state"]` en cuerpo.

## Spec/design criteria satisfechos

- SPEC-01-A (status = status de fase, 22), SPEC-01-B (controles literales, 4), SPEC-01-C (terminal null real, #27), SPEC-01-D (par blocked/failed con phase/state, 28a/28b), SPEC-05 (YAML, writable, 0 retired, index_budget n/a, mirrors `[]`).
- Verificado por lectura: 29/29 con `binding_version 14.0.0` + path SDD + `branch_name feature/…` + `pr_url ""` + sin `error_message`; coherencia `task_id`/`slug`/fichero/`phase_artifacts_dir`; 9 secciones con ownership en cada cuerpo; 0 `retired_aliases`; `slots: 28, files: 29`.

## Documentación actualizada (para reflejo del orchestrator en índice §4/§5)

28 slots / 29 ficheros canónicos v14 creados; cobertura 1:1 con `binding.phases[]` + `binding.controls[]` + `status.writable` (8 valores).

## Desviaciones

- `none`. Convención AD-01 y snippets §5.1/§5.2/§5.3 aplicados literalmente (incluido `blocked_reason` didáctico en 28a/28b).

## Follow-up no resuelto

- `none` en esta WU. Nota: los nuevos `sdd1406` (`p1_accepted`) y `sdd1420` (`p4_reviewing`) colisionan en `phase`/`state` con la serie recabecerada (AD-03: mandan los nuevos; retiro de serie vía WU-LEGACY-DEL por el orchestrator).

## Summary

Creados y verificados los 29 ficheros de ejemplo canónicos v14 (22 fase + 4 controles + terminal done con null real + par blocked/failed con phase/state preservados), con frontmatter plantilla v14 válida, sin aliases retirados y status por fase.
