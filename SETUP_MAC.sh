#!/bin/bash

# ORACLE - macOS Übersicht Setup
# This script installs the Übersicht widget for receiving camera frames

echo "🎬 ORACLE - macOS Widget Setup"
echo "================================\n"

# Check if Übersicht is installed
if [ ! -d "$HOME/Library/Application Support/Übersicht" ]; then
  echo "❌ Übersicht not installed"
  echo "\nInstall Übersicht from: https://tracesof.net/uebersicht/"
  echo "Then run this script again."
  exit 1
fi

echo "✅ Übersicht found"

# Create widget directory
WIDGET_DIR="$HOME/Library/Application Support/Übersicht/widgets/oracle.widget"
mkdir -p "$WIDGET_DIR"
echo "✅ Created widget directory: $WIDGET_DIR"

# Copy widget file
cp widget/simple.jsx "$WIDGET_DIR/index.jsx"
echo "✅ Installed widget: index.jsx"

# Create README for the widget
cat > "$WIDGET_DIR/README.md" << 'EOF'
# ORACLE Widget

## Setup

1. Install the ORACLE Expo app on your Android phone
2. Connect to same WiFi network as your Mac
3. In Expo app, tap "Start Streaming"
4. Note the IP address shown (e.g., 192.168.1.100)
5. Edit `index.jsx` and update `ANDROID_IP` variable
6. Reload Übersicht (⌘+R)
7. You should see the camera stream!

## Troubleshooting

**Widget shows "Connecting...":**
- Make sure Android phone IP is correct in `index.jsx`
- Ensure Android app is running and "Start Streaming" button was pressed
- Check that both devices are on same WiFi network
- Look at Android app logs to confirm WebSocket server is running

**No frames appearing:**
- Click "Start Streaming" on Android app again
- Check Network settings - Android must be on local WiFi (not hotspot)
- Verify firewall allows port 8080

## Mac setup (if on same network):
```
# Find your Android's local IP
arp -a | grep -i android
# Or check in Expo app - it shows the IP
```
EOF

echo "✅ Created README.md"

echo "\n✨ Setup Complete!"
echo "\nNext steps:"
echo "1. Update ANDROID_IP in: $WIDGET_DIR/index.jsx"
echo "2. Reload Übersicht with ⌘+R"
echo "3. Start camera streaming on Android"
echo "\n📍 To find your Android IP:"
echo "   - Look at Android app after tapping 'Start Streaming'"
echo "   - It will show: 📍 Android IP: 192.168.x.x"
