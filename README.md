# ORACLE

> Live camera from your Android phone → macOS desktop.  
> Local. Private. No cloud. No auth. No nonsense.

**Mental model:** AirDrop for live camera presence.

---

## How It Works

```
Android (CameraX) ──MJPEG──▶ Mac <img> tag
                    direct TCP
                   WiFi / Tailscale
```

The Android app runs an embedded MJPEG HTTP server. Your Mac (widget or app) opens it like any image URL. The browser handles the streaming protocol natively — no WebSocket, no base64, no relay server.

---

## Structure

```
oracle/
├── android/      Native Kotlin app — CameraX + MJPEG server
├── mac/          Tauri macOS app — floating MJPEG viewer
├── widget/       Übersicht widget — desktop live view
│   └── oracle.widget/index.jsx
└── config/
    └── oracle.example.json
```

---

## Quick Start

### 1. Android app

Open `android/` in Android Studio and run on your phone.

- Tap **Start Streaming**
- Note the stream URL shown on screen: `http://192.168.x.x:8080/stream`
- Test immediately: open that URL in Chrome on your Mac → live video

### 2. Übersicht widget (fastest path)

```bash
# Install Übersicht if you haven't
brew install --cask ubersicht

# Copy the widget
cp -r widget/oracle.widget ~/Library/Application\ Support/Übersicht/widgets/

# Create config
mkdir -p ~/.oracle
cp config/oracle.example.json ~/.oracle/config.json

# Edit config — put your phone's IP
nano ~/.oracle/config.json
# { "androidIP": "192.168.x.x", "port": 8080 }
```

Widget appears on your desktop. Done.

### 3. Mac app (optional — floating window)

```bash
cd mac
cargo tauri dev        # development
cargo tauri build      # build .app
```

Enter your phone's IP in the app and click Connect.

---

## Networking

### Same WiFi (easiest)
Phone and Mac on same network. Use the IP shown in the Android app.

### Tailscale (across networks)
1. Install Tailscale on both phone and Mac
2. Use the Tailscale IP (starts with `100.`) in your config
3. Works exactly the same — Tailscale handles the routing

No ports to forward. No router config.

---

## Performance

| Metric | Value |
|---|---|
| Latency (same WiFi) | 100–250ms |
| Latency (Tailscale) | 150–400ms |
| FPS | 15–20 FPS |
| Frame size | ~50–80KB JPEG (720p, q=60) |
| Bandwidth | ~8–12 Mbps |
| Mac CPU (widget) | <1% |
| Mac Memory (widget) | ~0MB extra |
| Mac Memory (Tauri app) | ~40MB |

---

## Troubleshooting

**Stream URL shows `?` for IP**  
→ Check WiFi is connected on the phone. Restart the app.

**Mac can't reach the stream**  
→ Confirm phone and Mac are on the same WiFi. Check Android firewall settings. Try the URL in Chrome first.

**Low FPS**  
→ Lower `JPEG_QUALITY` or `TARGET_HEIGHT` in `android/.../StreamConfig.kt`

**Tailscale not working**  
→ Make sure both devices appear as "connected" in the Tailscale app.

---

## Configuration

`android/.../StreamConfig.kt` — port, JPEG quality, resolution  
`~/.oracle/config.json` — Android IP (read by widget and Mac app)

---

## Roadmap

- [ ] mDNS auto-discovery (no manual IP entry)
- [ ] WebSocket binary frames (sub-100ms latency if needed)
- [ ] `brew install oracle` formula
- [ ] macOS WidgetKit native widget (requires Swift + Developer account)
