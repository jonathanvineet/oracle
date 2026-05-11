#!/usr/bin/env bash
set -euo pipefail

# Simple installer script for macOS (downloads latest DMG and mounts it)
DMG_URL="$1"
if [[ -z "$DMG_URL" ]]; then
  echo "Usage: ./install.sh <dmg-url>"
  exit 1
fi
TMPDIR=$(mktemp -d)
DMG="$TMPDIR/app.dmg"
curl -L "$DMG_URL" -o "$DMG"
hdiutil attach "$DMG" -nobrowse -quiet
echo "Mounted. Please drag the app to /Applications or run installer manually."
