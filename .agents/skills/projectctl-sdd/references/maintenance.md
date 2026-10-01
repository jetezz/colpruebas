# Mantenimiento de projectctl-sdd

`projectctl-sdd` es el dueño del bloque delimitado `task-flow-binding` en [`tasks/binding.md`](tasks/binding.md), del MAP de lanes, del protocolo, de sus assets y de la proyección `generated/phase-state-schema.json`. El core `projectctl-requirements` aporta criterios y contratos de evidencia, sin versionar el workflow.

## Identidad y actualización

- `metadata.version` de `projectctl-sdd/SKILL.md` versiona el satélite. El binding conserva el ID estable `projectctl-requirements.task-flow` v15.0.0, fijado en el locator. Ese ID **no** concede autoridad al core.
- Un cambio del bloque machine exige actualizar binding y satélites seleccionables que pineen `base_binding_id`/`base_binding_version`, regenerar la proyección con `bun .agents/skills/projectctl-sdd/scripts/skill/task-flow-normalizer.ts --generate-base-projection` y comprobar el baseline con `--check-baseline`.
- La proyección es derivada y no autoriza estados, aprobaciones ni recuperación. El cambio de `active_sources` altera el digest y también requiere regeneración.
- Una instalación mixed/híbrida de versiones de binding, locator, proyección, MAP y extensión seleccionada **bloquea** antes de routing o delivery. En particular V1/V2 o task documents v8/v9 no se convierten por fallback a una revisión vigente. Nunca elegir una fuente alternativa por silencio.
- Copiar el satélite completo con `copy-tree-no-mods`. El destino configura su locator, registry, agentes y cualquier target UI propio; esos archivos de integración no forman parte del árbol portable.

## Checks

1. `bun .agents/skills/projectctl-sdd/scripts/skill/sdd-check.ts --check` (= `--check-installed` / `--mode installed`, default compat) valida paquete + binding + locator de la instancia (falla sin locator o con locator corrupto). `bun .agents/skills/projectctl-sdd/scripts/skill/sdd-check.ts --check-package` (o `--mode package`) valida solo el árbol portable (paquete + binding + `active_sources` + templates, omite el locator) y debe dar 0 en un copy-tree sin `.agents/sdd-workflow.json`.
2. `bun .agents/skills/projectctl-sdd/scripts/skill/task-flow-normalizer.ts --check-baseline` valida identidad, locator y versión (modo installed; el API acepta `{ skipLocator: true }` solo para verificación portable programática).
3. `bun test ./.agents/skills/projectctl-sdd/scripts/__tests__` comprueba el protocolo, resolución, proyección y composición condicional RDD/JD.
4. `bun .agents/skills/projectctl-requirements/scripts/skill/requirements-check.ts --check` valida **solo el core**; no presupone la instalación SDD.

Las decisiones vigentes se documentan en [`decisions.md`](decisions.md); [`sources.md`](sources.md) contiene los IDs PCT-106..PCT-121 del workflow. Un informe de lane SDD no equivale a cobertura aceptada por la política Test del core.

Las operaciones Git del motor producen la evidencia `branch_name` que consume el gate de PR/cierre. Al cambiar productores o consumidores, comprobar su integración con un repositorio Git de prueba y cubrir la recuperación `branch verify` sin avance de estado ni evidencia de procedencia inferida. Esta corrección operativa no cambia el bloque machine ni requiere migrar índices o extensiones.

## v25 / binding v15 — identidad canónica

La política core es obligatoria para todas las lanes. `criteria_identity` declara evidencia calculada para aprobación vigente, links spec/tasks y delta materializado. Propuesta usa `criteria-change/v1`; spec/tasks usan `criteria-links/v1`. No se aceptan criterios AC locales, aliases ni gates verdes por referencias aisladas. Seguir [`criteria-integration.md`](criteria-integration.md) para migración explícita; no adaptar automáticamente índices v13. Preservar historial, reconstruir trabajo pendiente con IDs reales y aprobar la revisión vigente. Validar ambos paquetes y sus instalaciones copiadas.
