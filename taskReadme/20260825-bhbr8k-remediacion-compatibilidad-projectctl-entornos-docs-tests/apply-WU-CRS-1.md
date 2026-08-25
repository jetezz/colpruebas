# APPLY-WU-CRS-1 — Evidencia de implementación (AC-005 CROSS)

> Lane: `sdd-apply-code-medium` · Unit: `WU-CRS-1` · apply_lane: `code-medium`
> Objetivo: AC-005 — crear `frontend/playwright.config.ts` (target del symlink raíz) — repara
> symlink roto y habilita discovery canónico para runner/gate (AD-05).
> Estado de la unit: `done` · Archivo de evidencia: este artifact.
> Estándar inyectado: `projectctl-requirements` v10.0.0 / binding `task-flow-binding` v9.0.0.

---

## 1. Pre-implementation gate (code-medium — full 5-check)

| Gate | Resultado | Evidencia |
| --- | --- | --- |
| **Scope** | PASS | Unit `WU-CRS-1`, `apply_lane: code-medium`, archivo owned exacto: `frontend/playwright.config.ts` (NEW). Nada más tocado. |
| **Spec linkage** | PASS | REQ-CRS-006 (symlink resuelve a target existente); REQ-TST-008 (config resoluble por runner/`bunx playwright test`, declara `PWAUTO_VIEWS`). |
| **Implementation target** | PASS | Concreto: crear `frontend/playwright.config.ts` derivado del contrato canónico de `playwright.config.cjs` (projects `pwauto-home`/`pwauto-test-tab` + `pwauto-projectctl`, `metadata.bundle_path`, `base_url`, `outputDir: 'playwright/test-results'`, JUnit reporter) + export `PWAUTO_VIEWS` con claves `projectctl`, `home`, `project-workspace:test-tab` (design §5.6). |
| **Verification target** | PASS | Symlink `playwright.config.ts` resuelve (target es archivo regular existente); `frontend/playwright.config.ts` exporta `PWAUTO_VIEWS` con las 3 claves de vista y cada project declara `metadata.bundle_path`. |
| **Failure routing** | PASS | `code_issue` en caso de fallo. |

Cross-cutting: unit nueva config (1 archivo, 1 superficie); deriva del contrato canónico
Playwright del repo. Sin surfaces migration/security/runtime. Contract fields todos presentes
y concretos. Dependencia `WU-TSK-1` resuelta (done). Conflict group `playwright-config`, modo
serial, sin dependencias sin resolver.

---

## 2. Implementación

### 2.1 Contexto leído (source of truth)

- Contrato canónico: `playwright.config.cjs` (raíz) — projects `pwauto-home` (grep `/@home\b/`,
  bundle_path `views/home/index`), `pwauto-test-tab` (grep `/@(project-workspace-test-tab|test-tab)\b/`,
  bundle_path `views/project-workspace/features/test-tab`), `outputDir: 'playwright/test-results'`,
  reporter JUnit a `playwright/test-results/.last-run.junit.xml`, `baseURL` default
  `http://localhost:4321` vía `process.env.BASE_URL`.
- Diseño §5.6 `PWAUTO_VIEWS` contract: mapa `view[:feature] → {project, bundle_path, grep}` con
  al menos `projectctl` (`pwauto-projectctl`, `views/projectctl/index`, `/@projectctl\b/`), más
  `home` y `project-workspace:test-tab` (ya existentes en `.cjs`).
- Specs: REQ-CRS-006 / REQ-TST-008.
- Especs existentes en `frontend/tests/`: `@home`, `@project-workspace-test-tab` (coherentes con
  los greps de `pwauto-home`/`pwauto-test-tab`).

### 2.2 Archivo creado: `frontend/playwright.config.ts` (NEW)

