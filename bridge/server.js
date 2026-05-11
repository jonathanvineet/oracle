#!/usr/bin/env node

/**
 * ORACLE Frame Bridge (NOT a backend/server)
 * 
 * Local macOS process that:
 * 1. Receives frame data from Android app over HTTP
 * 2. Relays frames to Übersicht widgets via WebSocket
 * 3. Stores only the latest frame in RAM
 * 
 * This is a LOCAL RELAY only:
 * - Not cloud-hosted
 * - Not public-facing
 * - Not a "backend" service
 * - Just frame reception → broadcast
 * 
 * Future optimizations (Stage 2+):
 * - Binary JPEG blobs instead of base64 (will reduce bandwidth 25-30%)
 * - Start with ~4 FPS (250ms) for stability, optimize later
 * - Consider Tauri embedment to eliminate this separate Node process
 * 
 * Usage:
 *   node server.js
 */

const WebSocket = require('ws')
const http = require('http')
const os = require('os')

const PORT = 8080
let latestFrame = null
let clients = []

// Create HTTP server for receiving frames from Android
const httpServer = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/frame') {
    let body = ''
    
    req.on('data', chunk => {
      body += chunk.toString()
    })
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body)
        if (data.base64) {
          latestFrame = data.base64
          
          // Broadcast to all WebSocket clients
          broadcast({
            type: 'frame',
            data: latestFrame,
            timestamp: data.timestamp || Date.now()
          })
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ 
          success: true,
          clientsReceived: clients.filter(c => c.readyState === WebSocket.OPEN).length
        }))
      } catch (error) {
        res.writeHead(400)
        res.end(JSON.stringify({ error: error.message }))
      }
    })
    
  } else if (req.url === '/' && req.method === 'GET') {
    // Info page
    const info = `
      <html>
      <head>
        <title>ORACLE Server</title>
        <style>
          body { font-family: system-ui; background: #0f1724; color: #fff; padding: 40px; }
          .card { background: #111827; padding: 20px; border-radius: 8px; margin: 20px 0; }
          code { background: #1f2937; padding: 4px 8px; border-radius: 4px; }
          .stat { display: flex; justify-content: space-between; padding: 8px 0; }
        </style>
      </head>
      <body>
        <h1>🎬 ORACLE Server</h1>
        
        <div class="card">
          <h3>📊 Status</h3>
          <div class="stat">
            <span>Frames Received:</span>
            <strong>${latestFrame ? '✅ Yes' : '❌ None'}</strong>
          </div>
          <div class="stat">
            <span>Übersicht Clients:</span>
            <strong>${clients.filter(c => c.readyState === WebSocket.OPEN).length}</strong>
          </div>
        </div>
        
        <div class="card">
          <h3>📱 Android Setup</h3>
          <p>Android app sends frames to:</p>
          <code>POST http://YOUR_MAC_IP:8080/frame</code>
          <p>With JSON body:</p>
          <pre>{ "base64": "...jpeg data...", "timestamp": 123456 }</pre>
        </div>
        
        <div class="card">
          <h3>🖥️ macOS Setup</h3>
          <p>Übersicht widgets connect via:</p>
          <code>ws://localhost:8080</code>
          <p>And receive frames as:</p>
          <pre>{ "type": "frame", "data": "...base64...", "timestamp": 123456 }</pre>
        </div>
        
        <div class="card">
          <h3>💻 Your Mac IP</h3>
          <code>${getLocalIP()}</code>
          <p style="font-size: 12px; color: #999;">
            Use this IP when configuring the Android app
          </p>
        </div>
      </body>
      </html>
    `
    
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(info)
    
  } else {
    res.writeHead(404)
    res.end('Not found')
  }
})

// Create WebSocket server for broadcasting to Übersicht widgets
const wss = new WebSocket.Server({ server: httpServer })

wss.on('connection', (ws) => {
  console.log(`✅ Übersicht client connected (total: ${clients.length + 1})`)
  clients.push(ws)
  
  // Send latest frame if available
  if (latestFrame) {
    ws.send(JSON.stringify({
      type: 'frame',
      data: latestFrame,
      timestamp: Date.now()
    }))
  }
  
  ws.on('close', () => {
    clients = clients.filter(c => c !== ws)
    console.log(`❌ Übersicht client disconnected (remaining: ${clients.length})`)
  })
  
  ws.on('error', (error) => {
    console.error(`WebSocket error:`, error.message)
  })
})

// Broadcast frame to all connected clients
function broadcast(message) {
  const activeClients = clients.filter(c => c.readyState === WebSocket.OPEN)
  
  if (activeClients.length > 0) {
    const msg = JSON.stringify(message)
    activeClients.forEach(client => {
      client.send(msg, (err) => {
        if (err) console.error('Send error:', err.message)
      })
    })
  }
}

// Get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  return 'localhost'
}

// Start bridge
httpServer.listen(PORT, () => {
  const localIP = getLocalIP()
  console.log(`\n🌉 ORACLE Frame Bridge running`)
  console.log(`🌍 Local IP: ${localIP}`)
  console.log(`📍 HTTP:  http://${localIP}:${PORT}  (for Android frames)`)
  console.log(`📡 WebSocket: ws://localhost:${PORT}  (for Übersicht widgets)`)
  console.log(`\n📱 Android app sends frames to: http://${localIP}:${PORT}/frame`)
  console.log(`🖥️  Übersicht widgets connect to: ws://localhost:${PORT}`)
  console.log(`\n💡 Bridge is LOCAL relay only - not a backend, not cloud, not remote`)
  console.log(`\nBridge ready. Waiting for connections...\n`)
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down ORACLE Server...')
  
  // Close all client connections
  clients.forEach(client => {
    client.close()
  })
  
  httpServer.close(() => {
    console.log('✅ Server stopped')
    process.exit(0)
  })
  
  // Force exit after 5 seconds
  setTimeout(() => {
    console.log('❌ Force shutdown')
    process.exit(1)
  }, 5000)
})
