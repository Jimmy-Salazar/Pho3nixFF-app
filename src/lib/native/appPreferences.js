import { Preferences } from "@capacitor/preferences"

const KEYS = {
  biometricEnabled: "pho3nix_biometric_enabled",
}

function localSet(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {}
}

function localGet(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function localRemove(key) {
  try {
    localStorage.removeItem(key)
  } catch {}
}

export async function setBiometricEnabled(enabled) {
  const value = enabled ? "true" : "false"

  localSet(KEYS.biometricEnabled, value)

  try {
    await Preferences.set({
      key: KEYS.biometricEnabled,
      value,
    })
  } catch (error) {
    console.warn("No se pudo guardar preferencia biométrica en Capacitor Preferences:", error)
  }
}

export async function getBiometricEnabled() {
  const localValue = localGet(KEYS.biometricEnabled)

  if (localValue === "true") return true
  if (localValue === "false") return false

  try {
    const { value } = await Preferences.get({
      key: KEYS.biometricEnabled,
    })

    if (value === "true" || value === "false") {
      localSet(KEYS.biometricEnabled, value)
    }

    return value === "true"
  } catch (error) {
    console.warn("No se pudo leer preferencia biométrica desde Capacitor Preferences:", error)
    return false
  }
}

export async function clearBiometricEnabled() {
  localRemove(KEYS.biometricEnabled)

  try {
    await Preferences.remove({
      key: KEYS.biometricEnabled,
    })
  } catch (error) {
    console.warn("No se pudo limpiar preferencia biométrica:", error)
  }
}
