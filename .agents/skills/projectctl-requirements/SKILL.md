---
name: projectctl-requirements
description: "Use for projectctl acceptance criteria, App Map documentation, test evidence, project structure and code traceability; verify the criteria → docs → test → structure → code chain. SDD tasks and managed runtime are owned by their satellites."
metadata:
  id: projectctl-requirements
  version: 26.0.0
  layer: repo
  type: standard
  sot_policy: canonical-standard
  install: copy-tree-no-mods
  license: MIT
  categories:
    - projectcl
---

# projectctl-requirements — core

El core define y verifica la cadena **criterios → docs → test → estructura/arquitectura → code** de un proyecto compatible con `/projectctl`. Se instala y comprueba sin locator SDD, binding de tareas, agentes SDD ni satélites opcionales.

## Autoridad y lectura

| Eslabón | Contrato | Diagnóstico local |
|---|---|---|
| Criterios: definir identidad y ledger | [`references/criterios/reglas.md`](references/criterios/reglas.md), `references/app-map/criteria.yaml` y `coverage-ledger.yaml` | `scripts/skill/requirements-check.ts --check` |
| Docs: editar bundles App Map | [`references/docs/reglas.md`](references/docs/reglas.md), `docs/app-map/navigation.yaml` y bundles `.md`/`.mmd` | `scripts/project/doctor-docs.ts --root . --json` |
| Test: aportar evidencia `@ac` | [`references/test/reglas.md`](references/test/reglas.md) | `scripts/project/doctor-test.ts --root . --json` |
| Estructura: mapear `type` y `evidence_paths` | [`references/estructura/reglas.md`](references/estructura/reglas.md) | `scripts/project/doctor-structure.ts --root . --json` |
| Code: trazar `@criterion`/`@trace` | [`references/code/reglas.md`](references/code/reglas.md) | `scripts/project/doctor-structure.ts --root . --json` |

[`references/standard.md`](references/standard.md) reúne las reglas de la cadena, [`references/sources.md`](references/sources.md) traza las fuentes y [`MAP.md`](MAP.md) publica las autoridades del paquete. `references/app-map/` y `references/schemas/` son contratos machine residentes (no se mueven). Los doctors locales son de solo lectura; un resultado `unverified` no sustituye evidencia gestionada por el operador.

El manifiesto `criteria.yaml` indexa criterios PCT con revisión y owner; el texto y `criteria[]` de cada proyecto son autoridad en sus bundles App Map. No usar el manifiesto de muestra como sustituto de los bundles del destino.

Identidad única: cargar [`references/criterios/identity.md`](references/criterios/identity.md) al definir o consumir criterios. `scripts/project/criterion-contract.ts` posee formato, tipos y revisión; `app-map-inventory.ts` resuelve la autoridad. Tests, código, estructura y satélites usan exactamente el mismo ID. Un criterio nuevo recibe su ID definitivo en la solicitud de cambio; ningún agente crea IDs equivalentes por tarea.

Los tres doctors de proyecto aceptan `--target=<view>[:<feature>]` para un diagnóstico acotado. Sin filtro comprueban el proyecto completo. `navigation.yaml` define la jerarquía y cada bundle posee sus `criteria[]`; `scripts/project/app-map-inventory.ts` deriva el inventario común sin crear otra fuente de verdad. Una vista incluye sus features descendientes. Los checks comunes y los veredictos managed siguen siendo globales: un diagnóstico acotado no certifica el proyecto completo.

## Superficies satélite de `/projectctl`

- [Entorno](../projectcl-enviorement/SKILL.md): Compose y runtime gestionado; consultar su doctor para cambios de entorno.
- [Tareas](../projectctl-sdd/SKILL.md): binding y tab informativa del workflow; instalar por separado si se usa SDD.
- Tab Agentes: el MAP del core identifica skills externas, no registra lanes SDD ni su protocolo.

## Satélites independientes

`projectctl-sdd` posee el binding `task-flow-binding`, las fases, el protocolo, los agentes, las plantillas y las proyecciones de tareas. Consume los criterios y la evidencia del core, pero no gobierna su diagnóstico. `projectctl-rdd` y `projectctl-judgment-day` poseen sus mecanismos respectivos; Judgment Day también puede operar sin SDD. Si se selecciona una extensión no instalada o incompatible, el propietario del flujo debe bloquear, nunca inferir un resultado.

Para ejecutar SDD, cargar [su skill](../projectctl-sdd/SKILL.md) e instalar por separado su locator y runtime. Copiar solo este árbol no requiere `.agents/sdd-workflow.json`. El core se valida con `bun .agents/skills/projectctl-requirements/scripts/skill/requirements-check.ts --check`; SDD, cuando está instalado, con `bun .agents/skills/projectctl-sdd/scripts/skill/sdd-check.ts --check`.

## Mantenimiento

Conservar una única autoridad por criterio, citar las fuentes sin duplicar catálogos y actualizar [`references/maintenance.md`](references/maintenance.md) al cambiar contratos. `metadata.version` versiona **este core**, independientemente de versiones del binding y los satélites. El árbol se distribuye como `copy-tree-no-mods`; los destinos aportan sus wrappers e integraciones de CLI. No usar test/report de una lane SDD como evidencia de cobertura aceptada por el core.
