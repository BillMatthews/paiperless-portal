# Docker Setup for Voy Portal

This document explains how to run the Voy Portal application using Docker.

## Prerequisites

- Docker and Docker Compose installed on your system
- Git (to clone the repository)

## Quick Start

### Development Environment

1. **Start the development environment:**
   ```bash
   npm run docker:dev
   # or
   ./scripts/docker-dev.sh up
   ```

2. **Access the application:**
   - Open your browser and go to `http://localhost:3000`

3. **Stop the development environment:**
   ```bash
   npm run docker:dev:down
   # or
   ./scripts/docker-dev.sh down
   ```

### Production Environment

1. **Build and start the production environment:**
   ```bash
   npm run docker:prod
   # or
   docker-compose up --build
   ```

2. **Access the application:**
   - Open your browser and go to `http://localhost:3000`

3. **Stop the production environment:**
   ```bash
   npm run docker:prod:down
   # or
   docker-compose down
   ```

## Available Scripts

### Development Scripts

- `npm run docker:dev` - Start development environment
- `npm run docker:dev:down` - Stop development environment
- `npm run docker:dev:logs` - View container logs
- `npm run docker:dev:shell` - Open shell in container
- `npm run docker:dev:clean` - Clean up containers and volumes

### Production Scripts

- `npm run docker:prod` - Start production environment
- `npm run docker:prod:down` - Stop production environment

### Build Scripts

- `npm run docker:build` - Build Docker image
- `./scripts/build-docker.sh [tag] [--push]` - Build and optionally push image

## Docker Images

### Building Custom Images

```bash
# Build with default tag (latest)
./scripts/build-docker.sh

# Build with custom tag
./scripts/build-docker.sh v1.0.0

# Build and push to registry
./scripts/build-docker.sh v1.0.0 --push
```

### Image Details

- **Base Image:** Node.js 20 Alpine
- **Multi-stage Build:** Yes (deps, builder, runner)
- **Output:** Standalone Next.js application
- **User:** Non-root (nextjs:nodejs)
- **Port:** 3000
- **Health Check:** Built-in endpoint at `/api/health`

## Environment Variables

The application supports the following environment variables:

- `NODE_ENV` - Node environment (development/production)
- `NEXT_TELEMETRY_DISABLED` - Disable Next.js telemetry
- `PORT` - Port to run the application on (default: 3000)
- `HOSTNAME` - Hostname to bind to (default: 0.0.0.0)

## File Structure

```
├── Dockerfile                 # Production Docker image
├── docker-compose.yml        # Production compose file
├── docker-compose.dev.yml    # Development compose file
├── .dockerignore             # Docker ignore file
├── scripts/
│   ├── build-docker.sh       # Build script
│   └── docker-dev.sh         # Development script
└── src/app/api/health/       # Health check endpoint
```

## Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # Check what's using port 3000
   lsof -i :3000
   
   # Kill the process or change the port in docker-compose.yml
   ```

2. **Permission issues on Windows:**
   ```bash
   # Make sure scripts are executable
   chmod +x scripts/*.sh
   ```

3. **Build failures:**
   ```bash
   # Clean Docker cache
   docker system prune -a
   
   # Rebuild without cache
   docker-compose build --no-cache
   ```

### Logs and Debugging

```bash
# View container logs
npm run docker:dev:logs

# Open shell in container
npm run docker:dev:shell

# Check container status
docker ps
```

## Security Considerations

- The application runs as a non-root user (`nextjs`)
- Only necessary files are copied to the production image
- Environment variables should be properly configured
- Health checks are enabled for container orchestration

## Performance Optimization

- Multi-stage build reduces final image size
- Standalone output includes only necessary files
- Alpine Linux base image for smaller footprint
- Proper layer caching for faster rebuilds


