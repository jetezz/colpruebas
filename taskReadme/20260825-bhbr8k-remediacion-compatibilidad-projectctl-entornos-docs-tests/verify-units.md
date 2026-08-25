# VERIFY-UNITS — Evidencia de verificación de unit tests (AC-003 / AC-004)

> Lane: `sdd-verify-units` · Unit: `WU-VER-UNITS` · apply_lane: `none` (deferred fase 3)
> Objetivo: ejecutar/revisar/reportar la suite unit de fase 3 (WU-TST-2) y el gate de
> cobertura (WU-TST-1 verify-expects runtime) — run/review/report-ONLY.
> Verdict: **`failed`** (1 aserción incorrecta en `sot-coherence.test.ts`) + **`blocked`**
> (runner `run --method=unit` inejecutable por `tests/back/endpoints.test.ts` sin header
> `// @ac` → persist/write-back no ejercitable). Routing: `sdd-apply-unit-tests`.
> Estándar inyectado: `projectctl-requirements` v10.0.0 / binding `task-flow-binding` v9.0.0.
> Framework: `bun test` · Skill resolution: `injected-paths` (8 skill files cargados).

---

## 1. Verify authorization gate (sdd-verify-common §Verify Authorization Gate)

| Check | Resultado | Evidencia |
| --- | --- | --- |
| Lane en `lane_context.registry` + `allowed_lanes` fase 3 | PASS | `sdd-verify-units` ∈ registry; fase 3 allowed_lanes incluye `sdd-verify-units`. |
| Work-unit portador de los 4 campos obligatorios | PASS | WU-TST-1 (`apply-WU-TST-1.md` §1 gate: Spec linkage / Implementation target / Verification target / Failure routing `code_issue`) y WU-TST-2 (`apply-WU-TST-2.md` §1: Spec linkage REQ-TST-006/007+TSK-004 / Implementation target / Verify expects / Failure routing `unit_test_issue`). |
| Lane es run/review/report-only | PASS | Solo se ejecutaron los comandos Bun del scope inyectado; NO se crearon/editaron archivos de test ni producto; no git/gh/docker/projectctl/browser; no índice. |
| `artifact_context.mirrors: []` → `write_order: ["primary"]` | OK | Sin mirrors; esta lane escribe SOLO su phase artifact `verify-units.md` (index-primary variant, §F.5). |

---

## 2. Comandos ejecutados (exactos, scope inyectado)

### 2.1 `bun test frontend/__tests__/projectctl-bundle.test.ts frontend/__tests__/projectctl-requirements.sot-coherence.test.ts`

```text
$ bun test frontend/__tests__/projectctl-bundle.test.ts frontend/__tests__/projectctl-requirements.sot-coherence.test.ts
bun test v1.3.12 (700fc117)
frontend/__tests__/projectctl-requirements.sot-coherence.test.ts: 10 pass, 1 fail
frontend/__tests__/projectctl-bundle.test.ts: 9 pass
 19 pass
 1 fail
 305 expect() calls
Ran 20 tests across 2 files. [42.00ms]
EXIT=1
```

**Único fallo (determinista, presente en ambas corridas):**

```text
(fail) ... > generated client projection STATUS_WRITABLE excludes retired aliases
frontend/__tests__/projectctl-requirements.sot-coherence.test.ts:169
  expect(generatedTsRaw ?? '').not.toMatch(new RegExp(`^\\s*'${alias}',?$`, 'm'));
error: expect(received).not.toMatch(expected)
Expected substring or pattern: not /^\s*'branching',?$/m
```

**Diagnóstico (evidencia read-only)**: la aserción L165-171 aplica el regex
`/^\s*'<alias>',?$/m` sobre **TODO el archivo generado**
`frontend/src/shared/sdd/task-flow.generated.ts`. Ese archivo declara legítimamente
`export const RETIRED_ALIASES = ['ready_for_branch', 'branching', 'pushing', 'verified', ...]`
(L263-267, derivado correcto del binding) — el regex colisiona con esa declaración. La
intención del test (STATUS_WRITABLE sin aliases retirados) es correcta y de hecho la
aserción hermana L157-163 (`retired status aliases are never declared as writable status`
sobre `binding.status.writable`) **pasa**. El defecto es del TEST (búsqueda whole-file),
no del producto: `STATUS_WRITABLE` real = `['pending','planning','implementing','testing',
'documenting','done','blocked','failed']` (sin aliases retirados). Fix sugerido: acotar el
regex al bloque STATUS_WRITABLE (ej. extraer el array entre `STATUS_WRITABLE` y `] as const;`).

### 2.2 `bun test frontend/__tests__/` (todos los frontend __tests__ — sin regresiones)

```text
$ bun test frontend/__tests__/
 23 pass
 1 fail      # mismo único fallo de 2.1
 321 expect() calls
Ran 24 tests across 4 files. [68.00ms]
EXIT=1
```

- `home/home.test.ts` (HOME-01..05, HSS-01..04, HRM-01..02) → PASS (3 aserciones).
- `project-workspace-test-tab/proxy.test.ts` (PWT-01..12) → PASS.
- `projectctl-bundle.test.ts` → 9/9 PASS.
- `projectctl-requirements.sot-coherence.test.ts` → 10/11 PASS; 1 FAIL (ítem 2.1).
- **Sin regresiones** en mirrors home/proxy.

### 2.3 `bun run test:check` (gate raíz, TST-13 — coverage-only)

```text
$ bun run test:check
$ bun run scripts/test-runner.ts check
test:check OK: no implemented criterion missing Unit+PW-AUTO coverage
EXIT=0
```

El gate es semántica coverage-only (TST-13): falla solo si algún criterio
`functional: implemented` tiene Unit y PW-AUTO ambos `missing`. Estado real del bundle:
28 criterios; PCT-79..82 `not-applicable`; PCT-83..88, PCT-89..94, PCT-95..100,
PCT-106/107/109/110/112/121 `implemented` con `Unit: covered` → OK.

### 2.4 `bun run scripts/test-runner.ts run --method=unit --target=projectctl --persist` (runner bajo test + write-back)

```text
$ bun run scripts/test-runner.ts run --method=unit --target=projectctl --persist
rejected: tests/back/endpoints.test.ts has no '// @ac <ID>' header in the first lines (PCT-90)
EXIT=2
run-dirs BEFORE=46  AFTER=46   (nada persistido)
```

