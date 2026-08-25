# Requirements — Tab Doc

Índice navegable de requisitos que un proyecto debe cumplir para que la **tab Doc** (`/projectctl?tab=doc`) liste las reglas documentales que un proyecto debe cumplir para que su `docs/app-map/` se renderice bien (read-only) desde la tab Doc del workspace `/project/<id>?tab=doc`.

Esta skill es el **estándar canónico de compatibilidad `/projectctl`** y este archivo cubre PCT-83..88. Cada requisito cita fuentes relacionadas en formato estructurado y declara `Cumple: PCT-XX` + `last-verified: 2026-07-24`.

> **Convención de citación**: por entry, formato
> ```
> SoT original: <path-1> + <path-2> + <CLI/API> + <test-path>.
> Cumple: PCT-XX[, PCT-YY, ...].
> last-verified: YYYY-MM-DD (regenerar ante cualquier cambio en las SoT citadas).
> ```
> NO copies este checklist en otras skills. La etiqueta `SoT original` se mantiene para el test de coherencia y apunta a fuentes de trazabilidad.

---

## Requisito: Tab Doc existe y lista reglas documentales aplicables

> **SoT original**: `docs/app-map/views/project-workspace/features/doc-tab.md` (PRJ-73..PRJ-78e) + `.agents/skills/projectctl-requirements/references/standard.md` §1 + `frontend/src/views/projectctl/ui/DocTabPanel.tsx` (scope WU-UI-2) + `docs/app-map/views/projectctl/features/doc.md` (bundle declarativo, scope WU-DOC-1).
> **Cumple**: PCT-83, PCT-102, PCT-103.
> **last-verified**: 2026-07-24.

La ruta `/projectctl?tab=doc` MUST renderizar el panel Doc listando las reglas documentales (5 secciones MUST, contrato `criteria[]` inline, prefix discipline, SoT única, eliminación de archivos legacy) que un proyecto debe cumplir para que su `docs/app-map/` se renderice (read-only) desde la tab Doc del workspace `/project/<id>?tab=doc`. La tab Doc MUST renderizar el bloque `<aside data-testid="projectctl-tab-sources-doc">` con la tabla SoT del tab (PCT-102) y referenciar el bundle `features/doc.md` para la lógica declarativa de los criterios.

## Requisito: 5 secciones canónicas MUST por bundle (`URL`, `Tab`, `Objetivo`, `Criterios`, `Diagrama Mermaid`)

> **SoT original**: `docs/app-map/views/<bundle>/index.md` (secciones canónicas; ej. `docs/app-map/views/projectctl/index.md`, `docs/app-map/views/project-workspace/features/doc-tab.md`) + `.agents/skills/projectctl-requirements/references/standard.md` §1.
> **Cumple**: PCT-84.
> **last-verified**: 2026-07-24.

El panel Doc MUST listar las 5 secciones canónicas MUST por bundle (`URL`, `Tab`, `Objetivo`, `Criterios de calidad`, `Diagrama Mermaid`) como checklist navegable, con marcador obligatorio por sección y enlace al estándar integrado `.agents/skills/projectctl-requirements/references/standard.md` como policy de origen. Cada bundle de `docs/app-map/` está obligado a declarar estas 5 secciones; los diagramas Mermaid viven como `${bundle}.mmd` siblings.

## Requisito: Contrato `criteria[]` inline en frontmatter YAML con IDs prefijados por bundle

> **SoT original**: `docs/app-map/views/projectctl/index.md` (frontmatter ejemplo, `criteria[]` con IDs `PCT-*`) + `.agents/skills/projectctl-requirements/references/standard.md` §1 + `.agents/skills/projectctl-requirements/references/standard.md` §2.
> **Cumple**: PCT-85.
> **last-verified**: 2026-07-24.

El panel Doc MUST explicar el contrato `criteria[]` inline en frontmatter YAML: estructura `{id, title, functional, coverage}` con IDs prefijados por bundle (`PCT-*` para `views/projectctl/`, `PRJ-*` para `views/project-workspace/`, `TST-*` para test-system, `AC-*` cross-cutting, `DSH-*` para `views/dashboard/`, `TNL-*` para tunnel, `LGN-*` para `views/login/`, `MDL-*` para `views/models/`) y métodos/cobertura permitidos (`Unit`, `PW-CLI`, `PW-AUTO`, `Manual` × `covered`, `partial`, `missing`, `not-applicable`). Estados funcionales permitidos: `implemented | partial | missing | not-applicable`.

## Requisito: Única SoT = `docs/app-map/` + `navigation.yaml` + `${bundle}.md` + `${bundle}.mmd` (sin archivos legacy)

> **SoT original**: `.agents/skills/projectctl-requirements/references/standard.md` §1 + TST-03 / TST-12 (`docs/app-map/views/project-workspace/features/test-tab.md` líneas contractuales de la eliminación).
> **Cumple**: PCT-86, PCT-103.
> **last-verified**: 2026-07-24.

El panel Doc MUST citar como **única SoT** `docs/app-map/` + `docs/app-map/navigation.yaml` + `${bundle}.md` + `${bundle}.mmd`, y MUST recordar explícitamente que la superficie de `docs/01-product/quality/` (incluidos los archivos quality-plan.md y quality-status.md, más el subárbol `quality/**`) está **eliminada íntegra** per TST-03/TST-12 — NO se debe reescribir ni restaurar. La cobertura se escribe directo en `criteria[].coverage` de cada bundle; NO en archivos paralelos. Cualquier agente que intente actualizar o restaurar un archivo dentro de esa superficie legacy está creando una nueva SoT prohibida y debe ser bloqueado por `projectctl-requirements` §standard.

