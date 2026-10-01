# Proposal — cumplimiento de requisitos y corrección del index colpruebas

- Tarea: `20261001-cumreq-cumplimiento-requisitos-index` (fase_1_propuesta, binding v15 TaskFlowBindingV2).
- Base: informe sdd-explore-code aportado como insumo (no re-explorado); verificado solo lo necesario
  (`frontend/src/pages/index.astro:19`, `InfoCard.astro:32`, bundles home, tests, compose, Dockerfiles).

## Intent

Dejar la vista index de colpruebas en cumplimiento con 4 puntos verificables:

1. **App colpruebas**: identidad visible (nombre en título + tarjeta principal).
2. **Frontend env**: entorno visible prod/dev resuelto por variables de entorno (no texto fijo).
3. **API env + salud**: estado de la API visible por entorno y con salud real (no texto estático).
4. **Rama Git por rama**: la tarjeta muestra la rama real de la ejecución; corregir `MAIN`
   hardcodeado (`index.astro:19`) → `develop` / dinámico por rama.

## Assigned view/feature, canonical bundles and baseline revision

- Targets (según `docs/app-map/navigation.yaml`): `home` (view),
  `home-status-summary` (feature), `home-runtime-metadata` (feature).
- Bundles propietarios:
  - `views/home/index` → `HOME-01`, `HOME-05`.
  - `views/home/features/status-summary` → `HSS-01`, `HSS-02`, `HSS-03`, `HSS-04`.
  - `views/home/features/runtime-metadata` → `HRM-01`, `HRM-02`.
- Baseline: contenido vigente de los bundles citados (los bundles no portan contador de
  revisión; se fija `revision: 1` = contenido actual; revalidar con `proposal check` en fase 2
  antes de materializar).

## Canonical acceptance-criteria delta (app-map)