**Rechazo fatal previo a persist** (contrato runner L532: "Rejection is fatal: exit 2,
nothing executed/persisted"). `tests/back/endpoints.test.ts` (único archivo unit sin
header entre los 8 descubiertos) bloquea TODO `run --method=unit` repo-wide. Consecuencia:
el write-back `patchBundleCoverage` (write-back deseado bajo verificación) **NO se ejecutó**;
no se creó run-dir; bundle `docs/app-map/views/projectctl/index.md` intacto
(mtime 09:13, sin cambios); los 46 run-dirs legacy preservados (29 con `unit/`).

### 2.5 Reject-without-@ac (read-only, exit 2) — evidencia con archivo real

```text
$ bun run scripts/test-runner.ts run --method=unit --target=projectctl
rejected: tests/back/endpoints.test.ts has no '// @ac <ID>' header in the first lines (PCT-90)
EXIT=2
```

El comportamiento de rechazo PCT-90 (TST-03/04) queda reproducido contra el archivo real
existente (sin modificar ningún test). **No** se usó temp-copy: crearlo en un discovery root
violaría la regla de no-creación de tests de esta lane, y `/tmp` queda fuera de los roots
del runner (`tests/back`, `backend/src`, `frontend/__tests__`). El path de código es idéntico
(`assertAcHeader` L106-114 → exit 2).

---

## 3. Coverage mapping — AC → criterios → archivos de test (evidencia REAL)

| AC | Criterios bundle | Archivo de test (header `@ac`) | Resultado ejecución | Nota |
| --- | --- | --- | --- | --- |
| AC-002 (bundle 5 secciones + navigation + legacy out) | PCT-83..PCT-88 | `frontend/__tests__/projectctl-bundle.test.ts` (`// @ac PCT-83..PCT-88`) | **9/9 PASS** | Aserciones directas sobre bundle/mmd/navigation/criteria[]/prefix/legacy. Bundle declara `Unit: covered`. |
| AC-004 / AC-005 (locator v9 + projections + aliases retirados + paths cross) | PCT-106, PCT-107, PCT-109, PCT-110, PCT-112, PCT-121 | `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` (`// @ac PCT-106..PCT-121`) | **10/11 PASS; 1 FAIL** | Gate R-007. FAIL = aserción STATUS_WRITABLE whole-file (ítem 2.1). |
| AC-003 (sistema de testing: runner, gate, persistencia) | PCT-89..PCT-94 | — (ningún archivo de test declara tokens `@ac` PCT-89..94) | Gate `test:check` EXIT=0 (coverage-only); runner unit **bloqueado** (endpoints headerless) | Gap: `Unit: covered` declarado sin unit-test file que declare esos tokens. El runner/gate se ejercitan vía CLI, no vía aserción unit. Persist/write-back no verificable en runtime. |
| AC-001 (entornos: env, compose, FRONTEND_PORT, docs) | PCT-95..PCT-100 | — (ninguno; tier notas = Manual/CLI) | — (no unit-testable; validación CLI `projectctl env validate/status` = coordinator-owned WU-CLI-VAL) | Gap advisory: `Unit: covered` declarado sin unit-test file. Tier real declarado en notas del bundle: Manual vía CLI. |
| Mirrors (sin regresión) | HOME-01..05, HSS-01..04, HRM-01..02 (home); PWT-01..12 (test-tab) | `home/home.test.ts`; `project-workspace-test-tab/proxy.test.ts` | **PASS** | Sin regresiones; cubren bundles home/project-workspace (no projectctl). |

**Observación de discovery**: `AC_HEADER_LINE_RE` captura solo el PRIMER token del header
(ej. `PCT-83..PCT-88` → token efectivo `PCT-83`; `PCT-106..PCT-121` → `PCT-106`). Es el I5
conocido (WU-TST-1 §6.6). Efecto: el scope del runner por target resuelve solo el primer
criterio de cada rango; los demás criterios del rango quedarían `missing` en un run
persistido real (hoy no verificable por el rechazo). Recomendación: headers individuales
por criterio o captura multi-token.

---

## 4. Gate `coverage_gate_passed` — checklist de evidencia

| Requisito hard_gate | Evidencia | Estado |
| --- | --- | --- |
| `required_unit_or_pwauto_coverage_green` | `bun run test:check` → **EXIT=0** (`test:check OK: no implemented criterion missing Unit+PW-AUTO coverage`). Semántica coverage-only TST-13 (no es gate de test-pass). | ✅ técnicamente verde (declaración) — pero ver riesgos: 1 unit-test falla y runner unit bloqueado. |
| `coverage_file_test_command_and_result_recorded` | Coverage file = bundle `docs/app-map/views/projectctl/index.md` `criteria[].coverage` (28 criterios: 4 NA + 24 implemented todos `Unit: covered`) + `.runtime/test-results/511a017a-.../<run-id>/summary.json` (canónico; 46 run-dirs legacy, 29 con `unit/`; shape `{run_id,started_at,finished_at,target,passed,failed,skipped,criteria,methods}` verificada en run `09fdbc4f`). | ✅ parcial: bundle registrado; **sin** summary.json de run NUEVO de esta verificación (persist rechazado, exit 2). |

**Veredicto del gate**: `coverage_gate_passed` **NO certificable como passed** para
`p3_complete` en este estado — la cobertura declarada está verde (test:check exit 0), pero
la evidencia de ejecución unit tiene 1 aserción incorrecta y el runner unit (y su write-back)
están bloqueados por un archivo de test sin header.

---

## 5. Write-back report (runner bajo test)

- **Comando**: `run --method=unit --target=projectctl --persist` → **exit 2 (reject)**.
- **criteria[].coverage cambió**: NO — el write-back `patchBundleCoverage` no se invocó
  (rechazo fatal previo a persist, runner L559-562). Bundle `index.md` mtime `Aug 25 09:13`
  intacto tras la corrida (verificado).
