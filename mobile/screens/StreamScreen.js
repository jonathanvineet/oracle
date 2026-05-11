import React, { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as Network from 'expo-network'

// Global state for frame streaming
let latestFrameBase64 = null
let wsServerRef = null
let wsPort = 8080

export default function StreamScreen() {
  const [permission, requestPermission] = useCameraPermissions()
  const [isStreaming, setIsStreaming] = useState(false)
  const [frameCount, setFrameCount] = useState(0)
  const [localIP, setLocalIP] = useState('Detecting...')
  const [tailscaleIP, setTailscaleIP] = useState('100.x.x.x')
  const cameraRef = useRef(null)
  const wsServerRef = useRef(null)
  const clientsRef = useRef([])
  const captureIntervalRef = useRef(null)

  const WEBSOCKET_PORT = 8080

  useEffect(() => {
    requestPermission()
    detectIPs()
  }, [])

  const detectIPs = async () => {
    try {
      const ipResponse = await Network.getIpAddressAsync()
      setLocalIP(ipResponse || '192.168.x.x')
      setTailscaleIP('100.x.x.x (check Tailscale app)')
    } catch (error) {
      console.error('IP detection error:', error)
    }
  }

  const startWebSocketServer = async () => {
    try {
      const localIp = await Network.getIpAddressAsync()
      
      console.log(`\n📡 ORACLE Frame Server`)
      console.log(`📍 Android IP: ${localIp}`)
      console.log(`🔌 Port: ${wsPort}`)
      console.log(`📺 Mac: WebSocket ws://${localIp}:${wsPort}`)
      console.log(`🎬 Starting camera capture...\n`)
      
      setIsStreaming(true)
      startCapturingFrames()
      
      // For now, show the connection info
      // The WebSocket server will be implemented as a background service
      setTailscaleIP(localIp)
      
      Alert.alert(
        '🎬 Streaming Ready',
        `Your Android IP:\n${localIp}\n\nOn Mac Übersicht widget:\n1. Edit index.jsx\n2. Set ANDROID_IP = '${localIp}'\n3. Reload widget (⌘+R)`,
        [{ text: 'OK' }]
      )
    } catch (error) {
      Alert.alert('Error', 'Failed to start: ' + error.message)
      setIsStreaming(false)
    }
  }

  const startCapturingFrames = () => {
    let count = 0
    let macServerIP = localIP // This will be set via the alert

    const captureFrame = async () => {
      try {
        if (!cameraRef.current || !isStreaming) return

        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.7,
          skipProcessing: true,
        })

        if (photo.base64) {
          // Store latest frame globally
          latestFrameBase64 = photo.base64
          
          count++
          setFrameCount(count)
          console.log(`📸 Frame ${count} captured (${photo.base64.length} bytes)`)
          
          // Send frame to Mac server
          try {
            const response = await fetch(`http://${macServerIP}:8080/frame`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                base64: photo.base64,
                timestamp: Date.now(),
                frameNumber: count
              })
            })
            
            if (!response.ok) {
              console.warn(`Server response: ${response.status}`)
            }
          } catch (fetchError) {
            console.error('Failed to send frame:', fetchError.message)
          }
        }
      } catch (error) {
        console.error('Frame capture error:', error)
      }
    }

    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current)
    }

    // Capture ~10 FPS (frame every 100ms)
    captureIntervalRef.current = setInterval(captureFrame, 100)
  }

  const handleStopStream = () => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current)
    }

    setIsStreaming(false)
    setFrameCount(0)
    latestFrameBase64 = null
    Alert.alert('Streaming Stopped', 'Frame capture ended.')
  }

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Requesting camera permissions...</Text>
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.errorText}>Camera permission required</Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.buttonText}>Grant Camera Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.icon}>🎬</Text>
          <Text style={styles.title}>ORACLE Stream</Text>
          <Text style={styles.subtitle}>Live Camera Broadcast</Text>
        </View>

        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
          />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardLabel}>📍 Connection Info</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Local IP:</Text>
            <Text style={styles.infoValue}>{localIP}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tailscale IP:</Text>
            <Text style={styles.infoValue}>{tailscaleIP}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Port:</Text>
            <Text style={styles.infoValue}>{WEBSOCKET_PORT}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Frames Sent:</Text>
            <Text style={styles.infoValue}>{frameCount}</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          {!isStreaming ? (
            <TouchableOpacity
              style={styles.startButton}
              onPress={startWebSocketServer}
            >
              <Text style={styles.buttonText}>▶ Start Streaming</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.stopButton}
              onPress={handleStopStream}
            >
              <Text style={styles.buttonText}>⏹ Stop Streaming</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.statusCard, isStreaming && styles.statusActive]}>
          <Text style={styles.statusLabel}>
            {isStreaming ? '🟢 STREAMING' : '🔴 INACTIVE'}
          </Text>
          <Text style={styles.statusText}>
            {isStreaming
              ? `Broadcasting ${frameCount} frames. Mac clients connecting to ws://${tailscaleIP}:${WEBSOCKET_PORT}`
              : 'Ready to stream. Tap "Start Streaming" when connected to Tailscale.'}
          </Text>
        </View>

        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>📖 How to Connect</Text>
          <Text style={styles.helpText}>
            1. Make sure you're connected to Tailscale{'\n'}
            2. Tap "Start Streaming" above{'\n'}
            3. On your Mac app, enter: ws://100.x.x.x:8080{'\n'}
            4. Replace 100.x.x.x with your Tailscale IP above{'\n'}
            5. Click "Connect" on Mac app
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1724',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    padding: 16,
  },
  loadingText: {
    color: '#d1d5db',
    textAlign: 'center',
    marginTop: 40,
  },
  errorText: {
    color: '#f87171',
    fontSize: 16,
    marginBottom: 20,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#06b6d4',
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  cameraContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  camera: {
    width: '100%',
    height: 240,
  },
  infoCard: {
    backgroundColor: '#111827',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#06b6d4',
  },
  cardLabel: {
    color: '#06b6d4',
    fontWeight: 'bold',
    marginBottom: 10,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  infoLabel: {
    color: '#9ca3af',
    fontSize: 12,
  },
  infoValue: {
    color: '#0f0',
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: '#06b6d4',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#dc2626',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  permissionButton: {
    backgroundColor: '#06b6d4',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusCard: {
    backgroundColor: '#1f2937',
    padding: 14,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#6b7280',
  },
  statusActive: {
    backgroundColor: '#1a3a2a',
    borderLeftColor: '#22c55e',
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#d1d5db',
  },
  statusText: {
    color: '#9ca3af',
    fontSize: 12,
    lineHeight: 18,
  },
  helpCard: {
    backgroundColor: '#1a2942',
    padding: 14,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  helpTitle: {
    color: '#3b82f6',
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  helpText: {
    color: '#d1d5db',
    fontSize: 12,
    lineHeight: 20,
  },
})
