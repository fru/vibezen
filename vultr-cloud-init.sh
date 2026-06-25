#!/bin/bash

# 1. Create the workspace directory
mkdir -p /app
cd /app

# 2. Generate your docker-compose file with Adminer included
cat << 'EOF' > docker-compose.yml
version: '3.8'

services:
  database:
    image: mcr.microsoft.com/mssql/server:2022-latest
    container_name: sql_server
    restart: always
    environment:
      - ACCEPT_EULA=Y
      - MSSQL_SA_PASSWORD=YourStrong@CloudPassword123!
    ports:
      - "1433:1433"
    volumes:
      - mssql_data:/var/opt/mssql

  backend:
    image: fru0/vibe-chat-app:latest
    container_name: csharp_backend
    restart: always
    ports:
      - "80:8080"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection=Server=database;Database=DemoDb;User Id=sa;Password=YourStrong@CloudPassword123!;TrustServerCertificate=True;
    depends_on:
      - database

  adminer:
    image: adminer:latest
    container_name: mssql_web_ui
    restart: always
    ports:
      - "8080:8080" # Maps public port 8080 to the Web Manager
    environment:
      - ADMINER_DEFAULT_SERVER=database
    depends_on:
      - database

  watchtower:
    image: containrrr/watchtower
    container_name: watchtower
    restart: always
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 300 --cleanup csharp_backend

volumes:
  mssql_data:
EOF

# 3. Launch the containers
docker compose up -d