- **Layout `.runtime` creado**: NO — ningún run-dir nuevo (`46 → 46`).
- **46 run-dirs legacy preservados**: SÍ — 46/46 intactos (29 con `unit/`, 45 con `pwauto/`).
- **Razón**: `tests/back/endpoints.test.ts` sin header `// @ac <ID>` (PCT-90) — único archivo
  headerless entre los 8 unit files descubiertos (`tests/back/{endpoints,coverage-endpoints,
  test-status}.test.ts` + `frontend/__tests__/**`).
- **Ruta del write-back verificada estructuralmente** (no runtime): `writeRunArtifacts`
  L406-487 — lazy import `patchBundleCoverage` (gray-matter instalado en `backend/node_modules`),
  `if (rejected.length === 0)` gate, solo `covered`/`partial` escritos (TST-11). Ejercitable
  end-to-end solo tras sanear endpoints.test.ts (o decisión de exclusión del coordinador).

---

## 6. Hallazgos y routing (sin creación de artefactos — sdd-verify-common §Routing)

| # | Severidad | Hallazgo | Tipo | Routing |
| --- | --- | --- | --- | --- |
| F1 | **incorrect** | `sot-coherence.test.ts` L165-171: regex whole-file colisiona con `RETIRED_ALIASES` legítimo de `task-flow.generated.ts` (L263-267) → fallo falso determinista. Producto correcto (`STATUS_WRITABLE` sin aliases retirados, verificado). | incorrect test | **`failed`** → `sdd-apply-unit-tests` (owner WU-TST-2), routing_tag `unit_test_issue` |
| F2 | **missing/blocking** | `tests/back/endpoints.test.ts` sin header `// @ac <ID>` → todo `run --method=unit` exit 2 → persist/write-back y derivación de criteria[] reales NO ejercitables (AC-003 runtime). | missing test-artifact (sanitización) | **`blocked`** → `sdd-apply-unit-tests`, routing_tag `unit_test_issue` |
| F3 | advisory | PCT-89..94 y PCT-95..100 declarados `Unit: covered` sin unit-test file que declare tokens `@ac` para esos criterios (I5: rango→primer token). PCT-95..100 tier real = Manual/CLI (notas del bundle). | gap de cobertura declarada vs archivos | Coordinador: decidir headers individuales + tests por criterio, o ajustar declaración de coverage. |
| F4 | info | 149 archivos `.runtime/` + `frontend/test-results/.last-run.json` siguen trackeados en git (ignore AD-02 activo para nuevos: `git check-ignore --no-index` exit 0; `git ls-files .runtime` = 149). | delivery | `git rm -r --cached` en WU-DELIVERY (coordinator). |

---

## 7. File-surface check (§D sdd-phase-common)

- **Tocado por esta lane**: únicamente `taskReadme/20260825-bhbr8k-.../verify-units.md` (phase
  artifact, commit normal). Nada más creado/escrito.
- Probe temporal `.runtime/test-ignore-probe` creado y eliminado durante check-ignore
  (dentro de dir gitignored; sin residuo: verificado `ls` negativo). Clasificación: excluido
  del commit por `.gitignore`.
- Sin `force-add` requerido; sin paths gitignored/generados en la superficie de esta lane.
- No se ejecutaron comandos git/gh (mecánica de commit/PR = coordinador).

---

## 8. Conclusión

- **unit_result**: `failed` (1 aserción incorrecta determinista) + `blocked` (runner unit
  inejecutable por header `@ac` faltante → persist/write-back sin verificar en runtime).
- **Gate**: `test:check` EXIT=0 (coverage-only) ✅; certificación `coverage_gate_passed`
  pendiente de rework F1/F2.
- **Next recommended**: re-lanzar `sdd-apply-unit-tests` (WU-TST-2 rework: acotar aserción
  STATUS_WRITABLE al bloque del array; sanear `tests/back/endpoints.test.ts` con header
  `// @ac <ID>`; evaluar headers individuales por criterio) → re-ejecutar `sdd-verify-units`
  (incl. `run --method=unit --target=projectctl --persist` para ejercicio real del write-back)
  → recién entonces transición `p3_test_running` → `p3_complete` (gate `coverage_gate_passed`)
  → fase 4.

**criteria_covered**: AC-002 (parcial: 9/9 bundle test), AC-003 (parcial: gate verde, runner
bloqueado), AC-004/AC-005 (parcial: 10/11 sot-coherence), AC-001 (no unit-testable; CLI
coordinator-owned).
**next_recommended**: rework `sdd-apply-unit-tests` (F1/F2) → re-verify → `p3_complete` → fase 4.

---

# RE-VERIFICACIÓN rev 2 (WU-TST-2 rev 2 F1/F2/F3 + WU-TST-1 rev 3 I5)

> Lane: `sdd-verify-units` · WU-VER-UNITS · re-lanzamiento tras rework (`p3_test_fixing` →
> `p3_test_running`, estado `testing`). Rework verificado en disco antes de ejecutar (F1/F2/F3
> en `apply-WU-TST-2.md` §6 rev 2; I5 en `apply-WU-TST-1.md` §7 rev 3). Ejecución real de los
> 4 comandos del scope inyectado + diagnóstico read-only del runner.
> Skill resolution: `injected-paths` (8 archivos cargados, aggregate ordenado exacto; helpers
> `[]` frozen).
> Veredicto rev 2: **`failed`** — F1/F2 verificados resueltos; F3 headers correctos en disco
> pero objetivo runtime NO cumplido; **I5 NO efectivo** (fix en primitivo sin consumidores;
> runner/inventory siguen single-token). Routing: `sdd-apply-code-medium` (WU-TST-1),
> routing_tag `code_issue`.

---

## 9. Verificación en disco (F1/F2/F3/I5 — read-only, previa a ejecución)

