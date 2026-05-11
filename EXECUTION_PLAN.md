# 🎯 ORACLE - Execution Plan

**Current Status:** Architecture designed ✅ | UI built ✅ | WebSocket implementation needed ⏳

This document tells you exactly what to do to complete ORACLE.

---

## What's Done (Don't Re-Do This)

✅ Expo app structure (LoginScreen, StreamScreen)  
✅ Tauri macOS app (client-side complete)  
✅ All documentation  
✅ UI/UX for both platforms  
✅ Frame capture logic (placeholder)  
✅ Network connectivity planning  

---

## What's Left (Do This)

### PRIORITY 1: Implement WebSocket Server (3 hours)

**Location:** `/mobile/screens/StreamScreen.js`

**Current State:** Frame capture code is there, but NOT sending to WebSocket

**What You Need to Do:**

1. **Install the native module:**
   ```bash
   cd mobile
   npm install react-native-tcp-socket
   npx expo install react-native-tcp-socket
   ```

2. **Update StreamScreen.js** - Replace placeholder server code:

   Look for this in `startWebSocketServer()`:
   ```javascript
   // Currently this just shows an Alert
   ```

   Replace with actual WebSocket server that:
   - Uses `react-native-tcp-socket`
   - Listens on port 8080
   - Accepts client connections
   - Broadcasts frames from `captureAndStream()`

3. **Reference:** See IMPLEMENTATION.md → "Option 1: React Native TCP Socket"

4. **Test It:**
   ```bash
   npx expo start
   # Scan QR on physical Android device
   # Tap "Start Streaming"
   # Should see frames being sent in logs
   ```

**Expected Time:** 2-3 hours  
**Difficulty:** Medium (native module + TCP/WebSocket knowledge)  
**Blockers:** None - all dependencies ready

---

### PRIORITY 2: Test End-to-End (1 hour)

**Setup:**
```bash
# Terminal 1: Android dev
cd mobile
npx expo start
# Scan QR with Expo Go, tap Start Streaming

# Terminal 2 (new terminal): macOS dev
cd mac
npm run tauri dev
# macOS app opens

# In macOS app: Enter ws://100.x.x.x:8080 (from Android screen)
# Click "Connect"
# Verify: Live frames appear on Mac
```

