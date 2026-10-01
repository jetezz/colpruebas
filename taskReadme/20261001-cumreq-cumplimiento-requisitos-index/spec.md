# Spec — Cumplimiento de requisitos y corrección del index colpruebas

- Tarea: `20261001-cumreq-cumplimiento-requisitos-index` · binding `projectctl-requirements.task-flow` v15.0.0 (`TaskFlowBindingV2`).
- Fase: spec (fase 2). Propuesta aprobada por usuario el 2026-10-01 (delta HRM-01 modify MAIN→rama real vía `PUBLIC_GIT_BRANCH` fallback `develop`; mantenidos HOME-01, HOME-05, HSS-01..04, HRM-02; añadidos ninguno; eliminados ninguno).
- Índice: `taskReadme/20261001-cumreq-cumplimiento-requisitos-index.md`. Propuesta: `taskReadme/20261001-cumreq-cumplimiento-requisitos-index/proposal.md`.
- Este artefacto NO implementa; solo especifica requisitos delta + escenarios Given/When/Then con RFC 2119. La definición vigente de cada criterio vive en su bundle App Map propietario; aquí solo se desarrolla el comportamiento verificable.

## Alcance delta

- Añadidos: ninguno. Eliminados: ninguno. Modificado: `HRM-01`. Mantenidos: `HOME-01`, `HOME-05`, `HSS-01`, `HSS-02`, `HSS-03`, `HSS-04`, `HRM-02`.
- No se crean IDs de aceptación locales ni otro catálogo. Los IDs de escenario (`SC-*`) identifican escenarios y NUNCA sustituyen IDs de criterio.

## Precondiciones globales

- P1: El repo está en la rama de trabajo `feature/20261001-cumreq-cumplimiento-requisitos-index` con base `develop`; la landing `/` levanta en prod y dev.
- P2: Backend expone `GET /health` (y/o `GET /api/status`) en los entornos declarados en `.env.example` / `.env.dev` (prod `4321/3005`, dev `4324/3100`).
- P3: Variables `PUBLIC_*` disponibles en build-time SSR: `PUBLIC_ENVIRONMENT`, `PUBLIC_API_URL`, `PUBLIC_GIT_BRANCH` (inyectadas vía compose dev/prod + `Dockerfile.prod` `ARG/ENV`; tipadas en `frontend/src/env.d.ts`).
- P4: Doctors y gates ejecutables: scripts skill `doctor-*`, `requirements-check`, runner `scripts/test-runner.ts` con `strict_tdd: true`.

## Datos de prueba

- D1: `PUBLIC_ENVIRONMENT=production` + `PUBLIC_API_URL=http://localhost:3005` + `PUBLIC_GIT_BRANCH=<rama-real>` (p. ej. `feature/20261001-cumreq-...` o `develop`).
- D2: `PUBLIC_ENVIRONMENT=development` + `PUBLIC_API_URL=http://localhost:<api-dev>` + `PUBLIC_GIT_BRANCH=develop`.
- D3: `PUBLIC_ENVIRONMENT` ausente/vacío → fallback documentado `test`; `PUBLIC_GIT_BRANCH` ausente/vacío → fallback documentado `develop`.
- D4: API caída o con latencia > timeout SSR → se espera degradado al texto estático actual, sin error de consola.

## Requisitos MANTENIDOS (sin cambio de aceptación)

### HOME-01 — Identidad visible de la aplicación (bundle `views/home/index`)

- El sistema DEBE mostrar `colpruebas` en el `<title>` del documento y en la tarjeta principal (`Header` + `InfoCard`) en cada render de `/`.
- Trazabilidad: `frontend/src/pages/index.astro` (`appName`, `<title>`), `frontend/src/components/Header.astro`, `tests/e2e/home/index.spec.ts` (`@ac HOME-01`).

### HOME-05 — Consola limpia en carga inicial (bundle `views/home/index`)

- El sistema NO DEBE emitir `console.error` al cargar `/` (incluido el path del fetch SSR de salud con degradado graceful).
- Trazabilidad: `frontend/src/pages/index.astro` (fetch SSR + timeout + fallback), `tests/e2e/home/index.spec.ts` (`@ac HOME-05`, aserción `errors` longitud 0 tras `networkidle`).

### HSS-01 — Fila `Aplicación:` (bundle `views/home/features/status-summary`)

- La tarjeta `Resumen de estado` DEBE renderizar la etiqueta `Aplicación:` con valor `colpruebas`, sin cambios.
- Trazabilidad: `frontend/src/components/InfoCard.astro:18-20`, `tests/e2e/home/index.spec.ts` (`@ac HSS-01`).

### HSS-02 — Fila `Frontend:` por entorno (bundle `views/home/features/status-summary`)