| Hallazgo | Verificado en disco | Evidencia |
| --- | --- | --- |
| F1: `extractArrayLiteralMembers` acotado + aserción positiva `RETIRED_ALIASES` | ✅ RESUELTO | `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` L78-91 (helper parsea SOLO `export const <Name>… = [ … ] as const;`), L187-200 (`STATUS_WRITABLE mirrors the binding writable statuses and excludes retired aliases` + igualdad con `binding.status.writable`), L202-209 (aserción positiva `RETIRED_ALIASES preserves`). Ya NO hay regex whole-file contra `RETIRED_ALIASES` (L263-267 del generated). |
| F2: header `// @ac PCT-90 PCT-93` en `tests/back/endpoints.test.ts` | ✅ RESUELTO | L1 `// @ac PCT-90 PCT-93` + comentario de mapeo L2-8 (TST-03/04 PCT-90; TST-36 layout PCT-93). Resto del archivo byte-intacto (imports/cuerpo). |
| F3: headers individuales | ✅ EN DISCO (efecto runtime NO — ver §11) | `projectctl-bundle.test.ts` L1: `// @ac PCT-83 PCT-84 PCT-85 PCT-86 PCT-87 PCT-88`. `sot-coherence.test.ts` L1: `// @ac PCT-106 PCT-107 PCT-109 PCT-110 PCT-112 PCT-121` (subset exacto implementado del rango). |
| I5: `extractAcTokensFromBun` multi-token | ⚠️ CÓDIGO PRESENTE, **SIN CONSUMIDORES** | `backend/src/ac-header.ts` L19 `headerLine.matchAll(/\b[A-Z][\w-]*/g)` captura todos los tokens; `AC_HEADER_LINE_RE` shape estable (L1); loops `ac=`/range preservados (L24-32). **PERO** `grep -rn extractAcTokensFromBun *.ts` → único match = la propia definición. El runner importa solo `AC_HEADER_LINE_RE, extractAcTokensFromPlaywright` (`scripts/test-runner.ts` L30); `test-inventory.ts` importa solo `AC_HEADER_LINE_RE` (L4-7). Los extractores vivos (`readHeader` L97-102 → `m[1]`; `extractUnitAcFromFile` L116-121 → `[m[1]]`) siguen single-token. |

---

## 10. Comandos ejecutados (exactos, scope inyectado) + resultados

### 10.1 `bun test frontend/__tests__/projectctl-bundle.test.ts frontend/__tests__/projectctl-requirements.sot-coherence.test.ts`

```text
21 pass, 0 fail, 315 expect() calls, Ran 21 tests across 2 files. [36.00ms]
EXIT=0
```
- bundle 9/9 PASS; sot-coherence **12/12 PASS** (incl. las 2 aserciones F1 partidas:
  `STATUS_WRITABLE mirrors...` y `RETIRED_ALIASES preserves...`). El fallo determinista rev 1
  (regex whole-file vs `RETIRED_ALIASES`) desapareció. **F1 verificado resuelto en ejecución.**

### 10.2 `bun test frontend/__tests__/` (sin regresiones)

```text
25 pass, 0 fail, 331 expect() calls, Ran 25 tests across 4 files. [46.00ms]
EXIT=0
```
- home (HOME-01..05, HSS-01..04, HRM-01..02) PASS · proxy (PWT-01..12) PASS · bundle 9/9 ·
  sot-coherence 12/12. Sin regresiones en mirrors home/proxy (rev 1: 23 pass + 1 fail).

### 10.3 `bun run test:check` (gate TST-13, coverage-only)

```text
$ bun run scripts/test-runner.ts check
test:check OK: no implemented criterion missing Unit+PW-AUTO coverage
EXIT=0
```
- Gate verde sobre la DECLARACIÓN del bundle (28 criterios: 4 NA + 24 `Unit: covered`).

### 10.4 `bun run scripts/test-runner.ts run --method=unit --target=projectctl --persist` (runner bajo test)

```text
run 8c0ff766-7443-4fb2-b074-d574d44a3617 persisted: .runtime/test-results/511a017a-.../8c0ff766-7443-4fb2-b074-d574d44a3617
EXIT=1
```
- **NO exit 2** (F2 resuelto: header `// @ac` presente → sin rechazo PCT-90). ✅
- **Ejecutó tests reales** (W1 rev 2 intacto): `bun test` sobre los archivos scoped →
  junit real con 21 tests (12 sot-coherence + 9 bundle), 0 failures. ✅
- **Layout canónico creado**: `{unit,pwauto}/{junit.xml,results.json,summary.json}` + root
  `summary.json` con shape §5.3 (`run_id/started_at/finished_at/target/passed/failed/skipped/
  criteria/methods`). ✅
- **46 runs legacy preservados**: 46 → **47** (solo run nuevo añadido). ✅
- **Write-back ejecutado**: bundle `docs/app-map/views/projectctl/index.md` mtime
  `09:13:58 → 11:04:32.99` (rev 1: intacto → ahora reescrito por `patchBundleCoverage`, lazy
  import OK con gray-matter vía `backend/node_modules`). ✅
- **EXIT=1** (ver §11.2): el comando `bun test` real salió con status 1 por
  `tests/back/endpoints.test.ts` que NO cargó (`error: Cannot find package 'express'`), pese a
  que los 21 tests ejecutados pasaron. `anyMethodFailed` = ran && exitCode>0 → return 1.

### 10.5 Diagnóstico read-only (runner/scoping — permitido)

- **Reproducción exacta del comando spawn del runner** (`bun test <sot> <bundle> <endpoints>
  --reporter=junit` con outfile en `/tmp/colpruebas-runner/`, cwd=repoRoot):
  ```text
  error: Cannot find package 'express' from '.../tests/back/endpoints.test.ts'
  21 pass, 1 fail, 1 error, Ran 22 tests across 3 files. EXIT=1
  ```
  Causa raíz: `node_modules` raíz VACÍO (0 entradas); `express`/`cors` solo existen en
  `backend/node_modules` (82 entradas) y la resolución de módulos de Bun parte del directorio
  del archivo (`tests/back/` → sube a raíz) — no salta a `backend/`. El junit resultante solo
  contiene los 2 archivos que cargaron (21 tests) → `deriveCriterionCoverage` marca `missing`
  los criterios del archivo que no cargó. No es un fallo de aserción: es un gap de resolución
  de deps del entorno para archivos `tests/back`.
- **Probe inventory** (`buildInventory` vía bun -e, read-only): `PCT-83 → bundle.test.ts`,
  `PCT-90 → endpoints.test.ts`, `PCT-106 → sot-coherence.test.ts`; **`PCT-84/93/107 →
  NO_UNIT`** (2º+ token del header invisible); `PCT-89/95 → NO_UNIT` (ningún archivo los
  declara). Confirmación ejecutable de single-token en el primitivo vivo del inventory.

---

## 11. Hallazgos rev 2 y routing (sin creación de artefactos — sdd-verify-common §Routing)

