#!/usr/bin/env bash

set -e

echo "⚙️ Local APK Build (Advanced)"
echo "--------------------------------"

# Check Java
if ! command -v java >/dev/null 2>&1; then
  echo "❌ Java not found"
  exit 1
fi

# Check Android SDK
if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
  echo "❌ Android SDK not configured"
  exit 1
fi

echo "✅ Java + SDK detected"

# Build APK
./gradlew assembleDebug

APK_PATH=$(find . -name "*.apk" | head -n 1)

echo ""
echo "🎉 BUILD SUCCESS"
echo "📱 APK Location:"
echo "$APK_PATH"
