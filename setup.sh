#!/bin/bash

# ORACLE - One-Click Setup
# Run this to set up everything

echo "🎬 ORACLE - Setting up streaming..."
echo ""

# Check if Übersicht is installed
if [ ! -d "$HOME/Library/Application Support/Übersicht" ]; then
  echo "⚠️  Übersicht not found."
  echo "Install from: https://tracesof.net/uebersicht/"
  echo "Or: brew install --cask ubersicht"
  echo ""
fi

# Create widget directory
WIDGET_DIR="$HOME/Library/Application Support/Übersicht/widgets/oracle.widget"
mkdir -p "$WIDGET_DIR"
echo "✅ Widget directory created"

# Copy widget
if [ -f "widget/simple.jsx" ]; then
  cp widget/simple.jsx "$WIDGET_DIR/index.jsx"
  echo "✅ Widget installed"
else
  echo "❌ widget/simple.jsx not found"
  exit 1
fi

echo ""
echo "🎬 Setup complete! Follow QUICK_START_STREAMING.md"
echo ""
echo "Next steps:"
echo "1. Terminal 1: cd server && npm start"
echo "2. Terminal 2: cd mobile && npm start"
echo "3. Terminal 3: Done! Widget auto-loads"
echo ""
echo "Then tap 'Start Streaming' on Android app."
