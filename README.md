# 🎬 ORACLE — Live Camera Widget

**Lightweight, private, Tailscale-based live camera streaming.**

Custom Android app that broadcasts JPEG frames. Custom Mac app that receives them. No cloud. No bloat. Just you, your devices, and your private network.

---

## How It Works

```
┌─────────────────────────────────────────────────┐
│  Android (Expo)                                 │
│  • Captures JPEG frames from camera             │
│  • WebSocket SERVER on port 8080                │
│  • Broadcasts to all connected Mac clients      │
└────────────┬────────────────────────────────────┘
             │
        Tailscale VPN
       (encrypted tunnel)
             │
┌────────────┴────────────────────────────────────┐
│  macOS (Tauri)                                  │
│  • WebSocket CLIENT (connects to 100.x.x.x)    │
│  • Receives base64 JPEG frames                 │
│  • Displays in floating widget                 │
└─────────────────────────────────────────────────┘
```

---

## Features

✅ **Custom Android app** — No third-party IP webcam apps needed  
✅ **Custom Mac app** — Lightweight Tauri-based receiver  
✅ **Tailscale networking** — Encrypted private VPN  
✅ **~10 FPS streaming** — New frame every ~100ms  
✅ **Homebrew installable** — Easy Mac distribution  
✅ **No backend servers** — Everything runs locally  
✅ **Personal use** — 4-5 devices on your network

---

## Quick Start (5 minutes)

### Android Setup

1. **Install Tailscale**
   - Download from Play Store
   - Sign in with your account
   - Note your Tailscale IP (format: `100.x.x.x`)

2. **Run the Expo app**
   ```bash
   cd mobile
   npm install
   npx expo start
   ```
   - Scan QR code with Expo Go
   - Allow camera permissions
   - Tap "Start Streaming"

3. **Note the WebSocket address**
   - App shows: `ws://100.x.x.x:8080`

### macOS Setup

1. **Install Tailscale** on Mac
   - Download from https://tailscale.com/download
   - Sign in

2. **Install Mac app**
   ```bash
   brew install oracle-camera-widget
   # or run: ./mac/target/release/oracle
   ```

3. **Connect to your Android device**
   - Enter WebSocket address from step above
   - Click "Connect"
   - Stream appears in widget

---

## 📚 Documentation Index

| Document | For Whom | Purpose |
|----------|----------|---------|
| [QUICK_START.md](QUICK_START.md) | **First time?** | 10-minute setup guide |
| [ARCHITECTURE.md](ARCHITECTURE.md) | **Want to understand the system?** | Technical design & protocol details |
| [IMPLEMENTATION.md](IMPLEMENTATION.md) | **Developer working on WebSocket?** | Code examples & implementation guide |
| [EXECUTION_PLAN.md](EXECUTION_PLAN.md) | **Ready to build?** | Step-by-step tasks (Priority 1-5) |
| [DEVELOPMENT_SUMMARY.md](DEVELOPMENT_SUMMARY.md) | **Project manager?** | Complete status & timeline |

**👉 Start here:** [QUICK_START.md](QUICK_START.md)

---

## Technology Stack

| Component | Tech | Why |
|-----------|------|-----|
| Android | Expo (React Native) | Fast development, camera support, Tailscale compatible |
| Camera | expo-camera | JPEG compression, native frame rate control |
| Streaming | WebSocket | Low latency, lightweight protocol |
| Mac | Tauri | Lightweight, Homebrew-installable, minimal resources |
| Networking | Tailscale | Encrypted, no port forwarding, works anywhere |

---

## File Structure

