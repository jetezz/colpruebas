# DESIGN-1 — Diseño técnico (fase 2) — Remediación compatibilidad /projectctl (entornos, docs, tests)

> Lane: `sdd-design` (fase 2, unit `DESIGN-1`). Basado en propuesta aprobada
> (`proposal.md`, PROPOSE-1), specs delta (`spec.md`, SPEC-1, 30 REQs / 5 dominios,
> §8 con 5 decisiones abiertas) y exploración reconciliada (`explore-code.md`, EXPLORE-1).
> Estándar inyectado: `projectctl-requirements` v10.0.0 / binding `task-flow-binding` v9.0.0
> (`references/{standard,entorno,test,doc,tareas}.md`). YAGNI + repo patterns sobre
> preferencias genéricas: cada decisión se apoya en archivos reales leídos
> (`.gitignore`, `package.json`, `docker-compose*.yml`, `playwright.config.{cjs,js}`,
> `.agents/sdd-workflow.json`, `.env*`, `backend/src/{ac-header,coverage-writer,test-inventory}.ts`,
> `docs/app-map/{navigation.yaml,index.md}`, bundles `views/home`/`views/project-workspace`,
> `frontend/__tests__/**/*.test.ts`, `frontend/Dockerfile.{prod,dev}`, `.runtime/test-results/**`).
> Write autorizado: únicamente este artifact (`design`). No modifica código, docs, config ni tests.

---

## 1. Technical Approach

La remediación se implementa como **una sola rama feature con un único PR a `develop`**
(delivery `single-pr` v9.0.0), aplicando 5 frentes independientes por AC sobre el estado
real detectado (nada se asume vacío: `.runtime/test-results` ya tiene 46 run-dirs, 29 con
`unit/junit.xml`). El orden de aplicación es **AC-004 → AC-005 → AC-002 → AC-001 → AC-003**
por dependencias de gates y de resolución de herramientas:

1. **AC-004 (workflow base)** primero: el pin del locator a `9.0.0` y las projections
   regeneradas estabilizan la base de coordinación; el retiro de estados inválidos del
   frontmatter `taskReadme/*.md` elimina el ruido del guardrail de estados antes de tocar
   producto.
2. **AC-005 (prerrequisitos CROSS)** segundo: crea `AGENTS.md`, `README.md`,
   `docs/00-context/agents_skills.md`, `docs/04-process/task.md`, `.atl/skill-registry.md` y
   repara el symlink `playwright.config.ts` — sin la config Playwright resoluble, el runner
   de AC-003 no puede arrancar.
3. **AC-002 (bundle DOCS)** tercero: el bundle `views/projectctl` + `navigation.yaml` +
   `index.mmd` son el destino del write-back de cobertura (`patchBundleCoverage`) que el
   runner de AC-003 patchea. Primero el bundle, después el runner que lo cubre.
4. **AC-001 (ENTORNO)** cuarto: env + overlays canónicos + docs de entorno + skill
   `sandbox-runtime-policy`. Independiente del runner; se valida vía CLI `projectctl`
   (coordinator-owned) en fase 3.
5. **AC-003 (TEST)** quinto y último: runner unificado, gate `test:check`, `TEST_PLAN.md`,
   tests bundle/sot-coherence y completar la persistencia atómica. Se agrega al final para
   que el gate `test:check` nazca con sus dependencias ya presentes (bundle AC-002, config
   Playwright AC-005) y no quiebre en su primer commit.

**Principio rector**: reutilizar antes que duplicar. Los primitivos de infra de testing ya
existen en `backend/src/{ac-header.ts,coverage-writer.ts,test-inventory.ts}` y el runner
`scripts/test-runner.ts` los **importa directamente** (patrón repo: `coverage-writer.ts`
exporta `patchBundleCoverage` con rewite atómico cuerpo-preservante, y `ac-header.ts` los
regex `AC_HEADER_LINE_RE` / `PW_ANNOTATION_RE` que el runner debe reutilizar). El layout de
persistencia `.runtime/test-results/<projectId>/<run-id>/{unit,pwauto}/{junit.xml,results.json,summary.json}`
ya existe parcialmente con el shape canónico de `summary.json`
(`{run_id, started_at, finished_at, target:{view,feature,method}, passed, failed, skipped, criteria[], methods[]}`)
— se **completa la producción** de ese shape, no se redefine.

**Decisión de doble capa de runner (contexto)**: los tests `frontend/__tests__/**` existentes
son *proxy mirrors* que el runner del proyecto padre (plataforma `mis-proyectos`) descubre
globeando `frontend/__tests__/**/*.test.ts` desde REPO_ROOT. AC-003 exige que ESTE repo tenga
su propio runner unificado con contrato 1:1 con `projectctl test *`; el runner local
**espeja el contrato del runner padre** (misma CLI, mismo header-discovery, misma
persistencia) de modo que ambas capas conviven sin conflicto de paths ni de semántica.

---

## 2. Architecture Decisions

### AD-01 — Recrear `compose.yml`/`compose.dev.yml` canónicos y `git rm` los legacy (resuelve decisión abierta §8.1 de spec)

**Decisión**: NO `git mv` de `docker-compose*.yml` a los nombres canónicos. Se **recrean**
`compose.yml` (prod) y `compose.dev.yml` (dev) como archivos nuevos con contenido canónico y
se **eliminan** `docker-compose.yml` / `docker-compose.dev.yml` del árbol.

**Rationale**: (evidencia `docker-compose.yml`/`docker-compose.dev.yml` leídos)
1. REQ-ENT-004 exige que ninguna ruta operativa referencie los legacy — un `git mv` deja el
   archivo con nombre canónico pero cuyo diff sería un rewrite masivo igualmente (renombre
   de servicios `frontend-prod`→`frontend`, `dockerfile:`→`target:`, `api-prod`→`api`); el
   "rename" no preserva nada útil de historia aquí porque cambia la identidad del servicio.
2. Un `git rm docker-compose.yml` explícito documenta en el PR la eliminación de overlays
   no canónicos (REQ-ENT-004) y hace visible el cambio a revisores y al gate `AC-009`.
