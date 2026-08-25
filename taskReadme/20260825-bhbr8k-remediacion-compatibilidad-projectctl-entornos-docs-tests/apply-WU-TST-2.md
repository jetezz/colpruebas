# APPLY-WU-TST-2 — Evidencia de implementación (AC-003 / AC-004)

> Lane: `sdd-apply-unit-tests` · Unit: `WU-TST-2` · apply_lane: `unit-tests`
> Objetivo: AC-003/AC-004 — crear tests bundle projectctl + sot-coherence R-007
> (layout flat AD-09; header `// @ac` obligatorio).
> Estado de la unit: `done` · Archivo de evidencia: este artifact.
> Estándar inyectado: `projectctl-requirements` v10.0.0 / binding `task-flow-binding` v9.0.0.
> Framework: `bun test` · Skill resolution: `injected-paths` (9 skill files cargados).

---

## 1. Pre-implementation gate (unit-tests)

| Gate | Resultado | Evidencia |
| --- | --- | --- |
| **Scope** | PASS | Unit `WU-TST-2`, `apply_lane: unit-tests`; archivos owned exactos: `frontend/__tests__/projectctl-bundle.test.ts` (NEW), `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` (NEW). Nada más tocado (no código producto, no docs, no índice, no git/gh/docker/browser, no `bun test`). |
| **Spec linkage** | PASS | REQ-TST-006 (layout canónico flat AD-09: bundle tests a nivel view, `// @ac` header); REQ-TST-007 (`projectctl-*-bundle.test.ts` valida bundle; `sot-coherence.test.ts` gate R-007); REQ-TSK-004 (R-007 valida locator v9, projections, fuentes, sin catálogos duplicados, aliases retirados fuera de status). |
| **Implementation target** | PASS | Concreto: ambos archivos `.test.ts` bajo `frontend/__tests__/` (flat, AD-09) con header `// @ac <ID>` en la línea 1 (primeras 10 líneas). Aserciones reales contra el estado actual del repo (bundle/navigation/locator/projections). |
| **Verify expects** | PASS | Ambos `bun test` (file-scoped) deben quedar verdes; ambos declaran `// @ac <ID>` en primeras 10 líneas (el runner `assertAcHeader` valida el rango; si no, exit 2). Verificación de ejecución = lane `sdd-verify-units` (WU-VER-UNITS), NO se ejecutó en esta lane. |
| **Failure routing** | PASS | `unit_test_issue` en caso de fallo. |

Dependencias `WU-TST-1` / `WU-DOC-1` / `WU-TSK-1` resueltas (done). Conflict group `test-pipeline`, modo `serial`.

---

## 2. Implementación

### 2.1 Contexto leído (source of truth)

- **Skills** (ordered aggregate cargado): `sdd-apply-unit-tests/SKILL.md`,
  `sd-protocol/{sdd-phase-common,workflow-runtime-context,apply-work-unit-schema,apply-lane-common}.md`,
  `projectctl-requirements/{SKILL.md, references/tareas.md, references/test.md, references/maintenance.md}`.
- **Specs/design**: REQ-TST-006/007, REQ-TSK-004 (`spec.md` §4.1/§5.2); design §AD-09 (layout
  flat), §Table de archivos (`projectctl-bundle.test.ts` header `// @ac PCT-83..PCT-88`,
  `sot-coherence.test.ts` gate R-007). tasks.md row 226 (contrato exacto del WU).
- **Patrón de tests existente** (estilo `bun:test`): `frontend/__tests__/home/home.test.ts`
  (header `// @ac HOME-01..HOME-05`), `frontend/__tests__/project-workspace-test-tab/proxy.test.ts`
  (`import { describe, expect, it } from 'bun:test'`, `Bun.YAML.parse` del frontmatter, rutas
  absolutas con `PROJECT_ID`).
