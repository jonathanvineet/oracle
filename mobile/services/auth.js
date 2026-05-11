import * as SecureStore from 'expo-secure-store'

export async function saveToken(token) {
  return SecureStore.setItemAsync('token', token)
}
export async function getToken() {
  return SecureStore.getItemAsync('token')
}
export async function clearToken() {
  return SecureStore.deleteItemAsync('token')
}
