#!/bin/bash

# Development Docker script for Voy Portal
# Usage: ./scripts/docker-dev.sh [up|down|logs|shell]

set -e

COMMAND=${1:-"up"}

case $COMMAND in
    "up")
        echo "🚀 Starting development environment..."
        docker-compose -f docker-compose.dev.yml up --build
        ;;
    "down")
        echo "🛑 Stopping development environment..."
        docker-compose -f docker-compose.dev.yml down
        ;;
    "logs")
        echo "📋 Showing logs..."
        docker-compose -f docker-compose.dev.yml logs -f
        ;;
    "shell")
        echo "🐚 Opening shell in container..."
        docker-compose -f docker-compose.dev.yml exec voy-portal-dev sh
        ;;
    "clean")
        echo "🧹 Cleaning up containers and volumes..."
        docker-compose -f docker-compose.dev.yml down -v --remove-orphans
        docker system prune -f
        ;;
    *)
        echo "Usage: $0 [up|down|logs|shell|clean]"
        echo "  up     - Start development environment"
        echo "  down   - Stop development environment"
        echo "  logs   - Show container logs"
        echo "  shell  - Open shell in container"
        echo "  clean  - Clean up containers and volumes"
        exit 1
        ;;
esac