- **Estado real del repo verificado (read-only)**:
  - Bundle `docs/app-map/views/projectctl/index.md` — 5 secciones MUST (`## 1. URL`…`## 5. Diagrama Mermaid`), frontmatter `criteria[]` con 24 criterios PCT-* (cada uno `{id,title,functional,coverage}`); PCT-83..88 `functional: implemented`; sibling `index.mmd` presente.
  - `docs/app-map/navigation.yaml` — entry `- id: projectctl` + `bundle: views/projectctl/index`.
  - Legacy `docs/01-product/quality-plan.md` / `quality-status.md` — ausentes (`docs/01-product/` no existe).
  - `.agents/sdd-workflow.json` — `binding_version: "9.0.0"`, `expected_binding_id: "projectctl-requirements.task-flow"`, `machine_block_id: "task-flow-binding"`, `contract_version: 1`, projection paths.
  - `frontend/src/views/projectctl/data/tareas-tab.view-model.ts` y `frontend/src/shared/sdd/task-flow.generated.ts` — ambas `AUTO-GENERATED … task-flow-binding v9.0.0`.
  - `.agents/skills/projectctl-requirements/generated/phase-state-schema.json` — `binding_version/binding_id` v9.
  - `active_sources.include` (8 paths) todos presentes; `active_sources.exclude` roots `openspec/proposals/specs/designs/tasks` ausentes del FS.
  - Binding en `references/tareas.md`: 1 open marker `<!-- task-flow-binding:start -->` (L144) + 1 close `<!-- task-flow-binding:end -->` (L898) + 1 fenced ```` ```json ````.
  - `taskReadme/*.md` (top-level .md): ningún frontmatter `status:` = `branching|pushing|ready_for_branch|verified` (los fixtures `2026-04-17-*-state-*.md` usan `status: done|blocked|failed`).
  - `STATUS_WRITABLE` generado: `['pending','planning','implementing','testing','documenting','done','blocked','failed']` — sin aliases retirados, comillas simples.

### 2.2 `frontend/__tests__/projectctl-bundle.test.ts` (NEW)

Header `// @ac PCT-83..PCT-88` (línea 1). Valida (REQ-TST-006/007, AD-09):

1. Existe el bundle `docs/app-map/views/projectctl/index.md`.
2. Declara las 5 secciones MUST (`## 1. URL` … `## 5. Diagrama Mermaid`).
3. Sibling `index.mmd` presente.
4. `navigation.yaml` registra `- id: projectctl` + `bundle: views/projectctl/index`.
5. Frontmatter `criteria[]` declara PCT-83..PCT-88 (`functional: implemented`).
6. Cada criterio del frontmatter cumple el contrato `{id, title, functional, coverage}` (coverage objeto no-null).
7. Prefix discipline PCT-88: todos los ids `^PCT-\d+$`.
8. `functional` ∈ {`implemented`, `not-applicable`}.
9. Ausencia de legacy `docs/01-product/quality-plan.md` / `quality-status.md` (también bajo `quality/`).

### 2.3 `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` (NEW)

Header `// @ac PCT-106..PCT-121` (línea 1). Gate R-007 (maintenance §4 / REQ-TST-007 /
REQ-TSK-004). Aserciones explícitas y acotadas (sin scanner genérico):

1. Binding file existe con **un único** bloque `task-flow-binding` (marcadores start/end únicos, fenced JSON parseable).
2. Binding identifica `binding_id=projectctl-requirements.task-flow`, `binding_version=9.0.0`, `model_version=1`.
3. Todo `active_sources.include` existe en FS.
4. Sin catálogo duplicado: los roots `active_sources.exclude` (`openspec/proposals/specs/designs/tasks`) NO existen como catálogo activo.
5. Locator pinnea `contract_version=1`, `binding_path`, `machine_block_id=task-flow-binding`, `expected_binding_id`, `binding_version=9.0.0`.
6. `binding_path` del locator resuelve a un file con el bloque `task-flow-binding:start`.
7. Projections presentes y coherentes v9: `phase-state-schema.json` (`binding_version/binding_id`), `tareas-tab.view-model.ts` + `task-flow.generated.ts` (ambos `task-flow-binding v9.0.0`).
8. Proyecciones del locator (`state_model`/`task_template`/`client_view_model`/`client_generated_ts`) existen.
9. Aliases retirados (`branching|pushing|ready_for_branch|verified`) NO están en `status.writable` del binding.
10. `STATUS_WRITABLE` generado NO reintroduce un alias retirado.
11. `taskReadme/*.md` (top-level) sin frontmatter `status:` retirado.

---

## 3. Verificación narrow (permitida — sin `bun test`)

> La ejecución de la suite es de la lane de verificación `sdd-verify-units` (WU-VER-UNITS). Esta
> lane hace verificación estática read-only de que cada aserción es REAL y pasa contra el estado
> actual del repo (evidencia capturada en §2.1).

| Check | Resultado | Evidencia |
| --- | --- | --- |
| Bundle 5 secciones MUST presentes | PASS | `grep` en `docs/app-map/views/projectctl/index.md` — `## 1. URL`…`## 5. Diagrama Mermaid` (L381/386/403/412/445). |
| `index.mmd` presente | PASS | `ls` confirma `docs/app-map/views/projectctl/index.mmd` (800 B). |
| `navigation.yaml` entry projectctl | PASS | `- id: projectctl` (L28) + `bundle: views/projectctl/index` (L30). |
| criteria[] PCT-83..88 implementados | PASS | `criteria[]` incluye PCT-83..88 con `functional: implemented` (L65–146). |
| Contrato `{id,title,functional,coverage}` y prefijo PCT-* | PASS | 24 criterios, todos con las 4 claves; `coverage` objeto; ids `^PCT-\d+$`. |
| Legacy quality-*.md ausente | PASS | `docs/01-product/` no existe (ausente `quality-plan.md`/`quality-status.md`). |
| Locator pin v9 + identity | PASS | `.agents/sdd-workflow.json`: `binding_version:"9.0.0"`, `expected_binding_id`, `machine_block_id`, `contract_version:1`. |
| active_sources.include presentes | PASS | 8/8 paths existen (verificado con `test -e`). |
| exclude roots ausentes | PASS | `openspec/proposals/specs/designs/tasks` no existen en FS. |
| Bloque machine único | PASS | 1 open marker (L144) + 1 close (L898) + 1 fenced ```` ```json ```` en `references/tareas.md`. |
| Projections presentes y coherentes v9 | PASS | `phase-state-schema.json`, `tareas-tab.view-model.ts`, `task-flow.generated.ts` — todos con binding v9.0.0. |
| Sin status retirado en taskReadme/*.md | PASS | `grep -rEn '^\s*status:\s*(branching\|pushing\|ready_for_branch\|verified)\b' taskReadme/*.md` → sin matches. |
| `STATUS_WRITABLE` sin aliases retirados | PASS | `task-flow.generated.ts` L27-37: solo `pending..failed`, comillas simples, sin retired. |

---

## 4. Devueltos / entregables

- **Archivos creados** (owned, exactos): `frontend/__tests__/projectctl-bundle.test.ts` (NEW),
  `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` (NEW). **Nada más**.
- **Spec/design criteria satisfechos**: REQ-TST-006, REQ-TST-007, REQ-TSK-004; design §AD-09
  (layout flat), §5.x (locator/projections), §8 (frontend/__tests__ discovery);
  maintenance §4 (R-007 bounded checks); PCT-83..88 (bundle), PCT-106..121 (R-007).
- **Task contract fields satisfechos**: implementation contract + verify expects (ver §1/§3).
- **Deviations del diseño**: ninguna. Ambos archivos siguen AD-09 flat (sin subcarpetas) y el
  header `// @ac` en línea 1 (primeras 10 líneas).
- **Unresolved follow-up**: la ejecución real de los 2 tests (y del gate `bun run test:check`)
  corresponde a `sdd-verify-units` (WU-VER-UNITS), que re-corre el gate con backend deps y
  confirma criteria coverage del bundle (PCT-83..88 / PCT-106..121 → `Unit: covered`).

---

## 5. File-surface check (§D sdd-phase-common)

- `frontend/__tests__/projectctl-bundle.test.ts` (NEW) → superficie de commit normal.
- `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` (NEW) → superficie de commit normal.
- Phase artifact `taskReadme/20260825-bhbr8k-.../apply-WU-TST-2.md` → commit normal.
- Sin `force-add` requerido; sin paths gitignored/generados entrega una ruta `frontend/__tests__`.
- No se ejecutaron comandos git/gh (mecánica de commit/PR = coordinador).

---

**criteria_covered**: AC-003, AC-004
**next_recommended**: `sdd-verify-units` (WU-VER-UNITS) → `bun test frontend/__tests__/**` +
`bun run test:check` (gate `coverage_gate_passed`), con backend deps instaladas; luego
transición `p3_test_running` → `p3_complete`.

---

## 6. Rework rev 2 — findings `sdd-verify-units` F1/F2/F3 (coordinator-extended scope)

> Re-lanzamiento de `WU-TST-2` (apply_lane `unit-tests`) en `fase_3_verificacion`/`p3_test_fixing`/
> `testing`, driven por `taskReadme/20260825-bhbr8k-.../verify-units.md` (verdict `failed` F1 +
> `blocked` F2 + advisory F3). Unit status rev 2: `done` (fixes aplicados; re-ejecución = lane
> `sdd-verify-units`). No se ejecutó `bun test` (prohibido en esta lane); verificación =
> estática read-only contra el estado real del repo. No git/gh, no índice (coordinator).

### 6.1 F1 — `sot-coherence.test.ts` L165-171 regex whole-file → scoped a `STATUS_WRITABLE`

- **Diagnóstico aceptado** (`verify-units.md` §2.1): la aserción `expect(generatedTsRaw ?? '')
  .not.toMatch(/^\s*'<alias>',?$/m)` buscaba sobre TODO el archivo generado
  `frontend/src/shared/sdd/task-flow.generated.ts` y colisionaba con la declaración legítima
  `RETIRED_ALIASES` (L263-267), que contiene `'branching'` etc. El producto es correcto
  (`STATUS_WRITABLE` real = 8 estados sin aliases retirados); el defecto era del TEST.
- **Fix aplicado** (solo `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts`):
  1. Helper nuevo `extractArrayLiteralMembers(raw, constName)` que parsea SOLO la lista literal
     de un const exportado (`export const <Name>… = [ … ] as const;`).
  2. La aserción `generated client projection STATUS_WRITABLE excludes retired aliases` fue
     reemplazada por `generated client projection STATUS_WRITABLE mirrors the binding writable
     statuses and excludes retired aliases`: parsea `STATUS_WRITABLE`, verifica
     `writableMembers` == `binding.status.writable` (coherencia binding↔proyección) y que
     ningún alias retirado ∈ miembros. Ya NO toca `RETIRED_ALIASES`.
  3. Aserción positiva nueva `generated client projection RETIRED_ALIASES preserves the retired
     status aliases`: parsea `RETIRED_ALIASES` y assert que los 4 aliases retirados
     (`branching|pushing|ready_for_branch|verified`) SÍ están presentes (inventario preservado).
- **Verificación estática (read-only)**: `extractArrayLiteralMembers(task-flow.generated.ts,
  'STATUS_WRITABLE')` → `['pending','planning','implementing','testing','documenting','done',
  'blocked','failed']` (8 miembros, igual que `binding.status.writable`, mismos valores y
  orden) → `not.toContain` de los 4 aliases pasa; `extractArrayLiteralMembers(…,
  'RETIRED_ALIASES')` → incluye los 4 aliases → `toContain` pasa. Sin `bun test` (verify lane).
  El helper regex no colisiona con otros const (busca el nombre del const exacto + `\b`).

### 6.2 F2 — `tests/back/endpoints.test.ts` sin header `// @ac` (coordinator scope extension)

- **Diagnóstico aceptado** (`verify-units.md` §2.4/§2.5): el runner rechaza repo-wide
  (`exit 2`, PCT-90) antes de cualquier ejecución/persist si un archivo unit descubierto no
  declara `// @ac <ID>` en las primeras líneas. `tests/back/endpoints.test.ts` era el ÚNICO
  headerless entre los 8 unit files descubiertos → bloqueaba `run --method=unit` (+ `--persist`
  y el write-back `patchBundleCoverage`).
- **Fix aplicado** (solo `tests/back/endpoints.test.ts`, header + comentario de mapeo; NADA
  más del archivo): `// @ac PCT-90 PCT-93` en la línea 1 (primeras 10 líneas).
- **Header mapping (por aserción/rol real del archivo)**:
  | ID | Justificación |
  | --- | --- |
  | `PCT-90` | Contrato AC mandatorio (`references/test.md` §PCT-90, TST-03/04): el archivo es el sujeto exacto del rechazo reproducido en `verify-units.md` §2.4/§2.5 — `assertAcHeader` (`scripts/test-runner.ts` L106-114) lo rechazaba sin header. Con este header el archivo cumple el contrato y desbloquea el `run` repo-wide. El header es la participación del archivo en PCT-90. |
  | `PCT-93` | Layout/discovery canónicos (`references/test.md` §PCT-93, TST-36): el archivo vive bajo `tests/back/`, uno de los tres unit roots canónicos (`backend/src/test-inventory.ts` `unitRoots` = `tests/back` + `backend/src` + `frontend/__tests__`, espejado por `discoverUnitFiles` del runner) — es descubierto y ejecutado por el runner/gate como parte del layout unit canónico. |
  - NO se declararon PCT-89/91/92/94: las aserciones del archivo (smoke de endpoints `/`,
    `/health`, `/api/status`) no ejercen el panel Test, el mapping CLI↔runner, la persistencia
    ni TEST_PLAN.md — declararlos sería sobre-claim de cobertura.
- **Verificación estática**: el resto del archivo queda byte-idéntico (solo se antepusieron 8
  líneas de header/comentario; imports y cuerpo intactos).

### 6.3 F3 — headers con rango (`PCT-83..PCT-88`, `PCT-106..PCT-121`) → IDs individuales explícitos

- **Diagnóstico aceptado** (`verify-units.md` §3 + I5 WU-TST-1 §6.6): `AC_HEADER_LINE_RE`
  captura solo el PRIMER token del header (`PCT-83..PCT-88` → token efectivo `PCT-83`);
  un run persistido marcaría `missing` los criterios restantes del rango.
- **Fix aplicado** — headers individuales space-separated (decisión coordinador):
  - `frontend/__tests__/projectctl-bundle.test.ts` → `// @ac PCT-83 PCT-84 PCT-85 PCT-86 PCT-87 PCT-88`
    (familia doc del bundle que el archivo valida: 5 secciones MUST, `criteria[]`, navigation,
    prefix, legacy out — PCT-83..88).
  - `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` → `// @ac PCT-106 PCT-107
    PCT-109 PCT-110 PCT-112 PCT-121` — el subset EXACTO del rango PCT-106..121 que el archivo
    valida, coincidiendo con el mapeo de `verify-units.md` §3 (fila AC-004/AC-005) y con los
    6 criterios `implemented`/`Unit: covered` de la familia tareas del bundle
    `docs/app-map/views/projectctl/index.md` (PCT-106/107/109/110/112/121; PCT-108/111/113..120
    NO están en `criteria[]` del bundle — el runner los descartaría en `scopeToBundle`):
    | ID | Aserciones del archivo que lo validan |
    | --- | --- |
    | `PCT-106` | Bloque machine único + identidad binding v9 + locator pin v9 + projections coherentes v9 (its 1,2,5,6,7,8). |
    | `PCT-107` | `status.writable` del binding sin aliases retirados + `STATUS_WRITABLE` generado sin aliases + frontmatter taskReadme sin status retirado (its 9,10,11). |
    | `PCT-109` | Integridad del registro de lanes del binding (bloque machine único; sin alias retirado como routing) (its 1,3,4). |
    | `PCT-110` | Gates del flujo evaluados contra binding v9: coherencia binding/projections guardada por las it 1,2,5,7. |
    | `PCT-112` | Persistencia/`active_sources` del binding: existencia de `active_sources.include` + proyecciones del locator (its 3,7,8). |
    | `PCT-121` | Precedencia del binding activo: paths canónicos presentes + proyecciones resolubles (its 3,7,8) — mapeo `references/sources.md` fila PCT-121 (`/artifact_store` + `/active_sources/include`, test path sot-coherence). |
- **Riesgo conocido (reportado al coordinador, NO resuelto en esta lane)**: con el runner
  ACTUAL (`AC_HEADER_LINE_RE` single-token, `backend/src/ac-header.ts` L1), un header
  space-separated sigue capturando solo el primer ID efectivo por archivo (`PCT-83` / `PCT-106`);
  los ids restantes de la lista quedarían `missing` en `criteria[]` de un run persistido salvo
  que otro archivo los declare. La captura multi-token es cambio de producto
  (`backend/src/ac-header.ts` + `scripts/test-runner.ts` `readHeader`/`scopeToBundle`),
  propiedad de `WU-TST-1` (code lane) — this lane solo alinea los headers a la convención de
  IDs individuales. Recomendación: coordinator decide seguir con el fix de runner o declarar
  cada criterio en su propio archivo (convención 1 criterio/archivo, TST-36).

### 6.4 Devueltos / entregables rev 2

- **Archivos modificados** (owned, exactos — coordinator-extended):
  | Archivo | Cambio |
  | --- | --- |
  | `frontend/__tests__/projectctl-bundle.test.ts` | F3: header `// @ac PCT-83..PCT-88` → `// @ac PCT-83 PCT-84 PCT-85 PCT-86 PCT-87 PCT-88` (línea 1). Nada más. |
  | `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` | F1: helper `extractArrayLiteralMembers` + aserción `STATUS_WRITABLE` acotada al bloque del const (+ igualdad con `binding.status.writable`) + aserción positiva `RETIRED_ALIASES`. F3: header → `// @ac PCT-106 PCT-107 PCT-109 PCT-110 PCT-112 PCT-121`. Nada más. |
  | `tests/back/endpoints.test.ts` | F2 (scope coordinator): header `// @ac PCT-90 PCT-93` + comentario de mapeo en primeras líneas (línea 1). Nada más del archivo. |
- **Sin tests ejecutados** (`bun test` prohibido; pertenece a `sdd-verify-units`).
- **Deviations**: ninguna respecto a la decisión inyectada. F3 ejecuta la decisión exacta del
  coordinador (listas space-separated); la limitación single-token del runner se reporta como
  riesgo/escalación (no es esta lane).
- **Unit status rev 2**: `done` — fixes F1/F2/F3 aplicados; re-verificación delegada.

### 6.5 File-surface check rev 2 (§D sdd-phase-common)

- `frontend/__tests__/projectctl-bundle.test.ts` — superficie de commit normal.
- `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` — superficie de commit normal.
- `tests/back/endpoints.test.ts` — superficie de commit normal.
- Phase artifact `taskReadme/20260825-bhbr8k-.../apply-WU-TST-2.md` (esta sección) — commit normal.
- Sin `force-add` requerido; sin paths gitignored/generados en la superficie tocada.
- No se ejecutaron comandos git/gh ni de runtime (mecánica de commit/PR = coordinador).

**criteria_covered (rev 2)**: AC-003, AC-004
**next_recommended (rev 2)**: re-lanzar `sdd-verify-units` (WU-VER-UNITS) → `bun test
frontend/__tests__/projectctl-bundle.test.ts frontend/__tests__/projectctl-requirements.sot-coherence.test.ts`
(esperado 20/20 + 1 nueva aserción = verde) → `bun run test:check` (gate) → `bun run
scripts/test-runner.ts run --method=unit --target=projectctl --persist` (write-back real, ya
sin rechazo PCT-90) → de ahí `p3_coverage_pending`/`p3_complete` (`coverage_gate_passed`).

---

## 7. Rework rev 3 — cierre del coverage-mapping F5 (PCT-91/92/94 + PCT-95..100)

> Re-lanzamiento de `WU-TST-2` (apply_lane `unit-tests`) en `fase_3_verificacion`/
> `p3_test_running`/`testing`, driven por `verify-units.md` rev 2 finding **F5** (22/24
> criterios `implemented` del bundle figuran `missing` en el run persistido: PCT-89/91/92/94
> y PCT-95..100 sin unit file que declare sus tokens) + WU-TST-1 rev 4 (multi-token
> `extractAcTokensFromBun` YA cableado en los extractores vivos: `readHeader` del runner y
> `extractUnitAcFromFile` del inventory). Unit status rev 3: `done`. No se ejecutó `bun test`
> (prohibido en esta lane); verificación = estática read-only contra el estado real del repo.
> No git/gh, no índice (coordinator), no código producto, no docs.

### 7.1 Alcance autorizado (coordinator, rev 3) — archivos owned NUEVOS

| Archivo | Header (línea 1) | Criterios declarados | REQs / diseño |
| --- | --- | --- | --- |
| `tests/back/test-runner-contract.test.ts` (NEW) | `// @ac PCT-91 PCT-92 PCT-94` | PCT-91, PCT-92, PCT-94 | REQ-TST-001/002/003/005; design §3.1/AD-08/AD-06 |
| `frontend/__tests__/projectctl-entorno.test.ts` (NEW) | `// @ac PCT-95 PCT-96 PCT-97 PCT-98 PCT-99 PCT-100` | PCT-95..PCT-100 | REQ-ENT-001..004/007; references/entorno.md PCT-95..100; design AD-01/AD-03/AD-07 |

> El runner (WU-TST-1 rev 4) captura TODOS los tokens de la línea `@ac` (espacio-separados);
> verificado abajo con el primitivo vivo `extractAcTokensFromBun` → los 9 tokens mapean 1:1.

### 7.2 Implementación — `tests/back/test-runner-contract.test.ts` (11 `it`)

Aserciones reales contra el estado actual (verificación estática en §7.4):

- **PCT-91 (runner CLI ↔ `projectctl test *`, mapping 1:1)**: el archivo
  `scripts/test-runner.ts` existe; su dispatcher acepta `run` y `check` (`cmd === 'run'` →
  `runCommand`, `cmd === 'check'` → `runCheck`); el subcomando `run` expone los flags
  canónicos `--method=`/`--target=` de `projectctl test *`; `package.json` declara
  `"test:check": "bun run scripts/test-runner.ts check"` (AD-08).
- **PCT-92 (persistencia atómica canónica)**: scan read-only de
  `.runtime/test-results/<projectId>/` — al menos un run-dir con `summary.json`
  (`criteria[]` + `methods[]`, `run_id` == nombre del dir) y `unit/junit.xml` presente
  (shape TST-08).
- **PCT-94 (`playwright/TEST_PLAN.md`)**: existe; declara la sección de tiers
  (`## Tiers de validación Playwright`, literales `PW-AUTO` y `PW-CLI`) y el mapping
  persistente archivo↔criterio (`## Cobertura persistente vigente` con filas
  `tests/front/tests/index.spec.ts` y `tests/front/tests/test-tab.spec.ts`).

### 7.3 Implementación — `frontend/__tests__/projectctl-entorno.test.ts` (16 `it`)

- **PCT-95 (docs prerrequisitos)**: `docs/00-context/entornos.md` y
  `docs/02-features/tunnel.md` existen; entornos.md menciona `FRONTEND_PORT`.
- **PCT-96 (overlays canónicos)**: `compose.yml`/`compose.dev.yml` parsean con
  `Bun.YAML.parse` y declaran servicios `frontend` + `api`; `frontend.build.target` =
  `prod` (prod) / `dev` (dev); `ports` incluye `"${FRONTEND_PORT}:4321"` en ambos.
- **PCT-97 (env validate)**: `.env.example`, `.env` y `.env.dev` existen y declaran
  `FRONTEND_PORT=4321` (regex `^FRONTEND_PORT=4321$` multilinea).
- **PCT-98 (edge alias)**: ambos overlays declaran la red `edge` `external: true` con
  `name: mis-proyectos-edge`; aliases `colpruebas-origin` (prod) /
  `test-colpruebas-origin` (dev) en `frontend.networks.edge.aliases`.
- **PCT-99 (sandbox skill)**: `.agents/skills/sandbox-runtime-policy/SKILL.md` existe;
  menciona `projectctl`, la regla no-docker (`docker.sock`, `docker: command not found`) y
  el control exclusivo (`exclusivamente** vía \`projectctl\``).
- **PCT-100 (FRONTEND_PORT obligatorio)**: `.env.example` declara `FRONTEND_PORT=4321` y
  NO declara ningún valor numérico distinto de 4321.

### 7.4 Verificación narrow (permitida — SIN `bun test`)

> La ejecución de la suite es de `sdd-verify-units` (WU-VER-UNITS). Esta lane verifica
> estáticamente (read-only) que cada aserción es REAL y pasa contra el estado actual.

| Check | Resultado | Evidencia |
| --- | --- | --- |
| Tokens extraídos del header (primitivo vivo `extractAcTokensFromBun` sobre `.slice(0,12)` como `readHeader`) | PASS | `test-runner-contract.test.ts` → `["PCT-91","PCT-92","PCT-94"]`; `projectctl-entorno.test.ts` → `["PCT-95","PCT-96","PCT-97","PCT-98","PCT-99","PCT-100"]` (multi-token rev 4 efectivo). |
| Runner dispatcher `run`/`check` | PASS | `scripts/test-runner.ts` L812-813: `if (cmd === 'check') return runCheck();` / `if (cmd === 'run') return runCommand(args.slice(1));`; `function runCommand` L491, `function runCheck` L714. |
| Flags canónicos `--method=`/`--target=` | PASS | 8 ocurrencias en `scripts/test-runner.ts` (CLI canónica §5.1 / PCT-91). |
| Gate `test:check` → runner check | PASS | `package.json` L9: `"test:check": "bun run scripts/test-runner.ts check"`. |
| Layout canónico persistido (PCT-92) | PASS | `.runtime/test-results/511a017a-.../` = 47 run-dirs; 30 con `summary.json` (`criteria[]`+`methods[]`) + `unit/junit.xml`; ejemplo `9576725e-…` con `run_id` == dir name. |
| TEST_PLAN.md tiers + mapping (PCT-94) | PASS | `## Tiers de validación Playwright` (L13), `PW-AUTO`/`PW-CLI` (L17-18), `## Cobertura persistente vigente` (L28) con filas `index.spec.ts` (L35) y `test-tab.spec.ts` (L36). |
| Overlays canónicos (PCT-96) | PASS | `Bun.YAML.parse` de `compose.yml`: services `[frontend, api]`, `frontend.build.target=prod`, `ports=["${FRONTEND_PORT}:4321"]`; `compose.dev.yml`: `target=dev`, mismo puerto. |
| Env `FRONTEND_PORT=4321` (PCT-97/100) | PASS | `.env.example`, `.env`, `.env.dev` — los 3 con `FRONTEND_PORT=4321` (regex multilinea). |
| Red edge + aliases (PCT-98) | PASS | Ambos overlays: `edge: {external:true, name:"mis-proyectos-edge"}`; aliases `colpruebas-origin` (prod) / `test-colpruebas-origin` (dev). |
| Docs prerrequisitos (PCT-95) | PASS | `docs/00-context/entornos.md` (8× `FRONTEND_PORT`) + `docs/02-features/tunnel.md` presentes. |
| Sandbox skill (PCT-99) | PASS | `sandbox-runtime-policy/SKILL.md` contiene `projectctl` (múltiple), `docker.sock`, `docker: command not found`, `exclusivamente** vía \`projectctl\``. |
| Load-safety de los archivos nuevos | PASS | Solo imports stdlib (`bun:test`, `node:fs`, `node:path`) + `Bun.YAML.parse` built-in → NO dependen de `express`/`cors` ni de `node_modules` (evita la clase de load-error I6 de `endpoints.test.ts` en el `run` del runner). |

### 7.5 Devueltos / entregables rev 3

- **Archivos creados** (owned, exactos — coordinator rev 3): `tests/back/test-runner-contract.test.ts`
  (NEW, 11 `it`, header `// @ac PCT-91 PCT-92 PCT-94`); `frontend/__tests__/projectctl-entorno.test.ts`
  (NEW, 17 `it`, header `// @ac PCT-95 PCT-96 PCT-97 PCT-98 PCT-99 PCT-100`). **Nada más** (no
  código producto, no docs, no índice, no otros tests).
- **Spec/design criteria satisfechos**: REQ-TST-001/002/003/005 (PCT-91/92/94);
  REQ-ENT-001..004/007 (PCT-95..100); design §3.1/AD-06/AD-08/AD-01/AD-03/AD-07;
  references/test.md §PCT-91/92/94 + references/entorno.md §PCT-95..100.
- **F5 impactado**: los criterios PCT-91/92/94 y PCT-95..100 pasan de "ningún archivo unit
  declara el token" a "declarados por unit file" — el run persistido podrá mapearlos a
  `covered` (el write-back TST-11 solo escribe `covered`/`partial`; la ejecución final la
  certifica `sdd-verify-units`).
- **Deviations del diseño**: ninguna respecto a la instrucción inyectada (headers
  individuales espacio-separados, archivos new bajo `tests/back/` y `frontend/__tests__/`
  flat AD-09).
- **Unresolved follow-up**: PCT-89 sigue sin unit file que declare su token (fuera del
  alcance de esta rev; recomendación: reclass doc-lane del coverage o archivo dedicado);
  PCT-90/93 → `endpoints.test.ts`; PCT-83..88 → `projectctl-bundle.test.ts`;
  PCT-106/107/109/110/112/121 → `sot-coherence.test.ts`.

### 7.6 File-surface check rev 3 (§D sdd-phase-common)

- `tests/back/test-runner-contract.test.ts` — superficie de commit normal (nuevo, tests/back
  es unit root canónico; imports stdlib-only).
- `frontend/__tests__/projectctl-entorno.test.ts` — superficie de commit normal (nuevo, flat
  AD-09; imports stdlib-only + `Bun.YAML.parse`).
- Phase artifact `taskReadme/20260825-bhbr8k-.../apply-WU-TST-2.md` (esta sección) — commit normal.
- Sin `force-add` requerido.
- **Riesgo delivery-surface (reportado, NO resoluble en esta lane)**: las aserciones PCT-97
  dependen de `.env` y `.env.dev` LOCALES — gitignored, `exclude from commit` (AD-03). En un
  checkout limpio/CI sin esos archivos locales, los 2 `it` de `.env`/`.env.dev` fallarían; la
  firma commitada es `.env.example` (assert cubierto igualmente) y la validación runtime es
  `projectctl env validate` (WU-CLI-VAL, coordinator). Decisión del coordinador: mantener la
  aserción (estado local del ambiente de ejecución) o parametrizarla.
- No se ejecutaron comandos git/gh ni de runtime (mecánica de commit/PR = coordinador).

**criteria_covered (rev 3)**: AC-001 (PCT-95..100 declarados por unit file), AC-003
(PCT-91/92/94 declarados por unit file)
**next_recommended (rev 3)**: doc-lane reclass PCT-89 → re-lanzar `sdd-verify-units`
(WU-VER-UNITS) final: `bun test tests/back/test-runner-contract.test.ts
frontend/__tests__/projectctl-entorno.test.ts` (+ suite existente) → `bun run test:check`
(gate) → `bun run scripts/test-runner.ts run --method=unit --target=projectctl --persist`
(write-back real con PCT-91/92/94 + PCT-95..100 mapeados) → `p3_coverage_pending` /
`p3_complete` (`coverage_gate_passed`).
