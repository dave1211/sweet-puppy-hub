#!/usr/bin/env bash

set -e

echo "🚀 Tanner Terminal APK Builder"
echo "--------------------------------"

# Detect Docker
if command -v docker >/dev/null 2>&1; then
  if docker info >/dev/null 2>&1; then
    echo "✅ Docker detected — using Docker build (recommended)"
    bash ./build-docker.sh
    exit 0
  else
    echo "⚠️ Docker installed but not running"
  fi
fi

# Detect Java
if command -v java >/dev/null 2>&1; then
  if [ -n "$ANDROID_HOME" ] || [ -n "$ANDROID_SDK_ROOT" ]; then
    echo "⚠️ Falling back to local build (advanced)"
    bash ./build-local.sh
    exit 0
  fi
fi

echo ""
echo "❌ No valid build environment found"
echo ""
echo "👉 Option 1 (recommended): Install Docker"
echo "   https://docs.docker.com/get-docker/"
echo ""
echo "👉 Option 2: Install Java + Android SDK manually"
echo ""
exit 1
