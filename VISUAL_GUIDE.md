# ORACLE Streaming - Visual Guide

## What You'll See

### On Android Phone
```
┌─────────────────────────────────┐
│  ORACLE Stream                  │
├─────────────────────────────────┤
│                                 │
│  [Camera Preview]               │
│  (shows what's being captured)  │
│                                 │
├─────────────────────────────────┤
│ 📍 Local IP: 192.168.1.100     │
│ 🔌 Port: 8080                  │
│ 📸 Frames Sent: 1234            │
├─────────────────────────────────┤
│ ▶ START STREAMING               │
└─────────────────────────────────┘
```

**After tapping "START STREAMING":**
```
┌─────────────────────────────────┐
│ 🟢 STREAMING                    │
│ Broadcasting 1234 frames...     │
│                                 │
│ [Camera Preview continues]      │
│                                 │
├─────────────────────────────────┤
│ ⏹ STOP STREAMING                │
└─────────────────────────────────┘
```

### On Mac Desktop

**Before connecting:**
```
┌─────────────────────────────────────┐
│ 🎬 ORACLE                           │
│                                     │
│  [Black box with:]                  │
│  "Waiting for server..."            │
│                                     │
│                          ❌ (red dot)│
│                                     │
│           Server: ❌ Disconnected    │
└─────────────────────────────────────┘
```

**After starting server + Android app:**
```
┌─────────────────────────────────────┐
│ 🎬 ORACLE                           │
│                                     │
│  [Live camera feed from Android]    │
│  (updates ~10 times per second)     │
│                                     │
│                          🟢 (green dot)
│                                     │
│           Server: ✅ Connected      │
└─────────────────────────────────────┘
```

## Three Terminal Windows

### Terminal 1: Mac Server
```bash
$ cd /Users/jonathan/elco/oracle/bridge && npm start

📡 ORACLE Server running
🌍 Local IP: 192.168.1.80
📍 HTTP:  http://192.168.1.80:8080
📡 WebSocket: ws://localhost:8080

📱 Android app sends frames to: http://192.168.1.80:8080/frame
🖥️  Übersicht widgets connect to: ws://localhost:8080

Server ready. Waiting for connections...

✅ Übersicht client connected (total: 1)
📸 Received frame #1 (45KB)
📸 Received frame #2 (44KB)
...
```

### Terminal 2: Android App
```bash
$ cd /Users/jonathan/elco/oracle/mobile && npm start

✓ Using Expo SDK 54
✓ Starting Metro bundler

✓ All dependencies loaded

│ Android bundled 1234ms

› Using Expo Go
› Press a │ open Android
› Press s │ switch to development build
› Press w │ open web

[Expo server running on exp://192.168.1.100:8081]
[Device connects and app loads]

[User taps "Start Streaming"]

📡 ORACLE Frame Server
📍 Android IP: 192.168.1.100
🔌 Port: 8080
📺 Mac: WebSocket ws://192.168.1.100:8080
🎬 Starting camera capture...

📸 Frame 1 captured (45234 bytes)
📸 Frame 2 captured (44891 bytes)
...
```

### Terminal 3: Setup
```bash
$ bash setup.sh

🎬 ORACLE - Setting up streaming...

✅ Widget directory created
✅ Widget installed

🎬 Setup complete! Follow QUICK_START_STREAMING.md

Next steps:
1. Terminal 1: cd server && npm start
2. Terminal 2: cd mobile && npm start
3. Terminal 3: Done! Widget auto-loads

Then tap 'Start Streaming' on Android app.
```

## Network Diagram

```
                    🖥️ Mac (192.168.1.80)
                    ┌──────────────────────┐
                    │  Übersicht Widget    │
                    │  ┌────────────────┐  │
                    │  │  [Camera Feed] │  │
                    │  │                │  │
                    │  │   🎬 ORACLE    │  │
                    │  └────────────────┘  │
                    │                      │
                    │  ws://localhost:8080 │
                    └──────────┬───────────┘
                               │ WebSocket
                               │ (push frames)
                    ┌──────────▼───────────┐
                    │   Node.js Server     │
                    │   :8080              │
                    │                      │
                    │  • Receives frames   │
                    │  • Broadcasts        │
                    │                      │
                    └──────────┬───────────┘
                               │ HTTP POST
                               │ frame data
                    ┌──────────▼───────────┐
                    │  📱 Android Phone    │
                    │  (192.168.1.100)     │
                    │                      │
                    │  Expo App            │
                    │  ┌────────────────┐  │
                    │  │  Camera Module │  │
                    │  │                │  │
                    │  │  • Captures    │  │
                    │  │  • Compresses  │  │
                    │  │  • Sends       │  │
                    │  └────────────────┘  │
                    │                      │
                    │ ▶ Start Streaming    │
                    └──────────────────────┘

                    Same WiFi Network
```

## Data Format

### Frame Data (Android → Server)
```json
{
  "base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAA...",
  "timestamp": 1715443200123,
  "frameNumber": 42
}
```

### Broadcast Message (Server → Widget)
```json
{
  "type": "frame",
  "data": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAA...",
  "timestamp": 1715443200123
}
```

## Latency

- Android capture: ~50ms
- Network transmission: ~20-50ms
- Server processing: <1ms
- Widget rendering: ~16ms
- **Total: ~100-150ms (6-10 FPS subjective)**

Acceptable for proof-of-concept!

---

**Ready to start?** See [QUICK_START_STREAMING.md](QUICK_START_STREAMING.md)
