import { run } from 'uebersicht'

/**
 * Oracle Übersicht Widget
 *
 * Displays a live MJPEG stream from your Android phone directly on the macOS desktop.
 *
 * Setup:
 *   1. Create ~/.oracle/config.json with { "androidIP": "YOUR_PHONE_IP", "port": 8080 }
 *   2. Open the Oracle Android app and tap "Start Streaming"
 *   3. This widget auto-refreshes the stream — no restart needed
 *
 * The <img> tag handles MJPEG natively. Zero JS streaming logic required.
 */

// ─── Config ──────────────────────────────────────────────────────────────────

const CONFIG_PATH = `${process.env.HOME}/.oracle/config.json`
const DEFAULT_CONFIG = { androidIP: null, port: 8080 }

// ─── Widget position ──────────────────────────────────────────────────────────

const POSITION = {
  top:   '20px',
  right: '20px',
  width: '340px',
}

// ─── Übersicht hooks ──────────────────────────────────────────────────────────

// Read config every 30s so IP changes are picked up without restarting Übersicht
export const command = `cat "${CONFIG_PATH}" 2>/dev/null || echo '{"androidIP":null,"port":8080}'`
export const refreshFrequency = 30000

// ─── Styles ───────────────────────────────────────────────────────────────────

export const style = `
  position: fixed;
  top: ${POSITION.top};
  right: ${POSITION.right};
  width: ${POSITION.width};
  font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
  user-select: none;
  z-index: 1000;

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .oracle-card {
    background: rgba(15, 23, 36, 0.92);
    border: 1px solid rgba(6, 182, 212, 0.25);
    border-radius: 14px;
    overflow: hidden;
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.04) inset;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .oracle-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .oracle-title {
    color: #06B6D4;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.08em;
  }

  .badge {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
  }

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }

  .dot-live {
    background: #22C55E;
    box-shadow: 0 0 6px #22C55E;
    animation: pulse-live 2s ease-in-out infinite;
  }

  .dot-offline {
    background: #EF4444;
  }

  .badge-live  { color: #86EFAC; }
  .badge-offline { color: #FCA5A5; }

  @keyframes pulse-live {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  /* Stream area */
  .stream-area {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    background: #000;
    overflow: hidden;
  }

  .stream-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  /* Offline placeholder */
  .stream-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: #374151;
    font-size: 12px;
  }

  .stream-placeholder .icon {
    font-size: 32px;
    opacity: 0.4;
  }

  .stream-placeholder .msg {
    color: #4B5563;
    text-align: center;
    line-height: 1.5;
  }

  /* Footer */
  .oracle-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 14px;
    border-top: 1px solid rgba(255, 255, 255, 0.04);
  }

  .footer-ip {
    color: #00FF88;
    font-size: 11px;
    font-weight: 600;
  }

  .footer-hint {
    color: #374151;
    font-size: 10px;
  }

  /* No-config state */
  .setup-card {
    padding: 20px 16px;
    text-align: center;
  }

  .setup-title {
    color: #F59E0B;
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 10px;
  }

  .setup-step {
    color: #6B7280;
    font-size: 11px;
    line-height: 1.8;
    text-align: left;
  }

  .setup-code {
    display: block;
    background: rgba(6, 182, 212, 0.08);
    border: 1px solid rgba(6, 182, 212, 0.2);
    border-radius: 6px;
    padding: 8px 10px;
    margin: 10px 0;
    color: #06B6D4;
    font-size: 10px;
    text-align: left;
    white-space: pre;
  }
`

// ─── Render ───────────────────────────────────────────────────────────────────

export const render = ({ output, error }) => {
  // Parse config from shell command output
  let config = DEFAULT_CONFIG
  try {
    config = JSON.parse(output?.stdout || output || '{}')
  } catch (_) {}

  const { androidIP, port = 8080 } = config
  const streamUrl = androidIP ? `http://${androidIP}:${port}/stream` : null

  // No config set yet → show setup instructions
  if (!androidIP) {
    return (
      <div className="oracle-card">
        <div className="oracle-header">
          <span className="oracle-title">🎬 ORACLE</span>
          <span className="badge badge-offline">
            <span className="dot dot-offline" />
            SETUP NEEDED
          </span>
        </div>
        <div className="setup-card">
          <div className="setup-title">⚙️ Quick Setup</div>
          <div className="setup-step">
            1. Open the Oracle Android app<br />
            2. Tap <strong style={{color:'#06B6D4'}}>Start Streaming</strong><br />
            3. Note your phone's IP address<br />
            4. Create this file on your Mac:
          </div>
          <code className="setup-code">{`# ~/.oracle/config.json
{
  "androidIP": "192.168.x.x",
  "port": 8080
}`}</code>
          <div className="setup-step">
            5. Übersicht will pick it up in ~30s
          </div>
        </div>
      </div>
    )
  }

  // Config exists → show stream
  return (
    <div className="oracle-card">
      <div className="oracle-header">
        <span className="oracle-title">🎬 ORACLE</span>
        <span className="badge badge-live">
          <span className="dot dot-live" />
          LIVE
        </span>
      </div>

      <div className="stream-area">
        <img
          className="stream-img"
          src={streamUrl}
          alt="Live stream"
          onError={(e) => {
            // If stream breaks, hide img to show placeholder beneath
            e.target.style.display = 'none'
          }}
          onLoad={(e) => {
            e.target.style.display = 'block'
          }}
        />
        <div
          className="stream-placeholder"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <span className="icon">📵</span>
          <span className="msg">
            Waiting for stream…<br />
            <span style={{ fontSize: '10px', color: '#374151' }}>
              Is the Android app streaming?
            </span>
          </span>
        </div>
      </div>

      <div className="oracle-footer">
        <span className="footer-ip">{androidIP}:{port}</span>
        <span className="footer-hint">MJPEG · local</span>
      </div>
    </div>
  )
}
