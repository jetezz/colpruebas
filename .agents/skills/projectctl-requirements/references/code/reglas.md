---
file: references/code/reglas.md
parent_skill: projectctl-requirements
owner: documentation maintenance
tab: estructura
criteria_covered: [REQ-CODETRACE-001, REQ-CODETRACE-002]
last-verified: 2026-09-28
---

# Code — reglas (trazabilidad código↔criterio)

Autoridad normativa de la convención de markers y del contrato portable de
trazabilidad código↔criterio tras el split por secciones. Los markers son
**locators**: ubican el claim, nunca demuestran comportamiento, auth,
ownership, RLS, side-effects ni un test real. La evidencia por método
(`Unit`, `PW-CLI`, `PW-AUTO`, `Manual`) sigue siendo obligatoria y vive en
`references/test/reglas.md`.

> **Contratos machine residentes**: `references/app-map/` y
> `references/schemas/` NO se mueven: son contratos machine residentes y aquí
> solo se citan. Excepción residente declarada: el shape machine de
> trazabilidad vive en
> `references/schemas/code-traceability.schema.json`
> (`code-traceability/v1`, `policyMode: warn`).
>
> **Gap declarado (no archivo presuposible)**: este paquete no incluye
> `references/app-map/code-traceability.yaml`. Cada instancia debe configurar
> su locator de trazabilidad explícitamente; no inferir prioridades entre
> un manifest de la skill ausente y `.agents/projectctl/code-traceability.yaml`.
> La selección del operador se verifica en la instancia, no en este paquete.

## Convención: markers como locator

> **SoT original**: esta convención + `.agents/skills/projectctl-requirements/scripts/project/code-traceability-contract.ts` (distribuidos). La task de trazabilidad de la instancia es historial no instalado en destinos.
> **Cumple**: `REQ-CODETRACE-002` (namespace técnico de la task; no añade un PCT).
> **last-verified**: 2026-09-22.

Esta entrada no crea criterios ni enums: el bundle/App Map sigue siendo la
autoridad de identidad, título, tipo y estado. Para un bloque elegible, la
convención usa comentarios adyacentes y estrechos: `@criterion AC-NNN`
reclama un único criterio; `@trace` relaciona `ac` + `req` con una forma
`view/tab/block` front o `domain/resource/operation/block` back; `@contract`
declara auth, ownership y side-effects cuando aplican; y `@ac AC-NNN`
permanece en tests como referencia de evidencia. Los prefijos soportados son
`//`, `--` y `<!--`.

Guía rápida marker→dónde→qué prueba (no añade markers ni cambia la
convención; solo fija la lectura):

| Marker | Dónde va | Qué declara | Qué NO hace |
| --- | --- | --- | --- |
| `@criterion AC-NNN` | Fuente, bloque elegible, comentario adyacente anterior al símbolo | Reclama un único criterio para ese bloque | No demuestra comportamiento, auth, ownership, RLS, side-effects ni test real |
| `@trace` | Fuente, junto a `@criterion`, mismo bloque adyacente | Relaciona `ac` + `req` con forma `view/tab/block` (front) o `domain/resource/operation/block` (back) | No sustituye la evidencia del test ni el ledger |
| `@contract` | Fuente, mismo bloque, solo cuando aplican | Declara auth, ownership y side-effects del bloque | No demuestra que el control exista ni que esté testeado |
| `@ac AC-NNN` | Tests, header en primeras 10 líneas (+ `annotations.push` en Playwright) | Referencia de evidencia que el runner cruza con el header | No reclama criterios en fuente; sin header el archivo se rechaza (TST-03/TST-04/TST-10) |

`@criterion` es claim en fuente; `@ac` es referencia de evidencia en tests;
nunca se intercambian. Ningún marker demuestra por sí solo lo listado en el
párrafo siguiente.

