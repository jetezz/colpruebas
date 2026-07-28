# Requirements — Tab CLI

Índice navegable de requisitos que un proyecto debe cumplir para que la **tab CLI** (`/projectctl?tab=cli`, default) se renderice correctamente. Esta tab expone los 71 comandos visibles del cliente `projectctl`, agrupados por familia (PCT-08..78 preservados), con copia al portapapeles y filtro `name` (PCT-04..07 ya implementados), más los nuevos criterios UI de la tab (PCT-79..82).

Cada requisito vive aquí como checklist canónico de compatibilidad `/projectctl` y cita fuentes relacionadas en formato estructurado con `Cumple: PCT-XX` + `last-verified` por entry.

> **Convención de citación**: por entry, formato
> ```
> SoT original: <path-1> + <path-2> + <CLI/API> + <test-path>.
> Cumple: PCT-XX[, PCT-YY, ...].
> last-verified: YYYY-MM-DD (regenerar ante cualquier cambio en las SoT citadas).
> ```
> NO copies este checklist en otras skills. La etiqueta `SoT original` se mantiene para el test de coherencia y apunta a fuentes de trazabilidad.

---

## Requisito: Catálogo de 71 comandos visibles, agrupados por familia, en orden canónico

> **SoT original**: `frontend/src/views/projectctl/data/projectctl-commands.ts` (PCT-04) + `frontend/src/views/projectctl/data/grouping.ts::familyOrder()` + `sandbox/src/lib/projectctl-registry.ts` `PROJECTCTL_COMMANDS` + `frontend/__tests__/projectctl-commands-mapping.test.ts` (drift guard 1:1).
> **Cumple**: PCT-04, PCT-05, PCT-79, PCT-80, PCT-103.
> **last-verified**: 2026-07-07.

La UI de la tab CLI reusa 1:1 `frontend/src/views/projectctl/data/projectctl-commands.ts` (PCT-04 — `Object.freeze` de 71 entries tipadas con `id`/`family`/`name`/`description`/`usage`/`copyTemplate`) como única fuente de metadata. Cero duplicación: si un agente busca otras definiciones del catálogo en `frontend/src/views/projectctl/`, solo debe existir una (la del módulo). El orden canónico de las 12 familias es `runtime → env → tunnel → commands → tasks → schedule → docs → storage → releases → activity → test → navigation`. La distribución por familia está pinneada: `runtime=22`, `env=8`, `tunnel=8`, `commands=5`, `tasks=5`, `schedule=7`, `docs=3`, `storage=2`, `releases=4`, `activity=2`, `navigation=1`, `test=4` (suma Σ=71).

## Requisito: Resumen por familia con `data-testid="projectctl-cli-family-summary-<family>"`

> **SoT original**: `sandbox/src/lib/projectctl-registry.ts` (ProjectctlRegistrySoT) + `frontend/__tests__/projectctl-commands-mapping.test.ts` (PCT-04 drift guard existente, extendido en WU-TEST-1).
> **Cumple**: PCT-81, PCT-104.
> **last-verified**: 2026-07-07.

Cada familia MUST exponer `<span data-testid="projectctl-cli-family-summary-<family>">{N} comandos</span>` en el header de cada `FamilySection`, donde `<family>` es el nombre kebab-case de la familia y `{N}` coincide con el conteo de entradas visibles por familia según el fixture inline de `frontend/__tests__/projectctl-commands-mapping.test.ts`. El sumatorio `Σ N = 71` MUST ser invariante a cambios cosméticos. La data-testid discipline sigue el patrón kebab-case `<purpose>-<scope>` transversal a todas las tabs.

## Requisito: Deep-link `?tab=cli` (default) compartible + scroll restoration opcional

> **SoT original**: `frontend/src/views/project/lib/project-tabs.ts:resolveProjectTabDeepLinkResolution` (precedente contract) + `frontend/src/views/models/ui/ModelsView.tsx` (MDL-04 patrón segmented control) + `frontend/src/views/projectctl/stores/tabs.store.ts` (nuevo, scope WU-UI-1) + `frontend/src/views/projectctl/lib/resolve-tab.ts` (nuevo, scope WU-UI-1).
> **Cumple**: PCT-82, PCT-101, PCT-102.
> **last-verified**: 2026-07-24.

La ruta `/projectctl?tab=cli` (o `/projectctl` sin query param, ya que `cli` es el default per D-9) MUST renderizar el panel CLI como segmented control interno. El click en cualquier tab del segmented control (cuyo `data-testid` sigue el patrón kebab-case `projectctl-tab-{cli,doc,test,entorno,tareas}`) MUST (a) cambiar la URL a `/projectctl?tab=<tab>` preservando otros query params si los hubiera, y SHOULD (b) preservar `scrollY` del usuario vía `sessionStorage.projectctl.lastScrollY`. La URL resultante MUST ser compartible (cargar la URL fría MUST restaurar el mismo tab activo). El helper `resolveProjectctlTab(pathname, search)` retorna `'cli'` como default y fallback ante query inválido.

