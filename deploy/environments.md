# Deployment environments

This repository has two managed Compose environments. The tables below describe only values
verified in the repository; runtime secrets and local `.env` files are intentionally not reproduced.

## Topology

| Environment | Hostname | Edge alias | Frontend service | API service | Overlay |
| --- | --- | --- | --- | --- | --- |
| Production | `https://test.colpruebas.online` | `colpruebas-origin` | `frontend-prod` | `api-prod` | `compose/compose.prod.yml` |
| Development | `https://colpruebas.online` | `test-colpruebas-origin` | `frontend-dev` | `api-dev` | `compose/compose.dev.yml` |

The shared base is `compose/compose.yml`. It declares the `internal` bridge network and the
external `mis-proyectos-edge` network; the environment overlays declare the services. The edge
aliases are attached to the corresponding frontend service.

## Compose and ports

Run the base together with exactly one environment overlay:

```text
docker compose -f compose/compose.yml -f compose/compose.prod.yml
docker compose -f compose/compose.yml -f compose/compose.dev.yml
```

Both frontend containers listen on `4321`; the host mapping is `${FRONTEND_PORT}:4321`.
The API containers listen internally on `3000`. The committed environment examples declare:

| Environment | `NODE_ENV` | `APP_NAME` | `ENVIRONMENT` | `FRONTEND_PORT` | `API_PORT` | `PUBLIC_API_URL` |
| --- | --- | --- | --- | ---: | ---: | --- |
| Production (`.env.example`) | `production` | `colpruebas` | `production` | `4321` | `3005` | `http://localhost:3005` |
| Development (`.env.dev.example`) | `development` | `colpruebas` | `development` | `4324` | `3100` | `http://localhost:3100` |

`API_PORT` is the declared host/API environment value. The development overlay connects the
frontend to `http://api-dev:3000` on the internal network; the production overlay maps the API
host port with `${API_PORT}:3000`.

## Central tunnel

The central tunnel is not a Compose service in this repository. Its configuration uses these
environment variables:

- `CENTRAL_TUNNEL_WEBHOOK_URL` — central tunnel webhook URL.
- `DEPLOY_JWT_SECRET` — JWT secret used to authenticate deploy/tunnel operations.

This document does not include values for either variable. The frontend is published through the
edge aliases above; the Compose `tunnel` service, where present as legacy fallback, is not the
primary path.

## Managed operations

Use the managed CLI for lifecycle and diagnostics:

```text
projectctl env validate
projectctl start prod
projectctl start dev
projectctl status
projectctl logs prod <service> --tail N
projectctl logs dev <service> --tail N
projectctl doctor
projectctl tunnel status
```

When tunnel configuration needs alignment, the repository documents
`projectctl tunnel set-domain` and `projectctl tunnel set prod|dev`; rebuild the affected
environment with `projectctl rebuild prod` or `projectctl rebuild dev`.

## Traceability

- `docs/00-context/entornos.md` — canonical overlays, service names, ports, hostnames, and aliases.
- `docs/00-context/architecture.md` — frontend/API internal ports and Compose layout.
- `docs/02-features/tunnel.md` — central tunnel variables, aliases, and managed commands.
- `.env.example` and `.env.dev.example` — committed production/development example values.
- `compose/compose.yml`, `compose/compose.prod.yml`, and `compose/compose.dev.yml` — networks,
  services, build targets, mappings, and aliases.
- `AGENTS.md` and `README.md` — managed `projectctl` operation and repository commands.