3. Los valores que SÍ deben preservarse (red `mis-proyectos-edge` `external: true` con key
   `edge` y alias `colpruebas-origin`/`test-colpruebas-origin`, mapeo `${FRONTEND_PORT}:4321`,
   watch/HMR de dev) se copian al archivo nuevo — preservación contractual PCT-98 sin
   dependencia del path legacy.
4. `git mv` mantendría el blob legacy en el diff como rename con contenido casi idéntico al
   nuevo, confundiendo la revisión de qué cambió realmente.

**Escenario cubierto**: REQ-ENT-002/003/004.

### AD-02 — Política `.gitignore`: `.runtime/` y `frontend/test-results/` se ignoran; `test-results/` raíz también (resuelve decisión abierta §8.2 de spec)

**Decisión**: agregar a `.gitignore` (evidencia: archivo actual solo ignora
`playwright/test-results/`, `test/playwright-results/`, `test/test-results/`; NO ignora
`.runtime/`, `frontend/test-results/` — `frontend/test-results/` existe y `.runtime/test-results/`
existe con 46 runs):
- `.runtime/` — artifacts runtime locales de corridas (`test-results/`, caches).
- `frontend/test-results/` — salida de specs Playwright locales.

**Rationale**: `.runtime/` es la persistencia atómica canónica generada por corrida (PCT-92);
los `junit.xml`/`results.json`/`summary.json` se regeneran en cada `--persist` y NO son
fuente de verdad (la SoT de cobertura es `criteria[].coverage` en los bundles, TST-11). Sin
el ignore, el runner nuevo de AC-003 colaría artefactos runtime en el commit — riesgo
declarado en spec §9/proposal §6.3. El write-back de cobertura se hace sobre los bundles
`docs/app-map/**` (commitados), no sobre `.runtime/`.

**Clasificación de entrega**: `.runtime/` y `frontend/test-results/` → `exclude from commit`
(no se stagean; se ignoran).

**Escenario cubierto**: REQ-TST-005 (política de ignorado), riesgo §9 spec.

### AD-03 — `.env` y `.env.dev` NO se commitean: `.env.example` es la referencia canónica commitada (resuelve decisión abierta §8.3 de spec)

**Decisión**: `.env` (raíz, NEW) y `.env.dev` (MODIFIED `FRONTEND_PORT=4324→4321`) se crean/
corrigen **en el working tree local** para habilitar `projectctl env validate` y el arranque,
pero se clasifican `exclude from commit` (ya gitignored, `.gitignore` líneas 1 y 22-23). El
único archivo env **commitado** es `.env.example` (MODIFIED `FRONTEND_PORT=4323→4321`), que
queda como referencia canónica instalable. Root `.env` se crea como copia de `.env.example`
con valores de producción (`ENVIRONMENT=production`) y `FRONTEND_PORT=4321`.

**Rationale**:
1. El modelo del estándar (entorno.md PCT-30..PCT-37 + standard §3) es que el estado canónico
   de configuración prod/dev **vive cifrado en Supabase** y el runtime consume inyección
   efímera; `.env*` locales pueden contener tokens (`OPENCODE_API_TOKEN`, `DEPLOY_JWT_SECRET`)
   y NO deben force-addearse — `force-add required` contradice el modelo de gestión de env
   de la plataforma y arriesga secretos en git.
2. AC-001/C2 se verifica en runtime (`projectctl env validate` ok, coordinator-owned), no con
   archivos commitados; la firma commitada es `.env.example`.
3. `sot-coherence.test.ts` (R-007) valida la existencia de paths canónicos
   (`compose.yml`, `compose.dev.yml`, `.env.example`) — no de `.env`/`.env.dev` — así el gate
   es estable en CI sin secretos.

**Clasificación de entrega**: `.env`, `.env.dev` → `exclude from commit` (policy review
resuelta: se entrega vía `.env.example` + validación runtime). `.env.example` → commit normal.

**Escenario cubierto**: REQ-ENT-001/007, riesgo §9 spec.

### AD-04 — Estados retirados en taskReadme: actualizar frontmatter a `done`, sin mover a carpeta histórica (resuelve decisión abierta §8.4 de spec)

**Decisión**: los 4 archivos `taskReadme/2026-04-17-test-task-for-state-{branching,pushing,ready-for-branch,verified}.md`
se MODIFICAN en su frontmatter: `status: <retirado>` → `status: done` (+ `updated` al
timestamp del apply). NO se mueven a subcarpeta histórica ni se borran.