| # | Severidad | Hallazgo | Tipo | Routing |
| --- | --- | --- | --- | --- |
| F1 | ✅ resuelto | Aserción `STATUS_WRITABLE` acotada al bloque del const + nueva aserción positiva `RETIRED_ALIASES`; bundle+sot-coherence 12/12 verdes. | test fixed | verificado — sin rework |
| F2 | ✅ resuelto | Header `// @ac PCT-90 PCT-93` en `tests/back/endpoints.test.ts`; runner `run --method=unit` ya NO exit 2. | test fixed | verificado — sin rework |
| I5 | ❌ **NO efectivo** (producto) | El fix multi-token quedó en `extractAcTokensFromBun` (`backend/src/ac-header.ts`) **sin ningún consumidor** (grep: solo definición). Los extractores vivos siguen single-token: `readHeader` (`scripts/test-runner.ts` L97-102 → `m[1]`) y `extractUnitAcFromFile` (`backend/src/test-inventory.ts` L116-121 → `[m[1]]`). Consecuencia real: en el run persistido SOLO `PCT-83` y `PCT-106` mapean `covered`; `PCT-84..88`, `PCT-107/109/110/112/121`, `PCT-90/93` quedan `missing` pese a estar listados en el header. Verify-expect rev 3 (`run --persist` mapea TODOS los criterios listados a covered) **NO cumplido**. | incorrect product behavior (cobertura infra-poblada) | **`failed`** → `sdd-apply-code-medium` (WU-TST-1), routing_tag `code_issue` |
| I6 | 🆕 env/runtime | `run --method=unit --target=projectctl` EXIT=1: `tests/back/endpoints.test.ts` no carga (`Cannot find package 'express'` — deps solo en `backend/node_modules`, raíz vacía). Los 21 tests ejecutados pasan; el exit 1 es del comando bun por load-error. Afecta a cualquier run que scope `tests/back` (PCT-90/93 → `missing` en criteria[] reales). | env gap de resolución de deps (tests/back) | Decisión producto/coordinator: deps en `tests/back` (package.json), deps raíz, o `NODE_PATH`/cwd en `runUnitExecution` → `sdd-apply-code-medium` (WU-TST-1) o coordinador |
| F3 | ⚠️ parcial | Headers individuales space-separated correctos EN DISCO, pero el efecto buscado (todos los criterios listados → `covered` en run persistido) NO se alcanza por I5 (single-token en runner/inventory). Los criterios `PCT-84..88`, `PCT-107/109/110/112/121`, `PCT-90/93` declarados en headers quedan `missing` en `summary.json`. | header OK + pipeline roto | se resuelve con I5 (code-medium) |
| F5 | 🆕 coverage-mapping | **22 de 24 criterios `implemented` del bundle quedan `missing` en el run persistido** mientras el bundle declara `Unit: covered` (write-back TST-11 jamás escribe `missing` → no auto-corrige). Desglose: `PCT-84..88` (5, listados en bundle.test.ts pero single-token), `PCT-89/91/92/94` (4, NINGÚN archivo unit declara esos tokens), `PCT-90/93` (2, endpoints declara pero archivo no carga + single-token), `PCT-95..100` (6, ningún archivo unit; tier real Manual/CLI → WU-CLI-VAL), `PCT-107/109/110/112/121` (5, listados en sot-coherence pero single-token). | gap declaración ↔ ejecución real | **No tocar bundle** (esta lane). Coordinador: reconciliar evidencia Manual/CLI (WU-CLI-VAL) para PCT-95..100 y corregir/rre-declarar coverage; PCT-89/91/92/94 requieren archivo unit que declare los tokens o declaración ajustada (doc-lane) |

---

## 12. Write-back report (runner bajo test — ejecución REAL rev 2)

- **Comando**: `run --method=unit --target=projectctl --persist` → **exit 1** (no exit 2 — F2 ok).
- **Run-id nuevo**: `8c0ff766-7443-4fb2-b074-d574d44a3617` → `.runtime/test-results/
  511a017a-01d4-4553-a063-ba01438b15cd/8c0ff766-.../` con `{unit,pwauto}/{junit.xml,
  results.json,summary.json}` + root `summary.json`.
- **46 runs legacy preservados**: SÍ — 46 → 47 (solo añadido el nuevo; 29 legacy con `unit/`
  intactos).
- **criteria[].coverage del bundle — ANTES vs DESPUÉS**: sin flips. Los 24 `implemented`
  siguen `Unit: covered` / `PW-AUTO: not-applicable` (valores byte-idénticos pre/post;
  re-grep con el mismo patrón). `patchBundleCoverage` solo patchea `covered`/`partial`
  (TST-11): en este run solo `PCT-83` y `PCT-106` fueron `covered` → 2 patches no-op (ya
  estaban `covered`). El archivo fue reescrito (mtime `09:13:58 → 11:04:32.99`, re-flow YAML
  menor de gray-matter observable en offsets de línea) sin cambio semántico de coverage.
- **Flipped a `covered`**: ninguno nuevo. **Flipped a `partial`**: ninguno. **`missing` en
  criteria[] del run (NO escritos al bundle)**: `PCT-84..88`, `PCT-89..94` (incl. 90/93),
  `PCT-95..100`, `PCT-107/109/110/112/121` (22 criterios) — ver §11 F5.
- **Percepción del run (`summary.json`)**: `passed 21, failed 0, skipped 0` (junit real);
  `methods[].exitCode: 1` (load-error de endpoints) → EXIT global 1.
- **Ruta write-back ejercitada end-to-end**: SÍ — lazy import `patchBundleCoverage`
  (gray-matter resuelto vía `backend/node_modules`), `rejected.length === 0`, solo
  covered/partial escritos. La mecánica TST-11/PCT-92 queda **verificada en runtime** (rev 1:
  no ejercitable por exit 2).

---

## 13. Coverage mapping — AC → criterios → archivos (ejecución REAL rev 2)

