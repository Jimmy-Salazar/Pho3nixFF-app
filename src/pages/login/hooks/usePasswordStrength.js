// src/pages/login/hooks/usePasswordStrength.js

import { useMemo } from "react"

export default function usePasswordStrength(password) {
  return useMemo(() => {
    const checks = {
      min: password.length >= 8,
      upper: /[A-ZÁÉÍÓÚÑ]/.test(password),
      number: /\d/.test(password),
      symbol: /[^A-Za-zÁÉÍÓÚÑáéíóúñ0-9]/.test(password),
    }

    const strength = Object.values(checks).filter(Boolean).length
    const label = ["Débil", "Débil", "Media", "Buena", "Fuerte"][strength]

    return {
      checks,
      strength,
      label,
    }
  }, [password])
}
