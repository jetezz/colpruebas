# Ejecución completa por fase y confirmación humana

El bloque `phase_execution` del [binding](tasks/binding.md) es la autoridad de
esta política. Este documento explica el mecanismo; no define otro catálogo
de fases, estados o lanes.

## Arranque obligatorio

La integración OpenCode debe **inyectar el contenido**, no solo los enlaces,
del bootstrap portable, del módulo del orchestrator, de este documento y del
binding en el prompt del agente mediante `{file:...}`. Ver
`assets/opencode-phase-execution.example.json`. Conservar las opciones de modelo
y permisos del destino. Reiniciar OpenCode después de instalar o actualizar.

En cada nueva petición, sesión o recuperación el orchestrator vuelve a cargar
el locator suministrado por el entorno, el binding, las fuentes `startup_paths`
y el índice activo. Ejecuta `validate`, `check` y `phase status` inline. Si una
fuente falta, la instalación mezcla versiones o el contexto está obsoleto,
preserva la posición y explica el bloqueo. El digest acredita resolución de
archivos, nunca comprensión del modelo ni autenticidad de un mensaje humano.

## Alcance de una petición

«Realiza una fase» pide la **macrofase completa**, no el primer artefacto o la
primera lane. Registrar la petición literal con `phase start` únicamente para
la fase actual, después de comprobar que el usuario la solicitó. Ejecutar sus
trabajos necesarios en orden de dependencias, reconciliar resultados y continuar
dentro de ella hasta la frontera declarada, un bloqueo o una pregunta necesaria.
No pedir permiso entre lanes de esa misma fase por defecto.

Una petición de una sola lane («haz solo la spec») autoriza solo ese assignment;
el packet conserva ese alcance menor. Su resultado se presenta como avance
parcial, nunca como fase completa. El registro de fase no amplía el assignment.

Antes de **cada** lanzamiento ejecutar `phase launch FILE --lane LANE`; incluir
su resultado inmutable en `execution_context` del contexto y del LaunchPacket.
Registrar el checkpoint antes de congelar el packet. Ejecutar
`phase validate-launch FILE --ref PACKET_JSON` inmediatamente antes de lanzar;
este comando verifica la admisión de fase, además de la validación completa del
LaunchPacket exigida por el protocolo. Comparar el resultado completo: lane,
posición, autorización, revisión del índice y hashes de las fuentes deben
coincidir. Si cambian, no lanzar el packet obsoleto; volver a reconciliar. El
JSON de transporte es efímero, no un segundo índice ni evidencia de aprobación.

Para presentar una fase como terminada, consultar `phase status`: debe estar
en una frontera declarada con resultados reconciliados y gates satisfechos.
`artifact record` solo acredita progreso de un artefacto. Spec no sustituye
design, tasks, aplicación ni revisión. Explicar si la frontera está pendiente
de aceptación del resultado o si la fase ya está aceptada.

## Todo cambio de fase requiere una pregunta y una respuesta nueva

Esta regla abarca avances, retornos por defectos, puentes documentales,
reverificación, extensiones seleccionadas y salida al estado terminal. Los
gates técnicos siguen siendo obligatorios: la confirmación humana no los
sustituye. Ninguna petición autoriza el flujo completo ni varios saltos futuros.

1. Completar el trabajo/evidencia disponible en la fase actual.
2. Identificar una arista declarada y sus gates con `check`.
3. Registrar `phase request FILE --to STATE --question '¿Autorizas pasar …?'`.
4. **Mostrar esa pregunta al usuario y finalizar el turno sin cambiar de fase.**
5. En un turno posterior, comprobar que la respuesta responde afirmativamente
   a esa pregunta; registrar actor y respuesta literal mediante `phase confirm`.
6. Ejecutar `transition` para esa arista. La autorización de salto se consume.
7. Registrar `phase start` en la fase destino con la respuesta literal que
   autorizó ejecutarla; continuar sus trabajos hasta su frontera.

Aunque el usuario diga «acepto la propuesta, realiza la siguiente fase», el
orchestrator registra la aceptación y **pregunta antes del salto**. Una respuesta
«sí» a una pregunta pendiente concreta es suficiente; «continúa» sin una
pregunta/alcance inequívoco no lo es. Un rechazo o respuesta ambigua conserva
la posición. Nunca fabricar respuestas ni interpretar envelopes como aprobación.

Las aceptaciones de propuesta y funcionalidad son registros independientes.
Registrar primero esas aceptaciones y las evidencias, después preguntar por
el salto: cambios de índice o fuentes invalidan una pregunta anterior. Una
pregunta confirmada no libera guards ni holds. Si un gate exige aceptación o
liberación de hold, verificar y registrar su evidencia antes de preguntar.

## Recuperación y entrega

Una autorización activa de fase puede reanudarse si las fuentes siguen vigentes;
no puede autorizar una fase distinta. Si el contrato cambió, solicitar de nuevo
el alcance. No borrar preguntas ni autorizaciones para sortear un bloqueo.

Las tareas antiguas se bloquean por versión: usar `phase migrate` con aprobación
explícita para actualizar únicamente la identidad del contrato, manteniendo
posición, artefactos, criterios y aprobaciones; sin otorgar permisos de ejecución.
Si la tarea no valida, enriquecerla explícitamente antes de continuar.

Los controles de entrega dentro de una fase requieren una solicitud explícita
de entrega; completar documentación no autoriza Git por sí solo. Antes de
cerrar con un cambio de fase al terminal, preguntar y confirmar esa salida.
Nunca fusionar PRs.

## Comunicación al detenerse

Presentar: fase solicitada, trabajo completado, posición real, resultado de sus
gates, problemas/preguntas y siguiente paso. Si procede otro cambio de fase,
formular una única pregunta concreta. Nunca anunciar «fase completada» por el
éxito de una lane aislada.
