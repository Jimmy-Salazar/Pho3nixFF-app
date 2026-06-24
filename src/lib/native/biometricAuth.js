import { NativeBiometric } from "capacitor-native-biometric"
import { getBiometricEnabled, setBiometricEnabled } from "./appPreferences"
import { isNativeApp } from "./platform"

function getErrorText(error) {
  if (!error) return ""

  if (typeof error === "string") return error

  const parts = [
    error?.message,
    error?.code,
    error?.name,
    error?.errorMessage,
    error?.localizedMessage,
  ].filter(Boolean)

  if (parts.length) return parts.join(" | ")

  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

function reasonToMessage(reason, error) {
  const detail = getErrorText(error)

  if (reason === "not_native") {
    return "La huella solo está disponible dentro de la APK."
  }

  if (reason === "plugin_error") {
    return detail
      ? `El plugin biométrico no respondió correctamente: ${detail}`
      : "El plugin biométrico no respondió correctamente. Revisa npx cap sync android y recompila el APK."
  }

  if (reason === "not_available") {
    return "Android indica que la biometría no está disponible para esta app. Revisa AndroidManifest.xml y permisos USE_BIOMETRIC."
  }

  if (reason === "verification_failed") {
    return detail
      ? `La verificación de huella falló o fue cancelada: ${detail}`
      : "La verificación de huella falló o fue cancelada."
  }

  return detail || "No se pudo activar la huella."
}

export async function checkBiometricAvailable() {
  if (!isNativeApp()) {
    return {
      available: false,
      reason: "not_native",
      biometryType: null,
      message: reasonToMessage("not_native"),
    }
  }

  try {
    const result = await NativeBiometric.isAvailable()
    const available = !!result?.isAvailable

    console.log("PHO3NIX BIOMETRIC isAvailable:", result)

    return {
      available,
      reason: available ? "available" : "not_available",
      biometryType: result?.biometryType || null,
      raw: result,
      message: available ? "" : reasonToMessage("not_available"),
    }
  } catch (error) {
    console.warn("PHO3NIX BIOMETRIC isAvailable error:", error)

    return {
      available: false,
      reason: "plugin_error",
      biometryType: null,
      error,
      message: reasonToMessage("plugin_error", error),
    }
  }
}

export async function getBiometricStatus() {
  const enabled = await getBiometricEnabled()
  const availability = await checkBiometricAvailable()

  return {
    enabled,
    available: availability.available,
    canUse: enabled && availability.available,
    reason: availability.reason,
    biometryType: availability.biometryType,
    message: availability.message,
    raw: availability.raw,
    error: availability.error,
  }
}

export async function canUseBiometricLogin() {
  return getBiometricStatus()
}

export async function verifyBiometricIdentity({
  title = "PHO3NIX",
  subtitle = "Ingreso seguro",
  description = "Usa tu huella o desbloqueo biométrico para continuar.",
  reason = "Confirma tu identidad para ingresar a PHO3NIX.",
  negativeButtonText = "Cancelar",
} = {}) {
  const availability = await checkBiometricAvailable()

  if (!availability.available) {
    return {
      ok: false,
      reason: availability.reason,
      message: availability.message || reasonToMessage(availability.reason, availability.error),
      raw: availability.raw,
      error: availability.error,
    }
  }

  try {
    console.log("PHO3NIX BIOMETRIC verifyIdentity start")

    await NativeBiometric.verifyIdentity({
      title,
      subtitle,
      description,
      reason,
      negativeButtonText,
    })

    console.log("PHO3NIX BIOMETRIC verifyIdentity success")

    return {
      ok: true,
      reason: "verified",
    }
  } catch (error) {
    console.warn("PHO3NIX BIOMETRIC verifyIdentity error:", error)

    return {
      ok: false,
      reason: "verification_failed",
      message: reasonToMessage("verification_failed", error),
      error,
    }
  }
}

export async function enableBiometricLogin() {
  const availability = await checkBiometricAvailable()

  if (!availability.available) {
    return {
      enabled: false,
      ok: false,
      reason: availability.reason,
      message: availability.message || reasonToMessage(availability.reason, availability.error),
      raw: availability.raw,
      error: availability.error,
    }
  }

  const verification = await verifyBiometricIdentity({
    title: "Activar huella",
    subtitle: "PHO3NIX",
    description: "Confirma tu huella para activar el ingreso rápido en este celular.",
    reason: "Activa el ingreso con huella para PHO3NIX.",
  })

  if (!verification.ok) {
    return {
      enabled: false,
      ...verification,
    }
  }

  await setBiometricEnabled(true)

  return {
    enabled: true,
    ok: true,
  }
}

export async function disableBiometricLogin() {
  await setBiometricEnabled(false)

  return {
    enabled: false,
    ok: true,
  }
}
