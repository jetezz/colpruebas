# Tunnel gestionado — Publicabilidad y guardrail (repo colpruebas)

> **Feature**: tunnel gestionado central y publicabilidad del proyecto `colpruebas`.
>
> Los **valores normativos** (contrato edge, guardrail, política legacy) NO se duplican aquí
> como catálogo paralelo: viven en `.agents/skills/projectctl-requirements/references/entorno.md`
> (PCT-98) y `.agents/skills/projectctl-requirements/references/standard.md` §3. Este documento
> describe cómo se aplica ese contrato a este repo y qué acciones tomar ante el guardrail.

## 1. Tunnel gestionado central (camino principal)

El tunnel compartido es **global y centralizado**, NO lo gestiona el compose de este proyecto.
Se configura mediante dos variables de entorno:

- `CENTRAL_TUNNEL_WEBHOOK_URL` — URL del webhook central que gestiona el tunnel compartido.
- `DEPLOY_JWT_SECRET` — secreto JWT para autenticar la operación de deploy/tunnel.

El servicio `tunnel` de compose NO es el camino principal: queda solo como **fallback legacy
opt-in** vía `profiles: [...]` explícito. Para publicabilidad hay que usar el tunnel gestionado
central + el contrato edge.

## 2. Contrato edge y alias por entorno

Para ser publicable, el frontend se une a la red externa `mis-proyectos-edge`
(`external: true`) con un **alias por entorno**:

| Entorno | Overlay | Alias edge |
| --- | --- | --- |
| **prod** | `compose.yml` | `colpruebas-origin` |
| **dev** | `compose.dev.yml` | `test-colpruebas-origin` |

- El alias prod (`<app>-origin`) es el `service` real que Cloudflare resuelve.
- El alias dev (`test-<app>-origin`) se usa para el entorno de test.
- No usar `host.docker.internal:<FRONTEND_PORT>` como camino estándar cuando existe alias edge
  gestionado (queda como compat/legacy).

## 3. Guardrail `TUNNEL_NOT_PUBLISHABLE`

Si **no hay alias edge válido** o el hostname **no resuelve**, `projectctl tunnel status`
reporta:

```
publishability: not_publishable
channels:   <canales afectados>
services:   <servicios sin alias edge resuelto>
remediation: <acciones correctivas>
```

Estado clave: **`TUNNEL_NOT_PUBLISHABLE`**.

### Acciones concretas (remediation)

1. **Verificar los overlays canónicos**: comprobar que `compose.yml` (prod) declara el alias
   `colpruebas-origin` y `compose.dev.yml` (dev) declara `test-colpruebas-origin` en
   `services.frontend.networks.edge.aliases`. Corregir el alias si falta o está mal.
2. **Verificar la red `mis-proyectos-edge`**: debe existir como red externa
   (`external: true`, key `edge`, `name: mis-proyectos-edge`). Si no existe, crearla/recrearla
   y reapuntar el overlay (no la gestiona el compose del proyecto).
3. **Verificar que la configuración prod/dev esté presente**: `projectctl env validate` debe
   reportar ok (`FRONTEND_PORT` obligatorio, ver `docs/00-context/entornos.md`).
4. **Configurar el tunnel gestionado**: si el alias edge existe pero el hostname no resuelve,
   revisar el estado del tunnel central con
   `projectctl tunnel status` y, si corresponde, `projectctl tunnel set-domain` /
   `projectctl tunnel set prod|dev` para alinear el dominio con el alias edge.
5. **Reconstruir el frontend** si cambió la topología de redes/alias:
   `projectctl rebuild dev` (o `prod`) y reintentar `projectctl tunnel status`.

La política normativa y los IDs PCT asociados (PCT-98, PCT-38/PCT-42..PCT-45) viven en
`.agents/skills/projectctl-requirements/references/entorno.md` y el bundle
`docs/app-map/views/projectctl/index.md`.
