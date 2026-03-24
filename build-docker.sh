#!/usr/bin/env bash

set -e

echo "🐳 Tanner Terminal Docker APK Build"
echo "-----------------------------------"

# Check Docker
if ! command -v docker >/dev/null 2>&1; then
  echo "❌ Docker is not installed"
  echo "👉 Install: https://docs.docker.com/get-docker/"
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker is not running"
  echo "👉 Start Docker Desktop and try again"
  exit 1
fi

echo "✅ Docker OK"

# Run build
echo "🔨 Building APK using Docker..."
docker compose -f docker-compose.android.yml build

echo ""
echo "📦 Searching for APK..."

APK_PATH=$(find . -name "*.apk" | head -n 1)

if [ -z "$APK_PATH" ]; then
  echo "❌ APK not found"
  echo "👉 Check Docker logs for errors"
  exit 1
fi

echo ""
echo "🎉 BUILD SUCCESS"
echo "-----------------------------------"
echo "📱 APK Location:"
echo "$APK_PATH"
echo ""
echo "👉 Transfer to your tablet and install"
echo ""
