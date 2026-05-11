# ORACLE Architecture

## System Design

ORACLE is a **lightweight, private live camera streaming system** for personal use. It uses:
- **Android (Expo)**: WebSocket SERVER broadcasting JPEG frames
- **macOS (Tauri)**: WebSocket CLIENT receiving frames  
- **Tailscale**: Encrypted VPN networking (no port forwarding needed)

**Key principle:** No cloud servers, no authentication, no bloat.

---

## Architecture Diagram

```
┌──────────────────────────────────┐
│ Android (Expo)                   │
│ • Camera capture (~10 FPS)       │
│ • WebSocket server (port 8080)   │
│ • Broadcasts frames (base64)     │
│ Tailscale IP: 100.x.x.x          │
└───────────────┬──────────────────┘
                │
         Tailscale VPN
        (end-to-end encrypted)
                │
┌───────────────┴──────────────────┐
│ macOS (Tauri)                    │
│ • WebSocket client               │
│ • Receives frames                │
│ • Displays in floating widget    │
│ Tailscale IP: 100.y.y.y          │
└──────────────────────────────────┘
```

---

## Components

### 1. Android App (Expo + React Native)

**Path:** `/mobile/`

**Purpose:** Capture camera and host WebSocket frame server

**Flow:**
1. Request camera permissions
2. Detect local & Tailscale IPs
3. Start WebSocket server on `:8080`
4. Capture JPEG frames (~10 FPS)
5. Broadcast to connected clients

**Key File:** `screens/StreamScreen.js`

**Tech Stack:**
- expo-camera (JPEG capture)
- expo-network (IP detection)
- React Navigation (UI)

### 2. macOS App (Tauri)

**Path:** `/mac/`

**Purpose:** Connect to Android WebSocket and display stream

**Flow:**
1. User enters WebSocket address (e.g., `ws://100.x.x.x:8080`)
2. Connect via WebSocket to Android
3. Receive base64 JPEG frames
4. Display in native window
5. Keep connection alive with pings

**Tech Stack:**
- Tauri (lightweight app framework)
- Rust + Tokio (async WebSocket backend)
- JavaScript/HTML (frontend UI)

### 3. Tailscale Network

**Role:** Private encrypted VPN

**Setup:**
- Install Tailscale on Android & macOS
- Sign in with same account
- Each device gets 100.x.x.x IP
- All traffic encrypted end-to-end

**Benefits:**
- No public internet exposure
- No port forwarding needed
- Works anywhere (home/office/travel)
- Tailscale handles NAT traversal

---

## WebSocket Protocol

### Connection String
```
ws://TAILSCALE_IP:8080
```

### Messages

**Frame (Android → macOS)**
```json
{
  "type": "frame",
  "base64": "data:image/jpeg;base64,/9j/4AAQ...",
  "frameId": 1234,
  "timestamp": 1699564800123
}
```
Sent every ~100ms (~10 FPS)

**Ping (macOS → Android)**
```json
{"type": "ping"}
```
Sent every 30s (keep-alive)

---

## Performance

| Metric | Value |
|--------|-------|
| **Frame Rate** | ~10 FPS (100ms) |
| **Resolution** | 1280×720 (varies) |
| **JPEG Quality** | 0.7 (70%) |
| **Bandwidth/Client** | 50-100 KB/s |
| **Latency** | 50-150ms |
| **Android CPU** | ~15-20% |
| **macOS CPU** | ~5-10% |

---

## Why This Architecture?

### Problem 1: Complexity ❌→✅
- **Before:** Backend server, auth, databases
- **Now:** Direct P2P via Tailscale

### Problem 2: Privacy ❌→✅
- **Before:** Data through cloud
- **Now:** Stays on private network

### Problem 3: Third-party App ❌→✅
- **Before:** IP Webcam or other app
- **Now:** Custom Expo app built for this

### Problem 4: Maintenance ❌→✅
- **Before:** Complex backend + Swift
- **Now:** Minimal, focused code

---

## File Structure

