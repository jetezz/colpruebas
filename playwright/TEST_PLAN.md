# TEST_PLAN.md — Plan persistente Playwright de Home

> La fuente funcional sigue siendo `docs/app-map/**`; la cobertura canónica
> vive en `criteria[].coverage` de cada bundle. Este archivo es el mapping
> persistente archivo↔criterio exigido por `PCT-94-TEST-PLAN`: registra qué
> spec persistente cubre cada criterio y con qué comandos canónicos se ejecuta.

## 1. Specs persistentes

| Spec (archivo) | Criterios cubiertos (`@ac`) | Proyecto PW | Bundles propietarios | Tier |
|---|---|---|---|---|
| `tests/e2e/home/index.spec.ts` | `HOME-01`, `HOME-05`, `HSS-01`, `HSS-02`, `HSS-03`, `HSS-04`, `HRM-01`, `HRM-02` | `pwauto-home` | `views/home/index`, `views/home/features/status-summary`, `views/home/features/runtime-metadata` | PW-AUTO |

## 2. Matriz test → criterio

| Criterio | Test que lo cubre | Evidencia del spec |
|---|---|---|
| HOME-01 | `HOME-01 HSS-01 HSS-02 HSS-03 HSS-04 HRM-01 home identity and status summary render correctly` | Título, heading `colpruebas`, tarjeta `.info-card` visible con nombre de la aplicación |
| HOME-05 | `HOME-05 page has no console errors` | Carga en `/` con `networkidle` y cero `console.error` |
| HSS-01 | `HOME-01 HSS-01 HSS-02 HSS-03 HSS-04 HRM-01 home identity and status summary render correctly` | Label `Aplicación:` y valor `colpruebas` dentro de `.info-card` |
| HSS-02 | `HOME-01 HSS-01 HSS-02 HSS-03 HSS-04 HRM-01 home identity and status summary render correctly` | Fila `Frontend:` con valor por entorno (`PRODUCCIÓN`/`DESARROLLO`/`TEST`) |
| HSS-03 | `HOME-01 HSS-01 HSS-02 HSS-03 HSS-04 HRM-01 home identity and status summary render correctly` | Fila `API:` con salud SSR o fallback estático por entorno |
| HSS-04 | `HOME-01 HSS-01 HSS-02 HSS-03 HSS-04 HRM-01 home identity and status summary render correctly` | Fila `Rama Git:` renderizada en la misma tarjeta |
| HRM-01 | `HOME-01 HSS-01 HSS-02 HSS-03 HSS-04 HRM-01 home identity and status summary render correctly` | Rama git real de la ejecución resuelta en SSR vía `PUBLIC_GIT_BRANCH` con fallback documentado a `develop`; cero `MAIN` operativo |
| HRM-02 | `timestamp visible in footer (HRM-02)` | Timestamp del `footer` con patrón ISO 8601 (`\d{4}-\d{2}-\d{2}T`) |

## 3. Reglas del spec

- `// @ac HOME-01, HOME-05, HSS-01, HSS-02, HSS-03, HSS-04, HRM-01, HRM-02`
  aparece en las primeras 10 líneas de `tests/e2e/home/index.spec.ts`.
- Cada criterio del header también aparece en
  `testInfo.annotations.push({ type: 'ac', description: '<ID>' })`.
- Los títulos de test llevan sus IDs (`TST-42-SPEC-TITLE`) y alinean con el header.
- La navegación usa `/` y la URL base proviene de la configuración de ejecución.

## 4. Comandos (runner canónico Bun)

- Unit (target home): `bun run scripts/test-runner.ts run --method=unit --target=home`
  (atajo: `bun run test:unit:home`).
- PW-AUTO (target home, proyecto `pwauto-home`):
  `bun run scripts/test-runner.ts run --method=pwauto --target=home`
  (atajo: `bun run test:pwauto:home`).
- Todo (target home): `bun run scripts/test-runner.ts run --method=all --target=home`
  (atajo: `bun run test:all:home`).
- Gate de cobertura contractual: `bun run scripts/test-runner.ts check`
  (atajo: `bun run test:check`).

## 5. Regla de actualización

1. Si nace cobertura persistente, crear o actualizar el spec con header y
   anotaciones y registrar aquí todos sus IDs.
2. Si cambia el conjunto de criterios cubiertos por el spec, actualizar la fila
   de §1 y la matriz de §2 en el mismo cambio documental.
3. Una corrida aislada no cambia este archivo.

---

**Fuentes relacionadas**: bundles `docs/app-map/views/home/index.md`,
`docs/app-map/views/home/features/status-summary.md`,
`docs/app-map/views/home/features/runtime-metadata.md` y
`tests/e2e/home/index.spec.ts`.
