# Motor portable de tareas

Para perfiles, preparación machine y comandos `requirements targets|snapshot|record|status`,
ver [requirements-verification.md](requirements-verification.md). Sus predicates
current/invalid se calculan desde receipts y inputs vivos; no se aceptan mediante
`evidence add` ni `verification record`. La autorización del perfil se comprueba
antes de registrar y las huellas se vuelven a comprobar al evaluar transiciones.

El ejecutable `scripts/project/tasks.ts` y la biblioteca `scripts/project/task-engine.ts` viajan íntegros con `projectctl-sdd`. Se invocan desde el checkout del proyecto (o con `--root DIR`) mediante Bun:

Para identidad canónica y migración, consultar [criteria-integration.md](criteria-integration.md). `criteria baseline TASK --targets view:feature` obtiene referencias/revisiones desde App Map; `proposal check TASK` devuelve y valida el delta completo antes de aprobación; `proposal check TASK --stage applied` comprueba definiciones y tombstones contra la propuesta aprobada. `proposal accept --criteria` usa los IDs exactos del delta, de cualquier prefijo canónico; se omite solo si el conjunto vacío está justificado. Spec/tasks requieren `criteria-links/v1` y los gates recomputan aprobación, links y materialización, sin admitir evidencia manual para esos predicates.

```sh
bun .agents/skills/projectctl-sdd/scripts/project/tasks.ts --help
bun .agents/skills/projectctl-sdd/scripts/project/tasks.ts init --id 20260929-abcd --slug mi-cambio --title 'Mi cambio' --problem 'Problema observado' --app-map docs/app-map/navigation.yaml
bun .agents/skills/projectctl-sdd/scripts/project/tasks.ts transitions taskReadme/20260929-abcd-mi-cambio.md
bun .agents/skills/projectctl-sdd/scripts/project/tasks.ts transition taskReadme/20260929-abcd-mi-cambio.md --to p1_exploring
```

`sdd-orchestrator` ejecuta `validate` y `check` / `transitions` antes de una mutación, comprueba por sí mismo el contenido de la evidencia y vuelve a validar después. `transition` solo admite aristas del binding con sus guards registrados. `evidence add FILE --id ID --ref PATH` registra una referencia existente **después de que sdd-orchestrator compruebe realmente su contenido**: la existencia del archivo no acredita por sí sola la prueba, la aprobación ni el resultado de un comando. Las aprobaciones se registran con `proposal accept` (revisión = SHA-256 del `proposal.md` canónico, mensaje literal, actor y AC aprobados) y `functionality accept` (mensaje, actor y revisión). No se debe usar `evidence add` para fabricar evidencias de aprobación, Git o pruebas.

Los subcomandos `artifact record`, `work-unit set` y `criteria set` sincronizan filas del índice; `verification record` guarda el veredicto por lane. `browser set` guarda destino y **referencia** al contrato de credenciales, nunca el secreto. `mode set`, `skills set`, `checkpoint set` y `outcome blocked|failed|resume` mantienen las opciones y el estado de recuperación. `environment defer|complete` gestiona métodos pendientes con revisión y auditoría. `branch create` comprueba la rama con Git y `pr record` consulta `gh` para verificar el PR abierto y su base. Para las opciones y argumentos exactos, usar `--help`.

`branch create` registra `delivery.branch_name`, `delivery.branch_verified` y las evidencias `branch_name`, `canonical_branch_active` y `branch_created_from_source_branch`. Para recuperar una tarea avanzada que carece de evidencia de rama, usar `branch verify FILE`: comprueba con Git que la rama canónica está activa y registra las dos primeras evidencias y los campos delivery, sin crear ni cambiar ramas ni modificar la posición de la tarea. No acredita creación ni procedencia histórica, por lo que no añade `branch_created_from_source_branch`. Ambos comandos producen `branch_name` con referencia `git:<rama>`; no editar esa evidencia manualmente ni usar `evidence add`. `validate` comprueba estructura, mientras que estas operaciones comprueban el hecho Git antes de escribir.

La evidencia operativa añadida por el motor está en un bloque JSON `task-operations/v1` dentro del propio índice. No hay store externo ni archivo de estado paralelo; el binding resuelto por `.agents/sdd-workflow.json` sigue siendo autoridad para rutas, modos, transiciones y gates. El motor vuelve a leer el índice antes de cada mutación, toma un lock exclusivo, comprueba que no cambió y lo reemplaza con rename atómico. Un lock abandonado requiere comprobación manual antes de retirarlo. `done` requiere todas las evidencias de cierre declaradas en el binding; ninguna operación fusiona un PR.

Los índices existentes pueden carecer del bloque JSON; la primera mutación válida lo añade sin sustituir el resto de su prosa. `validate` comprueba coherencia estructural, **no** verifica por sí solo que los hechos registrados sean verdaderos. Si detecta incoherencia no se realiza una mutación automática: hay que contrastar los hechos con la evidencia antes de repararlos. Para un campo todavía no soportado por el motor, sdd-orchestrator puede hacer una corrección acotada con relectura, comprobación del binding y `validate` posterior; nunca editar `phase`/`state`/`status` directamente para saltarse `transition`.
