# Trazabilidad del flujo SDD — PCT-106..PCT-121 y comandos de tarea

Autoridad: bloque `task-flow-binding` de [`tasks/binding.md`](tasks/binding.md). Los estados, lanes y gates no se republican aquí. Las extensiones RDD y JD se resuelven solo al seleccionarlas.

La tab Tareas y `projectctl tasks create/update` pertenecen a este satélite. El path histórico `projectctl-requirements/references/tareas.md` permanece en `/active_sources/exclude` como tombstone, aunque el archivo fue retirado del core.

| PCT ID | Contrato | Source |
| --- | --- | --- |
| `PCT-106` | Inputs de creación | `tasks/binding.md` `/task/required_inputs` |
| `PCT-107` | Identidad y naming | `tasks/binding.md` `/task` y `/delivery/branch_pattern` |
| `PCT-108` | Artifact store | `tasks/binding.md` `/artifact_store` |
| `PCT-109` | Fases y controles | `tasks/binding.md` `/phases` y `/controls`; RDD en `projectctl-rdd/workflow-extension.json` |
| `PCT-110` | Proposal y aceptación | `tasks/binding.md` `/phases` y `/gates` |
| `PCT-111` | Lanes y selección de skills | `tasks/binding.md` `/task_skill_selection`; `../modules/sd-protocol/skill-resolver.md` |
| `PCT-112` | Verificación en el workflow | `tasks/binding.md` `/phases` y `/gates`; política Test en `projectctl-requirements/references/test/reglas.md` |
| `PCT-113` | Entrega condicional | `tasks/binding.md` `/phases`; extensión `projectctl-rdd/workflow-extension.json` |
| `PCT-114` | Tab informativa frente a tarea mutable | `tasks/binding.md` `/active_sources/include` |
| `PCT-115` | Branch gate | `tasks/binding.md` `/gates` y `/controls` |
| `PCT-116` | Aceptación funcional | `tasks/binding.md` `/gates` |
| `PCT-117` | Entrega | `tasks/binding.md` `/delivery`; extensión RDD seleccionada |
| `PCT-118` | Aliases retirados | `tasks/binding.md` `/retired_aliases` y `/active_sources/exclude` |
| `PCT-119` | Mapping histórico AC↔PCT de origen; no operativo en v15. Migrar su fuente original antes de regenerar el inventario | `criteria-integration.md`; `tasks/binding.md` `/criteria_identity` |
| `PCT-120` | Envelopes y routing | `tasks/binding.md` `/status` y `/phases`; `../modules/sd-protocol/workflow-runtime-context.md` |
| `PCT-121` | Recuperación y precedencia | `tasks/binding.md` `/artifact_store` |
| `PCT-53`, `PCT-54` | Contrato profesional y selección explícita del CLI tasks | `tasks/binding.md` `/task_skill_selection/cli` y registro de la instancia destino |
| `PCT-155` | La proposal declara el delta de criterios con IDs | `../modules/sdd/sdd-propose/module.md`; identidad del criterio en el App Map de la instancia |

Comprobar con `bun test ./.agents/skills/projectctl-sdd/scripts/__tests__` y `bun .agents/skills/projectctl-sdd/scripts/skill/sdd-check.ts --check` (instancia) / `--check-package` (árbol portable sin locator).
