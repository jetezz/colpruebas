# Plan de Implementación: Deploy y Tunnel para Proyecto de Prueba

## Objetivo
Configurar un proyecto simple con backend (Bun/Express) y frontend que pueda desplegarse y accederse mediante los sistemas de deploy y tunnel del proyecto padre.

## Resumen de Configuración

### Puertos Asignados
| Servicio     | Puerto Host | Puerto Contenedor | Environment |
|-------------|-------------|-------------------|-------------|
| frontend-prod  | 8085        | 4321              | production  |
| frontend-test  | 8086        | 4321              | test        |
| api-prod       | 3005        | 3000              | production  |
| api-test       | 3006        | 3000              | test        |

### Contenedores
- `testapp-frontend-prod` - Frontend Production
- `testapp-api-prod` - API Production  
- `testapp-frontend-test` - Frontend Test
- `testapp-api-test` - API Test

### Archivos de Configuración
- `.env` - Variables de entorno con puertos
- `docker-compose.yml` - 4 servicios (prod + test)
- `.mis-proyectos/environment.docker.md` - Configuración para webhook-listener

## Verificación

### Servicios Corriendo ✅
```
testapp-frontend-prod   0.0.0.0:8085->4321/tcp
testapp-frontend-test   0.0.0.0:8086->4321/tcp
testapp-api-prod        0.0.0.0:3005->3000/tcp
testapp-api-test        0.0.0.0:3006->3000/tcp
```

### Pruebas Realizadas ✅
- [x] Frontend Prod: http://localhost:8085 - OK
- [x] Frontend Test: http://localhost:8086 - OK
- [x] API Prod: http://localhost:3005 - OK (environment: production)
- [x] API Test: http://localhost:3006 - OK (environment: test)

## Estructura del Proyecto
```
a7cb866f-ddba-4d47-9982-f73464cb495f/
├── .env                          # Puertos: 8085, 8086, 3005, 3006
├── docker-compose.yml            # 4 servicios
├── plan.md                       # Este archivo
├── .mis-proyectos/
│   └── environment.docker.md     # Config deploy
├── backend/
│   ├── src/index.ts             # API Express
│   ├── package.json
│   └── Dockerfile
└── frontend/
    ├── public/index.html         # Página HTML
    ├── package.json
    └── Dockerfile
```

## Notas
- Los puertos 8085/8086 y 3005/3006 fueron elegidos para evitar conflictos con otras aplicaciones
- El proyecto está configurado para usar el webhook-listener del proyecto padre
- Los nombres de contenedor empiezan con "testapp-" para ser reconocibles
