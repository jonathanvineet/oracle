# 🌉 ORACLE Frame Bridge

## What It Is (NOT What You Might Think)

This is **NOT** a backend. Not cloud. Not a server.

It's a **local relay** - a tiny process on YOUR Mac that:

1. Receives frames from Android
2. Broadcasts to widgets
3. That's it.

Think of it like:

```
Android → Bridge → Widget
         (localhost:8080)
```

All on your machine. All local. All simple.

---

## Why This Approach

Earlier attempts were painful:

```
❌ Android trying to HOST server
❌ Expo acting as network server  
❌ Tailscale socket complications
```

This is cleaner:

```
✅ Android just POSTs frames (simple HTTP)
✅ Bridge receives + broadcasts (simple Node)
✅ Widget connects locally (simple WebSocket)
```

**Minimal surface area. Maximum stability.**

---

## Current Architecture

### Frame Flow

```
Android Camera
    ↓ capture every 100ms
    ↓ compress to base64 JPEG
    ↓ POST to http://MAC_IP:8080/frame
    
Bridge (Node.js, localhost:8080)
    ↓ receives {"base64": "...", "timestamp": 123}
    ↓ stores as latestFrame in RAM
    ↓ broadcasts to all WebSocket clients
    
Übersicht Widget
    ↓ ws://localhost:8080
    ↓ receives {"type": "frame", "data": "..."}
    ↓ updates img.src = "data:image/jpeg;base64,..."}
    
macOS Desktop
    └─ live camera appears
```

### What Lives in RAM

Only:
- **Latest frame** (~40-50KB base64)
- **Connected clients list** (~1-2KB)
- **Node.js process** (~20MB base)

Total: ~70MB. Negligible.

---

## Future Optimizations (NOT NOW)

### 1. Binary Blobs Instead of Base64

**Now:** `base64` frame = ~50KB  
**Later:** Binary JPEG = ~30KB (saves 40% bandwidth)

Only matters if WiFi becomes bottleneck.

### 2. Lower FPS to Start

**Now:** ~10 FPS (100ms capture)  
**Later:** Drop to ~4 FPS (250ms capture) initially

Stability first, optimization later.

### 3. Embed in Tauri (Stage 3)

**Now:** Separate Node.js process  
**Later:** WebSocket server embedded in Tauri app

Then:
```bash
# Instead of:
npm start (bridge) + npm start (Android) + open widget

# Just:
open ORACLE.app
```

---

## Mental Model

**DON'T think:**
> "I'm building a backend service"

**DO think:**
> "I'm building a local frame relay"

The difference:
- Backend = remote, scalable, complex auth, databases
- Bridge = localhost, stateless, in-RAM only, ~70 lines of code

This mental model prevents over-engineering.

---

## What This Bridge Does

- ✅ Listen on port 8080
- ✅ Receive HTTP POST requests
- ✅ Store latest frame only
- ✅ Broadcast to WebSocket clients
- ✅ Serve info page at /
- ✅ Graceful shutdown
- ❌ No authentication
- ❌ No storage
- ❌ No persistence
- ❌ No remote access (by design)

---

## What It Doesn't Need

- ❌ Database
- ❌ Authentication  
- ❌ Authorization
- ❌ Encryption (local WiFi only)
- ❌ Error recovery
- ❌ Scaling
- ❌ Logging infrastructure
- ❌ Monitoring

It's just:

```
receive() → broadcast()
```

---

## Why This Works

**Expo frames:**
- Simple HTTP POST
- ~10 FPS baseline
- Base64 for now (good enough)

**Bridge receives:**
- Stateless handler
- No business logic
- No I/O beyond network

**Übersicht renders:**
- Native WebSocket support
- No external dependencies
- Instant updates via push

Result: Works immediately. No complexity.

---

## Later: When to Replace

Once Stage 1 works, you can swap the bridge:

```
Stage 1: Node.js bridge (now)
Stage 3: Tauri embedded bridge (later)

Android logic: UNCHANGED
Widget logic: UNCHANGED

Only the middle piece changes.
```

That's the beauty of this separation.

---

## Summary

This isn't over-engineering. It's:

- ✅ Simple enough to debug
- ✅ Local enough to test immediately
- ✅ Stateless enough to restart anytime
- ✅ Separate enough to replace later
- ✅ Stable enough to prove the concept

**It's a bridge. Not a backend. Don't overthink it.** 🌉
