# ORACLE Implementation Guide

This guide explains how to implement the WebSocket server for Android (Expo) and complete the system.

---

## Current Status

✅ **Complete:**
- Android UI (LoginScreen, StreamScreen)
- macOS Tauri app (client-side)
- Documentation & architecture

⏳ **Needs Implementation:**
- **React Native WebSocket Server** (native module)
- IP address detection refinement
- Testing & debugging

---

## The Challenge: WebSocket Server in React Native

React Native **doesn't have built-in WebSocket server** support. We need to use a native module.

### Option 1: React Native TCP Socket (Recommended)

**Package:** `react-native-tcp-socket`  
**Status:** Already in package.json  
**Difficulty:** Medium

**Implementation:**

```javascript
import TCPSocket from 'react-native-tcp-socket'

const startWebSocketServer = async () => {
  try {
    const server = TCPSocket.createTCPServer((socket) => {
      console.log('Client connected:', socket.address())

      socket.on('data', (data) => {
        console.log('Received:', data)
      })

      socket.on('close', () => {
        console.log('Client disconnected')
      })

      socket.on('error', (error) => {
        console.error('Socket error:', error)
      })
    })

    server.listen({ port: 8080 }, () => {
      console.log('Server listening on port 8080')
    })

    return server
  } catch (error) {
    console.error('Failed to start server:', error)
  }
}
```

**Pros:**
- Already declared in dependencies
- Low-level TCP access
- Good for debugging

**Cons:**
- WebSocket is on top of TCP (need to implement framing)
- More boilerplate code

### Option 2: Custom HTTP Server

**Package:** Use native Node.js-like server  
**Difficulty:** High

Create a native module that runs a Node.js server in parallel to React Native.

### Option 3: Use Expo Native Modules

**Package:** Custom native module  
**Difficulty:** High

Write Objective-C for iOS / Java for Android.

---

## Recommended Approach: Option 1 + WebSocket Framing

### Step 1: Install Dependencies

```bash
cd mobile
npm install react-native-tcp-socket
npx expo install react-native-tcp-socket
```

### Step 2: Implement WebSocket Server

Update `screens/StreamScreen.js`:

```javascript
import TCPSocket from 'react-native-tcp-socket'

// WebSocket frame format
function createWebSocketFrame(data) {
  const payload = Buffer.from(JSON.stringify(data))
  const frame = Buffer.alloc(2 + payload.length)
  
  // Simple WebSocket frame (FIN + Text opcode)
  frame[0] = 0x81  // FIN + opcode 0x1 (text)
  frame[1] = payload.length < 126 ? payload.length : 126
  
  payload.copy(frame, 2)
  return frame
}

function startWebSocketServer() {
  return new Promise((resolve, reject) => {
    try {
      const server = TCPSocket.createTCPServer((socket) => {
        console.log('WebSocket client connected')
        clientsRef.current.push(socket)

        socket.on('data', (data) => {
          // Handle WebSocket handshake and messages
          const dataStr = data.toString('utf8')
          
          if (dataStr.includes('Upgrade: websocket')) {
            // Respond to WebSocket handshake
            const response = 'HTTP/1.1 101 Switching Protocols\r\n' +
                           'Upgrade: websocket\r\n' +
                           'Connection: Upgrade\r\n' +
                           'Sec-WebSocket-Accept: ...\r\n\r\n'
            socket.write(response)
          }
        })

        socket.on('close', () => {
          clientsRef.current = clientsRef.current.filter(s => s !== socket)
          console.log('Client disconnected')
        })

        socket.on('error', (error) => {
          console.error('Socket error:', error)
        })
      })

      server.listen({ port: 8080 }, () => {
        console.log('WebSocket server started on port 8080')
        wsServerRef.current = server
        resolve(server)
      })
    } catch (error) {
      reject(error)
    }
  })
}

function broadcastFrame(frameData) {
  if (!wsServerRef.current) return
  
  const frame = createWebSocketFrame(frameData)
  
  clientsRef.current.forEach((socket) => {
    try {
      socket.write(frame)
    } catch (error) {
      console.error('Failed to send frame:', error)
    }
  })
}
```

### Step 3: Update startCapturingFrames()

```javascript
const startCapturingFrames = () => {
  let count = 0

  const captureFrame = async () => {
    try {
      if (!cameraRef.current || !isStreaming) return

      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
        skipProcessing: true,
      })

      if (photo.base64) {
        const frameData = {
          type: 'frame',
          base64: 'data:image/jpeg;base64,' + photo.base64,
          frameId: count,
          timestamp: Date.now(),
        }

        broadcastFrame(frameData)
        
        count++
        setFrameCount(count)
      }
    } catch (error) {
      console.error('Frame capture error:', error)
    }
  }

  if (captureIntervalRef.current) {
    clearInterval(captureIntervalRef.current)
  }

  // 10 FPS (every 100ms)
  captureIntervalRef.current = setInterval(captureFrame, 100)
}
```