- La tarjeta DEBE mostrar la fila `Frontend:` alineada a la derecha del label y diferenciada por entorno. El sistema DEBE resolver el entorno desde `PUBLIC_ENVIRONMENT` con valores `production` / `development` y fallback documentado `test`.
- Trazabilidad: `frontend/src/pages/index.astro` (`environment`, `frontendStatus`), `frontend/src/components/InfoCard.astro:22-25`, `frontend/src/env.d.ts`, compose dev/prod, `.env.example`.

### HSS-03 — Fila `API:` con salud real (bundle `views/home/features/status-summary`)

- La tarjeta DEBE mostrar la fila `API:` replicando el patrón de color por entorno. El texto DEBE reflejar la salud real obtenida por fetch SSR a `PUBLIC_API_URL/health` (o `/api/status`) con timeout corto + fallback al texto estático actual ante fallo/timeout. La etiqueta y el patrón se conservan.
- Trazabilidad: `frontend/src/pages/index.astro` (`apiStatus` + fetch SSR), `frontend/src/components/InfoCard.astro:27-29`, `frontend/src/env.d.ts`, `tests/e2e/home/index.spec.ts` (`@ac HSS-03`).

### HSS-04 — Fila `Rama Git:` renderizada (bundle `views/home/features/status-summary`)

- La tarjeta DEBE renderizar la etiqueta `Rama Git:` en la misma tarjeta. El render de la fila queda intacto; solo cambia el valor que recibe (rama real en vez de `MAIN`).
- Trazabilidad: `frontend/src/components/InfoCard.astro:30-33`, `frontend/src/pages/index.astro` (`gitBranch`), `tests/e2e/home/index.spec.ts` (`@ac HSS-04`).

### HRM-02 — Timestamp ISO 8601 SSR (bundle `views/home/features/runtime-metadata`)

- El pie de la landing DEBE mostrar un timestamp en formato ISO 8601 que refleje el momento del render SSR, no del cliente, sin cambios.
- Trazabilidad: `frontend/src/pages/index.astro` (`new Date().toISOString()`), `frontend/src/components/Footer.astro`, `tests/e2e/home/index.spec.ts` + `tests/unit/home/runtime-metadata.test.ts` (`@ac HRM-02`).

## Requisitos MODIFICADOS

### HRM-01 — Rama git real de la ejecución (bundle `views/home/features/runtime-metadata`) · operation `modify`

BEFORE (bloque completo vigente antes del cambio):

```text
HRM-01 (bundle views/home/features/runtime-metadata, type ui):
"La tarjeta muestra una referencia visible de la rama git para contextualizar
la ejecucion observada."
Contrato documentado: presencia de la referencia; valor constante `MAIN`
aceptado (fosilizado en frontend/src/pages/index.astro:19,
docs/app-map/views/home/features/runtime-metadata.md:25-28 y tests
tests/e2e/home/index.spec.ts:35, tests/unit/home/runtime-metadata.test.ts:18).
```

AFTER (bloque completo aprobado en proposal):

```text
HRM-01 (bundle views/home/features/runtime-metadata, type ui):
"La tarjeta muestra la rama git real de la ejecucion (resuelta por
entorno/rama via PUBLIC_GIT_BRANCH con fallback documentado a develop)
para contextualizar la ejecucion observada."
```

- El sistema DEBE resolver la rama en build-time SSR desde `PUBLIC_GIT_BRANCH`; cuando la variable esté ausente o vacía, DEBE usar el fallback `develop` y documentarlo en `runtime-metadata.md` + `.env.example`.
- El sistema NO DEBE renderizar el literal `MAIN` en ningún entorno (cero `MAIN`: grep limpio salvo historia/este spec).
- La inyección DEBE viajar por `Dockerfile.prod` (`ARG/ENV PUBLIC_GIT_BRANCH`) + `compose/compose.prod.yml` y `compose/compose.dev.yml` (+ `PUBLIC_API_URL` en dev, hoy ausente: dev inyecta `API_URL` no consumido).
- El tipado DEBE declararse en `frontend/src/env.d.ts` (`PUBLIC_ENVIRONMENT`, `PUBLIC_API_URL`, `PUBLIC_GIT_BRANCH`).
- Docs + firma env + tests `MAIN` DEBEN actualizarse en la misma unidad que el cambio de rama (una sola work-unit; evidencia: grep de `MAIN`).
- Trazabilidad: `frontend/src/pages/index.astro:19`, `frontend/src/components/InfoCard.astro:32`, `frontend/src/env.d.ts`, `frontend/Dockerfile.prod` (+ `Dockerfile.dev` si aplica), `compose/compose.dev.yml`, `compose/compose.prod.yml`, `docs/app-map/views/home/features/runtime-metadata.md` (+ docs home que citen `MAIN`), `.env.example`, `tests/e2e/home/index.spec.ts:35`, `tests/unit/home/runtime-metadata.test.ts:18`.

