# Verify-units — 20261001-sdd14-regen-taskreadme-binding-v14

- **Lane**: `sdd-verify-units` (run/review/report-only; sin creación ni edición de tests, sin cambios de producto, sin commit)
- **Task**: `20261001-sdd14-regen-taskreadme-binding-v14` · cambio mecánico-documental, sin código nuevo
- **Fecha (UTC)**: 2026-10-01 (re-verificación tras fix compliance test a v14)
- **unit_result**: `passed` (suite unit home 14/14 en verde; fix v14 de `projectctl-compliance.test.ts` confirmado read-only)
- **artifact_ref**: `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/verify-units.md` (este fichero; única escritura de la lane)
- **task_section_written**: `### Unit tests` (ver §6 de este artefacto; `sdd-orchestrator` consolida en el índice §6)

## 1. Comandos ejecutados (exactos + exit codes)

| # | Comando | Exit | Resultado |
| --- | --- | --- | --- |
| 1 | `bun test tests/unit/home/` | `0` | `14 pass, 0 fail, 97 expect() calls, 14 tests across 4 files` |
| 2 | `bun scripts/taskflow.ts --check` | `0` | `✅ taskflow:check passed; generated projections are intact` |
| 3 | `bun scripts/sdd-doctor.ts` | `0` | `✅ SDD static doctor passed (home-only profile).` |
| 4 | `bun run test:check` (`bun run scripts/test-runner.ts check`) | `0` | `test:check OK: no implemented criterion missing Unit+PW-AUTO coverage` |
| 5 | `bun test tests/unit/home/index.test.ts tests/unit/home/status-summary.test.ts tests/unit/home/runtime-metadata.test.ts` | `0` | `9 pass, 0 fail, 24 expect() calls, 9 tests across 3 files` (subconjunto de control, resto unit verde) |

## 2. Fallos previos remediados (evidencia read-only del fix)

Veredicto anterior (`failed`): 2 aserciones obsoletas en `tests/unit/home/projectctl-compliance.test.ts` (`// @ac HOME-01 HOME-05 HSS-01 HSS-02 HSS-03 HSS-04 HRM-01 HRM-02`), pineadas a binding v10.

Re-verificación confirma el fix aplicado por `sdd-apply-unit-tests` (esta lane NO tocó el fichero; solo lectura):

1. `keeps the seven core folders and only justified conditional folders` → ahora lee `.agents/skills/projectctl-requirements/references/estructura/reglas.md` (línea 45) y aserta `baseline de estructura 7+3` + fila `backend/src/` → PASS.
2. `pins the workflow locator to the v14 binding and preserves its machine block` → ahora espera `binding_path=.agents/skills/projectctl-sdd/references/tasks/binding.md`, `expected_binding_version=14.0.0`, `contract_kind=TaskFlowBindingV2`, `binding_version=14.0.0`, `writable` contiene `testing` y NO `verified`, lanes `sdd-apply-unit-tests` + `sdd-apply-pwauto-tests`, `active_sources.include` contiene `.agents/sdd-workflow.json` (líneas 52-78) → PASS.
3. Resto de la suite (`index.test.ts`, `status-summary.test.ts`, `runtime-metadata.test.ts` + `compliance` casos `skill registry`, `compose ports`, `projectctl commands`) → 14/14 PASS, 0 FAIL.

## 3. Coverage mapping

- Las work units de la tarea (`WU-LEGACY-DEL`, `WU-SERIE-V14`, `WU-EXAMPLES-28`, `WU-LOCATOR`) son mecánico-documentales con `criterion_ids: []` + `scenario_ids: []`: **ninguna unidad implementa un criterio**, luego `not_required` en cobertura unit nueva.
- Cobertura existente verificada read-only: `tests/unit/home/` 4 ficheros → 14/14 pass (incluido `projectctl-compliance.test.ts` ya migrado a v14).
- Gate contractual `test:check` → OK (ningún criterio implementado sin cobertura Unit+PW-AUTO).

## 4. Veredicto y routing

- **Veredicto**: `passed` (sin fallos; sin gaps de cobertura atribuibles a esta tarea).
- **Routing**: ninguno — no se requiere `sdd-apply-unit-tests` (fix v14 ya aplicado y verificado) ni `sdd-apply-code-{low,medium,high}` (sin defecto de producto observado).
- **Ejemplos `.md`**: inocuos para tests (ningún test importa `taskReadme`; veredicto previo §comando 7 se mantiene como evidencia, no re-ejecutado por ser read-only de búsqueda ya establecida).

## 5. Límites respetados

- Solo lectura de evidencia canónica + ejecución de comandos Bun del scope (`bun test tests/unit/home/`, `bun scripts/taskflow.ts --check`, `bun scripts/sdd-doctor.ts`, `bun run test:check`) + escritura de este phase artifact.
- Prohibido y NO ejecutado: crear/editar tests, fixes de producto, comandos Git/GitHub, Docker/runtime/projectctl, browser/`playwright-cli`, runners E2E persistentes, builds, gestores distintos de Bun, suites amplias no relacionadas, escritura en filas apply u otras secciones, escritura del índice (single-writer `sdd-orchestrator`), commit.

## 6. `### Unit tests` (sección para consolidación del orchestrator)

`unit_result: passed` — `bun test tests/unit/home/` 14 pass / 0 fail (97 expects, 4 files); `taskflow:check` (exit 0), `sdd-doctor` (exit 0) y `test:check` (exit 0) verdes; fix v14 de `projectctl-compliance.test.ts` (locator `projectctl-sdd/...`, `expected_binding_version` `14.0.0`, ruta `estructura/reglas.md`) confirmado read-only; sin routing. Detalle: `taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/verify-units.md`.

## 7. Summary (coordinación, para `sdd-orchestrator`)

`[sdd-verify-units] unit_result=passed | bun test unit=14pass/0fail, taskflow:check=0, sdd-doctor=0, test:check=0 | compliance v14 fix confirmado read-only | sin routing | artifact_ref=taskReadme/20261001-sdd14-regen-taskreadme-binding-v14/verify-units.md | sin cambios de código, sin commit`