**What to verify:**
- [ ] Android shows "STREAMING: Active"
- [ ] macOS app connects successfully
- [ ] Frames appear on macOS (may be slow/frozen at first, that's OK)
- [ ] No crashes or errors
- [ ] Connection stays stable for 30+ seconds

**If it works:** Continue to Priority 3  
**If it fails:** Debug using terminal logs (see IMPLEMENTATION.md → Debugging)

---

### PRIORITY 3: Improve IP Detection (1 hour)

**Location:** `mobile/screens/StreamScreen.js` → `detectIPs()` function

**Current:** Shows placeholders like "100.x.x.x (check Tailscale app)"

**What to Do:**

1. Install package:
   ```bash
   cd mobile
   npm install react-native-network-info
   npx expo install react-native-network-info
   ```

2. Update `detectIPs()` to auto-detect Tailscale IP

3. Reference: IMPLEMENTATION.md → "IP Address Detection" section

**Expected Time:** 1 hour  
**Difficulty:** Easy (mostly copy-paste)

---

### PRIORITY 4: Build Production Binaries (1 hour)

**Android APK:**
```bash
cd mobile
eas build --platform android --type apk
# Output: APK file for testing/sideload
```

**macOS DMG:**
```bash
cd mac
npm run tauri build
# Output: src-tauri/target/release/bundle/dmg/oracle_x.x.x_x64.dmg
# This is installable on macOS
```

**Expected Time:** 1 hour build time (mostly waiting)  
**Difficulty:** Easy (automated)

---

### PRIORITY 5: Create Homebrew Formula (2 hours)

**Location:** `packaging/homebrew_formula.rb`

**What to Do:**

1. Update with correct DMG URL (from Priority 4)
2. Calculate SHA256 of DMG: `shasum -a 256 oracle_x.x.x_x64.dmg`
3. Update formula with new SHA and version
4. Create GitHub repo for Homebrew tap
5. Push formula to tap

**Expected Time:** 2 hours  
**Difficulty:** Medium (Homebrew knowledge needed)

**Result:** User can install with: `brew install your-name/oracle/oracle`

---

## Summary: Tasks Ordered by Priority

| Priority | Task | Time | Difficulty | Status |
|----------|------|------|-----------|--------|
| 1️⃣ | WebSocket Server | 3h | 🟡 Medium | ⏳ BLOCKED (NEXT) |
| 2️⃣ | End-to-End Test | 1h | 🟢 Easy | ⏳ After #1 |
| 3️⃣ | IP Detection | 1h | 🟢 Easy | ⏳ After #2 |
| 4️⃣ | Build Binaries | 1h | 🟢 Easy | ⏳ After #3 |
| 5️⃣ | Homebrew Formula | 2h | 🟡 Medium | ⏳ After #4 |

**Total Time:** ~8 hours of active work

---

## Start Here: WebSocket Server

The ONLY thing blocking you from working system is the WebSocket server.

### What WebSocket Server Does

1. Listens on Android port 8080
2. Accepts connections from macOS clients
3. When frame is captured: broadcasts to all connected clients
4. Handles client disconnect gracefully

### How to Implement

**File:** `/mobile/screens/StreamScreen.js`

**Functions to add/update:**

```javascript
// NEW: Start server
async function startWebSocketServer() {
  // Use react-native-tcp-socket
  // Listen on port 8080
  // Accept connections
}

// NEW: Send frame to all clients
function broadcastFrame(frameBase64) {
  // For each connected client
  // Send frame in WebSocket format
}

// EXISTING: Gets called every 100ms
// Just call broadcastFrame() with captured frame
async function captureAndStream() {
  // Already captures JPEG
  // Just needs: broadcastFrame(frameBase64)
}
```

### Detailed Guide

See: `IMPLEMENTATION.md` → "Step 2: Implement WebSocket Server"

All code examples are there. Copy-paste and adapt.

---

## If You Get Stuck

### WebSocket Implementation Issues

→ Check IMPLEMENTATION.md → "Common Issues" section

### Connection Problems

→ Check IMPLEMENTATION.md → "Debugging" section

### General Questions

→ Check ARCHITECTURE.md or README.md

---

## Testing Without Full Implementation

If you want to test the macOS app before Android is ready:

1. Create a simple mock WebSocket server on Mac:
   ```bash
   # Using wscat (npm install -g wscat)
   wscat -l 8080
   ```

2. Connect Android app to this, verify connection

3. Manually send frame JSON:
   ```json
   {"type": "frame", "base64": "data:image/jpeg;base64,..."}
   ```

4. Verify macOS receives it

---

## v1.0 Release Criteria

✅ WebSocket server fully implemented and tested  
✅ Android and macOS apps connect and display live video  
✅ Frames transmit at ~10 FPS  
✅ Connection stable for 5+ minutes  
✅ CPU usage reasonable  
✅ Production builds (APK + DMG) available  
✅ Documentation complete  

**Expected:** 1-2 weeks from now

---

## Deployment Steps (After v1.0)

1. Tag release: `git tag v1.0.0`
2. Push to GitHub
3. Create GitHub Release
4. Build final APK and DMG
5. Create Homebrew formula
6. Test installation with Homebrew
7. Announce release

---

## Success Metrics

**After completing this execution plan, you'll have:**

✅ Fully functional ORACLE system  
✅ Android app hosting WebSocket server  
✅ macOS app receiving frames  
✅ Installed via Homebrew (just `brew install oracle`)  
✅ Works completely privately on Tailscale  
✅ No backend servers, no cloud, no accounts  

**Time to completion:** ~8 hours active work + ~2-3 hours build/wait time

---

## Questions?

- **"How do I start?"** → Do PRIORITY 1 (WebSocket Server)
- **"What if X breaks?"** → Check the relevant .md file (IMPLEMENTATION, ARCHITECTURE, etc.)
- **"Can I skip steps?"** → No. Each depends on the previous.
- **"What if I'm stuck?"** → See "If You Get Stuck" section above.

---

## Final Note

You have everything you need. The architecture is solid. The UI is ready. The only piece is implementing the WebSocket server in Android (Priority 1).

**Next action:** Read IMPLEMENTATION.md → "Option 1" section and start coding.

**Time to first working prototype:** 3 hours  
**Time to full v1.0:** 8 hours active + build time

Go! 🚀
