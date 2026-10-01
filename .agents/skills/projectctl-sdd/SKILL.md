---
name: projectctl-sdd
description: Flujo SDD portable de projectctl: binding, lanes, protocolo, resolver y proyecciones base.
metadata:
  id: projectctl-sdd
  version: 25.0.0
  layer: repo
  type: satellite
  sot_policy: satellite-extension
  install: copy-tree-no-mods
  license: MIT
  categories:
    - projectcl
---

# projectctl-sdd

Satélite instalable del flujo SDD de `/projectctl`. La autoridad única del workflow es el bloque `task-flow-binding` de [`references/tasks/binding.md`](references/tasks/binding.md), `TaskFlowBindingV2` v15.0.0 (model 2). El `binding_id` `projectctl-requirements.task-flow` permanece estable: cambiarlo requiere migración de locator, proyecciones y consumidores.

Los criterios conservan el ID canónico del bundle App Map durante proposal → spec → tasks → apply → verify. No hay catálogo AC por tarea ni aliases. Cargar [`references/criteria-integration.md`](references/criteria-integration.md) para proposals, aprobación, altas/bajas y migración; el contrato de identidad pertenece al core.

- [`MAP.md`](MAP.md) registra las lanes base y el protocolo por id; [`modules/sdd/sdd-orchestrator/module.md`](modules/sdd/sdd-orchestrator/module.md) coordina la ejecución.
- [`modules/sd-protocol/module.md`](modules/sd-protocol/module.md) define los mecanismos compartidos; [`assets/task-template.md`](assets/task-template.md) y `assets/examples/` documentan artefactos de tarea.
- `scripts/skill/task-flow-normalizer.ts` lee el binding y genera la proyección base `generated/phase-state-schema.json`; `scripts/skill/sdd-check.ts` valida el paquete. `scripts/project/` contiene las operaciones del índice de tareas en la instancia destino; los doctors de criterios, docs y estructura siguen en el core.
- [`references/sources.md`](references/sources.md) conserva la trazabilidad PCT-106..PCT-121 del workflow sin duplicar el bloque machine.
- [`references/decisions.md`](references/decisions.md) documenta únicamente las decisiones vigentes del workflow; el core versiona sus decisiones de criterios y evidencia.
- [`references/requirements-verification.md`](references/requirements-verification.md) explica los perfiles de requirements, preparación machine y receipts con vigencia selectiva; sus valores se resuelven exclusivamente del binding.
- El locator del proyecto `.agents/sdd-workflow.json` apunta al binding de este satélite. Este binding posee la tab Tareas; `projectctl-requirements` conserva la cadena de criterios, docs, test, estructura y código. La tab CLI pertenece a la instancia destino (sin skill portable) y RDD/Judgment Day a sus propios satélites.

Instalación: copiar el árbol completo a `.agents/skills/projectctl-sdd/` junto con el core para la compatibilidad `/projectctl` (`copy-tree-no-mods`); inicializar el locator del destino con `cp .agents/skills/projectctl-sdd/assets/sdd-workflow.example.json .agents/sdd-workflow.json` (ejemplo fijado a `expected_binding_version` 15.0.0; al subir de binding, re-sincronizar ejemplo y proyección según `references/maintenance.md`). Verificación portable (árbol sin locator) con `bun .agents/skills/projectctl-sdd/scripts/skill/sdd-check.ts --check-package`; verificación de instancia (con locator) con `bun .agents/skills/projectctl-sdd/scripts/skill/sdd-check.ts --check` (= `--check-installed`).

Operaciones del índice de tarea: [`scripts/project/tasks.ts`](scripts/project/tasks.ts) y su [guía](references/task-engine.md). El motor y sus pruebas residen dentro del satélite; resuelve el binding desde el locator de la instancia destino. `sdd-orchestrator` es el único operador/escritor del índice y utiliza el motor para toda operación que este soporta; los phase artifacts siguen siendo propiedad de sus lanes.