**Rationale** (evidencia: `2026-04-17-test-task-for-state-branching.md` leído — fixture de
display con `status: branching`, ~55 líneas, sin contenido productivo):
1. REQ-TSK-003 permite explícitamente "actualizar frontmatter a un estado válido del
   binding"; `done` es terminal del `status.writable` (`{pending, planning, implementing,
   testing, documenting, done, blocked, failed}`) y es consistente con el fixture hermano
   `2026-04-17-test-task-for-state-done.md` ya existente — el set de fixtures queda uniforme.
2. Mover a `taskReadme/_historical/` los sacaría del glob canónico `taskReadme/*.md` que el
   board/coordinator escanea (evidencia: 30+ archivos planos en `taskReadme/`), alterando la
   visibilidad del board y la semántica de inventory — riesgo mayor que el beneficio.
3. `blocked`/`failed` de otros fixtures están en `status.writable` → no requieren cambio.
4. La remoción de estados retirados se verifica por escaneo (escenario REQ-TSK-003:
   "no debe existir `branching`, `pushing`, `ready_for_branch`, `verified` como status");
   el contenido histórico permanece intacto (no se borra trabajo).

**Escenario cubierto**: REQ-TSK-003, riesgo §9 spec (historial preservado).

### AD-05 — Crear `frontend/playwright.config.ts` como target del symlink (no repuntar) (resuelve decisión abierta §8.5 de spec)

**Decisión**: se **crea** `frontend/playwright.config.ts` (el target declarado por el symlink
raíz `playwright.config.ts -> frontend/playwright.config.ts`), con contenido derivado del
contrato canónico de `playwright.config.cjs` existente (projects `pwauto-home`,
`pwauto-test-tab` con `metadata.bundle_path`, `outputDir: 'playwright/test-results'`, JUnit
reporter), más el contrato `PWAUTO_VIEWS` (ver §5). Los fallbacks `playwright.config.cjs` /
`playwright.config.js` permanecen como contexto (REQ-TST-008 permite su presencia).

**Rationale** (evidencia: `playwright.config.ts` es symlink roto → `frontend/playwright.config.ts`
inexistente; `frontend/tsconfig.json` y `frontend/package.json` con `@playwright/test` ^1.59.1
presentes; `playwright.config.cjs`/`.js` reales en raíz):
1. El symlink ya declara la intención arquitectónica (config Playwright vive en `frontend/`,
   donde está la dependencia `@playwright/test`); crear el target cumple esa intención sin
   tocar el symlink ni reescribir el entry point raíz que el runner resuelve.
2. Repuntar el symlink a `playwright.config.cjs` obligaría al runner a usar el fallback
   CJS/ESM re-export (`playwright.config.js` → `createRequire` → `.cjs`), y REQ-TST-008
   exige "config canónica resoluble sin fallback implícito requerido".
3. `frontend/` ya es contexto TypeScript (`tsconfig.json`, Astro) → una config `.ts` es
   nativa del entorno.
4. El doble-hop ESM/CJS actual (`.js` re-exporta `.cjs`) se conserva solo como fallback de
   compatibilidad, no como camino del runner.

**Escenario cubierto**: REQ-CRS-006, REQ-TST-008.

### AD-06 — Runner unificado reutiliza primitivos backend; espeja el contrato del runner padre

**Decisión**: `scripts/test-runner.ts` implementa la CLI canónica
`bun run scripts/test-runner.ts run --method=<unit|pwauto|all> --target=<view>[:<feature>] [--persist]`
y un subcomando `check` (gate). Importa directamente desde `backend/src/`:
`ac-header.ts` (`AC_HEADER_LINE_RE`, `extractAcTokensFromBun/Playwright`) y
`coverage-writer.ts` (`patchBundleCoverage`, types `CoverageMethod`/`AppMapCoverageState`)
y `test-inventory.ts` (`buildInventory`). Replica el header-discovery de 10 líneas
(`extractUnitAcFromFile` lee `.slice(0, 12)`) y el shape de `summary.json` existente.

**Rationale**: (evidencia: primitivos ya implementados y testeados en backend;
`summary.json` de los 46 runs reales usa el shape documentado)
1. Prohibición implícita de duplicación: `projectctl-requirements` maintenance §4 y el test
   `sot-coherence` penalizan catálogos duplicados; el runner debe ESTABILIZAR el contrato que
   los primitivos ya expresan, no copiarlo.
2. El write-back TST-11 (`patchBundleCoverage`) ya escribe atómicamente preservando el body;
   el runner solo lo invoca con `(bundle_path, method, state, {criterionId})` — la función
   existe y su default `defaultBundlePath()` apunta a `test-tab.md`; el runner SIEMPRE pasa
   `bundle_path` explícito desde el `metadata.bundle_path` de la config Playwright o del
   bundle resuelto del target.
3. Espejar el contrato del runner padre mantiene la compatibilidad del discovery
   (`frontend/__tests__/**/*.test.ts`) y de `projectctl test *` 1:1 (PCT-91).

**Escenario cubierto**: REQ-TST-001/004/005.

### AD-07 — `build.target: prod/dev` se habilita nombrando stages `AS prod`/`AS dev` en los Dockerfiles frontend

**Decisión**: `frontend/Dockerfile.prod` y `frontend/Dockerfile.dev` se MODIFICAN: la línea
`FROM oven/bun:1-alpine` pasa a `FROM oven/bun:1-alpine AS prod` / `AS dev` respectivamente.
Los overlays canónicos usan `build: {context: ./frontend, dockerfile: Dockerfile.prod|Dockerfile.dev, target: prod|dev}`.

**Rationale** (evidencia: Dockerfiles frontend son single-stage — `Dockerfile.prod` build-aa
Astro y `Dockerfile.dev` dev-server con HMR):
1. REQ-ENT-002/003 exigen `target: prod`/`target: dev` (no `dockerfile:` como único selector
   ni `Dockerfile.prod` como arg). `compose build.target` selecciona un stage NOMBRADO; sin
   `AS prod`/`AS dev`, el build falla.
2. Alternativa (unificar en un `Dockerfile` multi-stage) es un cambio mayor que reestructura
   el build de Astro y rompe los contexts/args actuales — YAGNI; el target nombrado es el
   cambio mínimo que cumple el literal del requisito.
3. Se conserva la separación prod/dev existente (build-aa vs watch) — patrón repo vigente.

**Escenario cubierto**: REQ-ENT-002/003.

### AD-08 — `bun run test:check` = subcomando `check` del runner (gate TST-13)

**Decisión**: `package.json` raíz gana `"test:check": "bun run scripts/test-runner.ts check"`.
El subcomando `check` recorre el inventory (`buildInventory` + discovery del repo): para cada
bundle de `docs/app-map/navigation.yaml` y cada criterio con `functional: implemented`,
falla si `Unit` y `PW-AUTO` están ambos en `missing`/ausentes; imprime bundle + criterio y
retorna exit != 0. Los bundles sin criterios `implemented` no gatillan el gate.

**Rationale**: (evidencia: `package.json` raíz solo tiene `test`, `test:back`, `test:front`)
1. REQ-TST-002 exige el gate con semántica TST-13 exacta — implementarlo como subcomando del
   runner lo mantiene coherente con el layout canónico (PCT-93) y reutiliza el mismo
   discovery que `run`, evitando una segunda lógica de escaneo duplicada.
2. El gate depende de que el bundle AC-002 exista con `criteria[]` y de que los tests AC-003
   existan — por eso el orden de rollout AD-10.
3. Compatible con Tests CLI `projectctl test *` (mapeo 1:1; `test:check` es gate interno,
   no comando CLI).

**Escenario cubierto**: REQ-TST-002.

### AD-09 — Layout flat para bundle/sot-coherence tests bajo `frontend/__tests__/` (convención citada por el estándar)

**Decisión**: los tests de AC-003/AC-004 se crean como **archivos flat**:
`frontend/__tests__/projectctl-bundle.test.ts` (satisface el glob `projectctl-*-bundle.test.ts`
de REQ-TST-007) y `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts`
(path exacto citado por maintenance §4 y PCT-90/92). Tests por criterio adicionales siguen la
convención 2-segmentos `frontend/__tests__/<view>/<feature>.test.ts` existente
(`home/home.test.ts`, `project-workspace-test-tab/proxy.test.ts`).

**Rationale** (evidencia: el estándar cita los paths flat como SoT de sus requisitos:
PCT-90 cita `frontend/__tests__/projectctl-commands-mapping.test.ts`, maintenance §4 cita el
flat `projectctl-requirements.sot-coherence.test.ts`):
1. Los paths citados en `references/*.md` son validadoss por el propio `sot-coherence.test.ts`
   (gate R-007) — alinear el layout a las citas evita drift de paths.
2. TST-36 (2 segmentos view/feature) se aplica a tests POR criterio de features; los bundle
   tests son a nivel view y el glob del estándar los reconoce flat.
3. El runner descubre ambos (`frontend/__tests__/**/*.test.ts`), sin diferencia funcional.

**Escenario cubierto**: REQ-TST-006/007.

### AD-10 — Orden de rollout AC-004 → AC-005 → AC-002 → AC-001 → AC-003

**Decisión**: ver §1 Technical Approach. Cada AC se commitea como WU separada en el mismo PR
(single-pr); el gate `test:check` se agrega en el último WU (AC-003), cuando el bundle
(AC-002), la config Playwright (AC-005) y la base de workflow (AC-004) ya existen.

**Rationale**:
1. `test:check` nace verde: si se agrega antes del bundle projectctl, el gate fallaría por
   falta de cobertura de criterios `implemented` — el diseño evita un commit rojo conocido.
2. El runner necesita config Playwright resoluble (AC-005) antes que el gate lo invoque.
3. AC-004 estabiliza el estado de coordinación antes de cambios de producto (base de
   workflow, guardrail estados).

**Escenario cubierto**: global; informa a `sdd-tasks` (desglose por WU).

---

## 3. Data Flow

### 3.1 Corrida de tests (`projectctl test run` → runner → persistencia → write-back)

```
projectctl test run --method=unit --target=projectctl        (CLI, PTY del proyecto)
  └─> bun run scripts/test-runner.ts run --method=unit --target=projectctl
        ├─ resolve target: view=projectctl, feature=null
        ├─ discover tests: glob frontend/__tests__/**/*.test.ts
        │    └─ assertAcHeader(file): // @ac <ID> en primeras 10 líneas (rechazo si falta)
        ├─ filter por target (view[:feature]) + mapa de criterios del bundle AC-002
        ├─ bun test (grep por @ac ids) → resultados
        ├─ si --persist:
        │    ├─ write .runtime/test-results/<projectId>/<run-id>/unit/{junit.xml,results.json}
        │    └─ write summary.json (shape canónico existente, criteria[] poblado)
        └─ write-back: patchBundleCoverage(bundlePath, 'Unit'|'PW-AUTO', state,
             {criterionId}) sobre docs/app-map/views/projectctl/index.md
             (rewite atómico cuerpo-preservante, module backend/src/coverage-writer.ts)
