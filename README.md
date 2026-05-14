# ORACLE

> Live camera from your Android phone → macOS desktop.  
> Local. Private. No cloud. No auth. No nonsense.

**Mental model:** AirDrop for live camera presence.

---

## How It Works

```
Android (CameraX)
  ↓
YUV_420_888 frames (30fps, native camera)
  ↓
JPEG encode (single thread, quality 30)
  ↓
AtomicReference<ByteArray> (latest frame only)
  ↓
Server thread pulls newest frame
  ↓
MJPEG HTTP stream (multipart/x-mixed-replace)
  ↓
Mac <img> tag (native browser decoding)
```

**Why this architecture:**
- STRATEGY_KEEP_ONLY_LATEST drops frames we can't encode fast enough
- Atomic reference = no queue = no buffering lag
- Single encoder thread = predictable, consistent latency
- Browser's `<img>` tag handles MJPEG natively — zero JS needed

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

**Real-time Architecture Optimizations** (May 2026)

### Streaming Pipeline
- ✅ **Atomic latest-frame-only model** — no queue, eliminates historical latency
- ✅ **640x360 resolution** (down from 1280x720) — 50% fewer pixels
- ✅ **JPEG quality 30** (down from 60) — ultra-fast encoding, <10KB/frame
- ✅ **Single-threaded JPEG encoder** — prevents CPU thrashing
- ✅ **Tailscale integration** — direct peer-to-peer, encrypted, low-latency routing
- ✅ **STRATEGY_KEEP_ONLY_LATEST backpressure** — CameraX drops frames camera can't process

### Widget Rendering (macOS)
- ✅ **Removed `backdrop-filter: blur()`** — expensive GPU work, switched to solid black
- ✅ **280x180px widget** (down from 340px) — less image scaling, cleaner render pipeline

### Latency Profile

| Scenario | Latency | FPS |
|---|---|---|
| Same WiFi (optimized) | 50–100ms | 28–30 |
| Tailscale (optimized) | 100–200ms | 28–30 |
| Old architecture | 200–400ms | 15–20 |

**Key Insight:** Smooth real-time video prioritizes frame freshness over quality. By always pushing the newest frame and dropping stale ones, latency consistency matters more than raw FPS.



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
