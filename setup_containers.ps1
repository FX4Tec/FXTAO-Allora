# Stop any running containers
docker-compose down

# Build Backend Image
Write-Host "Building Backend Image..."
docker build -t fxtao_api ./backend

# Build Frontend Image (This is usually the heavy one)
Write-Host "Building Frontend Image..."
docker build -t fxtao_web .

# Start Services using the built images
Write-Host "Starting Services..."
docker-compose up -d
