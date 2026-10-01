# Mantenimiento del core projectctl-requirements

Este árbol se distribuye mediante `copy-tree-no-mods`. El core versiona la cadena criterios → docs → test → estructura/arquitectura → code. Cambios contractuales requieren actualizar `metadata.version` en `SKILL.md`, las referencias de las superficies afectadas y las fuentes verificables de `references/sources.md`.

En v23.0.0, las referencias por función residen únicamente en `references/{criterios,docs,test,estructura,code}/reglas.md`. Las rutas raíz `doc.md`, `criterios.md`, `test.md` y `estructura.md` se retiraron; sus consumidores deben usar las rutas canónicas. Es un cambio MAJOR de paths públicos. Las citas en `taskReadme/` anteriores a esta versión son evidencia histórica, no rutas operativas.

En v24.0.0, `references/cli.md` pasó a `projectctl-cli/references/cli.md`; se retiraron los locators `references/entorno.md` y `references/tareas.md`, ya cubiertos por sus satélites. Los tres paths anteriores son históricos: el core no importa esos satélites para comprobarse. `projectctl-cli/references/cli.md` se eliminó del ecosistema portable (tab CLI retirada a la instancia destino); el core no lo importa. La generación de bundles de instancia puede citarlos sin convertirlos en dependencias de validación del core.

En v25.0.0, el generador de tabs, el manifest de capacidades de instancia, su schema y el template E2E de tabs salen del árbol copiable. La autoridad MAP queda en `scripts/skill/projectctl-map.ts`. La instalación core-only prueba importaciones reales de sus módulos; la instancia mantiene sus propias suites de proyecciones y tabs.

En v25.1.0, los tres doctors admiten el selector aditivo `--target=<view>[:<feature>]`. `scripts/project/app-map-inventory.ts` deriva navegación, bundles y criterios de las fuentes existentes para evitar tres resoluciones divergentes; sin filtro siguen los diagnósticos globales. Los checks managed y de infraestructura no se convierten en veredictos de feature.

La identidad de cada criterio se documenta en el bundle App Map. `references/app-map/criteria.yaml` es el inventario de origen; coverage-ledger aporta eventos de evidencia separados, no otra definición de criterios. No copiar catálogos de fases/lanes a este árbol. Un doctor local `unverified` no es aprobación gestionada.

En v26.0.0, `criterion-contract.ts` centraliza identidad, tipos, extracción y revisión, incluidos IDs compuestos. Se retiraron aliases operativos AC→PRJ; los destinos migran referencias explícitamente. `references/criterios/identity.md` define owner único, solicitudes con ID definitivo y tombstones de retirada. El inventario legado y sus candidatos son archivo de origen, nunca autoridad del destino ni asignador de IDs. El core sigue instalándose sin SDD.

Verificación del paquete: `bun .agents/skills/projectctl-requirements/scripts/skill/requirements-check.ts --check`; diagnóstico del proyecto: `scripts/project/doctor-{docs,test,structure}.ts`. El core se comprueba incluso sin `.agents/sdd-workflow.json` ni satélites. El contrato histórico de versiones del binding vive en [`projectctl-sdd/references/maintenance.md`](../../projectctl-sdd/references/maintenance.md) y se verifica por separado con `sdd-check.ts`.
