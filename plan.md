# Plan de Implementación: Proyecto colpruebas

## Objetivo
Configurar un proyecto simple con backend y frontend que muestre información del entorno (prod/test), API y rama Git.

## Resumen de Configuración

### Nombre del Proyecto
**colpruebas**

### Puertos Asignados
| Servicio     | Puerto Host | Puerto Contenedor | Environment |
|-------------|-------------|-------------------|-------------|
| frontend-prod  | 8085        | 4321              | production  |
| frontend-test  | 8086        | 4321              | test        |
| api-prod       | 3005        | 3000              | production  |
| api-test       | 3006        | 3000              | test        |

### Contenedores
- `colpruebas-frontend-prod` - Frontend Production
- `colpruebas-api-prod` - API Production  
- `colpruebas-frontend-test` - Frontend Test
- `colpruebas-api-test` - API Test

### Variables de Entorno
| Variable | Production | Test |
|----------|------------|------|
| APP_NAME | colpruebas | colpruebas |
| ENVIRONMENT | production | test |


## Verificación

### Servicios Corriendo ✅
```
colpruebas-frontend-prod   0.0.0.0:8085->4321/tcp
colpruebas-frontend-test   0.0.0.0:8086->4321/tcp
colpruebas-api-prod        0.0.0.0:3005->3000/tcp
colpruebas-api-test        0.0.0.0:3006->3000/tcp
```

### Pruebas Realizadas ✅

**Frontend Production (http://localhost:8085)**
- Aplicación: colpruebas
- Entorno: PRODUCCIÓN
- Frontend: Estamos en el frontend de PRODUCCIÓN
- API: API de producción funcionando
- Rama Git: main

**Frontend Test (http://localhost:8086)**
- Aplicación: colpruebas
- Entorno: TEST
- Frontend: Estamos en el frontend de TEST
- API: API de test funcionando
- Rama Git: main

**API Production (http://localhost:3005)**
```json
{
  "app": "colpruebas",
  "message": "API de prod funcionando",
  "environment": "production",
  "gitBranch": "main",
  "version": "1.0.0"
}
```

**API Test (http://localhost:3006)**
```json
{
  "app": "colpruebas",
  "message": "API de test funcionando",
  "environment": "test",
  "gitBranch": "main",
  "version": "1.0.0"
}
```

## Estructura del Proyecto
```
a7cb866f-ddba-4d47-9982-f73464cb495f/
├── .env                          # Puertos y variables Git
├── docker-compose.yml            # 4 servicios (prod + test)
├── plan.md                       # Este archivo
├── .mis-proyectos/
│   └── environment.docker.md     # Config deploy
├── backend/
│   ├── src/index.ts             # API Express con variables de entorno
│   ├── package.json
│   └── Dockerfile
└── frontend/
    ├── public/index.html         # HTML con info de entorno
    ├── package.json
    └── Dockerfile
```

## Notas
- Los contenedores ahora tienen nombres reconocibles (colpruebas-*)
- El frontend detecta el entorno según el puerto (8085=prod, 8086=test)
- La API devuelve mensajes diferenciados según ENVIRONMENT
- Se muestra la rama Git (main) en el frontend
