# Oracle — Übersicht Widget

Live MJPEG camera stream on your macOS desktop.

## Install

```bash
# Copy widget to Übersicht
cp -r oracle.widget ~/Library/Application\ Support/Übersicht/widgets/

# Create config
mkdir -p ~/.oracle
echo '{ "androidIP": "192.168.x.x", "port": 8080 }' > ~/.oracle/config.json
```

Replace `192.168.x.x` with your phone's IP (shown in the Oracle Android app).

## How it works

The widget reads `~/.oracle/config.json` every 30 seconds to pick up IP changes.  
It renders a single `<img src="http://IP:8080/stream" />` — the browser handles MJPEG natively.  
No JavaScript streaming loop. No WebSocket. No polling.

## Tailscale

Use the `100.x.x.x` Tailscale IP instead of the local WiFi IP. Works identically.