| AC | Criterios | Archivo que DECLARA el token (header) | Resultado ejecución run | Nota |
| --- | --- | --- | --- | --- |
| AC-002 | PCT-83..88 | `projectctl-bundle.test.ts` (`// @ac PCT-83..PCT-88`) | **PCT-83 `covered`; PCT-84..88 `missing`** | 12/12+9/9 verdes en `bun test` directo; en el run el runner single-token solo registra PCT-83 (I5). |
| AC-003 | PCT-89..94 | `endpoints.test.ts` (`// @ac PCT-90 PCT-93`) | PCT-90/93 **`missing`** (archivo no carga: express); PCT-89/91/92/94 **`missing`** (ningún archivo los declara) | Header F2 ok; pipeline roto por I5 + I6. |
| AC-004/AC-005 | PCT-106/107/109/110/112/121 | `sot-coherence.test.ts` (`// @ac PCT-106 PCT-107 PCT-109 PCT-110 PCT-112 PCT-121`) | **PCT-106 `covered`; PCT-107/109/110/112/121 `missing`** | 12/12 verdes en directo; single-token en run (I5). |
| AC-001 | PCT-95..100 | — (ninguno; tier Manual/CLI) | todos **`missing`** en run | Declarados `Unit: covered` sin archivo unit; evidencia real = WU-CLI-VAL (coordinator). |
| Mirrors | HOME-01..05/HSS/HRM; PWT-01..12 | `home/home.test.ts`; `project-workspace-test-tab/proxy.test.ts` | PASS en `bun test frontend/__tests__/` | No scoped al target projectctl; sin regresión. |

**Inventory (buildInventory) real**: `PCT-83/PCT-90/PCT-106` → archivos (primer token);
`PCT-84/PCT-93/PCT-107` → NO_UNIT (2º+ token invisible); `PCT-89/PCT-95` → NO_UNIT.
`test:check` sigue verde porque evalúa la DECLARACIÓN del bundle, no el inventory como gate.

---

## 14. Gate `coverage_gate_passed` — checklist rev 2

| Requisito hard_gate | Evidencia rev 2 | Estado |
| --- | --- | --- |
| `required_unit_or_pwauto_coverage_green` | `bun run test:check` → **EXIT=0**. Semántica coverage-only TST-13 sobre declaración del bundle. | ⚠️ verde declarado, **inconsistente con la ejecución real**: `run --persist` criteria[] marca 22/24 implementados `missing` y el run global EXIT=1. |
| `coverage_file_test_command_and_result_recorded` | Coverage file = bundle `docs/app-map/views/projectctl/index.md` `criteria[].coverage` (28 criterios; 24 `Unit: covered` declarados) + **`summary.json` NUEVO del run `8c0ff766-7443-4fb2-b074-d574d44a3617`** (shape canónico, criteria[] con los 28 ids, métodos con junit real) + junit real persistido (21 tests, 0 failures). | ✅ registrado (run nuevo) — pero el summary muestra la discrepancia §11 F5. |

**Veredicto del gate**: `coverage_gate_passed` **NO certificable como passed** para
`p3_complete` en este estado: F1/F2 cerrados, pero I5 (producto, sin consumidores) deja la
cobertura real infra-poblada, I6 (env) hace `run --method=unit` exit 1, y 22 criterios
declarados `covered` figuran `missing` en el run persistido (F5).

---

## 15. File-surface check rev 2 (§D sdd-phase-common)

- **Tocado por esta lane**: únicamente `taskReadme/20260825-bhbr8k-.../verify-units.md`
  (phase artifact, commit normal). Nada más creado/escrito por la lane.
- **Runner-under-test write-back (reportado, NO de esta lane)**: `docs/app-map/views/
  projectctl/index.md` reescrito por `patchBundleCoverage` (mtime 11:04:32.99) — valores de
  coverage sin cambios (ver §12). Nuevo run-dir `.runtime/test-results/.../8c0ff766-.../`
  (gitignored AD-02; 47 dirs).
- Diagnósticos en `/tmp/colpruebas-runner/` (fuera del repo; junit repro + stdout).
- Sin `force-add` requerido; sin git/gh/docker/projectctl/browser en esta lane.
- Riesgo delivery conocido (rev 1, F4): 149 archivos `.runtime/` + `frontend/test-results/
  .last-run.json` siguen trackeados → `git rm -r --cached` en WU-DELIVERY.

---

## 16. Conclusión rev 2

- **unit_result**: `failed` — F1 y F2 verificados resueltos (en disco + ejecución); F3 headers
  correctos pero objetivo runtime NO cumplido; **I5 NO efectivo** (primitivo fijado sin
  consumidores; runner `readHeader` + inventory `extractUnitAcFromFile` siguen single-token);
  run persistido EXIT=1 (I6: deps `tests/back` irresolubles desde raíz).
- **Routing**: rework `sdd-apply-code-medium` (WU-TST-1), routing_tag `code_issue`:
  (1) consumir extracción multi-token en `readHeader` + `extractUnitAcFromFile` (reutilizar
  `extractAcTokensFromBun` o parse por línea en runner/inventory); (2) resolver deps de
  `tests/back` (package.json local, deps raíz, o NODE_PATH en `runUnitExecution`).
- **Coverage-mapping (coordinador, NO fix de bundle)**: 22 criterios `implemented` declarados
  `Unit: covered` figuran `missing` en el run real (F5): PCT-95..100 evidencia Manual/CLI vía
  WU-CLI-VAL; PCT-89/91/92/94 sin archivo unit que declare los tokens (doc-lane o archivo
  nuevo); resto se cura con I5.
- **Gate**: `test:check` EXIT=0 (declaración) ✅; certificación `coverage_gate_passed`
  pendiente de rework I5/I6 + reconciliación F5.
- **next_recommended**: rework `WU-TST-1` (code-medium, I5 wiring + I6 deps) → re-correr
  `sdd-verify-units` (los 4 comandos) → coordinador WU-CLI-VAL (Manual/CLI PCT-95..100) +
  reconciliación coverage (doc-lane) → recién entonces `p3_complete`.

**criteria_covered (rev 2)**: AC-002 parcial (9/9 directo; run: PCT-83 covered), AC-003
parcial (gate verde; PCT-90/93 header ok pero run missing), AC-004/AC-005 parcial (12/12
directo; run: PCT-106 covered), AC-001 (CLI coordinator-owned).
**next_recommended (rev 2)**: rework `sdd-apply-code-medium` WU-TST-1 (I5 wiring +
I6) → re-verify-units → WU-CLI-VAL → `p3_complete`.
---

