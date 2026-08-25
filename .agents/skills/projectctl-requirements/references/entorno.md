---
file: references/entorno.md
parent_skill: projectctl-requirements
owner: WU-SKILL-2 (apply-doc)
tab: entorno
criteria_covered: [PCT-95, PCT-96, PCT-97, PCT-98, PCT-99, PCT-100]
last_bundle_sync: 2026-07-24
generated_by: sdd-apply-doc (WU-SKILL-2) — sdd/completar-projectctl/apply-doc-WU-SKILL-2
---

# `.agents/skills/projectctl-requirements/references/entorno.md` — Requisitos de la tab Entorno (PCT-95..PCT-100)

> **Archivo referente**: documento de la skill `projectctl-requirements` que operacionaliza, para repos destino, los **requisitos del sistema de runtime/entornos** que cualquier proyecto gestionado debe cumplir para arrancar, ser publicable y conectarse al tunnel compartido.
>
> Esta referencia es parte del **estándar canónico de compatibilidad `/projectctl`**. Sus fuentes de trazabilidad son `.agents/skills/projectctl-requirements/references/standard.md` §3 + `compose.yml` + `compose.dev.yml` + `.env.example` + `docs/00-context/entornos.md` + `.agents/skills/sandbox-runtime-policy/SKILL.md` + `.agents/skills/projectctl-requirements/references/standard.md` §4. El bloque `SoT original` conserva esa etiqueta en formato machine-grepeable (backticks) para que `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` valide las rutas contra el repo destino.

## Cómo leer este archivo

Para cada requisito:

- **Requisito** (qué debe ser cierto en el proyecto).
- **SoT original** (etiqueta de compatibilidad con el test; paths inline-code que `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` valida como existentes en el repo destino).
- **Cumple** (IDs PCT-95..PCT-100 que este requisito operacionaliza).
- **last-verified** (fecha YYYY-MM-DD de la última regeneración por el agente; bumpear ante cualquier cambio en cualquier path del bloque `SoT original`).

> Si el repo destino no tiene una de las skills referenciadas, el agente debe mostrar un aviso `"skill no encontrada en este repo; verifique localmente"` y **NO** fallar (ADDED-SKILL-005 / Maintenance contract).

---

## PCT-95 — Panel Entorno existe y lista las reglas para arrancar + ser publicable + tunnel

### Requisito

`/projectctl?tab=entorno` MUST renderizar el panel Entorno listando las reglas del repo para que un proyecto gestionado arranque, sea publicable y se conecte al tunnel compartido:

1. Overlays canónicos (`compose.yml` + `compose.dev.yml`).
2. Puertos canónicos + `FRONTEND_PORT` obligatorio en `.env` y `.env.dev`.
3. Contrato edge `mis-proyectos-edge` external + alias por entorno + guardrail `TUNNEL_NOT_PUBLISHABLE`.
4. Sandbox sin Docker CLI/socket — control de runtime exclusivamente via `projectctl`.

> **SoT original**: `.agents/skills/projectctl-requirements/references/standard.md` §3 + `docs/00-context/entornos.md` + `.agents/skills/sandbox-runtime-policy/SKILL.md`.
> **Cumple**: PCT-95.
> **last-verified**: 2026-07-24 — regenerar ante cualquier cambio en `.agents/skills/projectctl-requirements/references/standard.md` §3, `docs/00-context/entornos.md` o `.agents/skills/sandbox-runtime-policy/SKILL.md`.

---

## PCT-96 — Overlays canónicos (`compose.yml` prod + `compose.dev.yml` dev)

### Requisito

El panel Entorno MUST explicar el **layout canónico de overlays**:

