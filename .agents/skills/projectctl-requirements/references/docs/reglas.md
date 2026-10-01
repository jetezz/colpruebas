---
file: references/docs/reglas.md
parent_skill: projectctl-requirements
owner: documentation maintenance
tab: doc
criteria_covered: [PCT-83, PCT-84, PCT-85, PCT-86, PCT-87, PCT-88]
last-verified: 2026-09-28
---

# Docs — reglas (tab Doc, PCT-83..PCT-88)

Autoridad normativa de la tab Doc tras el split por secciones: contrato de
bundles, 6 secciones, `criteria[]` inline y SoT `docs/app-map/`. Cada
requisito cita fuentes en formato estructurado y declara `Cumple` +
`last-verified`.

> **Convención de citación**: por entry, formato `SoT original` +
> `Cumple: PCT-XX` + `last-verified: YYYY-MM-DD` (regenerar ante cualquier
> cambio en las SoT citadas). NO copies este checklist en otras skills.
>
> **Contratos machine residentes**: `references/app-map/` y
> `references/schemas/` NO se mueven: son contratos machine residentes y aquí
> solo se citan. La policy integrada de cuándo/cómo actualizar bundles vive
> en `references/standard.md` §1 (se cita, no se copia).

## Requisito: Tab Doc existe y lista reglas documentales aplicables

> **SoT original**: `.agents/skills/projectctl-requirements/references/standard.md` §1 + `.agents/skills/projectctl-requirements/scripts/__tests__/doctor-docs.test.ts` (contrato del app-map) + wrapper local `<repo>/scripts/...` (panel Doc de la instancia).
> **Cumple**: PCT-83.
> **last-verified**: 2026-09-28.

La ruta `/projectctl?tab=doc` MUST renderizar el panel Doc listando las
reglas documentales (6 secciones MUST, contrato `criteria[]` inline, prefix
discipline, SoT única, eliminación de archivos legacy) que un proyecto debe
cumplir para que su `docs/app-map/` se renderice (read-only) desde la tab Doc
del workspace `/project/<id>?tab=doc`. Histórico (retired v20.0.0, ver
`references/sources.md`): PCT-102/PCT-103 fueron exigibles de la instancia
origen (aside sources / bundle raíz) y hoy son solo histórico; no se
reciclan sus IDs ni se exigen en este core.

## Requisito: Diagnóstico del bundle que realmente carga el workspace

> **SoT original**: Contrato portable: `.agents/skills/projectctl-requirements/scripts/project/doctor-docs.ts` (diagnóstico del checkout consumidor) + wrapper local `<repo>/scripts/...` (proveído por el destino, lector de la instancia).
> **Cumple**: PCT-83, PCT-84, PCT-85, PCT-86.
> **last-verified**: 2026-09-29.

Para mostrar **la tab Doc del workspace**, `docs/app-map/navigation.yaml`
MUST existir aunque ya haya archivos `.md`/`.mmd`: ausencia del root o
manifest → `missing` (HTTP 404); manifest o bundle presente pero inválido →
`invalid` (HTTP 422); solo `valid` permite sidebar y artículo. El manifest
MUST tener `root_id` que coincida con un nodo y `navigation[]` no vacío.
Cada nodo requiere `id`, `title`, `kind: view|feature`, `bundle` relativo sin
extensión y `children: []` o lista de nodos; `id` y `bundle` MUST ser únicos
globalmente. El orden de `navigation` define el sidebar; `root_id` define la
selección inicial. Para cada nodo, `${bundle}.md` y `${bundle}.mmd` MUST
existir dentro de `docs/app-map/`; archivos sueltos no referenciados no se
muestran.

