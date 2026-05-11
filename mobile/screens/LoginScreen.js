import React, { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native'
import * as SecureStore from 'expo-secure-store'

export default function LoginScreen({ navigation }) {
  const [streamPassword, setStreamPassword] = useState('oracle123')
  const [tailscaleIP, setTailscaleIP] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkSavedSettings()
  }, [])

  async function checkSavedSettings() {
    try {
      const saved = await SecureStore.getItemAsync('tailscaleIP')
      if (saved) {
        setTailscaleIP(saved)
      }
    } catch (err) {
      console.warn('Error loading settings:', err)
    }
  }

  async function handleConnect() {
    if (!tailscaleIP.trim()) {
      Alert.alert('Error', 'Please enter your Tailscale IP address')
      return
    }

    setLoading(true)
    try {
      // Test connection to the widget
      const response = await fetch(`http://${tailscaleIP}:8080/ping`, {
        timeout: 3000
      }).catch(() => null)

      if (!response) {
        Alert.alert('Connection Error', 'Could not reach Android device on that IP. Make sure:\n1. Device is on same Tailscale network\n2. Stream is running on Android\n3. IP is correct')
        setLoading(false)
        return
      }

      // Save settings
      await SecureStore.setItemAsync('tailscaleIP', tailscaleIP)
      await SecureStore.setItemAsync('streamPassword', streamPassword)

      navigation.replace('Stream')
    } catch (err) {
      Alert.alert('Error', String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🎬 ORACLE</Text>
      <Text style={styles.subtitle}>Live Camera Widget</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Tailscale IP Address</Text>
        <Text style={styles.hint}>Your Android device's Tailscale IP (100.x.x.x)</Text>
        <TextInput
          style={styles.input}
          value={tailscaleIP}
          onChangeText={setTailscaleIP}
          placeholder="100.x.x.x"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Stream Password</Text>
        <Text style={styles.hint}>Optional password for stream access</Text>
        <TextInput
          style={styles.input}
          value={streamPassword}
          onChangeText={setStreamPassword}
          placeholder="oracle123"
          placeholderTextColor="#666"
        />
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleConnect}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Connecting...' : 'Start Streaming'}</Text>
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={styles.infoTitle}>How to use:</Text>
        <Text style={styles.infoText}>1. Install Tailscale on Android and Mac</Text>
        <Text style={styles.infoText}>2. Get your Android device's Tailscale IP</Text>
        <Text style={styles.infoText}>3. Enter it above and tap "Start Streaming"</Text>
        <Text style={styles.infoText}>4. Widget will display on your Mac</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1724' },
  content: { padding: 20, justifyContent: 'center', minHeight: '100%' },
  title: { fontSize: 36, fontWeight: 'bold', color: '#06b6d4', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#aaa', textAlign: 'center', marginBottom: 32 },
  section: { marginBottom: 24 },
  label: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  hint: { color: '#888', fontSize: 12, marginBottom: 8 },
  input: { width: '100%', padding: 12, backgroundColor: '#111827', color: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#333' },
  button: { backgroundColor: '#06b6d4', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#082032', fontWeight: 'bold', fontSize: 16 },
  info: { marginTop: 40, padding: 16, backgroundColor: '#111827', borderRadius: 8 },
  infoTitle: { color: '#06b6d4', fontWeight: 'bold', marginBottom: 8 },
  infoText: { color: '#aaa', fontSize: 13, marginVertical: 4 }
})
