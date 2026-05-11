// ORACLE - Simple Übersicht Widget
// Place this in: ~/Library/Application Support/Übersicht/widgets/oracle.widget/index.jsx

export const refreshFrequency = false

// ORACLE Server runs on localhost:8080
const WS_URL = `ws://localhost:8080`

export const className = `
  top: 20px;
  right: 20px;
  width: 360px;
  height: 240px;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #06b6d4;
  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
`

let ws = null
let isConnecting = false

const connectWebSocket = () => {
  if (isConnecting || ws?.readyState === 1) return
  
  isConnecting = true
  
  try {
    ws = new WebSocket(WS_URL)
    
    ws.onopen = () => {
      console.log('✅ Connected to ORACLE server')
      isConnecting = false
    }
    
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'frame') {
          const img = document.getElementById('oracle-frame')
          if (img) {
            img.src = `data:image/jpeg;base64,${msg.data}`
          }
        }
      } catch (e) {
        console.error('Frame parse error:', e)
      }
    }
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      isConnecting = false
    }
    
    ws.onclose = () => {
      console.log('❌ Server disconnected. Make sure server is running.')
      isConnecting = false
      // Try to reconnect every 2 seconds
      setTimeout(connectWebSocket, 2000)
    }
  } catch (e) {
    console.error('Failed to connect:', e)
    isConnecting = false
  }
}

// Try to connect when widget loads
if (!ws) {
  setTimeout(connectWebSocket, 100)
}

export const render = () => {
  return `
    <div style="
      width: 100%;
      height: 100%;
      position: relative;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      color: #fff;
    ">
      <!-- Frame Image -->
      <img 
        id="oracle-frame"
        src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 360 240%22%3E%3Crect fill=%22%23111%22 width=%22360%22 height=%22240%22/%3E%3Ctext fill=%22%23888%22 x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22system-ui%22 font-size=%2216%22%3EWaiting for server...%3C/text%3E%3C/svg%3E"
        style="
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: #000;
        "
      />
      
      <!-- Status Overlay -->
      <div style="
        position: absolute;
        top: 8px;
        left: 8px;
        background: rgba(0,0,0,0.7);
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        color: #0f0;
        font-weight: bold;
        font-family: monospace;
        z-index: 10;
      ">
        🎬 ORACLE
      </div>
      
      <!-- Connection Status -->
      <div style="
        position: absolute;
        bottom: 8px;
        left: 8px;
        background: rgba(0,0,0,0.7);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 10px;
        color: #999;
        font-family: monospace;
        z-index: 10;
      ">
        Server: ${ws?.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}
      </div>
      
      <!-- Status Indicator -->
      <div style="
        position: absolute;
        top: 8px;
        right: 8px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: ${ws?.readyState === 1 ? '#22c55e' : '#f87171'};
        animation: ${ws?.readyState === 1 ? 'pulse' : 'none'} 2s infinite;
        z-index: 10;
      ">
      </div>
      
      <style>
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      </style>
    </div>
  `
}
