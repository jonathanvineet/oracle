# 📱 ORACLE — Android App (Expo)

This is the Android streaming component. It runs a local MJPEG server and broadcasts camera frames over Tailscale.

## Features

- 📷 Camera streaming via MJPEG
- 🌐 Local TCP server on port 8080
- 🔐 Optional password protection
- 📊 Frame counter and stats display
- ⚡ Minimal resource usage (~5% CPU, ~30MB RAM)

## Setup

### Prerequisites

- Node.js 16+
- Android phone (5.0+)
- Expo Go app (download from Google Play)
- Tailscale installed and running

### Installation

```bash
npm install
```

### Running

Start the dev server:

```bash
npx expo start
```

Scan the QR code with Expo Go on your Android phone.

## Usage

1. **Login Screen**
   - Enter your Mac's Tailscale IP (found via `tailscale status`)
   - Set a password (optional)
   - Tap "Start Streaming"

2. **Stream Screen**
   - Shows your device's local IP address
   - Shows MJPEG server port (8080)
   - Shows frame count
   - Shows status (🟢 STREAMING / 🔴 STOPPED)

3. **Start Streaming**
   - Tap "Start Stream" button
   - App captures frames and broadcasts via MJPEG
   - Widget on Mac receives stream automatically

## Configuration

Edit `StreamScreen.js`:

```javascript
const MJPEG_PORT = 8080        // Change port if needed
const FRAME_QUALITY = 0.7      // 0.1 (low) to 1.0 (high)
const FRAME_INTERVAL = 100     // ms between frames (~10 FPS)
const FRAME_WIDTH = 640        // pixels
```

## Troubleshooting

- **No camera permission?** Grant in phone settings
- **No stream on Mac?** Check Tailscale connection: `tailscale status`
- **High CPU?** Reduce `FRAME_QUALITY` or increase `FRAME_INTERVAL`

## License

MIT
