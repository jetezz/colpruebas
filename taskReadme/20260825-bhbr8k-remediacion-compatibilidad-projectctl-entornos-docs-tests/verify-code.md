# VERIFY-CODE-1 — Code review (fase 2) — Remediación compatibilidad /projectctl (entornos, docs, tests)

> Lane: `sdd-verify-code` (fase 2, unit `VERIFY-CODE-1`) · Estado: `p2_code_review`
> Alcance: las 9 unidades de apply de fase 2 (`WU-TSK-1/2`, `WU-CRS-1/2`, `WU-DOC-1`,
> `WU-ENT-1/2/3`, `WU-TST-1`), todas `done` (tasks.md §5, filas 205-214).
> Estándar inyectado: `projectctl-requirements` v10.0.0 / binding `task-flow-binding` v9.0.0
> (surface policies frontend/backend/sandbox NO instaladas → gap conocido; `sandbox-runtime-policy`
> instalada por WU-ENT-3).
> Review-only: no se modificó código, tests ni docs; solo se escribió este artifact.
> Comandos usados (narrow scope autorizado): `git status --short`, `git diff --stat`,
> `git diff HEAD -- <paths>`, `git ls-files`, `grep`/`ls` read-only, `sed -n` para filas truncadas
> de la tabla de work units.

---

## 1. Authorization gate

- Lane id `sdd-verify-code` presente en `lane_context.allowed_lanes` y en el registro. ✅
- Skill resolution: `injected-paths` — 8 archivos de skill cargados (lane + sd-protocol
  comunes + projectctl-requirements standard). ✅
- **Task contract gate (4 campos)**: las 9 filas (tasks.md filas 205-214) tienen los 4 campos
  contractuales presentes y concretos (`Spec scenarios linked` con IDs REQ-*; `Implementation
  contract` con files/símbolos/valores; `Verify expects` con checks observables; `Routing tag on
  failure` = `code_issue`/`doc_issue`). → **PASS** (no `blocked`, no `tasks_contract_missing`).

## 2. Contract review (por unidad)

| Unit | Spec scenarios linked | Implementation contract | Verify expects | Routing | Usable |
| --- | --- | --- | --- | --- | --- |
| WU-TSK-1 | REQ-TSK-001/002/004 | locator field exacto + `taskflow:generate` + 2 projections | pin v9 + 5 campos byte-iguales + projections existen + R-007 (f3) | code_issue | ✅ |
| WU-TSK-2 | REQ-TSK-003 | frontmatter `status → done` + `updated` en 4 fixtures | grep sin estados retirados + 4 archivos intactos | code_issue | ✅ |
| WU-CRS-1 | REQ-CRS-006 / REQ-TST-008 | `frontend/playwright.config.ts` + `PWAUTO_VIEWS` 3 claves + `bundle_path` | symlink resuelve + 3 claves + metadata.bundle_path | code_issue | ✅ |
| WU-CRS-2 | REQ-CRS-001..005 | 5 archivos cross + formato registry | presencia + anti-drift task.md + nombra skills | doc_issue | ✅ |
| WU-DOC-1 | REQ-DOC-001..005 | bundle 5 MUST + criteria[] PCT-* + navigation + RM quality | fase-3 test + patchBundleCoverage read-only + ausencia quality | doc_issue | ✅ |
| WU-ENT-1 | REQ-ENT-001..004/007 | env + compose canónicos + git rm legacy + stages Dockerfile | file inspection overlay/red/alias/puerto/Dockerfile | code_issue | ✅ |
| WU-ENT-2 | REQ-ENT-005 | 3 docs entorno/architecture/tunnel | aliases + `TUNNEL_NOT_PUBLISHABLE` + FRONTEND_PORT | doc_issue | ✅ |
| WU-ENT-3 | REQ-ENT-006 | skill `sandbox-runtime-policy` copy-tree-no-mods | no-docker + projectctl-only | code_issue | ✅ |
| WU-TST-1 | REQ-TST-001..005 | runner CLI + primitivos backend + gate + TEST_PLAN + .gitignore | check/exit codes/persist layout/rejection/write-back/gitignore | code_issue | ✅ |

## 3. Findings (por severidad)

### Warning

