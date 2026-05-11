import React, { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native'
import { Camera } from 'expo-camera'
import { getNetworkStateAsync, getWifiSignalStrengthAsync } from 'expo-network'
import * as FileSystem from 'expo-file-system'
import { TCPSocket } from 'react-native-tcp-socket'

const MJPEG_PORT = 8080
const FRAME_QUALITY = 0.7
const FRAME_INTERVAL = 100 // ms between frames
const FRAME_WIDTH = 640

export default function StreamScreen({ navigation }) {
  const cameraRef = useRef(null)
  const [hasPermission, setHasPermission] = useState(null)
  const [streaming, setStreaming] = useState(false)
  const [tailscaleIP, setTailscaleIP] = useState('--')
  const [localIP, setLocalIP] = useState('--')
  const [frameCount, setFrameCount] = useState(0)
  const [password, setPassword] = useState('oracle123')
  const streamServerRef = useRef(null)
  const clientsRef = useRef([])
  const lastFrameRef = useRef(null)
  const lastFrameTimeRef = useRef(0)

  // Get local and Tailscale IP addresses
  useEffect(() => {
    getIPAddresses()
    const interval = setInterval(getIPAddresses, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    ;(async () => {
      const { status } = await Camera.requestCameraPermissionsAsync()
      setHasPermission(status === 'granted')
    })()
  }, [])

  useEffect(() => {
    return () => {
      stopStreaming()
    }
  }, [])

  async function getIPAddresses() {
    try {
      const network = await getNetworkStateAsync()
      if (network.ip) {
        setLocalIP(network.ip)
      }
      // Note: Getting Tailscale IP requires system integration or reading from system
      // For now, user will see it in the UI and type it manually
    } catch (err) {
      console.warn('IP fetch error:', err)
    }
  }

  function startMJPEGServer() {
    try {
      streamServerRef.current = TCPSocket.createTCPServer(socket => {
        clientsRef.current.push(socket)
        const clientIndex = clientsRef.current.length - 1

        socket.on('data', data => {
          const str = data.toString('utf8')
          // Check for auth header
          if (str.includes('password')) {
            const match = str.match(/password[=:\s]+([^\r\n]+)/)
            const providedPassword = match ? match[1].trim() : ''
            if (providedPassword !== password) {
              socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
              socket.end()
              clientsRef.current[clientIndex] = null
              return
            }
          }
        })

        socket.on('error', err => {
          console.warn('Socket error:', err)
        })

        socket.on('close', () => {
          clientsRef.current[clientIndex] = null
        })

        // Send MJPEG headers
        socket.write(
          'HTTP/1.1 200 OK\r\n' +
          'Content-Type: multipart/x-mixed-replace; boundary=frame\r\n' +
          'Connection: keep-alive\r\n' +
          'Cache-Control: no-cache\r\n\r\n'
        )
      })

      streamServerRef.current.listen({ port: MJPEG_PORT }, '0.0.0.0')
      console.log('MJPEG server started on port', MJPEG_PORT)
    } catch (err) {
      console.warn('Server start error:', err)
    }
  }

  function broadcastFrame(jpegData) {
    const boundary = '--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ' + jpegData.length + '\r\n\r\n'
    const frameData = Buffer.concat([Buffer.from(boundary), jpegData, Buffer.from('\r\n')])

    clientsRef.current = clientsRef.current.filter(socket => {
      if (!socket) return false
      try {
        socket.write(frameData)
        return true
      } catch (err) {
        console.warn('Broadcast error:', err)
        return false
      }
    })

    setFrameCount(prev => prev + 1)
  }

  async function captureAndStream() {
    if (!cameraRef.current || !streaming) return

    const now = Date.now()
    if (now - lastFrameTimeRef.current < FRAME_INTERVAL) {
      setTimeout(captureAndStream, FRAME_INTERVAL - (now - lastFrameTimeRef.current))
      return
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({ 
        base64: true, 
        quality: FRAME_QUALITY,
        skipProcessing: false
      })

      if (photo.base64) {
        const jpegBuffer = Buffer.from(photo.base64, 'base64')
        broadcastFrame(jpegBuffer)
        lastFrameTimeRef.current = Date.now()
      }
    } catch (err) {
      console.warn('Capture error:', err)
    }

  }

  function startStreaming() {
    if (streaming) return
    startMJPEGServer()
    setStreaming(true)
    captureAndStream()
  }

  function stopStreaming() {
    setStreaming(false)
    if (streamServerRef.current) {
      streamServerRef.current.close()
      streamServerRef.current = null
    }
    clientsRef.current = []
  }

  if (hasPermission === false) return <View style={styles.container}><Text style={styles.error}>No camera permission</Text></View>

  return (
    <View style={styles.container}>
      <Camera ref={cameraRef} style={styles.camera} type={Camera.Constants.Type.back} ratio="16:9" />
      
      <View style={styles.overlay}>
        <View style={styles.stats}>
          <Text style={styles.stat}>Local IP: {localIP}</Text>
          <Text style={styles.stat}>Port: {MJPEG_PORT}</Text>
          <Text style={styles.stat}>Frames: {frameCount}</Text>
          <Text style={styles.stat}>Status: {streaming ? '🟢 STREAMING' : '🔴 STOPPED'}</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity 
            onPress={() => (streaming ? stopStreaming() : startStreaming())} 
            style={[styles.btn, streaming && styles.btnActive]}
          >
            <Text style={styles.btnText}>{streaming ? 'Stop Stream' : 'Start Stream'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => { stopStreaming(); navigation.replace('Login') }} 
            style={styles.btn}
          > 
            <Text style={styles.btnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-between', padding: 12 },
  stats: { backgroundColor: 'rgba(0,0,0,0.7)', padding: 12, borderRadius: 8, marginTop: 40 },
  stat: { color: '#0f0', fontSize: 14, fontFamily: 'monospace', marginVertical: 2 },
  controls: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 32, gap: 8 },
  btn: { backgroundColor: '#0f1724', padding: 12, borderRadius: 8, flex: 1, alignItems: 'center' },
  btnActive: { backgroundColor: '#06b6d4' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  error: { color: '#fff', textAlign: 'center', marginTop: 20 }
})