```

Para `--method=pwauto`: runner resuelve `frontend/playwright.config.ts` (target del symlink
reparado), lee `PWAUTO_VIEWS` y `metadata.bundle_path` de los projects, invoca
`bunx playwright test` con `--project` filtrado por target, parsea JUnit
(`playwright/test-results/.last-run.junit.xml`), persiste idem bajo `pwauto/` y hace el mismo
write-back con método `PW-AUTO`.

### 3.2 Gate de cobertura (`bun run test:check`)

```
bun run test:check
  └─> bun run scripts/test-runner.ts check
        ├─ buildInventory(projectsRoot)              (backend/src/test-inventory.ts)
        │    ├─ unit roots: tests/back, backend/src (+ frontend/__tests__ — ver §8)
        │    └─ pwauto roots: tests/front/tests
        ├─ cargar navigation.yaml → bundles
        ├─ por bundle → por criterion con functional: implemented:
        │    si coverage.Unit ∈ {missing, ausente} AND coverage['PW-AUTO'] ∈ {missing, ausente}
        │      → VIOLACIÓN: reportar bundle + criterion + estado
        └─ exit 0 si sin violaciones; exit != 0 con detalle si hay violaciones (TST-13)
```

### 3.3 Runtime / entorno (validación coordinator-owned, fase 3)

```
projectctl env validate
  └─> lee .env y .env.dev (working tree) → FRONTEND_PORT=4321 en ambos → ok (PCT-97)
       └─ regresión: si .env falta o FRONTEND_PORT inválido → missing/invalid + configExists

projectctl status
  └─> resuelve compose.yml (prod) / compose.dev.yml (dev) canónicos
       └─ servicios frontend (target prod/dev) + api; ports ${FRONTEND_PORT}:4321;
            red mis-proyectos-edge external + aliases colpruebas-origin / test-colpruebas-origin

projectctl doctor
  └─> sin drifts críticos (locator v9, projections presentes, overlays canónicos)
```

### 3.4 Workflow / TAREAS

```
taskflow:generate (owner sdd-apply-code-high)
  └─> .agents/sdd-workflow.json (binding_version 9.0.0, resto preservado)
       └─> genera frontend/src/views/projectctl/data/tareas-tab.view-model.ts
            └─> frontend/src/shared/sdd/task-flow.generated.ts
