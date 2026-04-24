# Plan de Calidad — colpruebas

> **Documento contractual**: define el alcance mínimo de calidad verificable del producto actual y su trazabilidad con el código y los tests existentes.

---

## 1. Niveles de Cobertura

| Nivel | Significado | Evidencia mínima esperada |
|---|---|---|
| **Obligatorio** | Comportamiento base del producto actual. Si falla, el entregable queda incompleto. | Código implementado + test existente de la superficie correspondiente |
| **Esperado** | Calidad importante para uso y confianza básica. Puede tener gaps chicos si se documentan. | Código implementado o test existente claramente trazable |
| **Deseado** | Señales de diagnóstico o polish útil, sin bloquear entrega. | Best-effort |

---

## 2. Alcance actual del producto

El alcance real y documentado para `colpruebas` queda limitado a estas superficies:

| Superficie | Ruta | Nivel global |
|---|---|---|
| Landing pública | `/` | **Obligatorio** |
| API Health | `/health` | **Obligatorio** |
| API Status | `/api/status` | **Obligatorio** |

### Evidencia de soporte conocida

- Frontend: `tests/front/tests/index.spec.ts`
- Backend: `tests/back/endpoints.test.ts`
- Diagrama de la vista `/`: [docs/diagrams/views/home/flow.md](../diagrams/views/home/flow.md)

> Nota: el backend también expone `GET /`, pero queda fuera del alcance contractual mínimo pedido para este plan.

---

## 3. Vista: Landing (`/`)

**Nivel global: Obligatorio**

### Criterios de aceptación

| ID | Criterio | Tipo | Nivel |
|---|---|---|---|
| HOM-01 | La landing renderiza el nombre `colpruebas` en el `<title>` y en el encabezado principal | Visual | Obligatorio |
| HOM-02 | La landing muestra una tarjeta de información con las etiquetas `Aplicación`, `Frontend`, `API` y `Rama Git` | Funcional | Obligatorio |
| HOM-03 | La información visible del nombre de la app es consistente entre título, heading y tarjeta | Consistencia | Esperado |
| HOM-04 | La carga inicial de la landing no genera errores de consola en el navegador | Robustez | Esperado |
| HOM-05 | La landing muestra un timestamp visible en el footer para diagnóstico simple | Diagnóstico | Deseado |

---

## 4. API: `/health`

**Nivel global: Obligatorio**

| ID | Criterio | Tipo | Nivel |
|---|---|---|---|
| API-01 | `GET /health` responde `200` con `status: ok`, `environment` y `timestamp` | Contrato API | Obligatorio |

---

## 5. API: `/api/status`

**Nivel global: Obligatorio**

| ID | Criterio | Tipo | Nivel |
|---|---|---|---|
| API-02 | `GET /api/status` responde `200` con `app`, `environment` y `timestamp` | Contrato API | Obligatorio |

---

## 6. Trazabilidad con tests existentes

| Criterio | Evidencia actual |
|---|---|
| HOM-01, HOM-02, HOM-03 | `tests/front/tests/index.spec.ts` valida `<title>`, `h1`, `.info-card` y textos visibles |
| HOM-04 | `tests/front/tests/index.spec.ts` registra errores de consola y espera longitud `0` |
| API-01, API-02 | `tests/back/endpoints.test.ts` valida status `200` y estructura JSON de ambos endpoints |

---

## 7. Resumen de métricas

| Nivel | Criterios |
|---|---|
| **Obligatorio** | 4 |
| **Esperado** | 2 |
| **Deseado** | 1 |
| **Total** | **7** |

---

## 8. Definiciones

- **Código**: implementación visible en archivos fuente del producto actual.
- **Front E2E**: test Playwright existente que interactúa con la UI.
- **Back Test**: test Bun existente que verifica contratos HTTP del backend.
- **Consistencia visible**: coherencia entre los textos mostrados al usuario en una misma pantalla, sin implicar sincronización runtime con otro servicio.

---

*Documento generado: Abril 2026*
*Última actualización: Abril 2026*
