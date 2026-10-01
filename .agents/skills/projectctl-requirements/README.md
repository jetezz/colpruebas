# projectctl-requirements

Estándar portable de criterios → docs → test → estructura/arquitectura → code. Un criterio debe tener identidad y fuente documental; sus evidencias de tests y código se vinculan mediante `@ac`, `@criterion`/`@trace` y `evidence_paths`. Los diagnósticos de proyecto están en `scripts/project/` y el check del paquete en `scripts/skill/requirements-check.ts`.

Las reglas de cada eslabón viven respectivamente en `references/criterios/reglas.md`, `references/docs/reglas.md`, `references/test/reglas.md`, `references/estructura/reglas.md` y `references/code/reglas.md`. `SKILL.md` indica cuándo leer cada una; `references/standard.md` y `references/sources.md` cruzan toda la cadena. Los contratos machine permanecen en `references/app-map/` y `references/schemas/`.

El generador de las ocho tabs (`scripts/projectctl-docs-core.ts`) y el manifest de capacidades de CLI, SDD y entorno (`scripts/projectctl-manifest.ts`) son integraciones de esta instancia, fuera del paquete core. La copia del core se valida por sí sola sin importar esos scripts ni instalar satélites.

Los doctors `doctor-docs.ts`, `doctor-test.ts` y `doctor-structure.ts` admiten `--target=<view>[:<feature>]` (por ejemplo `--target=projectctl:criterios`). Sin filtro mantienen el diagnóstico del proyecto completo. La jerarquía viene de `docs/app-map/navigation.yaml`, la identidad de criterios de los bundles inline y el inventario derivado compartido vive en `scripts/project/app-map-inventory.ts`. Un resultado filtrado no reemplaza el gate global; `--managed` consulta al operador sobre el proyecto completo.

El árbol de esta skill no incluye binding, fases, agentes ni proyecciones SDD. El flujo de tareas es opcional y se instala por separado mediante [`projectctl-sdd`](../projectctl-sdd/SKILL.md). RDD y Judgment Day son satélites propios. El contrato de runtime gestionado pertenece a [`projectcl-enviorement`](../projectcl-enviorement/SKILL.md).

La tab CLI es responsabilidad de la instancia destino (su App Map + catálogo publicado), no de una skill portable. Las referencias históricas `references/{cli,entorno,tareas}.md` ya no forman parte del core; la instancia conserva los criterios de sus tabs en su App Map.

La tab Tareas puede enlazar un SDD instalado, pero el core no depende de que exista. `bun .agents/skills/projectctl-requirements/scripts/skill/requirements-check.ts --check` debe funcionar en una instalación core-only.