sot-coherence.test.ts (R-007) valida: pin v9 + presence de ambas projections + fuentes
activas/excluidas + ausencia de catálogos duplicados.
```

---

## 4. File Changes (paths concretos)

> Cada grupo indica el AC y la lane de apply recomendada para `sdd-tasks` (binding v9.0.0:
> `sdd-apply-code-medium` para config/runtime/scripts, `sdd-apply-code-high` para binding +
> generación, `sdd-apply-doc` para todo archivo documental — único owner documental del
> binding —, `sdd-apply-unit-tests` para archivos de test en fase 3).

### AC-004 (TAREAS) — lane `sdd-apply-code-high`
| Archivo | Cambio |
|---|---|
| `.agents/sdd-workflow.json` | MODIFIED: `binding_version` `"8.0.0"` → `"9.0.0"`; resto de campos preservados (REQ-TSK-001) |
| `frontend/src/views/projectctl/data/tareas-tab.view-model.ts` | NEW (generated, `taskflow:generate`) — dir `frontend/src/views/projectctl/data/` no existe (REQ-TSK-002) |
| `frontend/src/shared/sdd/task-flow.generated.ts` | NEW (generated) — dir `frontend/src/shared/sdd/` no existe (REQ-TSK-002) |
| `taskReadme/2026-04-17-test-task-for-state-branching.md` | MODIFIED: `status: branching` → `done` (+ `updated`) (AD-04, REQ-TSK-003) |
| `taskReadme/2026-04-17-test-task-for-state-pushing.md` | MODIFIED: `status: pushing` → `done` |
| `taskReadme/2026-04-17-test-task-for-state-ready-for-branch.md` | MODIFIED: `status: ready_for_branch` → `done` |
| `taskReadme/2026-04-17-test-task-for-state-verified.md` | MODIFIED: `status: verified` → `done` |

### AC-001 (ENTORNO) — lane `sdd-apply-code-medium` (env/overlays/Dockerfiles) + `sdd-apply-doc` (docs) + install (skill)
| Archivo | Cambio |
|---|---|
| `.env` | NEW (working tree local, `exclude from commit`; AD-03) — `FRONTEND_PORT=4321` (REQ-ENT-001) |
| `.env.dev` | MODIFIED (local, `exclude from commit`): `FRONTEND_PORT=4324` → `4321` (REQ-ENT-001) |
| `.env.example` | MODIFIED (commit normal): `FRONTEND_PORT=4323` → `4321` — referencia canónica (REQ-ENT-001) |
| `compose.yml` | NEW: overlay prod canónico; services `frontend` (build context `./frontend`, `dockerfile: Dockerfile.prod`, `target: prod`) + `api`; `ports: "${FRONTEND_PORT}:4321"`; networks `internal` + `edge` (`external: true`, name `mis-proyectos-edge`, alias `colpruebas-origin`); api no expuesto libremente salvo excepción documentada (REQ-ENT-002) |
| `compose.dev.yml` | NEW: overlay dev; services `frontend` (`target: dev`, watch/HMR de `Dockerfile.dev` vigente) + `api`; alias `test-colpruebas-origin`; service `tunnel` NO incluido como camino principal (solo fallback legacy opt-in vía profiles si se preserva) (REQ-ENT-003) |
| `docker-compose.yml` | REMOVED (`git rm`) — legacy no operativo (AD-01, REQ-ENT-004) |
| `docker-compose.dev.yml` | REMOVED (`git rm`) — legacy no operativo (AD-01, REQ-ENT-004) |
| `frontend/Dockerfile.prod` | MODIFIED: `FROM oven/bun:1-alpine AS prod` (AD-07) |
| `frontend/Dockerfile.dev` | MODIFIED: `FROM oven/bun:1-alpine AS dev` (AD-07) |
| `docs/00-context/entornos.md` | NEW: overlays canónicos, FRONTEND_PORT obligatorio, contrato edge, runtime vía projectctl (REQ-ENT-005) |
| `docs/00-context/architecture.md` | NEW: arquitectura del repo (REQ-ENT-005) |
| `docs/02-features/tunnel.md` | NEW: tunnel gestionado central, alias por entorno, guardrail `TUNNEL_NOT_PUBLISHABLE` (REQ-ENT-005) |
| `.agents/skills/sandbox-runtime-policy/SKILL.md` | NEW: instalación de la skill (árbol `copy-tree-no-mods`) — sandbox sin Docker CLI/socket, runtime exclusivo `projectctl` (REQ-ENT-006) |

### AC-002 (DOCS) — lane `sdd-apply-doc`
| Archivo | Cambio |
|---|---|
| `docs/app-map/views/projectctl/index.md` | NEW: bundle con 5 secciones MUST (`URL`, `Tab`, `Objetivo`, `Criterios de calidad`, `Diagrama Mermaid`) + frontmatter `criteria[]` con IDs `PCT-*` (estructura `{id, title, functional, coverage}`; métodos `Unit|PW-CLI|PW-AUTO|Manual` × estados) + prefix discipline + referencia a `references/standard.md` (REQ-DOC-001/005) |
| `docs/app-map/views/projectctl/index.mmd` | NEW: diagrama Mermaid sibling (REQ-DOC-002) |
| `docs/app-map/navigation.yaml` | MODIFIED: nodo `{id: projectctl, kind: view, bundle: views/projectctl/index}` (REQ-DOC-003) |
| `docs/01-product/quality-plan.md` | REMOVED — superficie legacy per TST-03/TST-12; prohibida su restauración (REQ-DOC-004) |
| `docs/01-product/quality-status.md` | REMOVED (REQ-DOC-004) |

### AC-003 (TEST) — lane `sdd-apply-code-medium` (runner/gate/config/.gitignore) + `sdd-apply-unit-tests` (tests, fase 3)
| Archivo | Cambio |
|---|---|
| `scripts/test-runner.ts` | NEW: runner unificado (CLI `run` + `check`); importa primitivos `backend/src/{ac-header,coverage-writer,test-inventory}.ts`; header-discovery 10 líneas; rechazo de cobertura sin AC; persistencia canónica; write-back `patchBundleCoverage` (REQ-TST-001/004/005) |
| `package.json` | MODIFIED: add `"test:check": "bun run scripts/test-runner.ts check"` (AD-08, REQ-TST-002) |
| `playwright/TEST_PLAN.md` | NEW: mapping archivo↔criterio + tiers PW-AUTO/PW-CLI (REQ-TST-003) |
| `frontend/playwright.config.ts` | NEW (target del symlink; AD-05): projects canónicos `pwauto-home`/`pwauto-test-tab` + `PWAUTO_VIEWS` (REQ-TST-008/REQ-CRS-006) |
| `.gitignore` | MODIFIED: add `.runtime/`, `frontend/test-results/` (AD-02, REQ-TST-005) |
| `frontend/__tests__/projectctl-bundle.test.ts` | NEW: valida 5 secciones MUST + `criteria[]` + entrada navigation (satisface glob `projectctl-*-bundle.test.ts`; header `// @ac PCT-83..PCT-88`; AD-09) (REQ-TST-007/006) |
| `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` | NEW: gate R-007 — paths canónicos, locator/binding v9, projections, fuentes activas/excluidas, catálogos duplicados (REQ-TST-007/REQ-TSK-004) |
| `.runtime/test-results/<projectId>/<run-id>` | Completado (NO recreado): pipeline escribe `{unit,pwauto}/{junit.xml,results.json,summary.json}` sobre el layout existente (46 runs preservados; REQ-TST-005) |

