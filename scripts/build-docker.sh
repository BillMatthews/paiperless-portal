#!/bin/bash

# Build script for Voy Portal Docker container
# Usage: ./scripts/build-docker.sh [tag] [--push]

set -e

# Default values
IMAGE_NAME="voy-portal"
TAG=${1:-"latest"}
PUSH=${2:-""}

echo "🐳 Building Docker image: ${IMAGE_NAME}:${TAG}"

# Build the Docker image
docker build -t "${IMAGE_NAME}:${TAG}" .

echo "✅ Docker image built successfully: ${IMAGE_NAME}:${TAG}"

# Show image size
echo "📦 Image size:"
docker images "${IMAGE_NAME}:${TAG}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

# Push to registry if --push flag is provided
if [ "$PUSH" = "--push" ]; then
    echo "🚀 Pushing image to registry..."
    docker push "${IMAGE_NAME}:${TAG}"
    echo "✅ Image pushed successfully"
fi

echo "🎉 Build completed!"


