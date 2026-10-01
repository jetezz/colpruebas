---
file: references/decisions.md
parent_skill: projectctl-sdd
owner: sdd-orchestrator
purpose: Current design decisions for the portable SDD workflow.
sot_policy: canonical-standard
---

# Decisiones vigentes — projectctl-sdd

- El bloque delimitado `task-flow-binding` en `references/tasks/binding.md` es la única autoridad machine del flujo; las proyecciones se generan desde él. `projectctl-requirements` conserva los criterios y la evidencia del core.
- `sdd-orchestrator` es el único actor que resuelve el locator, autoriza lanes, aplica gates, llama al CLI operativo y persiste el índice compacto. Las lanes persisten únicamente los phase artifacts asignados.
- `scripts/project/tasks.ts` es la vía de operación del índice para los comandos que soporta. Los datos de un envelope no acreditan por sí solos una evidencia: `sdd-orchestrator` los comprueba antes de registrarlos. La edición directa solo cubre campos aún no soportados por el motor y nunca sustituye `transition` u `outcome`.
- El índice y los phase artifacts del binding son suficientes para recuperación; los mirrors solo participan cuando el binding activo los configura. RDD y Judgment Day son extensiones seleccionables con autoridad propia, sin acceso de escritura al índice.
- `sdd-orchestrator` es un módulo interno de orquestación, no una lane de `binding.lanes`; los agentes ejecutores reciben el contexto y las rutas de skills inyectadas sin resolver fuentes raw.
- La verificación transversal usa perfiles y preparación machine resueltos del binding. La preparación documental acotada evita que la verificación técnica dependa de contenido editorial aún pendiente; los tests conservan su propio owner.
- La evidencia de requirements se conserva por doctor/target con huellas canónicas scope/global. Edición editorial invalida docs; cambios en inputs técnicos invalidan solo sus consumidores. Los contadores son auditables pero no aprueban vigencia. La excepción environmental mantiene retorno obligatorio y bloqueos conjunctivos.
- Doctors locales diagnostican; sus `unverified` requieren evidencia complementaria verificada por el orchestrator. Ni exit zero, ni un report de lane, ni una referencia sin efectos comprobados certifica cobertura, strict reader o mapping managed.

Para cambiar valores machine, modificar el binding y seguir `references/maintenance.md`; este archivo no duplica estados, gates ni catálogos.
