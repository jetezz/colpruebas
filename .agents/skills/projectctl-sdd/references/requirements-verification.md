# Requirements: preparación, perfiles y vigencia

Consultar `requirements_verification` del bloque machine en
[`tasks/binding.md`](tasks/binding.md) para routing, campos, doctors, artifacts y
gates. Este documento explica el mecanismo, no mantiene otro catálogo del flujo.

## Recorrido y ownership

Tras aprobar la propuesta, planificar una work unit `sdd-apply-doc` con perfil
`machine-preparation` en la posición autorizada por el binding. Posee solo
`navigation.yaml`, frontmatter machine de los bundles afectados y preparación
del plan persistente. Puede crear el par `.md`/`.mmd` mínimo necesario para la
identidad, sin anticipar el cierre editorial. El packet fija campos y secciones
owned; la autorización general de la fase no autoriza una edición documental
amplia. Las lanes de apply de tests poseen headers, annotations, títulos y files
de tests; ninguna doc lane edita tests. Programar este trabajo antes del perfil
técnico, con dependencias explícitas en `tasks`.

El orchestrator fija targets por identidad navigation, no URLs ni filenames:

```sh
bun .agents/skills/projectctl-sdd/scripts/project/tasks.ts requirements targets TASK --targets view:feature
bun .agents/skills/projectctl-sdd/scripts/project/tasks.ts requirements snapshot TASK --target view:feature
```

El motor bloquea el gate de preparación si faltan el plan, la identidad, los
campos machine o los headers/plan mapping de tests cuya cobertura se afirma.
Los doctors comprobarán la validez del mapping, metadata completa de tests
y cobertura real. El lanzamiento usa `buildRequirementsLaunch`; su validación
inmediata con `validateRequirementsLaunch` impide perfiles/posiciones erróneas,
targets desconocidos, snapshots obsoletos y comandos managed ocultos. Inyectar el
core como política de superficie obligatoria, además del módulo de la lane.

Tras la documentación, lanzar su perfil documental. La edición de títulos de bundle,
resumen, prosa editorial o Mermaid invalida docs, no la evidencia técnica. Cambiar la definición de aceptación (`criteria[].title`/`requirement`), criterios,
coverage, excepciones, paths, navegación técnica, tests, code, wiring o inputs
comunes invalida los doctors que consumen esos inputs. El gate de revisión usa
vigencia por scope en vez de comparar contadores globales de Markdown.

## Receipt persistente

La lane escribe el artifact asignado con exactamente un fence
`requirements-evidence` que contiene:

```json
{
  "schema": "requirements-evidence/v1",
  "profile": "technical",
  "target": "view:feature",
  "checks": [
    {
      "doctor": "test",
      "inputs": {"scope": "<snapshot.test.scope>", "global": "<snapshot.test.global>"},
      "report": {"ref": "<complete local JSON output file>", "sha256": "<fileDigest>"},
      "supplements": [
        {
          "check": "<unverified check ID>", "path": "<exact finding path if present>",
          "scope": "global", "inputs": "<snapshot.test.global>",
          "source": "runtime", "command": "<exact verified operation>",
          "verdict": "pass", "ref": "<independently verified evidence file>",
          "sha256": "<fileDigest>"
        }
      ]
    }
  ]
}
```

Incluir todos los doctors del perfil, completos. Los JSON de reports y evidencia
se guardan en archivos auxiliares del directorio de phase artifacts; conservar
comando, exit y salida íntegra. El exemplo muestra solo una fila: no es un receipt
técnico completo. Un receipt válido no admite doctor vacío, filas obligatorias
ausentes, scope/root distinto ni un report managed presentado como local.

