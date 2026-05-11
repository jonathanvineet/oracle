import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'

export default function LoginScreen({ navigation }) {
  useEffect(() => {
    // Auto-navigate to Stream on load
    // (In production, could add device discovery here)
    setTimeout(() => navigation.replace('Stream'), 500)
  }, [])

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.icon}>🎬</Text>
        <Text style={styles.title}>ORACLE</Text>
        <Text style={styles.subtitle}>Live Camera Widget</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🌐 How It Works</Text>
        <Text style={styles.cardText}>
          • This app HOSTS a WebSocket server
        </Text>
        <Text style={styles.cardText}>
          • Your Mac app CONNECTS to receive live frames
        </Text>
        <Text style={styles.cardText}>
          • Connected via Tailscale (encrypted)
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📝 Setup</Text>
        <Text style={styles.cardText}>
          1. Install Tailscale on this device
        </Text>
        <Text style={styles.cardText}>
          2. Note your Tailscale IP (100.x.x.x)
        </Text>
        <Text style={styles.cardText}>
          3. Tap the "Start Stream" button
        </Text>
        <Text style={styles.cardText}>
          4. On Mac, connect to your WebSocket address
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🔗 WebSocket Address</Text>
        <Text style={[styles.cardText, styles.mono]}>
          ws://YOUR_TAILSCALE_IP:8080
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => navigation.replace('Stream')}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Start Streaming →</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1724' },
  content: { padding: 20, justifyContent: 'center', minHeight: '100%' },
  hero: { alignItems: 'center', marginBottom: 40 },
  icon: { fontSize: 64, marginBottom: 8 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#06b6d4', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#aaa', marginBottom: 20 },
  card: { backgroundColor: '#111827', padding: 16, borderRadius: 12, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: '#06b6d4' },
  cardTitle: { color: '#06b6d4', fontWeight: 'bold', fontSize: 14, marginBottom: 8 },
  cardText: { color: '#aaa', fontSize: 13, marginVertical: 4, lineHeight: 20 },
  mono: { fontFamily: 'monospace', color: '#0f0', fontWeight: 'bold', fontSize: 12, marginTop: 8 },
  button: { backgroundColor: '#06b6d4', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#082032', fontWeight: 'bold', fontSize: 16 }
})
