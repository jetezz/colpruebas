# Verify units — 20261001-cumreq-cumplimiento-requisitos-index (WU3)

- Tarea: `20261001-cumreq-cumplimiento-requisitos-index` · binding `projectctl-requirements.task-flow` v15.0.0 (`TaskFlowBindingV2`).
- Lane: `sdd-verify-units` (solo ejecución/revisión/reporte; sin crear ni editar tests, sin tocar código producto).
- Unidad bajo verificación: `WU3-unit-red` (`apply_lane: unit-tests`, estado apply `done`) — fichero owned `tests/unit/home/runtime-metadata.test.ts` (`// @ac HRM-01, HRM-02, HSS-04` en línea 1, OK ≤10).
- Spec vinculada: SC-S4-rama-real, SC-S4-rama-fallback, SC-S4-cero-main, SC-S4-timestamp-ssr (`tasks.md` §5, routing tag `unit_test_issue`).

## ### Unit tests

**Veredicto lane: `passed` (re-run tras fix `unit_test_issue`; sin routing — verde).**

Comandos ejecutados (2026-10-01, re-run post-fix):

| Comando | Resultado |
|---|---|
| `bun run scripts/test-runner.ts run --method=unit --target=home` | VERDE (exit 0) |
| `bun test tests/unit/home/` (alcance home completo) | 16 pass / 0 fail (16 tests, 4 ficheros, 104 expects) |
| `bun test tests/unit/home/runtime-metadata.test.ts tests/unit/home/index.test.ts tests/unit/home/projectctl-compliance.test.ts` (3 ficheros fix) | 11 pass / 0 fail (93 expects) |
| `bun run test:check` (gate TST-13) | VERDE — `test:check OK: no implemented criterion missing Unit+PW-AUTO coverage` |

Detalle por fichero (home, 4 ficheros):

| Fichero | Tests | Estado | Evidencia |
|---|---|---|---|
| `tests/unit/home/runtime-metadata.test.ts` (WU3, `// @ac HRM-01, HRM-02, HSS-04`) | 4 | 4 pass | rama real `PUBLIC_GIT_BRANCH` + fallback `develop` + `Rama Git:` OK; cero `MAIN` OK; `not.toMatch(/console\.error\s*\(/)` en `:34` ya no casa el comentario `index.astro:26`, solo llamada real (ausente → pass); timestamp ISO 8601 OK |
| `tests/unit/home/index.test.ts` (`// @ac HOME-01, HOME-05`) | 2 | 2 pass | `not.toMatch(/console\.error\s*\(/)` en `:22` verde con el mismo remedio; sin `window.`/`document.` OK |
| `tests/unit/home/projectctl-compliance.test.ts` | 5 | 5 pass | locator `expected_binding_version '15.0.0'` + bloque máquina `TaskFlowBindingV2` v15 + `active_sources` include/exclude OK; estructura 7+3, registry, puertos, comandos OK |
| `tests/unit/home/status-summary.test.ts` | 5 | 5 pass | colateral verde (16 − 11 = 5), sin regresión |

Fix verificado: `runtime-metadata.test.ts:34` + `index.test.ts:22` estrechados a `/console\.error\s*\(/` (el comentario `index.astro:26` ya no matchea, la llamada real sí matchearía); `projectctl-compliance.test.ts` alineado a binding v15 (15.0.0 + `active_sources` sin locator). Código producto intacto y correcto (única mención `console.error` sigue siendo el comentario protector de `index.astro:26`; `catch` SSR silencioso con fallback estático).

Coverage mapping (criterios → tests):

- HRM-01 (rama real/fallback + cero MAIN): cubierto y verde por `runtime-metadata.test.ts` (4/4).
- HRM-02 (timestamp ISO): cubierto y verde.
- HSS-04 (`Rama Git:`): cubierto y verde.
- HOME-01 / HOME-05 + compliance estructural: cubiertos y verdes (`index.test.ts`, `projectctl-compliance.test.ts`, `status-summary.test.ts`).
- Gate TST-13 (`test:check`): verde — sin criterio implementado sin cobertura Unit+PW-AUTO.

No se creó ni editó ningún fichero de test ni de producto en esta lane (prohibido por contrato). No se escribe el índice (single writer: `sdd-orchestrator`).