`fileDigest` normaliza CRLF a LF y SHA-256; los snapshots serializan objetos con
keys ordenadas. Para inputs técnicos solo se leen campos seleccionados del YAML,
tests del scope, implementación trazada y evidencias declaradas. Prosa de bundles
no participa. Las entradas comunes se huellan por separado: config, plan, mapping,
inventario de identidades, capacidades y contrato de doctors. Una evidencia
global complementaria no certifica automáticamente todos los targets. El lector
strict documental tiene inputs globales sobre todos los bundles que lee.

No completar `unverified` por exit 0, ni por status declarado en coverage.
Los checks que el binding identifica como runtime requieren suplemento incluso
si un report local afirma `pass`; el filesystem no es su autoridad.
`sdd-orchestrator` ejecuta projectctl y wrappers `--managed`, examina findings,
testsExecuted/coverageAccepted cuando corresponda y verifica los efectos reales.
Un suplemento se liga a check, path, scope y huella de inputs; una referencia
por sí sola no es prueba. Los checks documentales diferidos por el binding se
resuelven en el perfil documental; el resto sigue pendiente en técnico.

Los suplementos del lector y del mapping contienen la salida JSON real de
`projectctl docs lint` (state valid, errors vacíos, checkedMarkdown > 0) y
`projectctl structure check` (remoteState evaluated, findings vacíos, exitCode 0).
Un `exitCode: 0` aislado no pasa. Para otras observaciones verificadas, el
orchestrator escribe un JSON `requirements-runtime-evidence/v1` con
`verified_by: sdd-orchestrator`, `check`, `path`, `scope`, `inputs`, `source`,
`command`, `verdict: pass`, `target` cuando el scope es target y `observations`
no vacío describiendo los efectos comprobados. Mantener el output runtime bruto
referenciado por estas observaciones; nunca convertir el envelope de una lane en
este suplemento sin reconciliar hechos.

La preparación valida también el delta real con
`validateMachinePreparationChanges`: en bundles existentes conserva body,
Mermaid y campos editoriales no assigned. Los nuevos pares admiten únicamente un
scaffold mínimo. El orchestrator verifica este delta antes de reconciliar el apply.

Registrar únicamente después de reconciliar los efectos:

```sh
bun .agents/skills/projectctl-sdd/scripts/project/tasks.ts requirements record TASK --profile technical --target view:feature --ref ARTIFACT
bun .agents/skills/projectctl-sdd/scripts/project/tasks.ts requirements status TASK
```

El índice guarda referencias y digest de receipts por perfil/target. Con varios
targets, usar el artifact del perfil seguido de `-<índice de target 1-based>` en
el orden canónico del índice, evitando colisiones. Releer antes de reconciliar.
El motor recalcula la vigencia en cada gate; `evidence add` y `verification record`
no pueden fabricar una aprobación de requirements. El status identifica el doctor
obsoleto: reutilizar sus hermanos vigentes y ejecutar solo lo invalidado.

Incluir en `evidence_paths` los inputs compartidos/dependencias que afectan al
criterio y no llevan su propio locator; las huellas no infieren dependencias
semánticas ocultas. Los directorios declarados se huellan con contenido recursivo.
Los wrappers managed pueden sincronizar docs: comparar los inputs después de
ejecutarlos y repetir solo los checks que hayan quedado obsoletos.

## Retornos y compatibilidad

El bridge documental exige técnica vigente; no exige un retorno por una escritura
editorial. Volver por el guard técnico solo si sus checks dejaron de ser válidos.
Los contadores verification/documentation se conservan como auditoría y evidence
de cierre, no como sustituto de huellas. `pending_environment` continúa siendo
conjuntivo: el candidato environmental conserva su retorno obligatorio a la
preparación técnica y todos los métodos pendientes, incluso si las huellas
técnicas no cambiaron. Nunca cerrar mediante el bridge normal para eludirlo.

La nueva versión del binding exige migrar locator, templates, proyección y pins
de extensiones conjuntamente. Los índices antiguos no se migran automáticamente:
el orchestrator reconcilia identidad y evidencia y vuelve a acreditar los nuevos
gates; no transforma un índice histórico en evidencia vigente.
