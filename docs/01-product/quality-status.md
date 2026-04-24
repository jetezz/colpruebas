# Plan de Calidad — Estado de Evidencia

> **Fuente de verdad**: [docs/01-product/quality-plan.md](./quality-plan.md)
> **Diagrama UI relacionado**: [docs/diagrams/views/home/flow.md](../diagrams/views/home/flow.md)
> **Corte de evidencia**: Abril 2026 — análisis de código y tests existentes del repositorio

---

## Leyenda de columnas

| Columna | Significado |
|---|---|
| **Código** | El comportamiento está implementado y se puede trazar directamente en el código fuente |
| **Front E2E** | Existe test Playwright que cubre explícitamente el criterio |
| **Back Test** | Existe test Bun del backend que cubre explícitamente el criterio |
| **Manual** | Verificación humana registrada |

Valores: **Y** = evidencia presente, **P** = parcial, **—** = sin evidencia, **N/T** = no aplica

---

## Resumen ejecutivo

| Superficie | Total | Código | Front E2E | Back Test | Manual | Con al menos una evidencia |
|---|---|---|---|---|---|---|
| Landing `/` | 5 | 5 | 4 | N/T | — | **5/5** |
| API `/health` + `/api/status` | 2 | 2 | N/T | 2 | — | **2/2** |
| **Total** | **7** | **7** | **4** | **2** | **0** | **7/7** |

### Observaciones clave

1. La home **no consulta la API en runtime**: el texto visible de `API` se arma en `frontend/src/pages/index.astro` a partir de `PUBLIC_ENVIRONMENT`.
2. La consistencia documentada para la home cubre **copy visible** (`title`, `h1`, tarjeta), no sincronización live con el backend.
3. El footer con timestamp está implementado, pero **no tiene test existente** en la suite frontend actual.

---

## 1. Vista: Landing (`/`)

| ID | Criterio | Nivel | Código | Front E2E | Back Test | Manual | Notas |
|---|---|---|---|---|---|---|---|
| HOM-01 | La landing renderiza `colpruebas` en `<title>` y heading principal | Obligatorio | **Y** | **Y** | N/T | — | Código: `frontend/src/pages/index.astro`, `frontend/src/components/Header.astro`. Test: `tests/front/tests/index.spec.ts`. |
| HOM-02 | La landing muestra `Aplicación`, `Frontend`, `API` y `Rama Git` | Obligatorio | **Y** | **Y** | N/T | — | Código: `frontend/src/components/InfoCard.astro`. Test: `tests/front/tests/index.spec.ts`. |
| HOM-03 | El nombre visible de la app es consistente entre título, heading y tarjeta | Esperado | **Y** | **Y** | N/T | — | `appName = 'colpruebas'` se reutiliza en `index.astro`; el test valida title, `h1` y texto en `.info-card`. |
| HOM-04 | La carga inicial no genera errores de consola | Esperado | **Y** | **Y** | N/T | — | Test: `tests/front/tests/index.spec.ts` captura `page.on('console')` y espera cero errores. |
| HOM-05 | La landing muestra timestamp visible en footer | Deseado | **Y** | — | N/T | — | Código: `frontend/src/components/Footer.astro`. Sin test existente que lo aserte. |

---

## 2. API: `/health`

| ID | Criterio | Nivel | Código | Front E2E | Back Test | Manual | Notas |
|---|---|---|---|---|---|---|---|
| API-01 | `GET /health` responde `200` con `status: ok`, `environment` y `timestamp` | Obligatorio | **Y** | N/T | **Y** | — | Código: `backend/src/index.ts`. Test: `tests/back/endpoints.test.ts`. |

---

## 3. API: `/api/status`

| ID | Criterio | Nivel | Código | Front E2E | Back Test | Manual | Notas |
|---|---|---|---|---|---|---|---|
| API-02 | `GET /api/status` responde `200` con `app`, `environment` y `timestamp` | Obligatorio | **Y** | N/T | **Y** | — | Código: `backend/src/index.ts`. Test: `tests/back/endpoints.test.ts`. |

---

## Cobertura por nivel

| Nivel | Criterios | Con evidencia de código | Con evidencia de test |
|---|---|---|---|
| **Obligatorio** | 4 | 4 | 4 |
| **Esperado** | 2 | 2 | 2 |
| **Deseado** | 1 | 1 | 0 |

### Gap explícito conocido

| ID | Estado | Motivo |
|---|---|---|
| HOM-05 | Sin test | El footer renderiza timestamp, pero `tests/front/tests/index.spec.ts` no lo verifica |

---

*Documentación actualizada: Abril 2026*
