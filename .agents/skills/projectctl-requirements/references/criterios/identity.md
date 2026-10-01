# Identidad canónica de criterios

## Autoridad

Un criterio tiene un ID estable, único en el proyecto, y un único bundle propietario listado en `docs/app-map/navigation.yaml`. `criteria[]` define su identidad, título y tipo; el texto normativo de aceptación vive en ese bundle. Si necesita detalle adicional para una comparación machine, usar `requirement` en su item y mantener el texto editorial como proyección. No dejar un cambio semántico únicamente en prosa que el delta no representa.

`scripts/project/criterion-contract.ts` posee el formato de ID, extracción, tipos y revisión de la definición (`id`, `title`, `type`, `requirement` cuando existe). `app-map-inventory.ts` deriva el inventario; `requireAppMap` rechaza navegación/bundles ilegibles e IDs duplicados. El estado funcional, coverage y resultados de ejecución no alteran la identidad ni la revisión de aceptación.

Los IDs simples (`PCT-155`, `TST-40`, `AC-329`) y compuestos (`AC-VIEWS-08`) son válidos. No traducir ni renumerar IDs por tarea. Normalizar mayúsculas es una operación léxica, no un alias. `@ac`, `@criterion`, `@trace`, evidence_paths, ledger y satélites referencian el mismo ID. Los IDs de escenario, unidad, gate y receipt identifican otros objetos, no otro criterio equivalente.

## Ciclo de vida

- **Alta propuesta:** la solicitud usa desde el principio el ID definitivo y el bundle owner. Es un delta pendiente, no un criterio vigente ni evidencia de cobertura. Comprobar colisiones globales antes de aprobar y otra vez antes de materializar. Serializar solicitudes concurrentes sobre los mismos IDs/owners; no prometer reserva global por una mera propuesta.
- **Aprobación:** congela la revisión de la solicitud y el baseline canónico. El escritor documental materializa después el criterio con ese mismo ID, antes de crear evidencia que lo referencie.
- **Modificación:** conserva ID y owner; declara el antes/después completo. Si cambian varias preocupaciones independientes, separarlas en criterios nuevos sin reutilizar identidades.
- **Retirada:** conservar el item como tombstone en el bundle owner con `functional: not-applicable`, `exception_reason: criterion_retired`, `coverage` no aplicable y la definición anterior. Explicar editorialmente el motivo y retirar referencias operativas de tests/código. No confundirlo con `capability_absent`. El tombstone reserva el ID y permite reconstruir el historial; no borrarlo ni reutilizarlo.
- **Sin cambio de aceptación:** referenciar criterios relevantes como mantenidos. Solo tareas realmente ajenas a criterios pueden devolver un conjunto vacío justificado.

## Proyecciones y portabilidad

`references/app-map/criteria.yaml` es el inventario de la instancia de origen incluido en el paquete, no el registro de proyectos destino. Sus filas históricas y `candidates` legacy son archivo de origen: no asignan IDs, no son aliases y no autorizan ninguna lane. Nuevas solicitudes usan IDs canónicos y no crean `PCT-CAND-*`/`related_ac`. Los schemas de manifiesto/ledger no sustituyen al bundle del proyecto.

El core permanece independiente de SDD. Cada satélite consume este contrato sin copiar su catálogo, manteniendo en sus artefactos solo referencias, deltas o evidencia. Un snapshot/delta conserva historia, no reemplaza la definición vigente del bundle.

## Migración desde identidades duplicadas

Inventariar referencias activas y contrastar definición + owner para escoger el ID canónico. Migrar explícitamente cada referencia; no inferir equivalencia por número o prefijo. Se retiraron los aliases operativos `AC-035..039 → PRJ-35..39`: esos IDs deben corregirse en los destinos que los usaban. Conservar artifacts históricos como historial y no importarlos como autoridad actual. Revalidar headers, annotations, títulos, markers y evidencia tras la migración. Una referencia desconocida debe fallar, nunca traducirse silenciosamente.
