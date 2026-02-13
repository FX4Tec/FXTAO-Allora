Remove-Item -Path "docker-compose.yml", "Dockerfile", "nginx.conf", ".dockerignore" -ErrorAction SilentlyContinue
Remove-Item -Path "backend/Dockerfile", "backend/.dockerignore" -ErrorAction SilentlyContinue
