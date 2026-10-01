---
name: projectctl-rdd
description: "Trigger: projectctl RDD, receipt-driven review, Fase 5. Route and explain the repo-local RDD adapter without duplicating Gentle-AI authority."
metadata:
  id: projectctl-rdd
  version: 3.0.0
  layer: repo
  type: satellite
  sot_policy: satellite-extension
  install: copy-tree-no-mods
  binding_role: selected-extension
  license: MIT
  categories:
    - projectcl
---

# projectctl-rdd

## Justificación

Esta skill existe para explicar y operar el adapter RDD repo-local de Fase 5 sin convertir el mecanismo opcional ni la autoridad de Gentle-AI en parte del estándar portable.

## Responsabilidad exclusiva

Posee únicamente la guía operativa derivada del adapter local: resolver el flujo `execute|collect|stop`, mantener lineage fail-closed, coordinar refuter y corrección acotada, ejecutar validación read-only, tratar `rdd-report` como proyección no autoritativa y orientar el re-apunte del normalizer y del registry físico.

`projectctl-sdd` posee el binding base; `workflow-extension.json` de este satélite es la única autoridad local de fase, lanes y gates RDD. La autoridad externa de candidatos, riesgo, receipts y CAS es Gentle-AI.

## Frontera D-5: cita, no copia

### Fuentes citadas

- [`projectctl-requirements/SKILL.md`](../projectctl-requirements/SKILL.md) — contrato portable y límites de compatibilidad.
- [`projectctl-sdd/MAP.md`](../projectctl-sdd/MAP.md) — resolución de lanes SDD y autoridades del flujo.
- [`projectctl-sdd/references/tasks/binding.md`](../projectctl-sdd/references/tasks/binding.md) — binding base y declaración de extensión.
- [`modules/`](modules/) — adapters locales RDD.
- [`workflow-extension.json`](workflow-extension.json) — catálogo RDD declarativo; cargar solamente si el modo está seleccionado.
- [`third_party/gentle-ai/**`](../../../third_party/gentle-ai/) — contratos y autoridad externa citada.

### Límites

- Esta skill posee el catálogo operacional RDD; el binding SDD posee únicamente el punto de extensión.
- Declara sus lanes y gates solo en `workflow-extension.json`; no redefine el binding base ni la autoridad del proveedor.
- La selección receipt-driven requiere este satélite completo y consistente; ausencia o mismatch bloquea sin fallback.
- Un resultado de agente, transcript, frontmatter o `rdd-report` nunca autoriza aprobación por inferencia; las discrepancias deben bloquearse explícitamente y conservar la autoridad externa.

## Guía operativa

### Contrato de extensión

El selector `rdd_mode: receipt-driven` obliga a resolver `workflow-extension.json` y los cuatro módulos propios antes de materializar fase, lanes o gates. `rdd_delivery_gate` es un evaluador read-only de este satélite: en cada frontera consulta al proveedor por el candidato actual, verifica lineage, revisión de autoridad, identidad de target y revisión de task; exige `allowed: true` y receipt aplicable cuando corresponda. Timeout, CAS incierto o respuesta parcial exige STATUS y reconciliación antes de otra transición. `rdd-report` es proyección y nunca evidencia de aprobación. En ausencia de selección el core no carga este contrato; selección inválida bloquea.

El catálogo local y las operaciones de composición son declarativos en `workflow-extension.json`: la sustitución del exit documental especifica el transition anterior completo (`expected`) y el nuevo (`entry`), los módulos y evaluadores nombran archivos del satélite y cada gate de entrega se adjunta a una transición identificada. Una divergencia en el binding base, un módulo ausente o una frontera sin gate bloquean la composición.

1. Resolver la configuración RDD desde el contexto de workflow y la autoridad canónica; no inferir un lanzamiento a partir de una selección de controlador.
2. Usar solo operaciones y tokens que la autoridad actual exponga; cualquier operación, schema, lane o dato de lineage desconocido falla cerrado.
3. Mantener cada acción ligada a `lineage_id`, revisión de autoridad, identidad de target y revisión de task; ante ausencia o mismatch, detener el flujo.
4. Reconsultar el estado después de una captura, timeout o mutación incierta; no convertir una respuesta parcial en aprobación.
5. Ejecutar la corrección únicamente dentro del alcance autorizado y enviar validación read-only posterior; el adapter local no altera la autoridad de Gentle-AI.

## Verificación

Verificar con `bun .agents/skills/projectctl-rdd/scripts/skill/rdd-check.ts --check`.

Sin scripts/project/: extensión opt-in sin superficie de destino.

## Skills relacionadas

- `projectctl-requirements` — política de criterios y evidencia; `projectctl-sdd` — binding base opcional.
- `skill-creator` — estructura y mantenimiento de skills repo-locales.
- `judgment-day` — mecanismo distinto y opt-in de revisión adversarial; no se fusionan sus responsabilidades.