# RE-VERIFICACIÓN rev 3 — FINAL (WU-TST-1 rev 4 I5+I6 · WU-TST-2 rev 3 PCT-91/92/94+PCT-95..100 · WU-DOC-1 rev 2 PCT-89→NA)

> Lane: `sdd-verify-units` · WU-VER-UNITS · re-verificación FINAL de cierre de la fase 3
> (`fase_3_verificacion` / `p3_test_running` / `testing`). Gate a certificar:
> `coverage_gate_passed` (hard_gate) → `p3_complete`. run/review/report-ONLY; NO se crearon/
> modificaron archivos de test ni producto; la única escritura no-lane es el write-back del
> runner-under-test (reportado abajo). Skill resolution: `injected-paths` (8 skill files,
> aggregate ordenado exacto; helpers `[]` frozen). Estándar: `projectctl-requirements` v10 /
> binding `task-flow-binding` v9.0.0. Framework: `bun test` v1.3.12.

## 17. Verificación en disco previa a ejecución (read-only)

| Hallazgo | Verificado | Evidencia |
| --- | --- | --- |
| WU-TST-1 rev 4 I5 wiring multi-token (runner + inventory) | ✅ | `scripts/test-runner.ts` `readHeader` → `extractAcTokensFromBun`; `backend/src/test-inventory.ts` `extractUnitAcFromFile` → `extractAcTokensFromBun` (ambos consumen el primitivo, ya no dead code). `backend/src/ac-header.ts` multi-token `matchAll`. |
| WU-TST-1 rev 4 I6 deps raíz | ✅ | `package.json` raíz `dependencies {express ^4.18.2, cors ^2.8.5}`; `node_modules` raíz 69 entradas con `express` presente. |
| WU-TST-2 rev 3 headers nuevos | ✅ | `tests/back/test-runner-contract.test.ts` L1 `// @ac PCT-91 PCT-92 PCT-94`; `frontend/__tests__/projectctl-entorno.test.ts` L1 `// @ac PCT-95 PCT-96 PCT-97 PCT-98 PCT-99 PCT-100`. |
| WU-DOC-1 rev 2 PCT-89 → not-applicable | ✅ | Bundle `docs/app-map/views/projectctl/index.md`: PCT-89 `functional: not-applicable`, coverage Unit/Manual `not-applicable`; resto `implemented` (23) intactos. |
| run-dirs antes | 47 | `.runtime/test-results/511a017a-.../` (47 dirs legacy preservados). |

## 18. Comandos ejecutados (exactos, scope inyectado) + resultados

### 18.1 `bun test tests/back/test-runner-contract.test.ts frontend/__tests__/projectctl-entorno.test.ts frontend/__tests__/projectctl-bundle.test.ts frontend/__tests__/projectctl-requirements.sot-coherence.test.ts`

```text
49 pass, 0 fail, 369 expect() calls, Ran 49 tests across 4 files. [171.00ms]
EXIT=0
```
- test-runner-contract 11/11 (PCT-91/92/94) · entorno 17/17 (PCT-95..100) · sot-coherence 12/12
  (PCT-106/107/109/110/112/121) · bundle 9/9 (PCT-83..88). **ALL GREEN.**

### 18.2 `bun test frontend/__tests__/` + `bun test tests/back/` (sin regresiones)

```text
frontend: 42 pass, 0 fail, 361 expect() calls, 5 files. EXIT=0
back:     43 pass, 0 fail, 143 expect() calls, 4 files. EXIT=0
```
- Home (HOME-01..05/HSS-01..04/HRM-01..02) + proxy test-tab (PWT-01..12) PASS.
- **`tests/back/endpoints.test.ts` AHORA CARGA y pasa (3 tests)** — I6 resuelto:
  `Cannot find package 'express'` eliminado (deps raíz). Cero regresiones.

### 18.3 `bun run test:check` (gate TST-13)

```text
test:check OK: no implemented criterion missing Unit+PW-AUTO coverage
EXIT=0
```
- Gate coverage-only verde: los 23 criterios `implemented` del bundle tienen declaración
  `Unit: covered`; PCT-79..82 y PCT-89 `not-applicable`.

### 18.4 `bun run scripts/test-runner.ts run --method=unit --target=projectctl --persist`

```text
run 3a6a5483-bcb4-4394-8ee1-3eb91e004a3c persisted: .runtime/test-results/511a017a-.../3a6a5483-...
EXIT=0
```
- **EXIT=0** (rev 2: exit 1 por load-error I6; rev 1: exit 2 por header). F2/I5/I6 cerrados.
- **I5 efectivo**: `summary.json` criteria[] mapea **TODOS** los implemented a `covered`:
  PCT-83..88, PCT-90/93, PCT-91/92/94, PCT-95..100, PCT-106/107/109/110/112/121 (23/23);
  PCT-79..82, PCT-89 not-applicable. **Ningún implemented `missing`.**
- **Layout canónico creado**: root `summary.json` + `{unit,pwauto}/{junit.xml,results.json,
  summary.json}`; junit real `tests="52"` `failures="0"`.
- **47 runs legacy preservados**: 47 → **48** (solo run nuevo; 47 legacy intactos).
- **Write-back ejecutado**: bundle `docs/app-map/views/projectctl/index.md` mtime
  `11:26:55 → 11:33:03` (re-escrito por `patchBundleCoverage`, lazy import OK con gray-matter).

## 19. Coverage mapping — F I N A L (todos los implemented ↔ archivo unit real)

| Criterio | Archivo que declara el token (header `@ac`) | Resultado run rev 3 |
| --- | --- | --- |
| PCT-83..PCT-88 | `frontend/__tests__/projectctl-bundle.test.ts` | **covered ×6** |
| PCT-90, PCT-93 | `tests/back/endpoints.test.ts` | **covered ×2** (archivo carga — I6) |
| PCT-91, PCT-92, PCT-94 | `tests/back/test-runner-contract.test.ts` (NEW rev 3) | **covered ×3** |
| PCT-95..PCT-100 | `frontend/__tests__/projectctl-entorno.test.ts` (NEW rev 3) | **covered ×6** |
| PCT-106, PCT-107, PCT-109, PCT-110, PCT-112, PCT-121 | `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` | **covered ×6** |
| PCT-79..82 | — (cli, `functional: not-applicable`) | not-applicable |
| PCT-89 | — (plataforma, WU-DOC-1 rev 2 reclass) | **not-applicable** (ya no exige unit) |

