const serverInput = document.getElementById('server')
const usernameInput = document.getElementById('username')
const passwordInput = document.getElementById('password')
const loginBtn = document.getElementById('loginBtn')
const logoutBtn = document.getElementById('logoutBtn')
const loginPanel = document.getElementById('login')
const viewer = document.getElementById('viewer')
const frameImg = document.getElementById('frame')
const toggleStreamBtn = document.getElementById('toggleStream')
const alwaysOnTop = document.getElementById('alwaysOnTop')

let polling = false
let pollInterval = null
let currentBlobUrl = null

async function saveServer(url){
  await window.electronAPI.setServer(url)
}
async function loadServer(){
  return window.electronAPI.getServer()
}

async function saveToken(t){
  return window.electronAPI.setToken(t)
}
async function getToken(){
  return window.electronAPI.getToken()
}
async function clearToken(){
  return window.electronAPI.clearToken()
}

async function doLogin(){
  const server = serverInput.value.trim()
  const username = usernameInput.value.trim()
  const password = passwordInput.value
  if (!server || !username || !password) return alert('fill fields')
  try {
    const res = await fetch(`${server}/api/login`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username, password }) })
    const j = await res.json()
    if (!res.ok) return alert(j.error || 'login failed')
    await saveToken(j.token)
    await saveServer(server)
    showViewer()
  } catch (err) {
    alert('Login error')
  }
}

async function showViewer(){
  loginPanel.style.display = 'none'
  viewer.style.display = 'block'
  logoutBtn.style.display = 'inline-block'
}

async function hideViewer(){
  loginPanel.style.display = 'block'
  viewer.style.display = 'none'
  logoutBtn.style.display = 'none'
}

async function fetchFrame(){
  const token = await getToken()
  if (!token) return
  const server = await loadServer()
  try {
    const res = await fetch(`${server}/api/latest-frame/self`, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl)
    currentBlobUrl = url
    frameImg.src = url
  } catch (err) {
    console.warn('frame fetch error', err)
  }
}

function startPolling(){
  if (polling) return
  polling = true
  pollInterval = setInterval(fetchFrame, 150)
  toggleStreamBtn.textContent = 'Stop'
}
function stopPolling(){
  polling = false
  if (pollInterval) clearInterval(pollInterval)
  pollInterval = null
  toggleStreamBtn.textContent = 'Start'
}

loginBtn.addEventListener('click', doLogin)
logoutBtn.addEventListener('click', async () => { await clearToken(); hideViewer(); stopPolling() })
toggleStreamBtn.addEventListener('click', () => { polling ? stopPolling() : startPolling() })
alwaysOnTop.addEventListener('change', async (ev) => { await window.electronAPI.setAlwaysOnTop(ev.target.checked) })

// On load, restore server and token
;(async ()=>{
  const s = await loadServer()
  if (s) serverInput.value = s
  const t = await getToken()
  if (t) showViewer()
})()