El Markdown MUST declarar frontmatter `id`, `title`, `kind`, `summary` no
vacío y `source_of_truth: app-map`. `id`/`title`/`kind` MUST coincidir con el
nodo. La sección exacta `## 1. URL` MUST contener una ruta `/...` o URL
HTTP(S) canónica válida; no se sintetiza la URL del workspace. El `.mmd` MUST
contener un diagrama Mermaid no vacío, con declaración admitida y etiquetas
sin corchetes ni placeholders de ruta sin comillas. Cada `criteria[]`
presente necesita `id`, `title` y `type` de los 9 valores; el lector
normaliza `functional`/`coverage` omitidos o inválidos a `missing`, por lo
que el estándar editorial exige los cuatro métodos explícitos y sus estados
canónicos. El parser de frontmatter del lector es estricto con la indentación
(saltos de 2 espacios); Bun.YAML u otro parser permisivo NO prueba que el
lector lo acepte.

Las seis secciones PCT-84 son una **exigencia editorial** de los bundles de
`/projectctl`, no seis comprobaciones del lector del workspace: para
renderizar, el lector valida frontmatter, URL y Mermaid como arriba; el
artículo de la UI muestra URL, Objetivo, Criterios de calidad y Mapa visual.
No convertir un incumplimiento editorial aislado en un supuesto 422 ni dar
por `valid` un bundle que solo cumple las seis secciones.

**Doctor**: `bun .agents/skills/projectctl-requirements/scripts/project/doctor-docs.ts --root . --json` detecta `missing`, errores estructurales y reglas editoriales; un pase local se informa `unverified`. Desde la terminal autenticada del proyecto, agregar `--managed` delega el veredicto al `projectctl docs lint --json` del operador, que usa el lector estricto real. `projectctl docs check` valida la generación de la tab global, no reemplaza el lint del app-map gestionado. El lector remoto puede intentar sincronizar el checkout al detectar missing/invalid; para la fuente efectiva de UI, consultar también `projectctl docs status`.

`--target=<view>[:<feature>]` acota las comprobaciones de bundles al subárbol de navegación indicado; la unicidad de navegación y de IDs de criterios se contrasta globalmente. El veredicto `--managed` siempre corresponde al proyecto completo, también si se solicita un target.

## Requisito: 6 secciones canónicas MUST por bundle

> **SoT original**: `docs/app-map/views/<bundle>/index.md` (secciones canónicas; patrón portable, instancia destino, no portable) + `.agents/skills/projectctl-requirements/references/standard.md` §1.
> **Cumple**: PCT-84.
> **last-verified**: 2026-09-20.

El panel Doc MUST listar las 6 secciones canónicas MUST por bundle (`URL`,
`Tab`, `Objetivo`, `Criterios`, `Diagrama Mermaid`, `Sources`) como checklist
navegable, con marcador obligatorio por sección y enlace al estándar
integrado `.agents/skills/projectctl-requirements/references/standard.md`
como policy de origen. Cada bundle de `docs/app-map/` está obligado
**editorialmente** a declarar estas 6 secciones; `Sources` cita fuentes y no
las copia, y los diagramas Mermaid viven como `${bundle}.mmd` siblings. El
checklist editorial no sustituye la validación del lector real.

## Requisito: Contrato `criteria[]` inline en frontmatter YAML

> **SoT original**: `.agents/skills/projectctl-requirements/references/standard.md` §1/§2 + `.agents/skills/projectctl-requirements/references/schemas/criteria.schema.json` (enum portable) + `.agents/skills/projectctl-requirements/scripts/project/app-map-format.ts` (formato portable; parser estricto inyectado por el destino) + `integration-tests/projectctl/app-map-criteria-types.test.ts` (corpus de esta instancia, no portable).
> **Cumple**: PCT-85.
> **last-verified**: 2026-09-28.

El panel Doc MUST explicar el contrato `criteria[]` inline en frontmatter
YAML con shape `{id, title, functional, coverage, type}`: el enum `type`
(T-1), su árbol de clasificación (T-5) y su verificación por defecto viven
en `references/standard.md` §1 y su mapping type→carpeta en
`references/estructura/reglas.md`; los value-sets `functional`/`coverage`
son los de `references/standard.md` §1, los métodos los de
`references/standard.md` §2 y `references/test/reglas.md`, y los prefixes
por bundle los de PCT-88. El contrato es **bidireccional** (R-B): la
auditoría doc⇒código vive en `references/standard.md` §1 y su mitad
mecánica en `references/test/reglas.md` TST-38.

