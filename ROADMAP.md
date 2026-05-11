# ORACLE Optimization Roadmap

## Current State (Stage 1)

**What Works:**
- ✅ Base64 JPEG frames
- ✅ 10 FPS capture
- ✅ Local WiFi relay
- ✅ Proof of concept

**Not Optimized Yet:**
- Bandwidth: ~500KB/sec at 10 FPS
- Latency: ~100-150ms end-to-end
- CPU: Minimal (decode/encode in browser)

**Status:** Good enough for Stage 1.

---

## Stage 2: UX & Stability

**When:** After streaming confirms it works  
**Goal:** Add controls + polish

### What to Do

1. **Lower FPS initially**
   - Start at 250ms (~4 FPS)
   - Increase on demand
   - Reason: Stability > speed

2. **Add controls**
   ```
   [Stop] [Quality ↑↓] [Record] [Stats]
   ```

3. **Better error handling**
   - Reconnect on drop
   - Show connection status
   - Retry logic

4. **Performance metrics**
   - FPS counter
   - Bandwidth display
   - Latency graph (optional)

### Code Impact

- StreamScreen.js: +50 lines (controls)
- bridge/server.js: +30 lines (stats)
- Widget: +40 lines (UI)

---

## Stage 3: Native App & Distribution

**When:** After Stage 2 feels polished  
**Goal:** Replace Übersicht with Tauri

### Architecture Change

```
NOW (Stage 1):
  Android ──HTTP──> Bridge ──WS──> Übersicht

STAGE 3:
  Android ──HTTP──> Tauri App (embedded bridge)
                         ├─ WebSocket server
                         ├─ Native UI
                         └─ System tray widget
```

### What to Do

1. **Create Tauri app** (replace bridge + widget)
   ```bash
   cargo create --name oracle
   ```

2. **Embed WebSocket server** in Rust
   - Same protocol as Node bridge
   - Lower overhead
   - Native UI rendering

3. **Package for macOS**
   - DMG creation
   - Code signing
   - Notarization

4. **Homebrew tap**
   ```bash
   brew install jonathanvineet/oracle/oracle
   ```

### Code Impact

- Remove: `bridge/` directory (300 lines Node)
- Add: `tauri/src/main.rs` (~400 lines Rust)
- Add: `tauri/src-tauri/` WebSocket handler
- Add: DMG/Homebrew config

---

## Stage 4: Optional Enhancements

### Bandwidth Optimization

**Current:** Base64 JPEG = ~50KB per frame  
**Optimized:** Binary JPEG = ~30KB per frame

Implementation:
```javascript
// NOW
{base64: "iVBORw0KGG..."}

// LATER
{binary: Buffer} // raw bytes
```

**Impact:** 40% bandwidth reduction (only if needed)

---

### Remote Access

**Current:** Local WiFi only  
**Optional:** Tailscale relay

Only if you want:
- Cross-network streaming
- Remote access
- Mobile viewing

NOT needed for Stage 1-2.

---

### Recording

**Current:** Real-time stream only  
**Optional:** Save frames to disk

Implementation:
```javascript
// In bridge or Tauri
fs.writeFile(`frame-${timestamp}.jpg`, jpeg_buffer)
```

**Impact:** Adds ~10MB per minute of video

---

### Network Compression

**Current:** Uncompressed frames  
**Optional:** Codec-level compression

Examples:
- H.264 hardware encoding (Android)
- VP8 codec
- Custom frame-to-frame delta

**Impact:** Advanced, only if bandwidth critical.

---

## Decision Tree

```
Stage 1 working?
├─ NO → Fix streaming bugs
└─ YES → Continue

Stage 2 worth doing?
├─ NO → Skip to Stage 3
└─ YES → Add controls + polish

Have good use case?
├─ Übersicht widget sufficient?
│  └─ YES → Stay at Stage 2, done
│  └─ NO → Continue
└─ YES → Proceed to Stage 3

Stage 3 worth doing?
├─ NO → Accept widget limitation
└─ YES → Build Tauri app + Homebrew
```

---

## Timeline Estimates

| Stage | Duration | Notes |
|-------|----------|-------|
| 1 (Now) | 2-3 hours | Proof of concept |
| 2 | 4-6 hours | Controls + stability |
| 3 | 8-12 hours | Tauri + packaging |
| 4 | 4-8 hours | Optional features |

---

## What NOT to Do

### Don't Skip Stage 1

❌ Building Tauri before frames work  
❌ Planning database before streaming proves viable  
❌ Worrying about remote access before local works  
❌ Recording video before quality confirmed

### Don't Over-Optimize

❌ Binary blobs if base64 works fine  
❌ Custom codecs before bandwidth issues  
❌ H.264 encoding before testing 10 FPS  
❌ Complex retry logic for stable WiFi

### Don't Over-Engineer

❌ Cloud backend  
❌ Authentication infrastructure  
❌ Distributed architecture  
❌ Persistent storage

---

## Remember

**Current Focus:** `streaming works`  
**Next Focus:** `streaming works smoothly`  
**Final Focus:** `streaming works + looks native`

Everything else is distraction.

The mental model:
1. ✅ Prove it works (Stage 1)
2. ✅ Make it reliable (Stage 2)
3. ✅ Make it pretty (Stage 3)
4. ⚠️ Optimize if needed (Stage 4)

Not the other way around.

🌉 Keep the bridge simple. 🎬
