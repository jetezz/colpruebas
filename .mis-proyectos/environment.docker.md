---
schema_version: 1
docker_project_path: "C:/Users/cuadr/Desktop/colpruebas
compose_file: "docker-compose.yml"
env_file_prod: ".env"
env_file_test: ".env"
project_name_prod: "colpruebas"
project_name_test: "colpruebas"
deploy_branch_prod: "main"
deploy_branch_test: "main"
prod_services: "frontend-prod,api-prod"
test_services: "frontend-test,api-test"
prod_port: 8085
test_port: 8086
---

## colpruebas - Proyecto de Prueba

Proyecto para validar los sistemas de deploy y tunnel.

### Servicios:
- **Production**: frontend-prod (8085), api-prod (3005)
- **Test**: frontend-test (8086), api-test (3006)

### Variables de entorno:
- `APP_NAME=colpruebas`
- `ENVIRONMENT=production` / `ENVIRONMENT=test`


### Contenedores:
- colpruebas-frontend-prod
- colpruebas-api-prod  
- colpruebas-frontend-test
- colpruebas-api-test