#### W1 — El subcomando `run` del runner NO ejecuta tests (contrato design §5.1/§3.1)
- **Archivo**: `scripts/test-runner.ts` (`runCommand` L328-433, `writeRunArtifacts` L223-326).
- **Evidencia**: el comando `run` solo (a) parsea CLI, (b) descubre archivos y valida headers
  `@ac` (L368-389), (c) scopea ACs al bundle (L400-411) y (d) con `--persist` escribe el layout
  canónico. **Nunca invoca `bun test` ni `bunx playwright test`**. `writeRunArtifacts` escribe
  `junit.xml` placeholder con `tests="0"` (L280-281/295), `results.json` vacío, y `criteria[]`
  con `status: 'covered'` solo por presencia de header (L260-264); el write-back
  `patchBundleCoverage(..., 'covered', ...)` (L316-322) marca cobertura sin resultado de test.
  El `junitPath` de los `methods[]` apunta a `playwright/test-results/.last-run.junit.xml`
  (L249-252) que el propio runner nunca produce.
- **Contrato violado**: design §5.1 "run: **ejecuta tests** del target con filtro `@ac`";
  design §3.1 flujo `bun test (grep por @ac ids) → resultados` y pwauto "invoca `bunx playwright test`
  ... parsea JUnit"; PCT-91 mapeo 1:1 con `projectctl test *` (`standard.md` §2: `projectctl test *`
  mapea 1:1 al runner). Un `projectctl test run --method=unit` que pase por este runner reportaría
  un run con 0 tests y marcaría `covered`.
- **No declarado**: `apply-WU-TST-1.md` §4 "Deviations del diseño" lista solo semántica de check,
  lazy import y descubrimiento de roots — no menciona la ausencia de ejecución.
- **Impacto**: afecta el componente central de AC-003 y el gate
  `no_known_functional_or_code_quality_defect`.
- **Routing**: `code_issue` → owning `sdd-apply-code-medium` (WU-TST-1). Alternativa: el
  coordinador acepta explícitamente un scope reducido (runner = validación + persistencia;
  ejecución real en fase 3 vía `bun test`/`bunx playwright test` directos) y registra la
  decisión; en ese caso re-verificar.

#### W2 — `frontend/__tests__` fuera de los unit roots de discovery (decisión design §8 no implementada)
- **Archivos**: `scripts/test-runner.ts` `discoverUnitFiles` L161-176 (roots `tests/back` +
  `backend/src`); `backend/src/test-inventory.ts` `unitRoots` L137-140 (idem, sin
  `frontend/__tests__`).
- **Evidencia**: design §8 resuelve "**Decisión**: extender `unitRoots` ... con
  `frontend/__tests__` (cambio backend de 1 línea, owner `sdd-apply-code-medium`) para que
  `buildInventory` sea la única fuente de inventory". Ni el backend ni el runner incluyen
  `frontend/__tests__`; `apply-WU-TST-1.md` §2.2 declara además "mismos roots que
  `buildInventory`" como estado deseado (contradice la decisión de diseño) y no lo reporta como
  desviación.
