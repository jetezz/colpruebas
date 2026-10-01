# Criterios canónicos en SDD

Identidad y ciclo de vida: [`../../projectctl-requirements/references/criterios/identity.md`](../../projectctl-requirements/references/criterios/identity.md). SDD posee la solicitud de cambio, sus links y aprobación; el bundle App Map del proyecto sigue siendo autoridad de producto. La forma ejecutable del delta y de sus links está en `scripts/project/criteria-change.ts`; no definir otro catálogo AC.

## Proposal

Leer los bundles del target y obtener el baseline con `tasks.ts criteria baseline TASK --targets view:feature`. Una vista/feature incluye sus descendientes. Incluir exactamente un fence `criteria-change` con schema `criteria-change/v1`, `targets`, `baseline` y `changes`. Cada baseline entry tiene `id`, `bundle`, `revision`, `retired` (boolean para detectar retiradas no aprobadas). Cada cambio tiene `id`, `bundle`, `operation` (`add|modify|remove|maintain`), `before`, `after`, `reason`. Las definiciones tienen `id`, `title`, `type` y opcionalmente `requirement`.

Para añadir: before=null; para retirar: after=null; para modificar: ambas definiciones completas y distintas; para mantener: ambas iguales. Cada ID aparece una vez. El baseline contiene todos los criterios del scope, no solo los editados. Una tabla/render legible se deriva del fence; si difiere, corregir el artefacto antes de pedir aprobación.

Un delta vacío exige `no_criteria_reason` no vacío. Si se conserva el comportamiento de criterios existentes, usar `maintain` con IDs reales. Una feature nueva puede declarar `new_bundles: [{bundle, parent_target}]`: el parent_target debe ser uno de los targets existentes explícitos, el bundle debe ser nuevo y su alta de navegación/documentación se asigna a apply-doc. Para una vista raíz nueva preparar primero su identidad mínima mediante trabajo documental autorizado; no inventar un target que navigation no resuelve.

`tasks.ts proposal check TASK` verifica baseline, owner, operaciones y colisiones; devuelve altas, modificaciones, bajas y mantenidos completos con justificación. El orquestador los presenta antes de aprobación, aunque el resumen del índice tenga presupuesto reducido. No recortar criterios para caber en 10 líneas. Una revisión se vuelve a presentar y aprobar.

`proposal accept` exige exactamente los IDs del delta y el SHA256 del artefacto. Los gates recalculan vigencia; registrar una referencia no satisface identidad, links ni materialización. No hay reserva concurrente implícita: el orquestador serializa cambios solapados y revalida antes de escribir el bundle.

## Spec y Tasks

Ambos llevan exactamente un fence `criteria-links` con schema `criteria-links/v1` y `criteria` igual al conjunto aprobado, sin IDs AC por tarea.

Spec añade `scenarios: [{id, criterion_ids}]`. Cada criterio aprobado tiene escenarios concretos, incluidos los de retirada. Tasks añade `units: [{id, criterion_ids, scenario_ids}]`. Los scenario_ids resuelven a spec y cada criterion_id de la unidad tiene un escenario vinculado. Cada criterio tiene al menos una unidad. Solo unidades puramente mecánicas pueden usar conjuntos vacíos y `mechanical: true`; no pueden sustituir la implementación de un criterio. El ID de unit coincide exactamente con la tabla de trabajo.

La prosa de spec explica escenarios Given/When/Then y referencia el delta; tasks explica implementación/verificación y referencia spec. Ninguno crea una definición vigente independiente del bundle. La aprobación no se amplía por añadir nuevos IDs en spec/tasks. El motor valida links al registrar artifacts, asignar unidades y entrar en implementación.

## Aplicación y cierre

Planificar preparación machine de los bundles antes de crear tests/código que referencien altas. Aplicar la definición aprobada y los tombstones de retirada con apply-doc y el perfil autorizado; comprobar de nuevo colisiones/revisiones antes de la escritura. Los gates de cierre comparan definiciones, owners, baseline no modificado y scope resultante, además de los receipts de requirements. Las evidencias de eliminación comprueban tombstone y limpieza de referencias operativas, no simple presencia/ausencia del ID.

`tasks.ts proposal check TASK --stage applied` verifica materialización contra la proposal aprobada. Una modificación de proposal tras aprobación invalida esa autoridad. Cambios adicionales de aceptación requieren regresar al circuito de propuesta; no registrar manualmente los tres evidence IDs calculados de `criteria_identity`.

## Migración v13 → v14

Actualizar conjuntamente core v26, satélite v24, binding v14, locator y pins de extensiones seleccionables; regenerar proyección. El binding_id permanece estable. Una instalación mixed falla antes de routing.

Los índices anteriores no se convierten automáticamente: inventariar AC locales, comprobar definición/owner y corregir referencias activas con los IDs canónicos. Preservar el índice y sus artifacts originales como historia; crear un índice vigente para el trabajo restante cuando la identidad/approval anterior no sea demostrable. Reconstruir proposal con baseline y delta, volver a obtener aprobación y regenerar spec/tasks links. No copiar approvals ni estados verdes antiguos por coincidencia numérica. Los artifacts antiguos no satisfacen los nuevos gates.

Actualizar en la fuente original cualquier requisito heredado de mapping AC↔PCT (como PCT-119) antes de regenerar su manifiesto de origen. El paquete portable conserva ese inventario histórico, no lo usa para resolver criterios del destino ni reescribe la fuente ausente.
