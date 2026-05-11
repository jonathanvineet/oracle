# ⚡ ORACLE Quick Start (10 minutes)

## What You'll Get

Live Android camera stream on your Mac desktop. Peer-to-peer via Tailscale (no servers).

```
Android phone (Expo app)
    ↓ WebSocket server
    ↓
Tailscale (encrypted VPN)
    ↓
Mac app (Tauri)
```

---

## Android Setup (3 minutes)

### 1. Install Two Apps

From Google Play Store:
- **[Tailscale](https://play.google.com/store/apps/details?id=com.tailscale.ipn)**
- **[Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)** (for development)

### 2. Connect to Tailscale

1. Open Tailscale app
2. Sign in with your account
3. Look for your device IP (format: `100.x.x.x`)
4. **Note this IP** - you'll need it for Mac

### 3. Run the Expo App

```bash
cd mobile
npm install
npx expo start
```

You'll see a QR code. Scan it with Expo Go on your phone.

### 4. Start Streaming

In the Expo app:
1. Grant camera permissions
2. Tap "Start Streaming"
3. You should see: "WebSocket server hosting on port 8080"
4. App displays your WebSocket address: `ws://100.x.x.x:8080`

**Keep this address - you'll enter it on Mac.**

---

## Mac Setup (5 minutes)

### 1. Install Tauri App

Option A - Build from source:
```bash
cd mac
npm install
npm run tauri build
# Output: src-tauri/target/release/bundle/dmg/oracle_x.x.x_x64.dmg
# Install the DMG file
```

Option B - Install via Homebrew (when released):
```bash
brew install oracle-camera-widget
```

### 2. Connect to Android

1. Open ORACLE app on Mac
2. Enter the WebSocket address from Android: `ws://100.x.x.x:8080`
3. Click "Connect"
4. **Live stream appears!**

---

## Troubleshooting

### Can't connect on Mac

**Checklist:**
- ✓ Tailscale is running on both devices
- ✓ Android app shows "STREAMING: Active"
- ✓ IP address is in `100.x.x.x` format (not `192.168.x.x`)
- ✓ Port 8080 is accessible: `nc -zv 100.x.x.x 8080`

### Android app crashes

- Grant camera permissions
- Restart Expo Go
- Check device has working camera

### Frames are blurry

Edit `mobile/screens/StreamScreen.js`:
- Find `quality: 0.7`
- Increase to `0.8` or `0.9` for higher quality
- Re-run `npx expo start`

### Connection drops

- Check Tailscale is still connected
- Restart both apps
- Or try reconnecting on Mac

---

## Next Steps

- [ ] Build Android APK: `eas build --platform android`
- [ ] Build macOS DMG: `npm run tauri build` in `/mac/`
- [ ] Create Homebrew formula for distribution
- [ ] Test with multiple devices

---

## That's It!
- ✅ Encrypted via Tailscale
- ✅ Zero servers
- ✅ Minimal CPU usage

**Enjoy!** 🎬
