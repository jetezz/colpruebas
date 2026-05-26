---
name: docs-governance
description: "Trigger: docs governance, quality docs, app-map. Locate normative docs and keep documentation model consistent."
metadata:
  id: docs-governance
  version: 1.0.0
---

# Docs Governance

Esta skill unifica lookup, decision, escritura y arquitectura documental.

## Fuentes a revisar primero

1. `taskReadme/<task>.md`
2. `docs/04-process/task.md`
3. `docs/04-process/development.md`
4. `docs/01-product/quality-plan.md`
5. `docs/01-product/quality-status.md`
6. `docs/01-product/quality/views/**`
7. `docs/00-context/agents_skills.md`
8. `AGENTS.md`
9. `README.md`

## Regla de trabajo

- Busca primero la fuente normativa mas cercana y recien despues contexto secundario.
- La documentacion se actualiza dentro del scope real del cambio; no como workflow paralelo que compita con implementacion.
- Aplica Diataxis con criterio, pero no inventes estructura nueva si el repo ya define una.
- Reorganiza `/docs` solo cuando el problema es estructural de verdad, no por un cambio menor de contenido.
- MUY IMPORTANTE: si el cambio toca comportamiento, proceso, arquitectura o instrucciones operativas, la prioridad documental maxima es mantener `quality` actualizado, incluso por encima de la documentacion editorial general.
- Nunca cierres una actualizacion documental contractual sin revisar primero `docs/01-product/quality-plan.md` y toda la superficie `docs/01-product/quality/**`.

## Diagramas de UI

- Todas las vistas de UI y sus tabs o subsuperficies deben documentarse con diagramas de flujo Mermaid cuando formen parte de la documentacion funcional del repo.
- Guarda esos diagramas en `docs/diagrams/views/`.
- La estructura debe ser una carpeta por vista y, si aplica, subcarpetas por tab o subsuperficie.
- Usa Mermaid como formato canonico y valida el diagrama antes de darlo por bueno.

## Contratos documentales obligatorios

### App map para la tab `doc`

- Root fijo: `docs/app-map/`
- Manifest obligatorio: `docs/app-map/navigation.yaml`
- Bundle exacto por nodo: `${bundle}.md` + `${bundle}.mmd`
- `source_of_truth: quality-plan`
- `docs/app-map/` documenta la superficie funcional y no reemplaza `quality/views/**` ni `quality-status.md`

### Quality para la tab `quality`

- `quality-plan.md` define criterios, niveles y vocabulario.
- `docs/01-product/quality/**` completo es superficie contractual obligatoria para quality; incluye `manifest.yaml`, `views/**` y cualquier archivo relacionado dentro de esa superficie.
- `quality-status.md` resume; no concentra todo el detalle operativo.
- El detalle vive en `docs/01-product/quality/views/**`.
- Si una tarea documental cambia comportamiento, proceso o arquitectura, revisar y actualizar quality es SIEMPRE obligatorio y tiene prioridad sobre la doc editorial general.
- Estado funcional y cobertura se reportan por separado.
- Metodos permitidos: `Unit`, `PW-CLI`, `PW-AUTO`, `Manual`.
- Estados de cobertura permitidos: `covered`, `partial`, `missing`, `not-applicable`.

Estas dos convenciones son requeridas. No crear estructuras alternativas para `doc` o `quality`.

## Triggers documentales minimos

- Actualiza docs si cambia comportamiento visible, contrato de API, contrato operativo, vocabulario quality o estructura obligatoria de `docs/app-map/` o `quality`.
- Si cambia comportamiento, proceso, arquitectura o instrucciones operativas, revisar `quality-plan.md` y `docs/01-product/quality/**` es obligatorio aunque despues no haga falta tocar otras docs editoriales.
- No actualices docs si el cambio es solo refactor interno, test-only o endurecimiento sin impacto contractual observable.
- `quality-status.md` sigue siendo resumen ejecutivo; no metas evidencia granular ahi.
- `docs/app-map/` describe estado funcional objetivo; no evidencia de ejecucion.
- `quality/views/**` describe estado y cobertura contractual; no un diario narrativo de debugging.
- Esta skill gobierna ubicacion, forma y trigger documental; `testing-policy` gobierna evidencia y metodo.

## Resultado esperado

- lista de docs afectadas
- motivo de cada update
- paths exactos y secciones relevantes
- indicacion de si la fuente es normativa o contextual
- gaps abiertos, si quedan

## Regla para agents

- Si un agent usa esta skill, esta skill es la fuente de verdad obligatoria.
- El agent no debe introducir policy adicional que contradiga o compita con este archivo.