## Requisito: `projectctl-requirements` como policy integrada sobre cuándo y cómo actualizar bundles

> **SoT original**: `.agents/skills/projectctl-requirements/references/standard.md` §1 + `docs/04-process/task.md` §1-5.
> **Cumple**: PCT-87.
> **last-verified**: 2026-07-24.

El panel Doc MUST referenciar `.agents/skills/projectctl-requirements/references/standard.md` como la policy integrada sobre cuándo y cómo actualizar bundles (trigger documental mínimo + contratos obligatorios de `docs/app-map/`). Si un agente duda si actualizar `index.md` del bundle, la respuesta está en este estándar integrado.

## Requisito: Lista explícita de IDs reservados por bundle/prefix + AC cross-cutting vigentes

> **SoT original**: `docs/app-map/views/<view>/index.md` (frontmatter ejemplo en `projectctl/index.md`, `project-workspace/features/test-tab.md`, etc.) + `docs/app-map/views/project-workspace/features/test-tab.md` (TST-XX + AC-011..AC-024) + `.agents/skills/projectctl-requirements/references/standard.md` §1.
> **Cumple**: PCT-88.
> **last-verified**: 2026-07-24.

El panel Doc MUST listar los IDs reservados por bundle/prefix (`PCT-*`, `PRJ-*`, `TST-*`, `AC-*`, `DSH-*`, `TNL-*`, `LGN-*`, `MDL-*`) para que un nuevo bundle o feature no invente prefijo nuevo. SHOULD incluir los AC cross-cutting vigentes (`AC-006`, `AC-009`, `AC-010`, `AC-011..AC-024`) como referencia de IDs ya emitidos. La regla de prefix discipline (`PCT-*` ya reservado para `views/projectctl/`) está pinneada en `docs/app-map/views/projectctl/index.md` línea 9; cualquier desviación exige spec delta + decisión explícita en `sdd-spec`.

## Requisito: Sidebar / aside con tabla de sources normativas (PCT-102)

> **SoT original**: `frontend/src/views/projectctl/ui/TabSources.tsx` (scope WU-UI-1) + `frontend/src/views/projectctl/ui/DocTabPanel.tsx` (scope WU-UI-2).
> **Cumple**: PCT-102.
> **last-verified**: 2026-07-24.

El panel Doc MUST renderizar un bloque `<aside data-testid="projectctl-tab-sources-doc">` con la tabla de sources (skill path + bundle path + URL API + test path) para que un agente o humano sepa de dónde sale cada regla. Cada tab (`cli | doc | test | entorno | tareas`) MUST tener su propio aside `<aside data-testid="projectctl-tab-sources-<tab>">` con kebab-case `<tab>` perteneciente a ese conjunto canónico.

---

## Criterios cubiertos por este archivo

| ID | Criterio | Estado |
|---|---|---|
| **PCT-83** | `/projectctl?tab=doc` MUST renderizar panel Doc listando las 5 secciones MUST + contrato `criteria[]` inline + prefix discipline + SoT única + eliminación de los archivos quality-plan.md y quality-status.md (legacy per TST-03/TST-12) | `añadir` |
| **PCT-84** | Panel Doc MUST listar las 5 secciones canónicas MUST (`URL`, `Tab`, `Objetivo`, `Criterios`, `Diagrama Mermaid`) como checklist navegable con marcador obligatorio | `añadir` |
| **PCT-85** | Panel Doc MUST explicar `criteria[]` inline: estructura + prefijo por bundle + cobertura (`Unit`/`PW-CLI`/`PW-AUTO`/`Manual` × `covered`/`partial`/`missing`/`not-applicable`) | `añadir` |
| **PCT-86** | Panel Doc MUST citar `docs/app-map/` + `navigation.yaml` como única SoT y recordar eliminación de los archivos quality-plan.md y quality-status.md, más todo el subárbol `docs/01-product/quality/**`, per TST-03/TST-12 | `añadir` |
| **PCT-87** | Panel Doc MUST referenciar `.agents/skills/projectctl-requirements/references/standard.md` como policy integrada de bundles (cuándo + cómo) | `añadir` |
| **PCT-88** | Panel Doc MUST listar prefijos reservados (`PCT-*`, `PRJ-*`, `TST-*`, `AC-*`, `DSH-*`, `TNL-*`, `LGN-*`, `MDL-*`) y SHOULD incluir AC cross-cutting vigentes (`AC-006`, `AC-009`, `AC-010`, `AC-011..AC-024`) | `añadir` |

**`criteria_covered` por este archivo**: `PCT-83..PCT-88` (6 criterios nuevos, derivados de spec §6.3 + design §7.1).

**Bundles documentales relacionados**: `docs/app-map/views/projectctl/features/doc.md` + `docs/app-map/views/projectctl/features/doc.mmd` + mapping en `docs/app-map/views/projectctl/index.md` + registro de las 5 tabs en `docs/app-map/navigation.yaml`.

**Skills relacionadas** (NO copian estos requisitos): `.agents/skills/frontend-policy/SKILL.md`, `.agents/skills/skill-creator/SKILL.md`. Las reglas antes cubiertas por `docs-governance` y `testing-policy` viven integradas en `.agents/skills/projectctl-requirements/references/standard.md`.

**Documentación relacionada** (NO se modifica por esta skill, solo se referencia): `docs/00-context/agents_skills.md` §6 (registro de skills), `docs/04-process/task.md` §1-5 (flujo task), `docs/app-map/views/project-workspace/features/doc-tab.md` (PRJ-73..PRJ-78e), `docs/app-map/views/projectctl/index.md` (frontmatter ejemplo + criterios view-level PCT-01..07).
