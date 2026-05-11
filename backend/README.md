# Backend - DEPRECATED

**⚠️ This Next.js backend is NOT needed for the current architecture.**

## Current Architecture

The modern ORACLE design uses **direct WebSocket streaming**:

```
Android (Expo) → WebSocket SERVER
                    ↓
              Tailscale Encrypted VPN
                    ↓
macOS (Tauri) → WebSocket CLIENT
```

**No backend needed!** All streaming happens peer-to-peer.

## Why This Folder Still Exists

- Historical reference (original design included cloud relay)
- Future use if you need: frame logging, analytics, or cross-network access
- Can be repurposed for other needs

## If You Want to Use the Backend

```bash
cd backend
npm install
npm run dev
```

Old API routes (reference only):
- `POST /api/login` - Authentication (not used)
- `POST /api/upload-frame` - Frame storage (not used)
- `GET /api/latest-frame` - Retrieve frames (not used)

## Recommendation

**Delete this folder** if you're not using it. The production ORACLE system works without it.