### AC-005 (CROSS) — lane `sdd-apply-doc` (+ regen skill-registry coordinator-only per maintenance §10)
| Archivo | Cambio |
|---|---|
| `AGENTS.md` | NEW: directrices de operación para agentes (REQ-CRS-001) |
| `README.md` | NEW: descripción del proyecto + entry points (`/projectctl`, docs, tests) (REQ-CRS-002) |
| `docs/00-context/agents_skills.md` | NEW: registro de skills del repo, coherente con `.atl/skill-registry.md` (REQ-CRS-003) |
| `docs/04-process/task.md` | NEW: guía del flujo de tareas; cita el bloque `task-flow-binding` v9.0.0 como única SoT (sin catálogo paralelo) (REQ-CRS-004) |
| `.atl/skill-registry.md` | NEW: registro de skills (incluye `sandbox-runtime-policy` + `projectctl-requirements`); regeneración coordinator-only (REQ-CRS-005) |
| `playwright.config.ts` (symlink raíz) | REPARADO via target `frontend/playwright.config.ts` (AD-05, REQ-CRS-006) |

---

## 5. Interfaces / Contracts

### 5.1 Runner CLI contract (`scripts/test-runner.ts`)
```
bun run scripts/test-runner.ts run --method=<unit|pwauto|all> --target=<view>[:<feature>] [--persist]
bun run scripts/test-runner.ts check
```
- `run`: ejecuta tests del target con filtro `@ac`; `--persist` escribe en
  `.runtime/test-results/<projectId>/<run-id>/{unit,pwauto}/` y ejecuta write-back.
- `check`: gate TST-13 (AD-08).
- Exit codes: `0` ok; `1` fallo de test o gate; `2` rechazo (header `@ac` ausente o cobertura
  sin AC mapeado — REQ-TST-001/PCT-90).
- Mapping 1:1 con `projectctl test *` (PCT-91, tabla de `references/test.md`).

### 5.2 Contrato AC mandatorio (PCT-90)
- Header `// @ac <ID>` en las primeras 10 líneas de todo `.test.ts` (Bun) y `.spec.ts`
  (Playwright) — regex canónico `AC_HEADER_LINE_RE` (backend/src/ac-header.ts).
- Specs PW: `test.info().annotations.push({ type: 'ac', description: '<ID>' })` —
  regex `PW_ANNOTATION_RE`.
- Rechazo: `results.json` con cobertura de criterio sin AC mapeado → rejected (TST-10/AC-007).

### 5.3 `summary.json` schema (persistencia canónica, PCT-92/TST-08)
Shape ya existente en los 46 runs — el runner la produce, no la redefine:
```json
{
  "run_id": "<uuid>",
  "started_at": "<iso>",
  "finished_at": "<iso>",
  "target": { "view": "projectctl", "feature": null, "method": "unit" },
  "passed": 0, "failed": 0, "skipped": 0,
  "criteria": [ { "id": "PCT-83", "status": "covered" } ],
  "methods": [ { "method": "unit", "passed": 0, "failed": 0, "skipped": 0,
                 "startedAt": "<iso>", "finishedAt": "<iso>", "exitCode": 0,
                 "junitPath": "...", "results": [] } ]
}
```
`criteria[]` (hoy vacío en runs legacy) se puebla con status por criterio
(`covered | partial | missing | not-applicable`).

### 5.4 Write-back `patchBundleCoverage` (TST-11/PCT-92)
- Firma: `patchBundleCoverage(bundlePath: string, method: CoverageMethod, state: AppMapCoverageState, opts?: {criterionId?: string})` (backend/src/coverage-writer.ts).
- Semántica: rewite atómico del frontmatter (`dumpBundleAtomic`) preservando bytes del body;
  `error` si el bundle no tiene `criteria[]` o el `criterionId` no existe.
- Target de AC-003: `docs/app-map/views/projectctl/index.md` (criterios `PCT-*`).

### 5.5 `criteria[]` schema del bundle (frontmatter YAML, PCT-85)
```yaml
criteria:
  - id: PCT-83
    title: >- ...
    functional: implemented   # implemented | partial | missing | not-applicable
    coverage:
      Unit: missing           # covered | partial | missing | not-applicable
      PW-CLI: missing
      PW-AUTO: missing
      Manual: missing
    notes: >- ...
```
IDs reservados (prefix discipline PCT-88): `PCT-* | PRJ-* | TST-* | AC-* | DSH-* | TNL-* | LGN-* | MDL-*`.