---

## Alternative: Simple HTTP Streaming

If WebSocket is too complex, use simpler HTTP MJPEG:

```javascript
// Use http module
import { createServer } from 'react-native-http'

const startHTTPServer = async () => {
  const server = createServer((req, res) => {
    if (req.url === '/video') {
      res.writeHead(200, {
        'Content-Type': 'multipart/x-mixed-replace; boundary=--frame',
      })

      const sendFrame = () => {
        const base64 = getLatestFrame()
        res.write('--frame\r\n')
        res.write('Content-Type: image/jpeg\r\n')
        res.write('Content-length: ' + base64.length + '\r\n\r\n')
        res.write(Buffer.from(base64, 'base64'))
        res.write('\r\n')
      }

      const interval = setInterval(sendFrame, 100)
    }
  })

  server.listen(8080)
  return server
}
```

**Pros:**
- Simpler than WebSocket
- Works with existing MJPEG tools

**Cons:**
- Slightly higher latency
- More bandwidth per connection

---

## IP Address Detection

Currently using placeholders. To detect actual IPs:

```javascript
import * as Network from 'expo-network'
import NetInfo from '@react-native-community/netinfo'

const detectIPs = async () => {
  try {
    // Get local network IP
    const localIP = await Network.getIpAddressAsync()
    setLocalIP(localIP || '192.168.x.x')

    // Tailscale IP requires checking /etc/hosts or network interfaces
    // This needs platform-specific code or native module
    // For now, instruct user to check Tailscale app
    
  } catch (error) {
    console.error('IP detection error:', error)
  }
}
```

**Better approach:** Use native module `react-native-network-info`:

```bash
npm install react-native-network-info
npx expo install react-native-network-info
```

```javascript
import NetworkInfo from 'react-native-network-info'

const getTailscaleIP = async () => {
  try {
    const ips = await NetworkInfo.getIPv4Address()
    // Filter for 100.x.x.x addresses
    const tailscaleIPs = ips.filter(ip => ip.startsWith('100.'))
    return tailscaleIPs[0] || null
  } catch (error) {
    return null
  }
}
```

---

## Testing

### Test 1: Verify Server Starts

```bash
# In Android, check logs
npx expo start --clear

# Look for: "WebSocket server started on port 8080"
```

### Test 2: Connect from macOS

```bash
# In Mac terminal
wscat -c ws://100.x.x.x:8080

# Should show: connected
```

### Test 3: Frame Transmission

In macOS app, check browser console:
```javascript
ws.onmessage = (event) => {
  console.log('Frame received:', event.data.substring(0, 50))
}
```

### Test 4: Connection Stress

Connect multiple Macs simultaneously, verify all receive frames.

---

## Debugging

### Android Logs

```bash
npx expo start --clear
# Press 'i' for iOS or 'a' for Android
```

Look for:
- `WebSocket server started`
- `Client connected`
- `Frame broadcast: #123`

### macOS Logs

```bash
npm run tauri dev
# Open browser console (F12)
# Look for frame messages
```

### Network Debug

```bash
# Test TCP connection
nc -zv 100.x.x.x 8080

# Monitor network traffic
tcpdump -i any port 8080
```

---

## Common Issues

### "Server fails to start"

**Solution:**
- Check port 8080 is available
- Restart Expo Go app
- Check camera permissions

### "Frames not being sent"

**Solution:**
- Verify `broadcastFrame()` is being called
- Check `clientsRef.current` is not empty
- Add debug logging

### "High CPU usage"

**Solution:**
- Increase frame interval (e.g., 200ms instead of 100ms)
- Reduce JPEG quality
- Optimize frame encoding

### "Connection drops frequently"

**Solution:**
- Implement automatic reconnection
- Add keepalive ping/pong
- Check network stability (Tailscale)

---

## Production Deployment

### Build APK

```bash
cd mobile
eas build --platform android --type apk
```

### Build for Play Store

```bash
eas build --platform android
# Follow Expo instructions for store submission
```

### Code Signing

```bash
eas credentials
# Set up signing keys
```

---

## Next Steps

1. **Implement WebSocket server** (Option 1 or 2)
2. **Test connection** between Android and macOS
3. **Optimize frame rate** and quality
4. **Add reconnection logic**
5. **Build production APK and DMG**
6. **Release via Homebrew**

---

## Resources

- [React Native TCP Socket](https://www.npmjs.com/package/react-native-tcp-socket)
- [Expo Camera Docs](https://docs.expo.dev/versions/latest/sdk/camera/)
- [WebSocket Protocol](https://tools.ietf.org/html/rfc6455)
- [Tauri Documentation](https://tauri.app/en/docs/api/)
