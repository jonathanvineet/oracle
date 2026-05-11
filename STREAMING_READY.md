# ✅ ORACLE Streaming - Ready to Test

## What Changed

You were right - I was jumping ahead into packaging/Tauri/Homebrew before proving the core **streaming works**.

I've refocused to **Stage 1 only**: Android captures camera → macOS widget displays live stream.

## The New Architecture

**Much simpler:**

```
Android Expo App
    ↓ (captures frames)
    ↓
    ├─ Sends JPEG (base64) via HTTP POST
    ↓
Mac Node.js Server (8080)
    ├─ Receives frames
    ├─ Stores latest frame
    ├─ Broadcasts to all connected clients
    ↓
macOS Übersicht Widget
    ├─ Connects via WebSocket (ws://localhost:8080)
    ├─ Receives frame updates
    ├─ Displays live stream
    ↓
Desktop Widget (top-right corner)
```

## Files Created/Modified

### Server (Node.js - Mac side)
- **[server/server.js](server/server.js)** - HTTP + WebSocket server that:
  - Listens on port 8080
  - Receives JPEG frames from Android
  - Broadcasts to Übersicht widgets
  
- **[server/package.json](server/package.json)** - Dependencies installed

### Android (Expo side)
- **[mobile/screens/StreamScreen.js](mobile/screens/StreamScreen.js)** - Updated to:
  - Capture camera frames every 100ms
  - Send frames to Mac server via HTTP POST
  - Show Android IP for user reference
  
- **[mobile/package.json](mobile/package.json)** - Fixed (removed broken dependencies)

### Widget (macOS side)
- **[widget/simple.jsx](widget/simple.jsx)** - Übersicht widget that:
  - Connects to local WebSocket server
  - Receives frame updates
  - Displays live stream on desktop
  - Shows connection status indicator

### Documentation
- **[QUICK_START_STREAMING.md](QUICK_START_STREAMING.md)** - Three-terminal quick start

## How to Test

### Terminal 1 (Mac Server)
```bash
cd /Users/jonathan/elco/oracle/bridge
npm start
```
Expected: `📡 ORACLE Server running` on port 8080

### Terminal 2 (Android App)
```bash
cd /Users/jonathan/elco/oracle/mobile
npm start
# Press 'a' or scan QR code to open on Android device
```

### Terminal 3 (Install Widget)
```bash
mkdir -p ~/Library/Application\ Support/Übersicht/widgets/oracle.widget
cp /Users/jonathan/elco/oracle/widget/simple.jsx ~/Library/Application\ Support/Übersicht/widgets/oracle.widget/index.jsx
# Reload Übersicht: ⌘+R
```

### On Android
1. Tap "Stream" tab
2. Tap "▶ Start Streaming"
3. Watch console show frame count: 1, 2, 3...

### On Mac
- Widget appears top-right with live camera feed
- Green pulsing dot = connected

## Why This Approach

✅ **Works on local WiFi** - No Tailscale/VPN complexity yet  
✅ **Simple architecture** - Android → Server → Widget (3 pieces)  
✅ **Testable immediately** - No build/packaging/signing needed  
✅ **Minimal dependencies** - Expo built-in features + ws (WebSocket)  
✅ **Easy to debug** - Clear HTTP/WS messages, console logs  

## What's NOT Done Yet (And Shouldn't Be)

❌ Tauri macOS app replacement  
❌ Rust backend  
❌ Homebrew formula  
❌ DMG packaging  
❌ App signing/notarization  
❌ Remote access (Tailscale can be added later)  
❌ Recording/controls  
❌ Reconnect logic  

**These are Stage 2 & 3 work. For now: just stream.**

## Next Steps

Once you confirm this works:

1. **Stage 2**: Add UI controls (stop, quality slider, record button)
2. **Stage 3**: Replace Übersicht with native Tauri app
3. **Stage 4**: Add Homebrew packaging

For now: **Get frames flowing.** 🎬

---

## Troubleshooting Quick Links

- Server won't start → Check port 8080 isn't in use
- Widget won't connect → Make sure server is running first
- Frames not sending → Check Android IP in server console
- Widget still shows "Waiting..." → Reload with ⌘+R