## Requisito: Única SoT = `docs/app-map/` + `navigation.yaml` + `${bundle}.md` + `${bundle}.mmd`

> **SoT original**: `.agents/skills/projectctl-requirements/references/standard.md` §1 + TST-03 / TST-12 (líneas contractuales de la eliminación en el bundle de la instancia destino, no portable).
> **Cumple**: PCT-86, PCT-103.
> **last-verified**: 2026-09-10.

El panel Doc MUST citar como **única SoT** `docs/app-map/` +
`docs/app-map/navigation.yaml` + `${bundle}.md` + `${bundle}.mmd`, y MUST
recordar explícitamente que la superficie de `docs/01-product/quality/`
(incluidos los archivos quality-plan.md y quality-status.md, más el subárbol
`quality/**`) está **eliminada íntegra** per TST-03/TST-12 — NO se debe
reescribir ni restaurar. La cobertura se escribe directo en
`criteria[].coverage` de cada bundle; NO en archivos paralelos. Cualquier
agente que intente actualizar o restaurar un archivo dentro de esa superficie
legacy está creando una nueva SoT prohibida y debe ser bloqueado por
`projectctl-requirements` §standard.

## Requisito: `projectctl-requirements` como policy integrada

> **SoT original**: Contrato portable: `.agents/skills/projectctl-requirements/references/standard.md` §1 + wrapper local `<repo>/docs/...` (proveído por el destino, flujo task de la instancia).
> **Cumple**: PCT-87.
> **last-verified**: 2026-09-10.

El panel Doc MUST referenciar
`.agents/skills/projectctl-requirements/references/standard.md` como la
policy integrada sobre cuándo y cómo actualizar bundles (trigger documental
mínimo + contratos obligatorios de `docs/app-map/`). Si un agente duda si
actualizar `index.md` del bundle, la respuesta está en este estándar
integrado.

## Requisito: IDs reservados por bundle/prefix + AC cross-cutting

> **SoT original**: `docs/app-map/views/<view>/index.md` (frontmatter ejemplo; patrón portable, instancia destino, no portable) + `.agents/skills/projectctl-requirements/references/standard.md` §1.
> **Cumple**: PCT-88.
> **last-verified**: 2026-09-10.

El panel Doc MUST listar los IDs reservados por bundle/prefix (`PCT-*`,
`PRJ-*`, `TST-*`, `AC-*`, `DSH-*`, `TNL-*`, `LGN-*`, `MDL-*`) para que un
nuevo bundle o feature no invente prefijo nuevo. SHOULD incluir los AC
cross-cutting vigentes (`AC-006`, `AC-009`, `AC-010`, `AC-011..AC-024`) como
referencia de IDs ya emitidos. La regla de prefix discipline (`PCT-*`
reservado para la vista `projectctl` de la instancia) la pinea el bundle de
la instancia destino (instancia origen:
`docs/app-map/views/projectctl/index.md` línea 9, no portable); cualquier
desviación exige spec delta + decisión explícita en `sdd-spec`.

## Requisito: Sidebar / aside con tabla de sources normativas (PCT-102 — histórico)

> **SoT original**: contrato de tabs de la instancia `integration-tests/projectctl/bundle-contracts.test.ts` + template e2e local `tests/e2e/demo-projectctl/tabs-contract.template.ts` (histórico, no exigible).
> **Cumple**: PCT-102 (histórico retired v20.0.0, ver `references/sources.md`; no exigible).
> **last-verified**: 2026-09-28.

Histórico: el aside `<aside data-testid="projectctl-tab-sources-doc">` fue
exigible de la instancia origen; en este core es solo referencia histórica
(retired v20.0.0, IDs no reciclados). No se exige su renderizado.

---

**Criterios cubiertos por este archivo**: `PCT-83..PCT-88`
(exigibles; `PCT-102`/`PCT-103` solo histórico retired v20.0.0, ver
`references/sources.md`, IDs no reciclados).