### 5.6 `PWAUTO_VIEWS` contract (`frontend/playwright.config.ts`)
Export del mapa view[:feature] → {project, bundle_path, grep} que el runner y el gate
consumen para discovery canónico (PCT-93/TST-36):
```ts
export const PWAUTO_VIEWS = {
  'projectctl': { project: 'pwauto-projectctl', bundle_path: 'views/projectctl/index', grep: /@projectctl\b/ },
  // + home, project-workspace:test-tab (ya existentes en playwright.config.cjs)
};
```
Los projects del config mantienen `metadata.bundle_path`/`base_url` (contrato `.cjs` vigente).

### 5.7 Gate `bun run test:check` (TST-13/PCT-93)
- Falla si algún bundle tiene criterio con `functional: implemented` y `Unit + PW-AUTO`
  ambos `missing`/ausentes; output: bundle + criterio violado.
- Pasa si todos los implementados tienen `Unit` o `PW-AUTO` ≥ `partial`/`covered`.

### 5.8 Locator contract (`.agents/sdd-workflow.json`, REQ-TSK-001)
```
{ contract_version: 1, binding_path: ..., machine_block_id: "task-flow-binding",
  expected_binding_id: "projectctl-requirements.task-flow",
  binding_version: "9.0.0", projections: { state_model, task_template,
  client_view_model, client_generated_ts } }
```
Solo cambia `binding_version`; el resto se preserva.

### 5.9 Contrato edge / red (PCT-98)
- `networks.edge: { external: true, name: mis-proyectos-edge }` en ambos overlays.
- Aliases: prod `colpruebas-origin`, dev `test-colpruebas-origin` en
  `services.frontend.networks.edge.aliases` (preservados de legacy, sin cambios de valor).

---

## 6. Testing Strategy (mapeo AC/PCT)

| AC | Método | Evidencia / test | Criterios |
|---|---|---|---|
| AC-001 | Runtime CLI (coordinator-owned) + Unit | `projectctl env validate` ok; `projectctl status` levanta prod/dev; `projectctl doctor` sin drifts críticos. Unit: `sot-coherence.test.ts` valida existencia de `compose.yml`, `compose.dev.yml`, `.env.example` (paths citados por `references/entorno.md`) | PCT-95, PCT-96, PCT-97, PCT-98, PCT-99 |
| AC-002 | Unit | `frontend/__tests__/projectctl-bundle.test.ts`: 5 secciones MUST en `index.md`, `criteria[]` con IDs `PCT-*` y estructura `{id,title,functional,coverage}`, `index.mmd` presente, entry en `navigation.yaml`, ausencia de `quality-plan.md`/`quality-status.md` | PCT-83..PCT-88 |
| AC-003 | Unit + gate | `bun run test:check` verde (TST-13); `projectctl test run --method=unit --target=projectctl` con `--persist` produce `summary.json` con `criteria[]` y write-back en `index.md`; `projectctl test list-runs`/`results` leen los mismos runs; headers `@ac` obligatorios | PCT-89..PCT-94 |
| AC-004 | Unit (gate R-007) | `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts`: locator pin `9.0.0`, projections presentes, fuentes activas/excluidas coherentes, sin catálogos duplicados; escaneo de `taskReadme/*.md` sin `branching/pushing/ready_for_branch/verified` como status | PCT-106..121, gate R-007 |
| AC-005 | Unit (presence) | Chequeos de presencia en `sot-coherence`/inventory + resolución del symlink `playwright.config.ts` (target `frontend/playwright.config.ts` existe; `bunx playwright test --list` smoke opcional, sin browser) | standard §1, PCT-93 |

- `// @ac <ID>` en TODOS los archivos de test nuevos (REQ-TST-004) + annotations PW.
- Browser validation NO requerida (`pw_enabled: false`, `browser_validation: optional`) — la
  validación de entorno es CLI `projectctl` (coordinator-owned), no PW-CLI/PW-AUTO.
- `AC-009.app_map_close` en cierre: `criteria[].coverage` de `views/projectctl/index.md`
  sincronizado (write-back) y `docs/app-map/**` sin deuda documental.
- Los runs legacy `.runtime/test-results/` (46) se preservan; el runner solo completa/popula
  sobre el layout existente (REQ-TST-005 — escenario "no borrar/recrear").

---

## 7. Migration / Rollout

### 7.1 Orden de aplicación (AD-10)
1. **WU AC-004**: pin locator `9.0.0` + `taskflow:generate` (projections) + frontmatter de los
   4 fixtures a `done`.
2. **WU AC-005**: archivos CROSS + `frontend/playwright.config.ts` (repara symlink).
3. **WU AC-002**: bundle `views/projectctl` + `navigation.yaml` + `index.mmd` + `git rm` de
   `docs/01-product/quality-*.md`.
4. **WU AC-001**: `.env.example` (commit) + `.env`/`.env.dev` (local) + `compose(.dev).yml`
   + `git rm` legacy compose + stage names Dockerfiles + docs entorno/arquitectura/tunnel +
   skill `sandbox-runtime-policy`.
5. **WU AC-003**: `scripts/test-runner.ts` + `package.json` (`test:check`) +
   `playwright/TEST_PLAN.md` + `.gitignore` + tests bundle/sot-coherence (fase 3 refina vía
   `sdd-apply-unit-tests`/`sdd-verify-units`).

### 7.2 Transiciones de entorno
- Los overlays canónicos reemplazan a los legacy en el mismo PR; `projectctl` resuelve por
  nombre canónico (REQ-ENT-004). Compat: red `mis-proyectos-edge` y alias se **preservan sin
  reconfiguración externa** — no se toca red/alias/hostname.
- `.env`/`.env.dev` se materializan localmente (no en git); si un entorno gestionado los
  inyecta cifrado (Supabase, standard §3), los valores locales son fallback de validación.