```criteria-change
{
  "schema": "criteria-change/v1",
  "targets": ["home", "home-status-summary", "home-runtime-metadata"],
  "baseline": [
    {"id": "HOME-01", "bundle": "views/home/index", "revision": 1, "retired": false},
    {"id": "HOME-05", "bundle": "views/home/index", "revision": 1, "retired": false},
    {"id": "HSS-01", "bundle": "views/home/features/status-summary", "revision": 1, "retired": false},
    {"id": "HSS-02", "bundle": "views/home/features/status-summary", "revision": 1, "retired": false},
    {"id": "HSS-03", "bundle": "views/home/features/status-summary", "revision": 1, "retired": false},
    {"id": "HSS-04", "bundle": "views/home/features/status-summary", "revision": 1, "retired": false},
    {"id": "HRM-01", "bundle": "views/home/features/runtime-metadata", "revision": 1, "retired": false},
    {"id": "HRM-02", "bundle": "views/home/features/runtime-metadata", "revision": 1, "retired": false}
  ],
  "changes": [
    {"id": "HOME-01", "bundle": "views/home/index", "operation": "maintain",
     "before": {"id": "HOME-01", "title": "La aplicacion se identifica visiblemente apenas carga la landing con su nombre en el titulo del documento y en la tarjeta principal.", "type": "functionality"},
     "after": {"id": "HOME-01", "title": "La aplicacion se identifica visiblemente apenas carga la landing con su nombre en el titulo del documento y en la tarjeta principal.", "type": "functionality"},
     "reason": "Identidad intacta; el cambio solo corrige valores derivados (rama/entorno), no la identidad."},
    {"id": "HOME-05", "bundle": "views/home/index", "operation": "maintain",
     "before": {"id": "HOME-05", "title": "La carga inicial de la landing no produce errores de consola (browser console clean).", "type": "functionality"},
     "after": {"id": "HOME-05", "title": "La carga inicial de la landing no produce errores de consola (browser console clean).", "type": "functionality"},
     "reason": "El fetch de salud SSR con degradado graceful se disena expresamente para no introducir errores de consola."},
    {"id": "HSS-01", "bundle": "views/home/features/status-summary", "operation": "maintain",
     "before": {"id": "HSS-01", "title": "El nombre de la aplicacion es visible dentro de la tarjeta central Resumen de estado con la etiqueta Aplicacion:.", "type": "ui"},
     "after": {"id": "HSS-01", "title": "El nombre de la aplicacion es visible dentro de la tarjeta central Resumen de estado con la etiqueta Aplicacion:.", "type": "ui"},
     "reason": "Fila Aplicacion: sin cambios."},
    {"id": "HSS-02", "bundle": "views/home/features/status-summary", "operation": "maintain",
     "before": {"id": "HSS-02", "title": "El estado del frontend se muestra dentro de la misma tarjeta, alineado a la derecha del label Frontend: y diferenciado por entorno.", "type": "ui"},
     "after": {"id": "HSS-02", "title": "El estado del frontend se muestra dentro de la misma tarjeta, alineado a la derecha del label Frontend: y diferenciado por entorno.", "type": "ui"},
     "reason": "Solo se alinean los valores de entorno (production/development); el patron label + color por entorno se conserva."},
    {"id": "HSS-03", "bundle": "views/home/features/status-summary", "operation": "maintain",
     "before": {"id": "HSS-03", "title": "El estado de la API se muestra dentro de la tarjeta con la etiqueta API: y replica el patron de color por entorno.", "type": "ui"},
     "after": {"id": "HSS-03", "title": "El estado de la API se muestra dentro de la tarjeta con la etiqueta API: y replica el patron de color por entorno.", "type": "ui"},
     "reason": "La fila API: conserva etiqueta y patron; el texto pasa de estatico a salud real con fallback, sin cambiar la aceptacion."},
    {"id": "HSS-04", "bundle": "views/home/features/status-summary", "operation": "maintain",
     "before": {"id": "HSS-04", "title": "Una referencia de rama git se renderiza con la etiqueta Rama Git: en la misma tarjeta.", "type": "ui"},
     "after": {"id": "HSS-04", "title": "Una referencia de rama git se renderiza con la etiqueta Rama Git: en la misma tarjeta.", "type": "ui"},
     "reason": "Render de la fila intacto; solo cambia el valor que recibe (rama real en vez de MAIN)."},
    {"id": "HRM-01", "bundle": "views/home/features/runtime-metadata", "operation": "modify",
     "before": {"id": "HRM-01", "title": "La tarjeta muestra una referencia visible de la rama git para contextualizar la ejecucion observada.", "type": "ui"},
     "after": {"id": "HRM-01", "title": "La tarjeta muestra la rama git real de la ejecucion (resuelta por entorno/rama via PUBLIC_GIT_BRANCH con fallback documentado a develop) para contextualizar la ejecucion observada.", "type": "ui"},
     "reason": "Corrige MAIN hardcodeado (index.astro:19, fosilizado en runtime-metadata.md:25-28 y tests): el contrato pasa de mera presencia a resolucion del valor real por rama."},
    {"id": "HRM-02", "bundle": "views/home/features/runtime-metadata", "operation": "maintain",
     "before": {"id": "HRM-02", "title": "El timestamp visible en el pie de la landing esta en formato ISO 8601 y refleja el momento del render SSR, no del cliente.", "type": "ui"},
     "after": {"id": "HRM-02", "title": "El timestamp visible en el pie de la landing esta en formato ISO 8601 y refleja el momento del render SSR, no del cliente.", "type": "ui"},
     "reason": "Timestamp SSR sin cambios."}
  ]
}
```

## Criterios delta (app-map) — tabla derivada del fence

| Operación | ID canónico | Bundle owner | Antes | Después | Justificación |
| --- | --- | --- | --- | --- | --- |
| mantener | `HOME-01` | `views/home/index` | Identidad visible (título + tarjeta) | Ninguno (sin cambio) | Identidad intacta |
| mantener | `HOME-05` | `views/home/index` | Consola limpia al cargar | Ninguno (sin cambio) | Fetch SSR con degradado graceful, sin errores de consola |
| mantener | `HSS-01` | `views/home/features/status-summary` | Fila `Aplicación:` visible | Ninguno (sin cambio) | Fila sin cambios |
| mantener | `HSS-02` | `views/home/features/status-summary` | Fila `Frontend:` + color por entorno | Ninguno (sin cambio) | Solo se alinean valores de entorno |
| mantener | `HSS-03` | `views/home/features/status-summary` | Fila `API:` + patrón color | Ninguno (sin cambio) | Etiqueta y patrón intactos; salud real con fallback |
| mantener | `HSS-04` | `views/home/features/status-summary` | Fila `Rama Git:` renderizada | Ninguno (sin cambio) | Solo cambia el valor recibido |
| modificar | `HRM-01` | `views/home/features/runtime-metadata` | Referencia visible de rama (valor constante `MAIN` aceptado) | Rama git real resuelta por entorno/rama (`PUBLIC_GIT_BRANCH`, fallback `develop`) | Corrige `MAIN` hardcodeado; contrato pasa de presencia a resolución |
| mantener | `HRM-02` | `views/home/features/runtime-metadata` | Timestamp ISO 8601 SSR | Ninguno (sin cambio) | Sin cambios |