## Escenarios Given/When/Then

### S1 — Identidad app colpruebas (HOME-01 / HSS-01)

- SC-S1-identidad — criteria: HOME-01, HSS-01.
  - Given la landing `/` desplegada en cualquier entorno (P1).
  - When un visitante carga `/`.
  - Then el sistema MUST mostrar `<title>` con `colpruebas`, heading `colpruebas` y la tarjeta `.info-card` con `Aplicación:` + `colpruebas`.

### S2 — Frontend env por `PUBLIC_ENVIRONMENT` (HSS-02)

- SC-S2-frontend-env-prod — criteria: HSS-02.
  - Given `PUBLIC_ENVIRONMENT=production` (D1, P3).
  - When se renderiza `/` en SSR.
  - Then la fila `Frontend:` MUST mostrar el texto de producción y la clase de color de producción.
- SC-S2-frontend-env-dev — criteria: HSS-02.
  - Given `PUBLIC_ENVIRONMENT=development` (D2, P3).
  - When se renderiza `/` en SSR.
  - Then la fila `Frontend:` MUST mostrar el texto de desarrollo y NO el de producción.
- SC-S2-frontend-env-fallback — criteria: HSS-02.
  - Given `PUBLIC_ENVIRONMENT` ausente o vacío (D3).
  - When se renderiza `/` en SSR.
  - Then el sistema MUST degradar al fallback documentado `test` y MUST NOT dejar la fila vacía ni romper el layout.

### S3 — API env + salud real SSR (HSS-03)

- SC-S3-api-salud-ok — criteria: HSS-03.
  - Given `PUBLIC_API_URL` apunta a una API sana (P2, D1/D2) con timeout SSR configurado.
  - When se renderiza `/` en SSR.
  - Then la fila `API:` MUST reflejar salud real (p. ej. texto de API operativa del entorno) con el patrón de color por entorno.
- SC-S3-api-degradado — criteria: HSS-03, HOME-05.
  - Given la API está caída o excede el timeout SSR (D4).
  - When se renderiza `/` en SSR.
  - Then el sistema MUST degradar al texto estático actual, MUST completar el render sin bloquear y MUST NOT emitir `console.error`.

### S4 — Rama real + cero MAIN + timestamp + consola (HSS-04 / HRM-01 / HRM-02 / HOME-05)

- SC-S4-rama-real — criteria: HSS-04, HRM-01.
  - Given `PUBLIC_GIT_BRANCH=develop` (o la rama real de la ejecución, D2/P3) inyectada por compose/Dockerfile.
  - When se renderiza `/` en SSR.
  - Then la fila `Rama Git:` MUST mostrar exactamente ese valor y MUST NOT mostrar `MAIN`.
- SC-S4-rama-fallback — criteria: HRM-01.
  - Given `PUBLIC_GIT_BRANCH` ausente o vacío (D3).
  - When se renderiza `/` en SSR.
  - Then la fila `Rama Git:` MUST mostrar `develop` (fallback documentado).
- SC-S4-cero-main — criteria: HRM-01.
  - Given el cambio aplicado en código + docs + tests (una sola unidad).
  - When se ejecuta grep de `MAIN` sobre `index.astro`, `InfoCard.astro`, `runtime-metadata.md`, `index.spec.ts`, `runtime-metadata.test.ts`.
  - Then el resultado MUST ser cero ocurrencias operativas (solo se permite historia/este spec como mención).
- SC-S4-timestamp-ssr — criteria: HRM-02.
  - Given cualquier entorno (P1).
  - When se renderiza `/` en SSR y se lee el `footer`.
  - Then el timestamp MUST cumplir ISO 8601 (`\d{4}-\d{2}-\d{2}T…`) y MUST corresponder al render del servidor.
- SC-S4-consola-limpia — criteria: HOME-05.
  - Given `/` cargada hasta `networkidle` en prod y dev (incluido path de fetch SSR con fallo simulado D4).
  - When se recogen los mensajes `console.error` del navegador.
  - Then la lista MUST estar vacía (longitud 0).

### S5 — Doctors y gates (verificación transversal, los 8 IDs)

