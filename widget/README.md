# 🖥️ ORACLE — macOS Übersicht Widget

Beautiful, lightweight desktop widget for viewing your Android camera stream. Displays as a floating window on your Mac desktop.

## Features

- 🎬 Live video stream display
- 📊 Real-time connection status
- 🔄 Auto-reconnect if stream drops
- 🎨 Draggable, resizable widget
- 🎯 Transparent, always-on-top
- ⚡ ~2% CPU usage
- 🔐 Encrypted via Tailscale

## Installation

### Via Homebrew (Recommended)

```bash
brew tap yourname/oracle
brew install oracle-widget
oracle-widget setup
```

### Manual Installation

1. Install Übersicht:
   ```bash
   brew install uebersicht
   ```

2. Copy widget to Übersicht folder:
   ```bash
   cp -r widget ~/.config/Übersicht/widgets/oracle
   ```

3. Run setup:
   ```bash
   oracle-widget setup
   ```

## Setup

Run the setup script:

```bash
oracle-widget setup
```

You'll be prompted for:

1. **Android device's Tailscale IP** (100.x.x.x)
   - Find it by running `tailscale status` on Android
   - Or see it displayed in the Expo app

2. **Stream password** (optional)
   - Defaults to "oracle123" if left empty
   - Used for optional stream authentication

Configuration is saved to `~/.oracle/config.json`.

## Usage

1. Open Übersicht (⌘Space, type "Übersicht", press Enter)
2. Widget appears on desktop
3. Shows live stream if Android device is streaming
4. Drag to move, resize from corners
5. Always-on-top (stays visible in other apps)

## Configuration

Edit `~/.oracle/config.json`:

```json
{
  "streamUrl": "http://100.x.x.x:8080/video",
  "password": "oracle123",
  "refreshInterval": 5000,
  "setupDate": "2026-05-11T00:00:00Z"
}
```

- `streamUrl` — Android device's MJPEG endpoint
- `password` — Stream password (if protected)
- `refreshInterval` — Update frequency in milliseconds

## Reconfiguration

To change settings:

```bash
oracle-widget setup
```

Or directly edit `~/.oracle/config.json`.

## Troubleshooting

### Widget doesn't appear

- Make sure Übersicht is running (⌘Space → Übersicht)
- Check widget visibility in Übersicht preferences
- Restart Übersicht: Kill Übersicht and reopen

### No video stream

- Ensure "Start Stream" is running on Android app
- Check Tailscale connection: `tailscale status`
- Verify IP: `ping 100.x.x.x` (should respond)
- Check firewall: port 8080 must be accessible

### Stream shows "Waiting for stream..."

- Android app may not be streaming yet
- Tap "Start Stream" on Android app
- Widget will auto-connect within 5 seconds

### Widget is slow or laggy

- Reduce `FRAME_INTERVAL` on Android (higher FPS)
- Or increase `refreshInterval` in widget config (lower refresh rate)
- Check Tailscale connection quality

## Commands

```bash
# Initial setup
oracle-widget setup

# View current configuration
cat ~/.oracle/config.json

# Reconfigure stream IP/password
oracle-widget setup

# View help
oracle-widget --help
```

## Performance

- **CPU**: ~2% when displaying stream
- **Memory**: ~50MB
- **Network**: ~500KB/s @ 10 FPS, 640px width
- **Latency**: <100ms over Tailscale

Adjust Android app settings to trade quality for performance:

- Reduce `FRAME_QUALITY` for lower bandwidth
- Increase `FRAME_INTERVAL` for lower FPS
- Reduce `FRAME_WIDTH` for smaller resolution

## Development

Widget file: `widget/index.jsx`

Edit directly to customize appearance. Changes reload automatically in Übersicht (may need to refresh).

### Customization Ideas

- Change widget size in CSS (currently 320px wide)
- Add timestamp overlay
- Display FPS counter
- Add recording button
- Change color scheme

## License

MIT
