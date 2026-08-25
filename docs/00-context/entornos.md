# Entornos — Runtime y overlays canónicos (repo colpruebas)

> Documento de **contexto** del repo `colpruebas` sobre cómo arrancan los entornos prod/dev
> gestionados. Los **valores normativos** de runtime (overlays canónicos, `FRONTEND_PORT`
> obligatorio, contrato edge, sandbox sin Docker) NO se duplican aquí como política paralela:
> viven en `.agents/skills/projectctl-requirements/references/entorno.md` (PCT-95..PCT-100) y
> `.agents/skills/projectctl-requirements/references/standard.md` §3, que son la fuente canónica.
> Este documento describe la **realidad de este repo** (los overlays concretos que genera esta
> remediación) para que los agentes/mantenimiento sepan cómo operar los entornos.

## 1. Overlays canónicos (compose de plataforma)

Un proyecto gestionado por la plataforma usa **tres archivos Compose canónicos** en la raíz,
tal y como los valida el `webhook-listener` de la plataforma (ground truth del contrato):

| Archivo | Rol | Contenido |
| --- | --- | --- |
| `compose.yml` | **BASE** | Solo las redes compartidas: `internal` (bridge) + `edge` (`name: mis-proyectos-edge`, `external: true`). No declara servicios. |
| `compose.prod.yml` | **PROD overlay** | Servicios `frontend-prod` (target `prod`) + `api-prod`. |
| `compose.dev.yml` | **DEV overlay** | Servicios `frontend-dev` (target `dev`, HMR/watch) + `api-dev`. |

La plataforma ejecuta el rango de overlays como

```
docker compose -f compose.yml -f compose.<mode>.yml
```

(+ un overlay runtime escrito por la plataforma que añade `container_name`, `API_URL` y los
bind-mounts de fuente `frontend/src` + `api/src`).

### Nombres de servicio: NO colisionar con la raíz de la plataforma

Los nombres de servicio **MUST NOT** colisionar con los del stack ROOT de la plataforma
(`frontend`, `api`, `tunnel`, `sandbox`, `webhook-listener`, `root-tunnel-sync`). Por eso este
proyecto usa nombres por entorno:

| Entorno | Servicios |
| --- | --- |
| prod | `frontend-prod` + `api-prod` |
| dev | `frontend-dev` + `api-dev` |

- El `api-<env>` no se expone libremente al host en producción (solo el mapeo documentado del
  overlay), de acuerdo con la excepción operativa de `standard.md` §3.
- El servicio `tunnel` NO es el camino principal: queda solo como fallback legacy opt-in vía
  `profiles` explícito. El camino principal es el tunnel gestionado central (ver
  `docs/02-features/tunnel.md`).

## 2. `FRONTEND_PORT` obligatorio

`FRONTEND_PORT` es **obligatorio** en `.env` y `.env.dev`; el runtime gestionado NO arranca sin
él. El frontend expone `4321` **dentro** del contenedor y mapea

```
"${FRONTEND_PORT}:4321"
```

- Valor canónico: `FRONTEND_PORT=4321`.
- La plataforma aloja **prod en `4321`** y, si el puerto estuviera ocupado, **dev cae
  automáticamente al siguiente puerto libre** (p. ej. `4324`) — la asignación del puerto efectivo
  la resuelve el runtime de la plataforma, no el repo.
- `.env` (prod) y `.env.dev` (dev) son **locales** y están excluidos del commit (gitignored);
  la referencia commitada es `.env.example` (`FRONTEND_PORT=4321`).
- `projectctl env validate` reporta `missing/invalid FRONTEND_PORT` si falta o es inválido.

## 3. Contrato edge `mis-proyectos-edge`

Para ser publicable por tunnel compartido, el servicio de frontend de cada entorno se une a la
red externa `mis-proyectos-edge` (`external: true`, no gestionada por el compose del proyecto)
con un **alias por entorno** declarado en `services.frontend-<env>.networks.edge.aliases`
(`frontend-prod` / `frontend-dev`):

| Entorno | Alias edge | Servicio |
| --- | --- | --- |
| prod | `colpruebas-origin` (el `service` real que Cloudflare resuelve) | `frontend-prod` |
| dev | `test-colpruebas-origin` | `frontend-dev` |

- Hostnames por entorno: prod `test.colpruebas.online`, dev `colpruebas.online`; la activación
  del token se hace vía `POST /tunnel-tokens/<id>/activate`.
- No usar `host.docker.internal:<FRONTEND_PORT>` como camino estándar cuando existe alias edge
  gestionado; queda solo como compat/legacy.
- Si faltara alias edge válido o el hostname no resolviera, `projectctl tunnel status` reporta
  `publishability: not_publishable` con accionables (guardrail `TUNNEL_NOT_PUBLISHABLE`). Ver
  `docs/02-features/tunnel.md` para las acciones concretas.

## 4. Runtime controlado exclusivamente vía `projectctl`

El **sandbox NO expone Docker** (ni `docker` CLI ni `docker.sock`); un `docker compose ...`
dentro del sandbox debe fallar (`docker: command not found` es comportamiento correcto, NO un
bug). El control de runtime es **EXCLUSIVO** vía `projectctl`:

- Ciclo de vida: `projectctl start|stop|restart|rebuild|promote|deploy|doctor`.
- Gestión de env: `projectctl env status|get|set|unset|edit|validate|pull|run`.
- Tunnel: `projectctl tunnel status|tokens|routes|set-domain|set|clear` (ver
  `docs/02-features/tunnel.md`).
- Tests: `projectctl test run|list-runs|results|schedule-add`.

La única superficie privilegiada que ejecuta Docker Compose en el host es `webhook-listener`;
la API valida auth + ownership y la PTY del proyecto hospeda el binario `projectctl`.

## 5. Cómo arrancar los entornos

1. Comprobar la configuración: `projectctl env validate` (debe reportar ok).
2. Levantar el entorno deseado: `projectctl start dev` (o `prod`).
3. Estado: `projectctl status`; logs: `projectctl logs dev|prod <service> --tail N`.
4. Diagnóstico: `projectctl doctor`.

Para la política normativa completa (PCT-95..PCT-100) ver
`.agents/skills/projectctl-requirements/references/entorno.md` y `standard.md` §3.
La arquitectura general del repo se describe en `docs/00-context/architecture.md`; el tunnel
gestionado en `docs/02-features/tunnel.md`.