Config TypeScript que el symlink raíz `playwright.config.ts -> frontend/playwright.config.ts`
resuelve. Hidden del fallback CJS/ESM (AD-05 rationale #2: el runner usa la config canónica).
Estructura:

- `import { defineConfig } from '@playwright/test'` (config TS nativa del entorno frontend).
- `export const PWAUTO_VIEWS` con las 3 claves de vista:

| Clave | project | bundle_path | grep |
| --- | --- | --- | --- |
| `projectctl` | `pwauto-projectctl` | `views/projectctl/index` | `/@projectctl\b/` |
| `home` | `pwauto-home` | `views/home/index` | `/@home\b/` |
| `project-workspace:test-tab` | `pwauto-test-tab` | `views/project-workspace/features/test-tab` | `/@(project-workspace-test-tab\|test-tab)\b/` |

- `defineConfig({ ... })` con:
  - `testDir: './tests'` — **NOTA**: el `.cjs` usaba `./frontend/tests` porque vivía en la raíz.
    Como `frontend/playwright.config.ts` vive en `frontend/`, `./tests` resuelve al mismo path
    repo-root `frontend/tests` (Playwright resuelve `testDir` relativo al directorio del config).
    Equivalencia canónica preservada.
  - `fullyParallel: false`, `forbidOnly: !!process.env.CI`, `retries: 0`, `workers: 1`.
  - `outputDir: 'playwright/test-results'` y reporter `[['list'], ['junit', {outputFile:
    'playwright/test-results/.last-run.junit.xml'}]]` — hace que el runner
    `readOrder[i]=<REPO_ROOT>/playwright/test-results/.last-run.junit.xml` parsee el JUnit.
  - `use: { baseURL, trace: 'off' }` con `baseURL = process.env.BASE_URL || 'http://localhost:4321'`.
  - Los 3 projects (`pwauto-home`, `pwauto-test-tab`, `pwauto-projectctl`), cada uno con
    `metadata.bundle_path`, `metadata.view_id`, `metadata.feature_id`, `metadata.base_url`,
    `testIgnore: /auth\.setup\.ts/`, `workers: 1` y `grep` ligado a `PWAUTO_VIEWS` (single
    source of truth para projects ↔ vistas — evita drift entre `.cjs` heredado y el mapa).

### 2.3 Symlink raíz reparado

`playwright.config.ts` (symlink raíz, NO tocado — era roto por target inexistente) ahora
resuelve a un **archivo regular existente**: `frontend/playwright.config.ts`. `readlink`
confirma `frontend/playwright.config.ts`; `test -f frontend/playwright.config.ts` = yes.

---

## 3. Verificación (narrow, permitida)

Sintaxis/parse del archivo owned únicamente (sin `playwright test`, sin descargar browsers, sin
instalar, sin build):

| Check | Resultado | Evidencia |
| --- | --- | --- |
| Symlink resuelve | PASS | `readlink playwright.config.ts` → `frontend/playwright.config.ts`; `test -f frontend/playwright.config.ts` → archivo regular existente. |
| `PWAUTO_VIEWS` con 3 claves | PASS | Compiled output incluye `PWAUTO_VIEWS` con `projectctl`, `home`, `project-workspace:test-tab`. |
| 3 projects con `metadata.bundle_path` | PASS | `pwauto-projectctl`, `pwauto-home`, `pwauto-test-tab`; cada uno con `bundle_path` + `view_id`/`feature_id`/`base_url`. |
| TS sintaxis válida | PASS | `bun build --no-install --external '@playwright/test' frontend/playwright.config.ts` → `Bundled 1 module`, exit 0. Único "error" sin `--external` es la resolución de módulo `@playwright/test` (dependencia no instalada — no se instala en esta lane); no es error de sintaxis. |
| `outputDir` + JUnit reporter | PASS | `outputDir: 'playwright/test-results'`; reporter `['list']` + `['junit', {outputFile: 'playwright/test-results/.last-run.junit.xml'}]`. |
| `coordinator optional` `bunx playwright test --list` | NO ejecutado (delegado al coordinador) | Forbidden por authority de esta lane (no se descargan browsers; smoke list es coordinator-owned opcional, tasks.md §4.5 / WU-CRS-1 Verify expects). |

Nota sobre cobertura `projectctl`: no existe aún spec con tag `@projectctl` en
`frontend/tests/` (el bundle `views/projectctl` y su spec nacen en WU-DOC-1 y fase 3
respectivamente). La claves `projectctl` en `PWAUTO_VIEWS` y el project `pwauto-projectctl` se
declaran per design §5.6 anticipando esa cobertura; no ocasiona error de config (project con
`grep` sin specs candidatas solo no selecciona tests).

---

## 4. Devueltos / entregables

- **Archivos modificados**: `frontend/playwright.config.ts` (NEW). **Nada más**.
- **Spec/design criteria satisfied**: REQ-CRS-006 (symlink resuelve), REQ-TST-008 (config
  resoluble, declara `PWAUTO_VIEWS`), AD-05 (propuesta ejecutada), design §5.6 (PWAUTO_VIEWS
  contract).
- **Task contract fields satisfied**: implementación contract + verify expects (ver §1/§3).
- **Deviations del diseño**: `testDir` expresado como `./tests` (equivalente canónico al
  `./frontend/tests` del `.cjs`, relativo a la nueva ubicación del config en `frontend/`).
  Proyecto/project `pwauto-projectctl` referenciado vía `PWAUTO_VIEWS` para evitar duplicación
  (single source of truth). Sin otras desviaciones.
- **Unresolved follow-up**: `projectctl` spec/subrenderizado de `PWAUTO_VIEWS` sin cobertura
  real hasta WU-DOC-1 (bundle) + fase 3 (spec `@projectctl`). `bunx playwright test --list`
  smoke delegado a coordinator (opcional).

---

## 5. File-surface check (§D sdd-phase-common)

- Archivo tocado: `frontend/playwright.config.ts` (NEW) — superficie de commit normal del repo
  (no gitignored, no generado). Sin `force-add required`, sin `exclude from commit`, sin
  `policy review required`. El symlink raíz `playwright.config.ts` preexistía como entrada de
  commit normal (ahora con target válido).
- Phase artifact `apply-WU-CRS-1.md` bajo `taskReadme/` — superficie de commit normal.

---

**criteria_covered**: AC-005
**next_recommended**: por AD-10, `sdd-apply-doc` WU-CRS-2 (parallel-safe con WU-DOC-1);
luego WU-ENT-1 → WU-ENT-2/WU-ENT-3 → WU-TST-1 (serial, último).