1. `compose.yml` (raíz del proyecto) → modo `prod`. El servicio `frontend` debe usar `target: prod`.
2. `compose.dev.yml` (raíz del proyecto) → modo `dev`. El servicio `frontend` debe usar `target: dev` (HMR + `bun --watch`).
3. Un solo repositorio, dos modos de ejecución (prod / dev).
4. Servicio `tunnel` queda solo como **fallback legacy opt-in** vía `profiles: [...]` explícito (per `standard.md` §3); NO es el camino principal. El camino principal es el tunnel gestionado central (`CENTRAL_TUNNEL_WEBHOOK_URL` + `DEPLOY_JWT_SECRET`).
5. `sandbox` y `api` NO se exponen libremente al host en producción, salvo la excepción operativa documentada del `compose.yml` raíz del repo (per `standard.md` §3).

> **SoT original**: `compose.yml` + `compose.dev.yml` + `.env.example` + `.agents/skills/projectctl-requirements/references/standard.md` §3 + `docs/00-context/entornos.md` + `docs/00-context/architecture.md`.
> **Cumple**: PCT-96.
> **last-verified**: 2026-07-24 — regenerar ante cualquier cambio en `compose.yml`, `compose.dev.yml`, `.env.example`, `.agents/skills/projectctl-requirements/references/standard.md` §3 o `docs/00-context/entornos.md` (especialmente la regla del servicio `tunnel` como fallback legacy).

---

## PCT-97 — Puertos canónicos + `FRONTEND_PORT` obligatorio en `.env` y `.env.dev`

### Requisito

El panel Entorno MUST declarar la **obligatoriedad de `FRONTEND_PORT`** y los puertos canónicos:

1. `FRONTEND_PORT` (host) → `4321` (contenedor). **OBLIGATORIO** en `.env` y `.env.dev`; sin eso, el runtime gestionado NO arranca (regla de `standard.md` §3).
2. `API_PORT`, `WEBHOOK_PORT` siguiendo la convención existente del repo (referenciados por `compose.yml` / `compose.dev.yml` / `.env.example`).
3. `projectctl env validate` (PCT-35) MUST reportar `missing/invalid FRONTEND_PORT` y el campo `configExists` cuando corresponda.

> **SoT original**: `compose.yml` + `compose.dev.yml` + `.env.example` + `.agents/skills/projectctl-requirements/references/standard.md` §3 + `docs/app-map/views/projectctl/index.md`.
> **Cumple**: PCT-97.
> **last-verified**: 2026-07-24 — regenerar ante cualquier cambio en cualquier overlay Compose (`compose.yml` o `compose.dev.yml`), en `.env.example`, en `.agents/skills/projectctl-requirements/references/standard.md` §3 o en `PCT-35` en `docs/app-map/views/projectctl/index.md`.

---

## PCT-98 — Contrato edge `mis-proyectos-edge` + alias + guardrail `TUNNEL_NOT_PUBLISHABLE`

### Requisito

El panel Entorno MUST explicar el **contrato edge** `mis-proyectos-edge`:

1. Red `mis-proyectos-edge` declarada como `external: true` en los overlays. NO gestionada por el compose del proyecto.
2. **Alias por entorno** declarados en `services.*.networks.edge.aliases` del frontend:
   - Prod: alias `<app>-origin` (ej. `colpruebas-origin`) — el `service` real que Cloudflare resuelve.
   - Dev: alias `test-<app>-origin` (ej. `test-colpruebas-origin`).
3. **Guardrail `TUNNEL_NOT_PUBLISHABLE`**: si no hay alias edge válido o el hostname no resuelve, `projectctl tunnel status` (PCT-38) MUST reportar `publishability: not_publishable` con accionables (`channels`, `services`, `remediation`).
4. **Regla "alias edge first, `host.docker.internal:<PORT>` solo legacy"**: NO usar `host.docker.internal:<FRONTEND_PORT>` como camino estándar cuando el proyecto ya tiene alias edge gestionado. Eso queda como compat/legacy, no como estándar.

> **SoT original**: `.agents/skills/projectctl-requirements/references/standard.md` §3 + `compose.yml` + `compose.dev.yml` + `docs/00-context/architecture.md` + `docs/02-features/tunnel.md` + `docs/app-map/views/projectctl/index.md`.
> **Cumple**: PCT-98.
> **last-verified**: 2026-07-24 — regenerar ante cualquier cambio en `.agents/skills/projectctl-requirements/references/standard.md` §3, en los overlays compose del proyecto destino, en `docs/02-features/tunnel.md`, en `PCT-38/PCT-42/PCT-43/PCT-44/PCT-45` o en el guardrail `TUNNEL_NOT_PUBLISHABLE`.

