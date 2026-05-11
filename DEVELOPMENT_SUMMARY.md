# ORACLE - Development Summary

This document summarizes the complete ORACLE system architecture, current state, and next steps.

---

## System Overview

**ORACLE** is a lightweight, private live camera streaming system:

- **Android**: Custom Expo app that hosts a WebSocket server
- **macOS**: Tauri app that connects as WebSocket client  
- **Network**: Tailscale (encrypted private VPN)
- **Data**: Base64 JPEG frames at ~10 FPS

```
Android → WebSocket Server (port 8080)
              ↓
        Tailscale VPN
              ↓
macOS ← WebSocket Client
```

---

## Directory Structure

```
oracle/
├── README.md                      # Main documentation
├── QUICK_START.md                # 10-minute setup guide
├── ARCHITECTURE.md               # Technical deep dive
├── IMPLEMENTATION.md             # Developer guide for WebSocket
├── DEVELOPMENT_SUMMARY.md        # This file
│
├── mobile/                       # Android (Expo)
│   ├── App.js                   # Root navigation
│   ├── app.json                 # Expo config (SDK 54)
│   ├── package.json             # Dependencies
│   └── screens/
│       ├── LoginScreen.js       # Welcome screen
│       └── StreamScreen.js      # Active streaming
│
├── mac/                         # macOS (Tauri)
│   ├── package.json
│   ├── tauri.conf.json
│   ├── src/index.html          # Frontend UI
│   └── src-tauri/
│       ├── Cargo.toml
│       ├── src/main.rs         # App entry
│       └── src/lib.rs          # WebSocket client
│
├── backend/                     # [DEPRECATED]
│   └── README.md               # Legacy Next.js (not used)
│
├── widget/                      # [DEPRECATED]
│   └── README.md               # Legacy Übersicht (not used)
│
├── electron/                    # [UNUSED]
│   └── (Old Electron attempt)
│
└── packaging/
    ├── homebrew_formula.rb     # Homebrew distribution
    └── oracle-setup            # Setup wizard
```

---

## Project History

### Original Concept
- Complex Expo + backend + Electron/Swift
- Cloud relay servers
- Centralized authentication

### First Pivot (IP Webcam)
- Rejected complexity
- Switched to pre-built IP Webcam app
- Übersicht widget on macOS
- **Outcome:** Simpler but using third-party app

### Current Architecture (WebSocket Server)
- Returned to custom Expo app
- **Key fix:** Android as SERVER (not client)
- Direct peer-to-peer WebSocket
- Tauri for macOS instead of Übersicht
- **Outcome:** Best of both worlds - custom + simple

---

## Technology Stack

| Component | Technology | Version | Why |
|-----------|-----------|---------|-----|
| Android | Expo (React Native) | SDK 54 | Quick dev, camera support |
| Camera | expo-camera | ~17.0.0 | Native JPEG compression |
| Navigation | React Navigation | ^6.1.0 | Screen management |
| Network | Tailscale | VPN | Encrypted, no ports needed |
| Streaming | WebSocket | TCP | Low latency, efficient |
| macOS | Tauri | ^1.5.0 | Lightweight, Homebrew-ready |
| Backend | Tokio + Tungstenite | Latest | Async WebSocket Rust |
| Distribution | Homebrew | Standard | Easy macOS installation |

---

## Completed Tasks ✅

### Phase 1: Architecture Design
- ✅ Defined WebSocket server model
- ✅ Chose Tauri for macOS (lightweight)
- ✅ Planned Tailscale integration

### Phase 2: Android App
- ✅ Created LoginScreen with setup info
- ✅ Built StreamScreen with camera UI
- ✅ Configured Expo SDK 54 compatibility
- ✅ Added IP detection placeholders
- ✅ Set up frame capture logic

### Phase 3: macOS App
- ✅ Created Tauri project structure
- ✅ Built Rust WebSocket client backend
- ✅ Designed HTML/CSS/JS frontend
- ✅ Implemented frame display UI

### Phase 4: Documentation
- ✅ Updated README with new architecture
- ✅ Created QUICK_START guide
- ✅ Wrote comprehensive ARCHITECTURE.md
- ✅ Created IMPLEMENTATION guide for WebSocket

---

## Pending Tasks ⏳

### High Priority

#### 1. Implement WebSocket Server (Android)
**File:** `mobile/screens/StreamScreen.js`  
**What:** Connect `react-native-tcp-socket` with WebSocket protocol  
**Time:** 2-3 hours  
**Guide:** See IMPLEMENTATION.md → Option 1  

**Status:** Placeholder code ready, needs native module integration

#### 2. Improve IP Detection (Android)
**File:** `mobile/screens/StreamScreen.js`  
**What:** Auto-detect Tailscale IP without manual entry  
**Dependencies:** `react-native-network-info`  
**Time:** 1 hour

#### 3. Test End-to-End
**What:** Verify Android → macOS frame transmission  
**Setup:**
```bash
# Terminal 1: Android dev
cd mobile && npx expo start

# Terminal 2: macOS dev
cd mac && npm run tauri dev

# Test: Enter ws://100.x.x.x:8080 in macOS app
```
**Time:** 2 hours

### Medium Priority