- Añadidos: ninguno. Eliminados: ninguno. IDs nuevos: ninguno (no se inventa ningún ID sin owner).
- SHA256 del artefacto: pendiente de cálculo en la aprobación (`proposal accept` exige IDs exactos
  del delta + SHA256; lo registra sdd-orchestrator; esta lane no dispone de shell).

## Relevant maintained criteria

`HOME-01`, `HOME-05`, `HSS-01`, `HSS-02`, `HSS-03`, `HSS-04`, `HRM-02`: comportamiento preservado;
spec/tests los cubren sin redefinirlos. Único cambio de aceptación: `HRM-01` (modify).

## Scope (in/out)

In:

- `frontend/src/pages/index.astro` (rama dinámica, env alineado, fetch salud SSR con fallback).
- `frontend/src/components/InfoCard.astro` (fila `Rama Git:` recibe valor real; sin cambio estructural).
- `Header.astro` / `Footer.astro` solo si toca (timestamp SSR y título intactos salvo necesidad).
- `frontend/src/env.d.ts`: tipado de `PUBLIC_*` (`PUBLIC_ENVIRONMENT`, `PUBLIC_API_URL`, `PUBLIC_GIT_BRANCH`).
- `frontend/Dockerfile.prod` (+ `Dockerfile.dev` si aplica): `ARG/ENV PUBLIC_GIT_BRANCH`.
- `compose/compose.prod.yml` y `compose/compose.dev.yml`: inyectar `PUBLIC_GIT_BRANCH` (+ `PUBLIC_API_URL` en dev, hoy ausente: dev inyecta `API_URL` no consumido).
- `docs/app-map/views/home/features/runtime-metadata.md` (+ docs home que citen `MAIN`) y firma `.env.example`.
- Tests: `tests/e2e/home/index.spec.ts:35` y `tests/unit/home/runtime-metadata.test.ts:18` (aserciones `MAIN` → rama real/fallback).
- Comandos doctors: `.agents/skills/projectctl-requirements/scripts/project/` (`doctor-test`, `doctor-structure`, `doctor-docs`, `app-map-inventory`, `criterion-contract`, …) + `scripts/skill/requirements-check.ts` (`bun <script> --root . [--target=home] [--json]`); testing `bun run scripts/test-runner.ts`, gate `test:check` (TST-13).

Out: endpoints backend nuevos (reutiliza `/health`, `/api/status` existentes); cambios visuales fuera
de la tarjeta; otros targets fuera de `home`; creación de rama/PR (delivery v15: lo coordina
sdd-orchestrator; `source_branch=develop`, `target=develop`, patrón `feature/<task_id>-<slug>`).

## Capabilities

- Index SSR muestra app + entorno + salud API + rama real sin errores de consola.
- Entornos prod/dev distinguibles solo por variables de entorno (puertos 4321/3005 vs 4324/3100
  según `.env.example` / `.env.dev`), con `PUBLIC_API_URL` efectivamente consumido.
- Doctors canónicos en verde para el target `home` y gate `test:check` (TST-13) en verde.

## Approach

1. Rama: variable build-time `PUBLIC_GIT_BRANCH` inyectada por compose prod/dev (+ `Dockerfile.prod`
   `ARG/ENV`, fallback `develop` en código). Ver decisión (a).