---

## PCT-99 — Sandbox sin Docker — control de runtime exclusivamente via `projectctl`

### Requisito

El panel Entorno MUST declarar la **regla sandbox**:

1. `sandbox` NO expone `docker` CLI ni `docker.sock`. Cualquier intento de `docker compose ...` desde dentro de un sandbox MUST fallar (`docker: command not found` es comportamiento correcto, NO bug — per `sandbox-runtime-policy`).
2. Control de runtime **EXCLUSIVO** via `projectctl`:
   - `projectctl env *` (PCT-30..PCT-37): gestión de `.env` / `.env.dev` (status, get, set, unset, edit, validate, pull, run).
   - `projectctl tunnel *` (PCT-38..PCT-45): tunnel (status, tokens, routes, domains, set-domain, set prod/dev, clear).
   - `projectctl start|stop|restart|rebuild|promote|deploy|doctor`: ciclo de vida del runtime.
3. La PTY del proyecto hospeda el binario `projectctl`; la API valida auth + ownership; `webhook-listener` ejecuta Docker Compose en el host (única superficie privilegiada).

> **SoT original**: `.agents/skills/sandbox-runtime-policy/SKILL.md` + `.agents/skills/projectctl-requirements/references/standard.md` §3 + `.agents/skills/projectctl-requirements/references/standard.md` §4 + `docs/app-map/views/projectctl/index.md` + `sandbox/src/bin/projectctl.ts`.
> **Cumple**: PCT-99.
> **last-verified**: 2026-07-24 — regenerar ante cualquier cambio en `.agents/skills/sandbox-runtime-policy/SKILL.md`, `.agents/skills/projectctl-requirements/references/standard.md` §4, en `sandbox/src/bin/projectctl.ts`, o en cualquier PCT-30..PCT-45 del bundle `docs/app-map/views/projectctl/index.md`.

---

## PCT-100 — References entorno: estándar integrado

### Requisito

El panel Entorno MUST declarar `projectctl-requirements` como policy operativa integrada obligatoria para este dominio:

1. `.agents/skills/projectctl-requirements/references/standard.md` §3 — policy integrada de **runtime cross-service del repo raíz** y frontera operativa para cambiar / migrar / corregir compose/env de proyectos gestionados con publicabilidad por tunnel compartido.

> **SoT original**: `.agents/skills/projectctl-requirements/references/standard.md`.
> **Cumple**: PCT-100.
> **last-verified**: 2026-07-24 — regenerar ante cualquier cambio en `.agents/skills/projectctl-requirements/references/standard.md` §3.

---

## Resumen de la tab Entorno

| ID | Requisito (resumen) |
| --- | --- |
| PCT-95 | Panel Entorno existe y lista reglas para arrancar + ser publicable + tunnel |
| PCT-96 | Overlays canónicos (`compose.yml` prod + `compose.dev.yml` dev) + `tunnel` como fallback legacy opt-in |
| PCT-97 | Puertos canónicos + `FRONTEND_PORT` obligatorio en `.env` y `.env.dev` |
| PCT-98 | Contrato edge `mis-proyectos-edge` + alias por entorno + guardrail `TUNNEL_NOT_PUBLISHABLE` |
| PCT-99 | Sandbox sin Docker CLI/socket — control de runtime exclusivamente via `projectctl` |
| PCT-100 | References entorno: estándar integrado en `projectctl-requirements` |

## Criterios cubiertos por este archivo

`PCT-95`, `PCT-96`, `PCT-97`, `PCT-98`, `PCT-99`, `PCT-100`.

(Véase `.agents/skills/projectctl-requirements/references/sources.md` para la tabla SoT machine-grepeable completa, y `.agents/skills/projectctl-requirements/references/maintenance.md` para el contrato anti-drift que rige la regeneración de este archivo.)