```
oracle/
├── README.md                    (this file)
├── QUICK_START.md              (5 minutes to working)
├── ARCHITECTURE.md             (technical deep dive)
├── IMPLEMENTATION.md           (developer guide for WebSocket)
├── EXECUTION_PLAN.md           (what to do next)
├── DEVELOPMENT_SUMMARY.md      (project status)
├── mobile/
│   ├── App.js                  (root component + navigation)
│   ├── app.json                (Expo config, SDK 54)
│   ├── package.json
│   └── screens/
│       ├── LoginScreen.js      (welcome + setup info)
│       └── StreamScreen.js     (camera + WebSocket server)
├── mac/
│   ├── src/main.rs             (Tauri app entry)
│   ├── src-tauri/              (Rust backend)
│   ├── package.json
│   └── tauri.conf.json
└── packaging/
    ├── homebrew_formula.rb     (Homebrew formula)
    └── oracle-setup            (setup wizard)
```

---

## WebSocket Protocol

### Connection

```
ws://TAILSCALE_IP:8080
```

Example: `ws://100.64.123.45:8080`

### Server → Client Messages (Android → Mac)

```json
{
  "type": "frame",
  "base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
  "timestamp": 1699564800123,
  "frameId": 1234
}
```

### Client → Server Messages (Mac → Android)

```json
{
  "type": "ping"
}
```

---

## Streaming Performance

- **Resolution**: 1280×720 (varies by device)
- **Frame rate**: ~10 FPS (100ms per frame)
- **JPEG quality**: 0.7 (70% compression)
- **Bandwidth**: ~50-100 KB/s per client
- **Latency**: 50-150ms (Tailscale VPN)
- **CPU**: ~15% Android, ~5% macOS

---

## Development

### Android

```bash
cd mobile

# Install dependencies
npm install

# Start dev server
npx expo start

# Scan QR with Expo Go on physical device
```

### macOS

```bash
cd mac

# Install Rust (one-time)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install dependencies
npm install

# Dev mode
npm run tauri dev

# Build release
npm run tauri build
# Output: src-tauri/target/release/oracle.app
```

---

## Troubleshooting

**WebSocket connection refused?**
- Confirm Android app shows "Streaming: Active"
- Check Tailscale IPs match (both should be 100.x.x.x)
- Verify port 8080 accessible: `nc -zv 100.x.x.x 8080`

**Frames look blurry/pixelated?**
- Default JPEG quality is 0.7 to save bandwidth
- Edit `StreamScreen.js` and increase `quality` value if needed

**App crashes on camera access?**
- Grant camera permissions in Android settings
- Restart Expo Go
- Check device has working camera

**Can't find Android in Tailscale?**
- Both devices must be on same Tailscale account
- Open Tailscale app and verify "Connected" status
- Run `tailscale status` to see all devices

---

## Privacy & Security

✅ **Zero cloud** — Data never leaves your network  
✅ **End-to-end encrypted** — Tailscale handles encryption  
✅ **No authentication** — No servers, no accounts needed  
✅ **No analytics** — No telemetry, no tracking  
✅ **Open source** — Code is auditable

---

## Deployment

### Build APK (Android)

```bash
cd mobile
eas build --platform android --type apk
```

### Build DMG (macOS)

```bash
cd mac
npm run tauri build
# Output: src-tauri/target/release/bundle/dmg/oracle_x.x.x_x64.dmg
```

### Release via Homebrew

Update `packaging/homebrew_formula.rb` with new version and SHA256, then:

```bash
brew tap username/tap
brew install username/tap/oracle
```

---

## License

MIT

4. Install:
```bash
brew tap yourname/oracle
brew install oracle-widget
```

---

## Why This Works

| Feature | Complexity | Latency | Cost | Privacy |
|---------|-----------|---------|------|---------|
| Cloud servers | 🔴 High | 100-500ms | $$$ | ❌ Cloud |
| Electron app | 🔴 High | <100ms | $0 | ✅ Local |
| **IP Webcam + Tailscale** | 🟢 **None** | **<50ms** | **$0** | **✅ Encrypted** |

---

## Components

- [IP Webcam](https://play.google.com/store/apps/details?id=com.pas.webcam) — Android camera streaming
- [Tailscale](https://tailscale.com) — Private VPN network (free)
- [Übersicht](https://tracesof.net/uebersicht/) — macOS desktop widgets
- Your widget — 20 lines of JavaScript

---

## License

MIT