2. Entorno: alinear `PUBLIC_ENVIRONMENT` a `production`/`development`, fallback `test` documentado;
   ajustar textos `frontendStatus`/`apiStatus` (hoy solo distinguen `production` vs resto). Ver (c).
3. Salud API: fetch SSR a `PUBLIC_API_URL/health` (o `/api/status`) con timeout corto + fallback al
   texto estático actual ante fallo/timeout. Ver (b).
4. Docs + firma env + tests `MAIN` actualizados en la misma unidad que el cambio de rama.
5. Verificación: doctors (target `home`) + `test:check` + PW-AUTO home, `strict_tdd: true`.

### Decisiones

- (a) **Rama vía `PUBLIC_GIT_BRANCH` build-time vs endpoint `/api/status`**: se recomienda **build-time
  + degradado graceful** (fallback `develop`). Motivo: el endpoint exigiría fetch en cada render y
  acoplaría la tarjeta al backend en el path crítico de `HOME-05` (consola limpia); build-time es
  determinista, auditable en compose/Dockerfile y sin riesgo de error de red en cliente.
- (b) **Salud API: fetch SSR con timeout + fallback estático vs mantener texto + reclasificar**:
  se recomienda **fetch SSR con degradado** (timeout corto; ante fallo, texto estático actual).
  Motivo: cumple el punto 3 del objetivo (salud real) sin arriesgar `HOME-05` ni `HSS-03`.
- (c) **Alinear `PUBLIC_ENVIRONMENT` con `production`/`development` + fallback `test` documentado**:
  se recomienda **alinear**. Motivo: hoy el frontend solo distingue `production` vs resto y el
  fallback `'test'` no corresponde a ningún entorno declarado (prod/dev); documentar el fallback
  evita silencio ante mala configuración.

## Affected Areas

Código → `index.astro`, `InfoCard.astro`, (si toca) `Header`/`Footer`, `env.d.ts`, `Dockerfile.prod`,
compose dev/prod. Docs → `runtime-metadata.md` (+ docs home), `.env.example` firma. Tests → e2e
`index.spec.ts` + unit `runtime-metadata.test.ts` (criterios → docs → test → estructura → código).

## Risks

- Los 4 ficheros de rama (`index.astro`, `InfoCard.astro`, docs, tests) viajan en la **misma unidad**:
  cambio parcial deja `MAIN` fosilizado en algún nivel; mitigación: una sola work-unit + grep de
  `MAIN` como evidencia.
- **Latencia/timeout del fetch SSR** de salud: puede ralentizar el render; mitigación: timeout corto
  + fallback estático (nunca bloquear ni loguear error en consola → protege `HOME-05`).
- `STRICT_READER` sin verificar (`unverified` sin `--managed`): la lectura SSR podría comportarse
  distinto bajo reader gestionado; mitigación: verificar tras apply y registrar veredicto.
- Desalineación `API_URL` (dev) vs `PUBLIC_API_URL` (consumido): el frontend dev podría apuntar a
  salud equivocada; mitigación: inyectar `PUBLIC_API_URL` también en compose dev.

## Rollback Plan

Revertir la work-unit completa (código + docs + tests) al estado previo `MAIN`/textos estáticos;
los criterios `maintain` quedan intactos y `HRM-01` vuelve a su definición `before`. Sin migración
de datos ni cambios backend: rollback = revert + re-run `test:check` + PW-AUTO home.

## Dependencies

- Backend `/health` y `/api/status` operativos (ya existen, sin cambios).
- Compose prod/dev y `Dockerfile.prod` aceptan el nuevo `ARG/ENV PUBLIC_GIT_BRANCH`.
- `strict_tdd: true` (test runner existe): tests primero según `sdd-verify-units`.

## Success Criteria

- `HRM-01` modificado materializado: la tarjeta muestra la rama real (`develop` en dev) con fallback documentado; cero restos de `MAIN` hardcodeado (grep limpio salvo historia).
- `HOME-01`, `HOME-05`, `HSS-01..HSS-04`, `HRM-02` preservados y en verde (PW-AUTO home + `test:check` TST-13).
- Doctors canónicos del perfil (`doctor-test`, `doctor-structure`, `doctor-docs`,
  `app-map-inventory`, `criterion-contract`, `requirements-check`) en verde para `home`.