### 7.3 Rollback
- PR único a `develop`: revertir el merge revierte todo el cambio.
- Por AC (proposal §7): AC-001 → restaurar overlays legacy si `projectctl` no levanta
  (alias/red no requieren rollback externo); AC-002/AC-005 → revert bundle/archivos cross
  (quality legacy restaurable solo si `AC-009.app_map_close` lo exige, no como SoT);
  AC-003 → revierte `package.json` + `scripts/` + `TEST_PLAN.md`; persistencia `.runtime/`
  intacta (solo se completó); AC-004 → locator vuelve a pin previo + projections marcadas
  ausentes sin romper resolución (proyección derivada no autoritativa).
- Pre-close: `bun run test:check` verde + `projectctl env validate/status/doctor` ok; si
  fallan → revertir antes del cierre.

---

## 8. Backend impact analysis

> Subsección del `design` (reemplaza el antiguo §12 del índice — el coordinador no duplica).

**Sin cambios en endpoints ni servicios backend.** El impacto backend es de **consumo y
extensión de primitivos existentes**, no de arquitectura de API:

1. **`backend/src/ac-header.ts`** — consumido por `scripts/test-runner.ts`
   (`AC_HEADER_LINE_RE`, `extractAcTokensFromBun/Playwright`). Sin cambios.
2. **`backend/src/coverage-writer.ts`** — consumido por el runner para write-back
   (`patchBundleCoverage`, `manualMark`, `resetCoverage`, `mockPwcliRun`). Sin cambios de
   firma; el runner pasa `bundle_path` explícito (`defaultBundlePath()` apunta hoy a
   `docs/app-map/views/project-workspace/features/test-tab.md`; NO debe usarse el default
   para los criterios `PCT-*`).
3. **`backend/src/test-inventory.ts`** — extiende el alcance de discovery: `buildInventory`
   escanea unit roots `tests/back` + `backend/src` y pwauto roots `tests/front/tests`. Para
   que el gate `test:check` vea los tests `frontend/__tests__/**` de AC-003, el runner
   agrega su propio discovery de `frontend/__tests__/**/*.test.ts` (espejo del contrato del
   runner padre) — **opción mínima**: extender `unitRoots` en `test-inventory.ts` con
   `frontend/__tests__` (cambio backend de 1 línea, owner `sdd-apply-code-medium`), o
   mantener el discovery en el runner. **Decisión**: extender `unitRoots` para que
   `buildInventory` sea la única fuente de inventory (patrón repo: sin lógica duplicada;
   el runner no reimplementa escaneo). Riesgo bajo: los unit roots ya incluyen rutas
   relativas al proyecto.
4. **API de coverage** (`POST /api/projects/[id]/docs/app-map/coverage/manual|reset`,
   `test-pwcli/run`) — sin cambios; operan sobre `patchBundleCoverage` y el bundle nuevo
   `views/projectctl/index.md` es un destino válido más.
5. **Sandbox** — sin expuestos de Docker; el control de runtime es `projectctl`
   (PCT-99, skill `sandbox-runtime-policy` AC-001).

**Riesgo backend**: el write-back sobre `views/projectctl/index.md` presupone que el bundle
nace con `criteria[]` completo y estables (AD-09/origen AC-002); si el bundle cambiara de
shape, `patchBundleCoverage` devuelve `error` (contrato §5.4) — mitigación: el bundle test
AC-002 congela el shape.

---

## 9. Open Questions

1. **Referencias externas a los overlays legacy**: `docker-compose*.yml` podrían citarse
   desde config externa a este repo (webhook-listener/tunnel-manager de la plataforma). El
   `projectctl status` (fase 3, coordinator-owned) verificará que resuelve los nombres
   canónicos; si algún consumidor externo pinnea legacy, se registra como blocker fuera de
   scope (no tocar red/alias).
2. **Alcance de `criteria[]` del bundle projectctl**: cuántos ids `PCT-*` declarar como
   `implemented` vs `missing`. Decisión de apply: declarar los criterios emitidos por el
   estándar aplicables a este repo (tab cli PCT-79..82, doc PCT-83..88, test PCT-89..94,
   entorno PCT-95..100, tareas PCT-106..121) con `functional` al estado real post-remediación;
   los no aplicables → `not-applicable`. El gate TST-13 solo exige cobertura a los
   `implemented`.
3. **`tunnel` como fallback legacy opt-in**: el overlay dev legacy no declaraba service
   `tunnel`; REQ-ENT-003 deja el service MAY vía `profiles`. Decisión: NO incluirlo (el
   tunnel gestionado central es el camino principal, standard §3); se documenta en
   `docs/02-features/tunnel.md` como política.
4. **Regeneración de `.atl/skill-registry.md`**: coordinator-only per maintenance §10 — el
   apply de AC-005 crea el archivo inicial; la regeneración formal queda en fase 4 a cargo
   del coordinador (WU-REG).
5. **`frontend/__tests__/projectctl-commands-mapping.test.ts`** citado por PCT-90 en
   `references/test.md`: no requerido por los REQ de AC-003 (solo bundle + sot-coherence).
   Se registra para no crear drift si el estándar lo cita; el `sot-coherence.test.ts` de
   R-007 valida paths citados — si el estándar exige ese path, se adiciona como test en
   fase 3.
6. **Estrategia de persistencia ante write-back en CI vs local**: `patchBundleCoverage`
   muta el bundle versionado durante la corrida; confirmar que el gate `test:check` NO
   persiste (`check` es read-only sobre coverage) para que CI no genere diffs espurios.

---

## File-surface check (obligatorio §D sdd-phase-common)

Único archivo tocado por esta lane: `taskReadme/20260825-bhbr8k-remediacion-compatibilidad-projectctl-entornos-docs-tests/design.md`
(phase artifact canónico bajo `taskReadme/`, superficie de commit normal). Sin riesgo de
delivery-surface para este write. Los riesgos de archivos gitignored/runtime listados en
spec §9 (`.env`/`.env.dev`, `.runtime/`) corresponden a fases posteriores (apply) y quedan
clasificados en AD-02/AD-03.

---

**criteria_covered**: AC-001..AC-005
**next_recommended**: `sdd-tasks` (desglose por WU ordenado por AD-10; gate `planning_artifacts_complete` = spec+design+tasks)