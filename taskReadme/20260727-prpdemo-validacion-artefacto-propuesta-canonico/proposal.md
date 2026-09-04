# Proposal: Validación de visibilidad del artifact `proposal.md`

## Intent

Crear una tarea SDD genuina de cambio documental para demostrar que el Tasks Tab puede descubrir y mostrar el artifact `proposal.md` desde la persistencia canónica `taskReadme index + phase artifacts`. La tarea no es una fixture `type: test`, no altera fixtures existentes y no requiere cambios de código, docs del producto ni bindings.

## Scope (in/out)

### In

- Crear el índice canónico de la tarea solicitada.
- Crear `taskReadme/20260727-prpdemo-validacion-artefacto-propuesta-canonico/proposal.md`.
- Dejar la tarea en `status: planning`, `phase: fase_1_propuesta`, `state: p1_awaiting_acceptance`.
- Documentar la visibilidad esperada del artifact y la necesidad de aprobación humana explícita.

### Out

- No editar tareas existentes ni fixtures `type: test`.
- No crear `spec.md`, `design.md`, `tasks.md` ni artifacts de fases posteriores.
- No editar código, docs, bindings, projections ni el índice del repositorio principal.
- No avanzar a ninguna fase posterior sin aprobación humana registrada según AC-010.

## Capabilities

- Persistencia canónica index-primary con detalle de propuesta en phase artifact.
- Descubrimiento del artifact `proposal.md` desde el Tasks Tab.
- Handoff de aceptación humana explícita antes de continuar el flujo SDD.

## Approach

1. Registrar la identidad y el estado inicial en el índice compacto canónico.
2. Persistir el detalle completo de la propuesta en el phase artifact `proposal.md`.
3. Mantener la tarea en `p1_awaiting_acceptance` hasta contar con actor humano, mensaje literal, timestamp UTC, revisión e IDs aprobados.
4. Verificar posteriormente la visibilidad en el Tasks Tab; cualquier avance debe ser coordinado por la transición AC-010.

## Affected Areas

- `workspace/projects/511a017a-01d4-4553-a063-ba01438b15cd/taskReadme/20260727-prpdemo-validacion-artefacto-propuesta-canonico.md`
- `workspace/projects/511a017a-01d4-4553-a063-ba01438b15cd/taskReadme/20260727-prpdemo-validacion-artefacto-propuesta-canonico/proposal.md`

No se afectan código, fixtures, documentación del producto, bindings ni índices del repositorio principal.

## Risks

- La tarea depende del binding `projectctl-requirements.task-flow` v8.0.0 y de que el Tasks Tab resuelva el índice y el phase artifact desde las rutas canónicas.
- Sin aprobación humana explícita, cualquier fase posterior sería inválida y debe permanecer bloqueada.

## Rollback Plan

Eliminar únicamente este índice y su directorio de phase artifact si la demostración debe retirarse. No tocar fixtures existentes ni archivos fuera de los dos paths creados para esta tarea.

## Dependencies

- Binding `projectctl-requirements.task-flow` v8.0.0.
- Persistencia filesystem `taskReadme index + phase artifacts` sin mirrors.
- Aprobación humana explícita conforme a `AC-010.explicit_approval` antes de cualquier fase posterior.

## Success Criteria

- El índice y `proposal.md` existen en los paths canónicos solicitados.
- El artifact contiene la propuesta completa y referencia la tarea como `type: documentation`.
- La tarea permanece en `planning / fase_1_propuesta / p1_awaiting_acceptance`.
- El Tasks Tab puede resolver y mostrar el artifact sin leer `proposals/`, `specs/`, `designs/` ni `tasks/`.
- La aprobación humana queda requerida y no se simula en este artifact.

## Human Approval Gate

No se autoriza specs, design, tasks, implementación ni verificación posterior hasta registrar explícitamente `AC-010.explicit_approval` con `approval_actor`, `approval_literal_message`, `approval_utc_timestamp`, `approved_revision` y `approved_criteria_ids`.
