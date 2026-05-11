import React, { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { Camera } from 'expo-camera'
import * as ImageManipulator from 'expo-image-manipulator'
import * as SecureStore from 'expo-secure-store'

const BACKEND = process.env.BACKEND_URL || 'http://10.0.2.2:3000'

export default function StreamScreen({ navigation }) {
  const cameraRef = useRef(null)
  const [hasPermission, setHasPermission] = useState(null)
  const [streaming, setStreaming] = useState(false)
  const [type, setType] = useState(Camera.Constants.Type.back)
  const busy = useRef(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync()
      setHasPermission(status === 'granted')
    })()
  }, [])

  useEffect(() => {
    return () => {
      stopStreaming()
    }
  }, [])

  async function uploadFrame(blob) {
    try {
      const token = await SecureStore.getItemAsync('token')
      if (!token) return
      await fetch(`${BACKEND}/api/upload-frame`, {
        method: 'POST',
        headers: { 'Content-Type': 'image/jpeg', Authorization: `Bearer ${token}` },
        body: blob
      })
    } catch (err) {
      console.warn('upload error', err)
    }
  }

  async function captureAndSend() {
    if (!cameraRef.current || busy.current) return
    busy.current = true
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: false, quality: 0.6 })
      // compress
      const manipulated = await ImageManipulator.manipulateAsync(photo.uri, [{ resize: { width: 640 } }], { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG })
      const response = await fetch(manipulated.uri)
      const blob = await response.blob()
      await uploadFrame(blob)
    } catch (err) {
      console.warn('capture error', err)
    } finally {
      busy.current = false
    }
  }

  function startStreaming() {
    if (streaming) return
    setStreaming(true)
    // capture every 150ms, but ensure previous finished
    intervalRef.current = setInterval(() => {
      captureAndSend()
    }, 150)
  }

  function stopStreaming() {
    setStreaming(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = null
  }

  if (hasPermission === false) return <View style={styles.container}><Text>No camera permission</Text></View>

  return (
    <View style={styles.container}>
      <Camera ref={cameraRef} style={styles.camera} type={type} ratio="16:9" />
      <View style={styles.controls}>
        <TouchableOpacity onPress={() => setType(t => (t === Camera.Constants.Type.back ? Camera.Constants.Type.front : Camera.Constants.Type.back))} style={styles.btn}>
          <Text style={styles.btnText}>Flip</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => (streaming ? stopStreaming() : startStreaming())} style={[styles.btn, streaming && styles.btnActive]}>
          <Text style={styles.btnText}>{streaming ? 'Stop' : 'Start'} Streaming</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { stopStreaming(); SecureStore.deleteItemAsync('token'); navigation.replace('Login') }} style={styles.btn}> 
          <Text style={styles.btnText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  controls: { position: 'absolute', bottom: 24, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-around' },
  btn: { backgroundColor: '#0f1724', padding: 12, borderRadius: 8 },
  btnActive: { backgroundColor: '#06b6d4' },
  btnText: { color: '#fff' }
})
