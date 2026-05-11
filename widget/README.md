# 🖥️ ORACLE Widget - DEPRECATED

**⚠️ This Übersicht widget is for the old IP Webcam architecture. Not used in current version.**

## Current Approach

The new ORACLE uses a **custom Tauri macOS app** instead of Übersicht:
- Download from Homebrew: `brew install oracle`
- More powerful and customizable
- Better performance and control
- Native app integration

## Legacy Widget

This folder contains the old Übersicht widget (kept for reference).

If you want to use it with the legacy IP Webcam approach:

```bash
mkdir -p ~/Library/Application\ Support/Übersicht/widgets/oracle.widget
cp index.jsx ~/Library/Application\ Support/Übersicht/widgets/oracle.widget/
# Edit to add your phone's Tailscale IP
```

But **recommended:** Use the new Tauri app instead.

## Usage

1. **Open Übersicht**
   - Press ⌘Space
   - Type "Übersicht"
   - Press Enter

2. **Widget appears** 
   - Top right corner of desktop
   - Shows live camera feed
   - Draggable with mouse

3. **Controls**
   - **Drag** to move widget
   - **Resize** from corners (drag on edge)
   - **⌘Q** on Übersicht to hide all widgets

---

## Features

- 🎬 **Live streaming** — Real-time MJPEG from IP Webcam
- 🔐 **Private & encrypted** — Via Tailscale tunnel
- 📌 **Always-on-top** — Stays visible above other windows
- ⚡ **Minimal CPU** — ~2% usage when active
- 🎨 **Draggable** — Move anywhere on screen
- 🔄 **Auto-reconnect** — Retries if stream drops

---

## Troubleshooting

### Black screen / "No video"

1. Check IP Webcam is **running** on Android (green "Stop" button)
2. Verify Tailscale is **connected**: `tailscale status`
3. Verify IP is correct: `curl http://100.x.x.x:8080/video`
4. Restart Übersicht: ⌘Q, then reopen

### Widget not visible

- Check Übersicht window is open
- Verify widget file location: `~/Library/Application\ Support/Übersicht/widgets/oracle.widget/index.jsx`
- Restart Übersicht if widget file was just edited

### High latency

- Lower video resolution in IP Webcam: Settings → Video size
- Check Tailscale connection quality: `tailscale status`
- Move device closer to WiFi router

---

## Customization

Edit `index.jsx` to customize:

- **Position**: Change `top: 30px; right: 30px;`
- **Size**: Change `width: 360px; height: 240px;`
- **Transparency**: Change `rgba(15,15,15,0.7)` (0=transparent, 1=opaque)
- **Border radius**: Change `border-radius: 18px;`

---

## Advanced

### Change Port

If IP Webcam uses different port (e.g., 8081):

```jsx
const STREAM_URL = "http://100.x.x.x:8081/video";
```

### Use Local IP Instead

On same WiFi network (no Tailscale):

```jsx
const STREAM_URL = "http://192.168.1.100:8080/video";
```

---

## Performance Notes

- Widget only loads image when **visible** on screen
- Refresh disabled (`refreshFrequency = false`) — only updates on image load
- Smooth motion via MJPEG streaming (not full video codec)
- <50ms latency typical over Tailscale

---

## License

MIT