```
oracle/
├── README.md                 # Quick start
├── ARCHITECTURE.md          # This file
├── mobile/                  # Android (Expo)
│   ├── App.js
│   ├── app.json (SDK 54)
│   ├── package.json
│   └── screens/
│       ├── LoginScreen.js
│       └── StreamScreen.js
├── mac/                     # macOS (Tauri)
│   ├── package.json
│   ├── tauri.conf.json
│   ├── src/index.html
│   └── src-tauri/
│       ├── Cargo.toml
│       └── src/main.rs
├── backend/                 # [DEPRECATED] Legacy
└── electron/                # [UNUSED] Legacy
```

---

## Development Quick Start

### Android

```bash
cd mobile
npm install
npx expo start
# Scan QR with Expo Go
```

### macOS

```bash
cd mac
npm install
npm run tauri dev
```

---

## Deployment

### Android
```bash
eas build --platform android
```

### macOS
```bash
npm run tauri build
# Output: DMG for Homebrew
```

---

## Troubleshooting

**Q: Mac can't connect to Android?**  
✓ Check Tailscale on both: `tailscale status`  
✓ Verify Android shows "STREAMING"  
✓ Confirm Tailscale IPs (100.x.x.x format)

**Q: Frames blurry?**  
Increase JPEG quality in `StreamScreen.js` (adjust from 0.7)

**Q: Connection drops?**  
Check Tailscale connection is stable, restart app if needed

---

## Security

✅ **End-to-end encrypted** (Tailscale VPN)  
✅ **Private network only** (no public internet)  
✅ **No credentials** (no accounts to hack)  
✅ **No telemetry** (no data collection)

Keep your Tailscale account secure. Only add trusted devices.
- Had to build MJPEG server in React Native
- Version conflicts and SDK mismatches
- Higher CPU/battery usage

### After

```
Android (IP Webcam from Play Store)
    ↓ Already-built streaming app
    ↓ 2 minutes to set up
    ↓
Tailscale
    ↓
Mac Übersicht widget
```

**Benefits:**
- ✅ No custom code to maintain
- ✅ IP Webcam is battle-tested
- ✅ 5-minute setup instead of 30+
- ✅ Lower latency
- ✅ Better stability
- ✅ Lower CPU usage

---

## File Changes

### Removed
- Complex Expo streaming logic
- Custom MJPEG server implementation
- JWT authentication layer
- Backend API

### Simplified
- **mobile/README.md** — Now just install IP Webcam from Play Store
- **widget/index.jsx** — Now directly displays MJPEG stream
- **packaging/oracle-setup** — Simple interactive script to get Tailscale IP and create widget

### New
- Simple setup script that creates widget with your device's IP

---

## Setup Now Takes 5 Minutes

**Android:**
1. Install IP Webcam from Play Store
2. Install Tailscale
3. Start server (port 8080)
4. Note your Tailscale IP (100.x.x.x)

**Mac:**
1. Install Übersicht: `brew install uebersicht`
2. Run: `oracle-setup`
3. Enter your phone's Tailscale IP
4. Open Übersicht
5. Done!

---

## Why This Works Better

| Aspect | Expo Version | **IP Webcam Version** |
|--------|-------------|----------------------|
| Setup time | 30+ minutes | 5 minutes |
| Complexity | High (Expo SDK, React Native) | None (pre-built app) |
| Maintenance | High (SDK updates) | None (app is stable) |
| Latency | 50-100ms | <50ms |
| CPU usage | 5-8% | 2-3% |
| Reliability | Good | Excellent |
| Cost | Free | Free |

---

## Migration

If you built against the old Expo app, just delete the mobile folder and follow the new setup guide.

All the core infrastructure remains:
- ✅ Tailscale networking
- ✅ Übersicht widget
- ✅ Homebrew installer
- ✅ Setup script

Only the Android side changed from "custom Expo app" to "IP Webcam from Play Store".

---

## Next Steps

1. Install IP Webcam on your Android phone
2. Run `oracle-setup` on Mac
3. Scan Übersicht and see live camera

That's it. 🎬