- **Consecuencia**: cuando WU-TST-2 (fase 3) cree `frontend/__tests__/projectctl-bundle.test.ts`
  y `projectctl-requirements.sot-coherence.test.ts`, el runner `run --method=unit` y el
  `buildInventory` del gate NO los descubrirán → el Verify expect de WU-TST-1
  ("`run --method=unit --target=projectctl --persist` produce `summary.json` con `criteria[]`
  poblado") es inalcanzable vía runner para los criterios PCT-* sin extender esos roots.
  Adicionalmente `tests/back/endpoints.test.ts` sin header hace que `--method=unit` retorne exit
  2 hoy (conocido, index §18, fase 3 sanea).
- **Routing**: `code_issue` → WU-TST-1 (o cambio backend de 1 línea en `test-inventory.ts`
  `unitRoots` al aplicar WU-TST-2 en fase 3, coordinado con `sdd-apply-code-medium`/owner backend).

### Info

#### I1 — `testDir` de `frontend/playwright.config.ts` vs specs reales
- `frontend/playwright.config.ts` L21 `testDir: './tests'` (→ `frontend/tests`) mientras los
  specs viven en `tests/front/tests/`. Documentado por WU-CRS-1 §4 y `playwright/TEST_PLAN.md`
  "Nota de coherencia". **Out-of-lane**: reconciliar en fase 3 (`sdd-apply-pwauto-tests` /
  coordinator), sin duplicar specs. No bloquea fase 2 (`pw_enabled: false`).

#### I2 — Artefactos runtime aún trackeados en git
- `.runtime/test-results/**` (149 archivos) y `frontend/test-results/.last-run.json` (1) siguen
  trackeados (`git ls-files` verificado). AD-02 (`.gitignore`) evita nuevos pero no destrackea.
  **Delivery**: el coordinador ejecuta `git rm -r --cached .runtime/ frontend/test-results/` en
  WU-DELIVERY (index §18, WU-TST-1 §5). Clasificación: `exclude from commit` (policy review).
  No es defecto de implementación de los 9 WUs.

#### I3 — Product surface policies no instaladas (gap conocido)
- `frontend-policy`, `backend-api-policy` no instaladas; `sandbox-runtime-policy` ya instalada
  (WU-ENT-3). No bloquear; deliverables de esta misma task. Info por instrucción del coordinador.

#### I4 — Validaciones runtime/gate diferidas a fase 3 (out-of-lane)
- `projectctl env validate`/`status`/`doctor` (REQ-ENT-007/008) → WU-CLI-VAL (coordinator);
  `bun run test:check` + `--persist` con backend deps + `bunx playwright test --list` →
  WU-VER-UNITS. Este lane no ejecuta runtime/git/browser.

#### I5 — Header `// @ac PCT-83..PCT-88` (rango) vs captura single-token del runner
- `AC_HEADER_LINE_RE` (`/^\s*\/\/\s*@ac\s+([A-Z][\w-]*)/m`) captura un único token: un header
  con rango mapearía solo el primer ID (`PCT-83`). Plan de WU-TST-2 (tasks.md fila 226) usa
  "`// @ac PCT-83..PCT-88`"; a coordinar en fase 3 (usar IDs individuales o un archivo por
  criterio) para que `criteria[]` se pueble completa. Info.

#### I6 — Proyecciones hand-generadas (generador `taskflow:generate` ausente)
- WU-TSK-1 §2.2 documenta el infra gap: las 2 projections se generaron a mano desde el bloque
  binding v9. Defendible (proyección no autoritativa, contrato §3); un generador futuro debe
  reproducirlas. Info.

#### I7 — `sandbox-runtime-policy` listada como "prevista" en docs mientras está instalada
- `docs/00-context/agents_skills.md` y `.atl/skill-registry.md` (escritos por WU-CRS-2 antes de
  WU-ENT-3) la listan como *prevista*; la skill ya existe en disco. WU-REG (coordinator, fase 4)
  regenera el registro formal. Info documental leve, no bloqueante.

## 4. Verify-expectations checklist (por unidad)

| Unit | Verify expect | Resultado (esta lane) |
| --- | --- | --- |
| WU-TSK-1 | locator `binding_version == "9.0.0"` + otros 5 campos byte-iguales | ✅ CHECKED — `git diff` muestra solo `binding_version`; `contract_version/binding_path/machine_block_id/expected_binding_id/projections` preservados (archivo completo leído). |
| WU-TSK-1 | ambas projections existen bajo `frontend/src/views/projectctl/data/` y `frontend/src/shared/sdd/` | ✅ CHECKED — archivos presentes, TS coherente, internamente consistentes con el contexto inyectado y el índice (phases[4], controls[7], writable[8], retired[34], delivery.actionOrder). |
| WU-TSK-1 | (f3) `sot-coherence.test.ts` R-007 verde | ⏭ out-of-lane → WU-TST-2 / WU-VER-UNITS. |
| WU-TSK-2 | grep `taskReadme/*.md` sin `^status: (branching\|pushing\|ready_for_branch\|verified)` | ✅ CHECKED — 0 ocurrencias; diffs de los 4 fixtures: solo `status`+`updated` (55 líneas cada uno, contenido intacto). |
| WU-CRS-1 | symlink resuelve a archivo regular existente | ✅ CHECKED — `playwright.config.ts -> frontend/playwright.config.ts`, target presente. |
| WU-CRS-1 | `PWAUTO_VIEWS` exporta 3 claves (`projectctl`, `home`, `project-workspace:test-tab`) | ✅ CHECKED — L10-18. |
| WU-CRS-1 | cada project declara `metadata.bundle_path` | ✅ CHECKED — L35-72. |
| WU-CRS-1 | (coord, opcional) `bunx playwright test --list` | ⏭ out-of-lane (no browser) → coordinator. |
| WU-CRS-2 | 5 archivos cross existen | ✅ CHECKED — todos presentes (AGENTS.md, README.md, agents_skills.md, task.md, .atl/skill-registry.md). |
| WU-CRS-2 | `task.md` ref. `task-flow-binding`/`tareas.md` sin catálogo paralelo | ✅ CHECKED — cita bloque v9.0.0 + path; sin tablas de machine values. |
| WU-CRS-2 | `agents_skills.md` + `.atl/skill-registry.md` nombran `projectctl-requirements` y `sandbox-runtime-policy` | ✅ CHECKED (ambas nombradas; `sandbox-runtime-policy` como *prevista* — I7). |
| WU-DOC-1 | bundle 5 secciones MUST + `criteria[]` PCT-* `{id,title,functional,coverage}` | ✅ CHECKED — 5 secciones (URL/Tab/Objetivo/Criterios/Diagrama); 28 criterios PCT-* válidos; estados/métodos del contrato. |
| WU-DOC-1 | `index.mmd` sibling presente | ✅ CHECKED — Mermaid válido. |
| WU-DOC-1 | entry `navigation.yaml` `{id: projectctl, kind: view, bundle: views/projectctl/index}` | ✅ CHECKED — nodo agregado (diff). |
| WU-DOC-1 | `patchBundleCoverage(bundle_path=...)` sin `error` (IDs estables) | ⏭ out-of-lane (requiere backend deps / fase 3); revisión estructural aquí: IDs únicos y estables. |
| WU-DOC-1 | `quality-plan.md`/`quality-status.md` ausentes | ✅ CHECKED — `docs/01-product/` vacío (eliminados en working tree; `git rm` del cierre). |
| WU-ENT-1 | overlays con `frontend`/`api`, `target: prod\|dev`, `"${FRONTEND_PORT}:4321"`, edge external + aliases | ✅ CHECKED — `compose.yml` (frontend target prod, alias `colpruebas-origin`); `compose.dev.yml` (target dev, alias `test-colpruebas-origin`); edge `external: true` name `mis-proyectos-edge`; sin service `tunnel` principal. |
| WU-ENT-1 | `docker-compose*.yml` ausentes | ✅ CHECKED — no existen en el árbol (eliminados; `git rm` del cierre). |
| WU-ENT-1 | Dockerfiles `AS prod`/`AS dev`; `.env.example` `FRONTEND_PORT=4321` | ✅ CHECKED — diffs confirman ambos. |
| WU-ENT-1 | `.env`/`.env.dev` `FRONTEND_PORT=4321` (local, exclude) | ✅ CHECKED — ambos literal 4321; gitignored, fuera de `git status`. |
| WU-ENT-1 | (f3) `projectctl env validate` / `status` / R-007 | ⏭ out-of-lane → WU-CLI-VAL / WU-VER-UNITS. |
| WU-ENT-2 | 3 docs existen; `tunnel.md` declara ambos alias + `TUNNEL_NOT_PUBLISHABLE` + accionables; `entornos.md` FRONTEND_PORT obligatorio + overlays canónicos | ✅ CHECKED — líneas 29/30 (alias), 37/49 (guardrail), sección remediation; entornos.md §2. |
| WU-ENT-3 | SKILL.md existe; reglas no-docker + projectctl-only (grep `projectctl`, sin exposición docker) | ✅ CHECKED — skill con frontmatter estándar, regla no-docker dura, regla projectctl-only, escalación. |
| WU-ENT-3 | (f3/4) R-007 resuelve el path; registry/agents_skills la listan | ⏭ out-of-lane (parcial: nombrada como prevista — I7). |
| WU-TST-1 | `check` exit 0 sin criterio implemented con Unit+PW-AUTO ambos missing; exit != 0 identificando bundle+criterio | ✅ CHECKED (estructural; ejecución por apply lane, exit 0 observado) + ⏭ re-ejecución fase 3 (WU-VER-UNITS). Condicionado a W1/W2. |
| WU-TST-1 | `run --method=unit --target=projectctl --persist` produce layout `{unit,pwauto}/{junit.xml,results.json,summary.json}` + `criteria[]` sin borrar 46 runs | ⚠️ PARCIAL — layout verificado por apply (46→47→46); `criteria[]` poblado inalcanzable para PCT-* por W2 y bloqueado por W1/W2 para evidencia real. |
| WU-TST-1 | `.test.ts` sin `// @ac` rechazado (exit 2) | ✅ CHECKED — `assertAcHeader`/`assertAcHeaderSpec` implementados (L102-126); exit 2 observado por apply lane. |
| WU-TST-1 | write-back actualiza `criteria[].coverage` | ⚠️ PARCIAL — ruta implementada (lazy import, bundle_path explícito); requiere backend deps y ejecución real (W1); verificar en fase 3. |
| WU-TST-1 | `.gitignore` contiene `.runtime/` y `frontend/test-results/` | ✅ CHECKED. |

## 5. Architecture / maintainability / API-safety review

- **AD-06 anti-duplication**: PASS parcial — el runner importa `AC_HEADER_LINE_RE` /
  `extractAcTokensFromPlaywright` (ac-header.ts), `buildInventory` (test-inventory.ts) y el tipo
  `AppMapCoverageState` + `patchBundleCoverage` lazy (coverage-writer.ts); exports verificados en
  los primitivos. La duplicación residual es el discovery de headers en el runner
  (`readHeader`/`extractCriteria`) como espejo defensivo, acotado y documentado.
- **Jerarquía / dead code**: sin archivos huérfanos; las 2 projections se consumen solo como
  data-derived (sin lógica de negocio). `RETIRED_ALIASES` (34) coherente con el contexto inyectado.
- **API/runtime safety**: compose edge external preservado sin cambios de valor (PCT-98);
  Dockerfiles con stage nombrado requerido por `build.target`; `docker-compose*.yml` fuera del
  árbol → ninguna ruta operativa los referencia (grep de rutas operativas sin hits). El runner
  no ejecuta procesos externos (sin `spawn`) → sin riesgo de command injection en la superficie
  nueva.
- **Deprecated/risky usage**: ninguno (sin APIs deprecadas en la superficie tocada). El parseo
  regex de `frontend/playwright.config.ts` en `resolveBundlePath` (L64-80) es frágil pero
  defensivo (fallback `views/<view>/index`).

## 6. Doc/code drift

- `apply-WU-TST-1.md` declara "Deviations: sin otras desviaciones" pero omite W1 y W2 → drift
  de reporte entre implementación y diseño (ver W1/W2).
- `docs/00-context/agents_skills.md` + `.atl/skill-registry.md` listan `sandbox-runtime-policy`
  como *prevista* aunque ya está instalada (I7, WU-REG la resuelve).
- `playwright/TEST_PLAN.md` `testDir` note (I1) documentado correctamente como pendiente fase 3.
- Locator pin `9.0.0` + projections presentes: coherentes con el binding citado por docs (task.md,
  AGENTS.md, índice) — sin drift.

## 7. File-surface / delivery notes (para el coordinador)

- `exclude from commit`: `.env`, `.env.dev` (gitignored, AD-03), `.runtime/**` +
  `frontend/test-results/.last-run.json` (trackeados → `git rm -r --cached` en WU-DELIVERY).
- `git rm` del cierre: `docker-compose.yml`, `docker-compose.dev.yml`,
  `docs/01-product/quality-plan.md`, `docs/01-product/quality-status.md` (físicamente eliminados
  por apply; staging pendiente del coordinador).
- Pre-existing out-of-scope (documentados en índice §18/§19): `.agents/skills/coordinador/SKILL.md`,
  `.opencode/*`, `taskReadme/2026-04-17-test-task-for-state-pushing-verify-pwcli.md` (D),
  `taskReadme/2026-08-04-asd.md` (D) — NO pertenecen a los 9 WUs; excluir del staging salvo
  decisión explícita.

## 8. Verdict

**`code_review_result`: `failed`** — 2 hallazgos warning (W1, W2) en el componente central de
AC-003 (`scripts/test-runner.ts` + discovery) violan contratos de diseño (§5.1/§3.1/§8) y
comprometen el gate `no_known_functional_or_code_quality_defect`. **Routing**: `code_issue` →
owner `sdd-apply-code-medium` (WU-TST-1); alternativa coordinada: aceptación explícita de scope
reducido del runner (validación+persistencia; ejecución real en fase 3) + re-verificación.

**Escenario de aceptación alternativo (decisión del coordinador)**: si se acepta que la
ejecución real de tests vive en fase 3 (WU-VER-UNITS ejecuta `bun test` directo y el gate
`check` es coverage-declaration), entonces el único bloqueante restante es la extensión de
discovery de `frontend/__tests__` (W2) para que `criteria[]` se pueble — 1 línea en
`test-inventory.ts` o en el runner al aplicar WU-TST-2.

---

**criteria_covered**: AC-001..AC-005 (verificación estática completa; validación runtime
env/status/doctor/gate diferida a fase 3 — WU-CLI-VAL/WU-VER-UNITS)
**next_recommended**: rework WU-TST-1 (`sdd-apply-code-medium`, `code_issue`) o decisión de
scope del coordinador + re-lanzar `sdd-verify-code`; NO transicionar a `p2_awaiting_acceptance`
hasta resolver W1/W2 (gate `code_review_passed` insatisfecho).

---

## 9. Re-verificación rev 2 — resolución W1/W2 (rework WU-TST-1)

> Lane: `sdd-verify-code` (rev 2) · Alcance: rework `WU-TST-1` rev 2 (apply-WU-TST-1.md §6) +
> los 9 WUs de fase 2 (regresión spot-check). Review-only; solo se escribió este artifact.
> Comandos usados (narrow scope autorizado rev-2): `git status --short`, `git diff --stat`,
> `ls`/reads read-only. NO se ejecutó bun/playwright/projectctl (gate runtime fase 3).
> Fuente de los hallazgos: sección §3 rev 1 (W1, W2) + routing `code_issue` → WU-TST-1 rev 2.

### 9.1 W1 — RESUELTO: `run` ahora ejecuta tests reales y deriva resultados reales

Evidencia en `scripts/test-runner.ts` (inspección directa del archivo, 820 líneas):

| Contrato (design §5.1/§3.1, PCT-91) | Implementación rev 2 | Verificado |
| --- | --- | --- |
| `run` invoca el comando de test del target | `runUnitExecution` (L302-337): `spawnSync('bun', ['test', ...files, '--reporter=junit', '--reporter-outfile=<tmp>'])` con cwd=repoRoot; `runPwautoExecution` (L354-391): `spawnSync('bunx', ['playwright', 'test', '--project=<pwa>', ...])` con project resuelto por regex de `PWAUTO_VIEWS` en `frontend/playwright.config.ts` (`resolvePwautoProject` L339-352). Scope al bundle del target vía `scopeToBundle` (L573-582) → solo tests con AC del bundle se ejecutan. | ✅ |
| Resultados/coverage derivados del output real | `parseJunitTotals` (L253-260) lee `tests/failures/skipped` del `<testsuites>` real; `fileJunitStats` (L264-275) por archivo; `deriveCriterionCoverage` (L279-300): `covered` solo si junit real tiene el archivo con tests>0 y 0 failures; `partial` si failures o archivos no ejecutados; `missing` si nada se ejecutó. `writeRunArtifacts` copia el junit REAL del comando a `{unit,pwauto}/junit.xml` (L453-454, `copyFileSync`). | ✅ |
| Sin `covered` fabricado | `deriveCriterionCoverage` L285-294 → `missing` (nunca `covered`) sin ejecución; loop de criteria L678 `executedCriteria.get(id) ?? 'missing'`; write-back (L480-482) solo `covered`/`partial`; `missing`/`not-applicable` jamás escritos (TST-11). Grep: `'covered'` literal solo en la derivación legítima (L297) y en el gate de aceptación (L721-722). | ✅ |
| `missing` cuando no hay tests | L285-294 (files vacíos o sin junit → missing); pwauto sin spec scoped → method result ran:false exit 0, criteria `missing` (L646-660) — "no-run no es fallo". | ✅ |
| Exit-code contract 0/1/2 | `2` = rechazo header `@ac` (L559-562) + CLI inválido (L503/L509) + usage (L815); `1` = fallo real de test (`anyMethodFailed` = outcome.ran && (failed>0 || exitCode>0), L612/L634) o fallo de persist (L702); `0` = ok (L706). | ✅ |
| Reject-without-`@ac` preservado | `assertAcHeader`/`assertAcHeaderSpec` + `AcRejectionError` (L106-130), escaneo previo a toda ejecución (L536-562) → rechazo fatal exit 2, nada se ejecuta/persiste (contrato invariante rev 1). | ✅ |

API-safety: `spawnSync` sin shell (`shell: false` implícito en L320/L374) con args array; el valor
`--project` proviene del regex del config y `target.view` solo entra a un nombre de tmpfile — sin
vector de command injection (sustituye la afirmación rev 1 "sin spawn", que quedó obsoleta).

Nota honesta: `writeJunit` (L393-401) escribe placeholder `tests="0"` solo cuando el comando real
no produjo junit (p.ej. fallo de spawn) — caso de fallo, no fabricación de cobertura.

### 9.2 W2 — RESUELTO: `frontend/__tests__` en ambos unit roots (design §8)

| Contrato (design §8) | Implementación rev 2 | Verificado |
| --- | --- | --- |
| `unitRoots` de `buildInventory` incluye `frontend/__tests__` | `backend/src/test-inventory.ts` L140: `join(projectsRoot, 'frontend', '__tests__')` — diff stat confirma `1 +` (1 línea, scope extendido por coordinador). | ✅ |
| `discoverUnitFiles` del runner incluye la misma raíz | `scripts/test-runner.ts` L169-173: roots `tests/back` + `backend/src` + `frontend/__tests__` (espejo exacto de `buildInventory`, AD-06). | ✅ |
| `buildInventory` descubre `frontend/__tests__/*.test.ts` | Archivos reales presentes en disco: `frontend/__tests__/home/home.test.ts` (header `// @ac HOME-01..HOME-05,HSS-01..HSS-04,HRM-01,HRM-02` en L1) y `frontend/__tests__/project-workspace-test-tab/proxy.test.ts` (header `// @ac PWT-01..PWT-12` en L1) → `listFilesRecursive` (regex unit file) + `extractUnitAcFromFile` (primeras 10-12 líneas) los capturan (HOME-01 / PWT-01). Evidencia de apply §6.3: harness `buildInventory` → `HOME-01 hasUnitTest: true`, `PWT-01 hasUnitTest: true`. | ✅ |

### 9.3 Regresión spot-check (resto de la implementación de fase 2 — intacta)

| Item | Estado |
| --- | --- |
| Locator `.agents/sdd-workflow.json` pin `binding_version: "9.0.0"` + 5 campos restantes (WU-TSK-1) | ✅ intacto (archivo leído: v9.0.0, contract_version/binding_path/machine_block_id/expected_binding_id/projections) |
| Bundle `docs/app-map/views/projectctl/index.md` 5 secciones MUST + `criteria[]` PCT-* `{id,title,functional,coverage}` (WU-DOC-1) | ✅ intacto (frontmatter criterios PCT-79..PCT-100+ visibles; no tocado por rework) |
| `navigation.yaml` registra `{id: projectctl, kind: view, bundle: views/projectctl/index}` (L28-31) | ✅ intacto |
| Overlays canónicos: `compose.yml` (frontend `target: prod`, `${FRONTEND_PORT}:4321`, edge external `mis-proyectos-edge`, alias `colpruebas-origin`) + `compose.dev.yml` (target dev, alias `test-colpruebas-origin`); `docker-compose*.yml` eliminados (D en git status) | ✅ intacto (WU-ENT-1) |
| Skill `sandbox-runtime-policy` instalada con reglas no-docker duras + projectctl-only (WU-ENT-3) | ✅ intacta (SKILL.md presente, L23-40) |
| `.gitignore` con `.runtime/` (L25) y `frontend/test-results/` (L26) | ✅ intacto (sin cambios en rev 2) |
| `package.json` `test:check` + `test`/`test:back`/`test:front` preservados | ✅ intacto (L6-9; sin cambios en rev 2) |

### 9.4 Contract review — WU-TST-1 (tasks.md fila 214) re-chequeado

- **Spec scenarios linked**: `REQ-TST-001..005` (runner CLI/exit codes, gate TST-13, TEST_PLAN, AC mandatorio, persistencia 46 runs + `@ac`) — ✓ usable.
- **Implementation contract**: `scripts/test-runner.ts` (CLI `run`/`check`, imports `ac-header.ts`/`coverage-writer.ts`/`test-inventory.ts`, header-discovery 10-12 líneas, rechazo exit 2, `--persist` layout canónico + `criteria[]`, write-back `bundle_path` explícito — "contratos design §5.1/5.3/5.4"), `package.json` `test:check` (AD-08), `playwright/TEST_PLAN.md`, `.gitignore` `.runtime/`+`frontend/test-results/` (AD-02) — ✓ usable (design §5.1 citado en el contrato es la base de W1; ahora cumplido).
- **Verify expects**: `bun run test:check` exit 0 / exit != 0; `run --method=unit --target=projectctl --persist` produce `summary.json` + `{unit,pwauto}/{junit.xml,results.json,summary.json}` sin borrar 46 runs; `.test.ts` sin `@ac` rechazado exit 2; write-back actualiza `criteria[].coverage` en el bundle; `.gitignore` con las 2 entradas — ✓ concretos.
- **Routing tag on failure**: `code_issue` — ✓ usable.
- → **Task contract gate: PASS** (no `blocked`, no `tasks_contract_missing`).

### 9.5 Verify-expects checklist WU-TST-1 (rev 2)

| Verify expect | Resultado (rev 2) |
| --- | --- |
| `check` exit 0 sin criterio `implemented` con Unit y PW-AUTO ambos missing; exit != 0 identificando bundle+criterio | ✅ CHECKED (estructural: `runCheck` L711-741 recorre `walkNavBundles`, mensaje `bundle :: criterio (Unit=..., PW-AUTO=...)` + candidato inventory; exit 0 observado por apply rev 2) · ⏭ re-ejecución fase 3 (WU-VER-UNITS). Ya NO condicionado a W1/W2. |
| `run --method=unit --target=projectctl --persist` produce `summary.json` con `criteria[]` + layout `{unit,pwauto}/...` sin borrar 46 runs | ✅ CHECKED (estructural: `writeRunArtifacts` materializa layout sin borrar; `criteria[]` derivado de junit real y del bundle; aplica rechazo exit 2 pre-ejecución por `endpoints.test.ts` legacy — conocido, fase 3 sanea) · ⏭ corrida real fase 3 (runtime gate). Ya NO bloqueado por W1/W2. |
| `.test.ts` sin `// @ac` rechazado (exit 2) | ✅ CHECKED — `assertAcHeader`/`assertAcHeaderSpec` (L106-130) + return 2 (L559-562); exit 2 observado por apply rev 2, sin persistir. |
| write-back actualiza `criteria[].coverage` | ✅ CHECKED (estructural: L468-487 — lazy import `patchBundleCoverage`, `bundle_path` explícito, solo `covered`/`partial`, `'not found'` no fatal) · ⏭ ejecución real con backend deps (`gray-matter`) fase 3 (WU-VER-UNITS). |
| `.gitignore` contiene `.runtime/` y `frontend/test-results/` | ✅ CHECKED — L25-26 (verificado en esta lane). |

### 9.6 Findings rev 2

**Resueltos (rev 1 → rev 2)**:
- ~~W1 (warning)~~ → **RESUELTO** (evidencia §9.1). `run` ejecuta `bun test`/`bunx playwright test` reales y deriva `criteria[]`/junit/results del output real; sin `covered` fabricado; exit codes 0/1/2 íntegros.
- ~~W2 (warning)~~ → **RESUELTO** (evidencia §9.2). `frontend/__tests__` en `unitRoots` (backend) y en `discoverUnitFiles` (runner); `buildInventory` descubre los archivos reales existentes.

**Info (arrastradas de rev 1, sin cambios; NO bloquean fase 2)**:
- I1 — `testDir` de `frontend/playwright.config.ts` (`./tests`) vs specs en `tests/front/tests/` → fase 3.
- I2 — `.runtime/test-results/**` + `frontend/test-results/.last-run.json` trackeados → `git rm -r --cached` en WU-DELIVERY (delivery, no defecto de apply).
- I3 — `frontend-policy`/`backend-api-policy` no instaladas (gap conocido; deliverables de la task).
- I4 — validaciones runtime/gate (`projectctl env validate`/`status`/`doctor`, `bun run test:check`, `--persist` con deps) → fase 3 WU-CLI-VAL/WU-VER-UNITS.
- I5 — headers con rango (`// @ac HOME-01..HOME-05`) vs captura single-token (`AC_HEADER_LINE_RE`): los archivos pre-existentes `frontend/__tests__/**` (proxy mirrors, fuera de owned scope de esta task) capturan solo el primer ID (`HOME-01`/`PWT-01`). Confirmado vigente; coordinar en fase 3 (WU-TST-2 usa IDs individuales).
- I6 — projections hand-generadas (generador `taskflow:generate` ausente) — defensible, proyección no autoritativa.
- I7 — `sandbox-runtime-policy` listada como *prevista* en docs/registry → WU-REG (fase 4).

### 9.7 Verdict rev 2

**`code_review_result`: `passed`** — W1 y W2 verificados como resueltos en código (inspección
directa) + evidencia narrow de apply rev 2; sin nuevos hallazgos warning/critical; contrato de la
unit usable; regresión spot-check de la implementación de fase 2 intacta. Gate `code_review_passed`
SÍ satisfecho → transición `p2_code_review` → `p2_awaiting_acceptance` habilitada (registro de
aceptación funcional → `p2_accepted`). Los Verify expects con ejecución real quedan correctamente
diferidos a fase 3 (WU-VER-UNITS / WU-CLI-VAL), donde se re-corre el gate con deps backend.

**File-surface (rev 2)**: único path tocado por esta lane = `verify-code.md` (phase artifact,
superficie de commit normal). Sin paths gitignored/generados/local-only en mi superficie.

---
**criteria_covered (rev 2)**: AC-001..AC-005 (verificación estática completa; validación runtime
env/status/doctor/gate diferida a fase 3 — WU-CLI-VAL/WU-VER-UNITS)
**next_recommended (rev 2)**: `p2_awaiting_acceptance` (gate `code_review_passed` satisfecho) →
aceptación funcional → `p2_accepted`; fase 3 `sdd-apply-unit-tests` (WU-TST-2) + `sdd-verify-units`
(WU-VER-UNITS) con backend deps.