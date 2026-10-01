---
name: projectctl-judgment-day
description: "Use Judgment Day to independently verify any evidence-bound target with multiple blind judges; optionally integrate into an SDD review."
metadata:
  id: projectctl-judgment-day
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

# projectctl-judgment-day

## Justificación

Esta skill verifica un target explícito con jueces adversariales independientes, con o sin SDD. El binding SDD es solo una integración opt-in y nunca un requisito de la invocación autónoma.

## Responsabilidad exclusiva

Posee el contrato de target, validación, adjudicación, ejecución standalone y la integración opcional con SDD. `scripts/judgment-day.ts` ejecuta dos procesos `opencode run --agent judgment-day-judge` independientes en paralelo, valida cada respuesta y emite un veredicto con evidencia; no escribe taskReadme ni infiere aceptación.

Judgment Day revisa cualquier target explícito (código, investigación, implementación, propuesta, documentación u otro), independientemente de la fase. Para un target de código reemplaza al reviewer asignado para la misma revisión; en SDD, `sdd-orchestrator` conserva la escritura de estado.

## Invocación autónoma (sin binding, taskReadme, fase ni review_mode)

Crear un JSON de target fuera de esta skill con **todos** los campos: `{ "identity": "id estable", "revision": "sha256:<digest de snapshot>", "kind": "research", "scope": ["sección del material"], "criteria": ["criterio comprobable"], "evidence_refs": ["referencia de evidencia consultable"], "snapshot": "contenido íntegro de la investigación o propuesta" }`. `kind` admite los valores de `workflow-extension.json`. El launcher valida el digest y entrega los mismos bytes de `snapshot` a todos los jueces; no sustituye el snapshot por una lectura mutable del worktree. Un cambio exige nueva revisión y digest.

```bash
bun .agents/skills/projectctl-judgment-day/scripts/judgment-day.ts /ruta/target.json --out /ruta/resultado-nuevo.json
```

`--out` es opcional y solo crea un archivo nuevo (no sobreescribe). El resultado JSON `judgment-day-result/v1` incluye judges, hallazgos confirmados/disputados y veredicto `reviewed_no_findings | findings_confirmed | escalate`; **ninguno equivale a aprobación**. La falta de target, de skill, de un juez, de evidencia, un mismatch o respuesta no JSON termina con error y sin veredicto. Los jueces no reciben resultados de otros jueces. No se lanzan fixes automáticamente: investigación/propuesta se corrigen mediante una revisión humana/nuevo artefacto versionado; para código/implementación/documentación un fix requiere autorización explícita y scope nuevo, seguido de una revisión nueva.

También se puede importar `reviewStandalone(target, launch, options)` desde el script para integrar un launcher propio. La función valida el satélite antes de lanzar agentes y no consulta archivos de core. El archivo `workflow-extension.json` es el único catálogo JD: sus campos `target`/`judges` gobiernan la vía autónoma; `selector`/`base_binding_*` son usados únicamente por el adaptador SDD.

## Integración opcional con SDD

Si existe un SDD y se selecciona JD mediante `mode_context.review.selected`, `sdd-orchestrator` puede invocar este mismo contrato con el target resuelto y vincular la evidencia al artefacto del flujo. Esta selección no habilita ni limita la invocación autónoma. En un target de código asignado a `sdd-verify-code`, el mecanismo elegido sustituye ese reviewer para esa misma revisión.

La integración SDD registra el mecanismo mediante `operations` en `workflow-extension.json`. El compositor de `projectctl-sdd` consume referencias a `target`, `judges` y `lane` y la ruta de módulo declarada por el satélite, sin saber su identidad; el script standalone sigue funcionando sin leer el binding.

## Frontera D-5: cita, no copia

### Fuentes citadas

- [`projectctl-sdd/references/tasks/binding.md`](../projectctl-sdd/references/tasks/binding.md) — adaptador opcional SDD (no usado por la invocación autónoma).
- [`modules/judgment-day/module.md`](modules/judgment-day/module.md) — contrato del mecanismo JD.
- [`workflow-extension.json`](workflow-extension.json) — contrato único de target y jueces; standalone lo lee directamente y SDD solo si seleccionado.

### Límites

- Esta skill posee el mecanismo JD; el binding de `projectctl-sdd` posee solo el punto de extensión opcional.
- No copia machine values, lanes, gates, rounds, envelopes, catálogos ni tablas del binding o del módulo canónico.
- Declara su mecanismo solo en el satélite; no redefine fases o gates del binding base.
- El target debe declarar identidad, revisión, tipo, scope, criterios y referencias de evidencia. Múltiples agentes independientes reciben exactamente ese target; ausencia o inconsistencia bloquea sin fallback.
- Dentro de una revisión SDD del mismo target no ejecuta Judgment Day junto con `sdd-verify-code`; standalone no consulta ni requiere SDD. No degrada silenciosamente a otro reviewer.

## Guía operativa

1. Elegir invocación autónoma directa o integración SDD opt-in; ninguna requiere la otra.
2. Congelar un target completo e inmutable y entregar igual alcance/criterios/evidencia a dos o más jueces ciegos; esperar todos antes de adjudicar.
3. Rechazar resultados fuera de scope/revisión, parciales o inconsistentes; escalar discrepancias y no inferir aprobación de un resultado vacío.
4. En SDD `sdd-orchestrator` persiste evidencia en su artefacto; standalone emite JSON a stdout o a un destino explícito nuevo. Los actores nunca escriben el índice.
5. Cualquier corrección se autoriza por separado y se vuelve a juzgar contra una revisión nueva, con límites de rounds del satélite.

## Verificación

Verificar con `bun .agents/skills/projectctl-judgment-day/scripts/skill/judgment-day-check.ts --check`.

Frontera skill/project: `scripts/skill/judgment-day-check.ts` valida el paquete; `scripts/judgment-day.ts` ejecuta jueces (no es verde).

Sin scripts/project/: extensión opt-in sin superficie de destino; el launcher no es diagnóstico.

## Skills relacionadas

- `projectctl-requirements` — criterios y evidencia; `projectctl-sdd` — integración de workflow opcional.
- `skill-creator` — estructura y mantenimiento de skills repo-locales.
- `projectctl-rdd` — adapter RDD separado; no se fusionan responsabilidades.