**23 implemented → 23 covered** en el run persistido; **0 missing** en criterios implemented.
`buildInventory` (primitivo vivo del gate) mapea los 23 tokens a archivos reales (rev 2:
22/24 missing por single-token/load-error → hoy 23/23 covered). F5 (reconciliación) CERRADO.

## 20. Write-back report (runner-under-test — ejecución REAL rev 3)

- **Comando**: `run --method=unit --target=projectctl --persist` → **exit 0**.
- **Run-id nuevo**: `3a6a5483-bcb4-4394-8ee1-3eb91e004a3c`.
- **criteria[].coverage ANTES ↔ DESPUÉS**: sin flips; los 23 implemented ya estaban
  `Unit: covered` en el bundle (WU-DOC-1 estado previo). `patchBundleCoverage` solo escribe
  `covered`/`partial` (TST-11) → este run confirma los 23 `covered` (patches no-op). mtime del
  bundle re-escrito (11:33:03); valores de coverage sin cambio semántico.
- **Run-dirs**: 47 → **48** (solo añadido el nuevo; 47 legacy preservados).
- **Gestión de estados del run**: `passed 52, failed 0`; `methods[].exitCode 0` → EXIT global 0.
- **Flipped a `covered`**: ninguno (ya cubiertos). **Flipped a `missing`/`partial`**: ninguno.

## 21. Gate `coverage_gate_passed` — checklist FINAL

| Requisito hard_gate | Evidencia rev 3 | Estado |
| --- | --- | --- |
| `required_unit_or_pwauto_coverage_green` | **`bun test` (49+42+43 = 134 tests, 0 fail)** + **`bun run test:check` EXIT=0** + **`run --persist` EXIT=0** con criteria[] todos `covered` para implemented. | ✅ **GREEN (ejecución real)** |
| `coverage_file_test_command_and_result_recorded` | Coverage file = bundle `docs/app-map/views/projectctl/index.md` `criteria[].coverage` (28 ids: 5 not-applicable + 23 implemented `Unit: covered`) + **`summary.json` NUEVO del run `3a6a5483-...`** (path canónico `.runtime/test-results/<projectId>/<run-id>/summary.json`, 23/23 covered) + junit real (52 tests, 0 failures). | ✅ **REGISTRADO (run nuevo, exit 0)** |

**Veredicto del gate**: `coverage_gate_passed` **CERTIFICADO como PASSED** para `p3_complete`.
Todos los comandos del scope salen **exit 0**; criteria[] del run persistido muestran los
23 implemented `covered` con **0 missing**; PATRONES rev 1 (F1 test bug, F2 headerless),
rev 2 (I5 dead-code, I6 load-error, F5 infra-poblada) — todos resueltos en disco + ejecución.

## 22. File-surface check FINAL (§D sdd-phase-common)

- **Tocado por esta lane**: únicamente `taskReadme/20260825-bhbr8k-.../verify-units.md`
  (phase artifact, commit normal). **Nada más** creado/escrito por la lane (run/review/report).
- **Runner-under-test write-back (reportado, NO de esta lane)**: `docs/app-map/views/
  projectctl/index.md` re-escrito por `patchBundleCoverage` (mtime 11:33:03) — coverage sin
  cambio semántico (ver §20). Nuevo run-dir `.runtime/test-results/.../3a6a5483-.../`
  (gitignored AD-02: `git check-ignore` exit 0; 48 dirs). Sin force-add.
- Diagnósticos en `/tmp/colpruebas-runner/` (fuera del repo).
- **Riesgo delivery conocido (rev 1 F4, sin cambio)**: 149 archivos `.runtime/` +
  `frontend/test-results/.last-run.json` siguen trackeados en git → `git rm -r --cached` en
  WU-DELIVERY (coordinador).
- **Riesgo delivery WU-TST-2 rev 3 §7.6 (sin cambio)**: aserciones PCT-97 dependen de `.env`/
  `.env.dev` locales (gitignored); en checkout limpio/CI faltarían → decisión coordinador
  (parametrizar o depender de `.env.example` que SÍ está cubierto). No bloquea; estado local
  actual verde.
- No se ejecutaron comandos git/gh/docker/projectctl/browser (mecánica commit/PR =
  coordinador).

## 23. Conclusión FINAL (rev 3)

- **unit_result**: **`passed`** — suite completa GREN (49+42+43 = 134 tests, 0 fail); gate
  `test:check` exit 0; `run --persist` **exit 0** con 23/23 implemented `covered`, 0 missing.
- **Hallazgos previos cerrados**: F1 (sot-coherence aserción) ✓, F2 (endpoints header) ✓,
  I5 (multi-token wiring) ✓, I6 (deps raíz) ✓, F3/F5 (coverage-mapping completo) ✓,
  F4 (delivery git rm; coord) — **no reabiertos**. PCT-89 reclassified a `not-applicable`
  (WU-DOC-1 rev 2) alineado con la matriz real (sin unit file legítimo; plataforma).
- **Gate**: `coverage_gate_passed` **certificado PASSED** → transición `p3_test_running` →
  `p3_complete` procede.
- **Remanente fuera de esta lane (no bloqueante)**: F4 `git rm -r --cached` de `.runtime/**`/
  `frontend/test-results/**` (WU-DELIVERY) y la decisión PCT-97 `.env` local (coordinador);
  validación browser/Manual PCT-95..100 → WU-CLI-VAL (coordinador, fase 3).

**criteria_covered (rev 3)**: AC-001 (PCT-95..100 covered ×6), AC-002 (PCT-83..88 covered ×6),
AC-003 (PCT-90/91/92/93/94 covered ×5; gate exit 0; run exit 0), AC-004/AC-005
(PCT-106/107/109/110/112/121 covered ×6). PCT-89 not-applicable per doc-lane rev 2.
**next_recommended**: `p3_complete` (gate `coverage_gate_passed` certificado) → coordinador
WU-CLI-VAL (Manual/CLI PCT-95..100 + F4 delivery git rm) → fase 4.