## Requisito: Filtro `<input type="search">` case-insensitive substring sobre `name`

> **SoT original**: `frontend/src/views/projectctl/data/projectctl-commands.ts` (PCT-04) + `frontend/__tests__/projectctl-commands.helpers.test.ts` (test vigente de PCT-06).
> **Cumple**: PCT-06, PCT-ADD-CLI-003 (spec §6.2.1).
> **last-verified**: 2026-07-24.

El filtro MUST filtrar case-insensitive substring sobre `name` (PCT-06) y SHOULD preservar intactos los resúmenes por familia como números agregados (no se filtran los resúmenes — solo las cards; si una familia queda vacía, su `data-testid` MUST persistir con `0 comandos` y aparecer `EmptyState` global solo si `Σ familias = 0`). Si ninguna card matchea, MUST aparecer `<EmptyState data-testid="projectctl-cli-empty">Sin coincidencias para '<query>'</EmptyState>`.

## Requisito: Botón copiar con feedback `✓ Copiado` durante ~1.5s

> **SoT original**: `frontend/src/views/projectctl/ui/CopyButton.tsx` (PCT-07) + `tests/e2e/projectctl.spec.ts` (PW-AUTO vigente cubre PCT-07).
> **Cumple**: PCT-07.
> **last-verified**: 2026-07-24.

Cada `CommandCard` MUST mostrar el botón copiar con feedback `✓ Copiado` durante ~1.5s preservando los placeholders del comando copiado. El `copyTemplate === name` está pinneado en `frontend/src/views/projectctl/data/projectctl-commands.ts`; cualquier desviación rompe la spec.

## Requisito: Catálogo CLI estable 1:1 con `sandbox/src/lib/projectctl-registry.ts` (sin drift)

> **SoT original**: `sandbox/src/lib/projectctl-registry.ts` `PROJECTCTL_COMMANDS` (72 entries: 1 hidden = `projectctl --project-id <id>`, 71 visibles) + `frontend/__tests__/projectctl-commands-mapping.test.ts` (drift guard parser tolerante del registry + fixture inline 71 entries).
> **Cumple**: PCT-04, PCT-79..82.
> **last-verified**: 2026-07-07.

La UI del frontend NO importa el registry backend (regla FSD-2 + sandbox-frontend boundary); la drift-guard 1:1 vive en `frontend/__tests__/projectctl-commands-mapping.test.ts` que parsea tolerante el registry y compara con la fixture inline. Si el registry agrega/quita comandos visibles, el test falla y obliga a regenerar la UI. Cualquier nuevo comando visible debe (a) tener ID en `PCT-08..PCT-78` contiguos, (b) tener `usage` no vacío, (c) tener `copyTemplate === name`, (d) tener `family` pinneada en `FAMILY_ORDER`.

---

## Criterios cubiertos por este archivo

| ID | Criterio | Estado |
|---|---|---|
| **PCT-04** | Fuente única reusable de metadata en `data/projectctl-commands.ts`; cero duplicación | `mantener` (archivado en `index.md`) |
| **PCT-05** | Comandos agrupados visualmente por `family` | `mantener` |
| **PCT-06** | Filtro `<input>` filtra solo por `name` (case-insensitive, substring) | `mantener` |
| **PCT-07** | Botón copiar muestra feedback `✓ Copiado` durante ~1.5s | `mantener` |
| **PCT-08..PCT-78** | Catálogo per-command 1:1 con `projectctl-registry.ts` | `mantener` (archivado en `index.md` §`Trazabilidad > Per-command`; este archivo solo referencia, NO duplica 1:1 per D-2) |
| **PCT-79** | `/projectctl?tab=cli` (default) MUST renderizar panel CLI con 71 cards en orden canónico de 12 familias | `añadir` |
| **PCT-80** | Panel CLI MUST reusar 1:1 `data/projectctl-commands.ts` (cero duplicación, FSD-2) | `añadir` |
| **PCT-81** | Por familia, MUST exponer `<span data-testid="projectctl-cli-family-summary-<family>">{N} comandos</span>` con conteos pinneados | `añadir` |
| **PCT-82** | Cambio de tab MUST cambiar URL a `?tab=<tab>` y preservar scroll; URL compartible | `añadir` |

**`criteria_covered` por este archivo**: `PCT-04..PCT-07` (view-level preservados), `PCT-08..PCT-78` (per-command preservados, referenciados sin duplicar 1:1 per D-2), `PCT-79..PCT-82` (nuevos, derivados de spec §6.2 + design §7.1).

**NO se migran** los criterios PCT-08..PCT-78 a este archivo (D-2 del spec §6.1, R-008 cerrado). La tabla PCT-08..PCT-78 vive en `docs/app-map/views/projectctl/index.md` §`Trazabilidad > Per-command`; este archivo la referencia por enlace, no la duplica 1:1.
