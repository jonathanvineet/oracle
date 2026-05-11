import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import * as SecureStore from 'expo-secure-store'

const BACKEND = process.env.BACKEND_URL || 'http://10.0.2.2:3000'

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('password')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const j = await res.json()
      if (!res.ok) {
        Alert.alert('Login failed', j.error || 'unknown')
        setLoading(false)
        return
      }
      await SecureStore.setItemAsync('token', j.token)
      navigation.replace('Stream')
    } catch (err) {
      Alert.alert('Error', String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>WODGET EVERYTHING ORACLE</Text>
      <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="Username" />
      <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#0f1724' },
  title: { color: '#fff', fontSize: 20, marginBottom: 16 },
  input: { width: '100%', padding: 12, marginVertical: 8, backgroundColor: '#111827', color: '#fff', borderRadius: 8 },
  button: { marginTop: 12, backgroundColor: '#06b6d4', padding: 12, borderRadius: 8 },
  buttonText: { color: '#082032', fontWeight: '600' }
})
