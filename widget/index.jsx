import { run } from 'uebersicht'

// Configuration
const CONFIG_FILE = '/Library/Application Support/Oracle/config.json'

let config = {
  streamUrl: 'http://100.0.0.1:8080/video',
  password: 'oracle123',
  refreshInterval: 30000
}

// Load config from file
const loadConfig = async () => {
  try {
    const result = await run(`cat "${CONFIG_FILE}" 2>/dev/null || echo '{}'`)
    if (result.stdout) {
      config = JSON.parse(result.stdout)
    }
  } catch (err) {
    console.log('Config load error:', err)
  }
}

export const command = `
  # Check if stream is running
  curl -s "${config.streamUrl}" --connect-timeout 2 > /dev/null && echo "connected" || echo "disconnected"
`

export const refreshFrequency = 5000

export const style = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  #oracle-widget {
    font-family: 'Menlo', 'Monaco', monospace;
    background: rgba(15, 23, 36, 0.95);
    border: 2px solid #06b6d4;
    border-radius: 8px;
    padding: 12px;
    width: 320px;
    max-width: 100%;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(10px);
  }

  .oracle-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    border-bottom: 1px solid #333;
    padding-bottom: 8px;
  }

  .oracle-title {
    color: #06b6d4;
    font-size: 14px;
    font-weight: bold;
  }

  .oracle-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
  }

  .status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  .status-indicator.connected {
    background: #10b981;
  }

  .status-indicator.disconnected {
    background: #ef4444;
    animation: none;
  }

  .status-text {
    color: #aaa;
    font-size: 11px;
  }

  .oracle-stream {
    width: 100%;
    aspect-ratio: 16 / 9;
    background: #000;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 12px;
    position: relative;
  }

  .oracle-stream img,
  .oracle-stream video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }

  .oracle-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    font-size: 11px;
  }

  .info-item {
    background: rgba(255, 255, 255, 0.05);
    padding: 6px 8px;
    border-radius: 4px;
    border-left: 2px solid #06b6d4;
  }

  .info-label {
    color: #888;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
  }

  .info-value {
    color: #0f0;
    font-weight: bold;
  }

  .oracle-settings {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #333;
    font-size: 10px;
    color: #888;
  }

  .settings-item {
    margin: 4px 0;
    display: flex;
    justify-content: space-between;
  }

  .settings-label {
    opacity: 0.7;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.3;
    }
  }
`

export const render = ({ output }) => {
  const isConnected = output?.stdout?.trim() === 'connected'

  // Extract IP from config
  const ipMatch = config.streamUrl.match(/(\d+\.\d+\.\d+\.\d+)/)
  const displayIP = ipMatch ? ipMatch[1] : 'N/A'

  return (
    <div id="oracle-widget">
      <div className="oracle-header">
        <div className="oracle-title">🎬 ORACLE</div>
        <div className="oracle-status">
          <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></div>
          <span className="status-text">{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
        </div>
      </div>

      <div className="oracle-stream">
        {isConnected ? (
          <img src={config.streamUrl} alt="Stream" onError={(e) => (e.target.style.display = 'none')} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' }}>
            Waiting for stream...
          </div>
        )}
      </div>

      <div className="oracle-info">
        <div className="info-item">
          <div className="info-label">Device IP</div>
          <div className="info-value">{displayIP}</div>
        </div>
        <div className="info-item">
          <div className="info-label">Port</div>
          <div className="info-value">8080</div>
        </div>
        <div className="info-item">
          <div className="info-label">Status</div>
          <div className="info-value">{isConnected ? 'Active' : 'Idle'}</div>
        </div>
        <div className="info-item">
          <div className="info-label">Network</div>
          <div className="info-value">Tailscale</div>
        </div>
      </div>

      <div className="oracle-settings">
        <div className="settings-item">
          <span className="settings-label">Config:</span>
          <span>~/.oracle/config.json</span>
        </div>
        <div className="settings-item">
          <span className="settings-label">Refresh:</span>
          <span>5s</span>
        </div>
      </div>
    </div>
  )
}