- SC-S5-doctors-target-home — criteria: HOME-01, HOME-05, HSS-01, HSS-02, HSS-03, HSS-04, HRM-01, HRM-02.
  - Given el cambio materializado con tests `@ac` en las 10 primeras líneas y coverage Unit+PW-AUTO por criterio.
  - When se ejecutan los comandos exactos:
    - `bun .agents/skills/projectctl-requirements/scripts/project/doctor-test.ts --root . --target=home`
    - `bun .agents/skills/projectctl-requirements/scripts/project/doctor-structure.ts --root . --target=home`
    - `bun .agents/skills/projectctl-requirements/scripts/project/doctor-docs.ts --root . --target=home`
    - `bun .agents/skills/projectctl-requirements/scripts/project/doctor-app-map-inventory.ts --root . --target=home` (inventario app-map; nombre según perfil `app-map-inventory`)
    - `bun .agents/skills/projectctl-requirements/scripts/project/doctor-criterion-contract.ts --root . --target=home` (contrato de criterio; nombre según perfil `criterion-contract`)
    - `bun scripts/skill/requirements-check.ts --root . --check` (y variante `--target=home` donde el perfil lo soporte)
  - Then cada doctor MUST salir en verde para el target `home`; cualquier rojo MUST bloquear el cierre.
- SC-S5-gate-test-check — criteria: HOME-01, HOME-05, HSS-01, HSS-02, HSS-03, HSS-04, HRM-01, HRM-02.
  - Given la misma precondición de cobertura.
  - When se ejecuta `bun run test:check` (gate TST-13; runner unificado `bun run scripts/test-runner.ts check` + `run --method=unit|pwauto --target=home`).
  - Then el gate MUST estar en verde (sin criterio implementado sin cobertura Unit+PW-AUTO); si falla, MUST bloquear el cierre.

## Errores y degradados

- E1 API caída/timeout: degradado a texto estático actual, sin bloqueo de render y sin `console.error` (protege HOME-05 y HSS-03).
- E2 `PUBLIC_ENVIRONMENT` inválido/ausente: fallback `test` documentado; nunca fila vacía ni layout roto.
- E3 `PUBLIC_GIT_BRANCH` ausente/vacío: fallback `develop` documentado; nunca `MAIN`.
- E4 `PUBLIC_API_URL` ausente (caso dev actual con `API_URL` no consumido): el sistema MUST usar el valor inyectado por compose dev tras el fix; si falta, aplica E1.
- E5 Cambio parcial de rama (solo código sin docs/tests o viceversa): prohibido; los 4 ficheros de rama viajan en la misma unidad con grep de `MAIN` como evidencia.

## Trazabilidad a ficheros

| Área | Ficheros |
| --- | --- |
| Código | `frontend/src/pages/index.astro`, `frontend/src/components/InfoCard.astro`, `frontend/src/components/Header.astro` (si toca), `frontend/src/components/Footer.astro` (si toca), `frontend/src/env.d.ts` |
| Runtime | `frontend/Dockerfile.prod` (+ `Dockerfile.dev` si aplica), `compose/compose.prod.yml`, `compose/compose.dev.yml` |
| Docs/env | `docs/app-map/views/home/index.md`, `docs/app-map/views/home/features/status-summary.md`, `docs/app-map/views/home/features/runtime-metadata.md`, `docs/app-map/runtime-metadata.md` (si existe como alias citado en proposal), `.env.example` |
| Tests | `tests/e2e/home/index.spec.ts`, `tests/unit/home/runtime-metadata.test.ts` (+ unit home asociados) |

```criteria-links/v1
{
  "schema": "criteria-links/v1",
  "criteria": ["HOME-01", "HOME-05", "HSS-01", "HSS-02", "HSS-03", "HSS-04", "HRM-01", "HRM-02"],
  "scenarios": [
    {"id": "SC-S1-identidad", "criterion_ids": ["HOME-01", "HSS-01"]},
    {"id": "SC-S2-frontend-env-prod", "criterion_ids": ["HSS-02"]},
    {"id": "SC-S2-frontend-env-dev", "criterion_ids": ["HSS-02"]},
    {"id": "SC-S2-frontend-env-fallback", "criterion_ids": ["HSS-02"]},
    {"id": "SC-S3-api-salud-ok", "criterion_ids": ["HSS-03"]},
    {"id": "SC-S3-api-degradado", "criterion_ids": ["HSS-03", "HOME-05"]},
    {"id": "SC-S4-rama-real", "criterion_ids": ["HSS-04", "HRM-01"]},
    {"id": "SC-S4-rama-fallback", "criterion_ids": ["HRM-01"]},
    {"id": "SC-S4-cero-main", "criterion_ids": ["HRM-01"]},
    {"id": "SC-S4-timestamp-ssr", "criterion_ids": ["HRM-02"]},
    {"id": "SC-S4-consola-limpia", "criterion_ids": ["HOME-05"]},
    {"id": "SC-S5-doctors-target-home", "criterion_ids": ["HOME-01", "HOME-05", "HSS-01", "HSS-02", "HSS-03", "HSS-04", "HRM-01", "HRM-02"]},
    {"id": "SC-S5-gate-test-check", "criterion_ids": ["HOME-01", "HOME-05", "HSS-01", "HSS-02", "HSS-03", "HSS-04", "HRM-01", "HRM-02"]}
  ]
}
```