#### 4. Build Production Binaries
**Android:** `eas build --platform android`  
**macOS:** `npm run tauri build` in `/mac/`  
**Time:** 1 hour

#### 5. Homebrew Distribution
**File:** `packaging/homebrew_formula.rb`  
**What:** Create Homebrew tap for distribution  
**Time:** 2 hours

#### 6. Performance Optimization
- Adaptive frame rate based on network
- Resolution selection (720p, 1080p)
- CPU/battery optimization
- **Time:** 2-3 hours

### Low Priority

- [ ] Frame recording feature
- [ ] Multi-camera support
- [ ] Device discovery (mDNS)
- [ ] Settings persistence
- [ ] Audio stream option

---

## Quick Commands

### Development

```bash
# Start Android dev
cd mobile && npx expo start

# Start macOS dev
cd mac && npm run tauri dev

# Build Android APK
cd mobile && eas build --platform android --type apk

# Build macOS DMG
cd mac && npm run tauri build

# Test WebSocket connection
wscat -c ws://100.x.x.x:8080
```

### Debugging

```bash
# View Android logs
npx expo start --clear

# View macOS logs
npm run tauri dev

# Check Tailscale
tailscale status
tailscale ip -4 self
```

---

## Known Limitations

1. **WebSocket Server Not Yet Implemented**
   - Current: Placeholder code
   - Solution: Integrate `react-native-tcp-socket`
   - Timeline: Should be priority #1

2. **IP Detection Manual**
   - Current: User sees placeholders
   - Solution: Auto-detect via `react-native-network-info`
   - Timeline: Can be done after WebSocket

3. **Frame Rate Fixed**
   - Current: Always 10 FPS
   - Solution: Add adaptive rate or user setting
   - Timeline: Nice-to-have for v1.1

4. **No Persistence**
   - Current: Settings lost on app restart
   - Solution: Use `expo-secure-store` for storage
   - Timeline: Nice-to-have for v1.1

---

## Testing Checklist

- [ ] Expo dev server starts
- [ ] App requests camera permissions
- [ ] LoginScreen displays correctly
- [ ] StreamScreen shows camera preview
- [ ] WebSocket server starts on Android
- [ ] macOS app connects successfully
- [ ] Frames display on macOS
- [ ] Multiple macOS clients can connect
- [ ] Connection persists for 5+ minutes
- [ ] Frame quality is acceptable
- [ ] CPU usage is reasonable (~15% Android, ~5% macOS)
- [ ] Tailscale disconnection handled gracefully

---

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Frame Rate | 10 FPS | Planned |
| Latency | <150ms | TBD |
| CPU Android | <20% | TBD |
| CPU macOS | <10% | TBD |
| Memory Android | <150 MB | TBD |
| Memory macOS | <100 MB | TBD |
| Bandwidth/client | 50-100 KB/s | TBD |

---

## Security Considerations

✅ **Implemented:**
- Tailscale encryption (default)
- No cloud servers
- No authentication needed (private network)
- Camera permission required

🔜 **Future:**
- WSS (WebSocket Secure) option
- Tailscale ACL support
- Device-specific pairing

---

## Release Plan

### v1.0 - MVP
- [ ] WebSocket server implementation (PRIORITY)
- [ ] Android dev build
- [ ] macOS dev build
- [ ] Basic documentation

### v1.1 - Polish
- [ ] Production builds (APK + DMG)
- [ ] Homebrew formula
- [ ] Settings persistence
- [ ] IP auto-detection

### v1.2 - Features
- [ ] Frame recording
- [ ] Multiple device support
- [ ] Device discovery
- [ ] Performance tuning

---

## Getting Help

### For WebSocket Implementation
→ See IMPLEMENTATION.md

### For Architecture Questions
→ See ARCHITECTURE.md

### For Quick Setup
→ See QUICK_START.md

### For General Info
→ See README.md

---

## Next Immediate Steps

1. **This Week:**
   - [ ] Implement WebSocket server in StreamScreen.js
   - [ ] Test Android → macOS connection
   - [ ] Verify frame transmission

2. **Next Week:**
   - [ ] Fix IP auto-detection
   - [ ] Build production binaries
   - [ ] Create Homebrew formula

3. **Following Week:**
   - [ ] Release v1.0 MVP
   - [ ] Gather feedback
   - [ ] Plan v1.1 improvements

---

## Resources

- **Expo Documentation:** https://docs.expo.dev
- **Tauri Guide:** https://tauri.app/en/docs
- **Tailscale Help:** https://tailscale.com/contact/support
- **WebSocket RFC:** https://tools.ietf.org/html/rfc6455
- **React Native:** https://reactnative.dev

---

## Questions?

This document provides a complete overview. For specific issues:

1. Check the relevant guide (QUICK_START, ARCHITECTURE, IMPLEMENTATION)
2. Search workspace for similar issues
3. Check terminal output/logs
4. Test with simplified example

---

## Project Status: 🟡 **In Development**

**Latest:** WebSocket architecture finalized, UI complete, awaiting server implementation.  
**Next:** Implement native WebSocket server (see IMPLEMENTATION.md).  
**ETA for v1.0:** 1-2 weeks after server implementation complete.