El marker normativo debe ser el último comentario inmediatamente anterior a
la declaración del símbolo, permitiendo solo blancos y documentación del
mismo símbolo. Un marker separado por imports, otra declaración o un símbolo
distinto no atribuye el claim y debe diagnosticarse como
`TRACE_NOT_ADJACENT`. La forma válida se comprueba antes de la semántica y
los IDs se resuelven contra sus autoridades; `not-evaluated` debe ser
explícito para exclusiones. Un marker nunca demuestra por sí solo
comportamiento, auth, ownership, RLS, side-effects ni un test real. No se
permiten títulos, enums, coverage, prosa normativa ni secretos en los
comentarios o en `COMMENT ON`.

## Requisito: layout de trazabilidad front/back (locator)

> **SoT original**: esta referencia + `.agents/skills/projectctl-requirements/scripts/project/code-traceability-contract.ts` (distribuidos). La task original de la instancia es historial externo.
> **Cumple**: `REQ-CODETRACE-001` (namespace técnico de la task; no añade un PCT).
> **last-verified**: 2026-09-21.

La ubicación hace resolubles la superficie, el owner y la responsabilidad; es
un locator y no evidencia comportamiento. En frontend, los shells de `pages/`
son finos y `views/<view>/` publica `index.ts`; `ui/tabs/<tab>/` solo existe
con masa crítica y `shared/` es agnóstico de view con owner explícito. En
backend, `routes/<domain>/` adapta HTTP, `services/<domain>/` contiene casos
de uso sin `Request`/`Response`, `lib/` queda para capacidades transversales
con owner y las migrations conservan su versión y contrato SQL.

Solo se trazan bloques con responsabilidad revisable (panel, loader, store,
handler, servicio con decisión, DDL contractual u operación OpenAPI).
Re-exports, tipos sin comportamiento, wiring, fixtures, snapshots, generados
y configuración sin lógica deben excluirse o declararse `not-evaluated` con
razón. Esta convención se adopta por touch points: no exige carpeta por
criterio, renombrado masivo ni migración global, y una ruta nunca sustituye
auth, ownership o RLS.

FSD puede vivir dentro de `frontend/` y la organización modular o hexagonal
puede vivir dentro de `backend/`; ninguna de esas jerarquías internas se
eleva a top-level. La elección de siete carpetas responde a ownership y
navegación predecibles en un proyecto fullstack ligero, sin imponer la
fragmentación de un monorepo (`apps/`, `packages/`, `services/`) cuando no
existen despliegues independientes. Tampoco convierte FSD o hexagonal en una
taxonomía global: son estrategias internas de cada superficie y siguen
gobernadas por sus skills respectivas.

## Requisito: contrato portable de trazabilidad código↔criterio

> **SoT original**: `.agents/skills/projectctl-requirements/scripts/project/code-traceability-contract.ts` + `.agents/skills/projectctl-requirements/references/schemas/code-traceability.schema.json` (distribuidos).
> **Cumple**: `REQ-CODETRACE-001` (locator; namespace técnico de la task, no añade un PCT).
> **last-verified**: 2026-09-25.

El shape + validador puro del locator vive en
`scripts/project/code-traceability-contract.ts` (raíces `front`/`back`/
`tests`, `ORPHAN_CODE_BLOCK` warn-only, `not-applicable` cuando el manifest
es inválido, regex `@criterion`/`@trace`/`@ac`/`@contract` con prefijos
`//`, `--`, `<!--` y adyacencia); el shape machine lo cierra
`references/schemas/code-traceability.schema.json`
(`code-traceability/v1`, `policyMode: warn`). La instancia runtime
(lecturas, snapshot y CLI de la instancia destino, no portable; wrapper local
`<repo>/scripts/...` proveído por el destino) aporta lecturas, snapshot y
CLI; el doctor de la instancia importa el contrato portable con fallback
inyectado. Ventana warn-first (OPCIÓN A): informativo siempre, nunca
bloqueante. El doctor copiado en esta skill es autónomo en repos destino: no
importa módulos de instancia ausentes del checkout; cualquier import de
instancia debe resolverse vía wrapper local del destino.

---

**Criterios cubiertos por este archivo**: `REQ-CODETRACE-001`,
`REQ-CODETRACE-002` (namespace técnico; no añaden PCT).
