---
schema_version: 1
docker_project_path: "C:/Users/cuadr/Desktop/mis-proyectos/workspace-test/projects/a7cb866f-ddba-4d47-9982-f73464cb495f"
compose_file: "docker-compose.yml"
env_file_prod: ".env"
env_file_test: ".env"
project_name_prod: "testapp-prod"
project_name_test: "testapp-test"
deploy_branch_prod: "main"
deploy_branch_test: "main"
prod_services: "frontend-prod,api-prod"
test_services: "frontend-test,api-test"
prod_port: 8085
test_port: 8086
---

## TestApp - Proyecto de Prueba

Este proyecto es de prueba para validar los sistemas de deploy y tunnel.

### Servicios:
- **Production**: frontend-prod (8085), api-prod (3005)
- **Test**: frontend-test (8086), api-test (3006)

### Contenedores:
- testapp-frontend-prod
- testapp-api-prod  
- testapp-frontend-test
- testapp-api-test
