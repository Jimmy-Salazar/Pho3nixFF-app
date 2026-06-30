// src/theme/themeConfig.js

export const PHOENIX_THEME_STORAGE_KEY = "pho3nix_theme_override"

// Para esta entrega dejamos Ecuador activo.
// Para volver al normal, cambia "ecuador" por "phoenix" o "auto".
export const THEME_MODE = "ecuador"

export const THEMES = {
  phoenix: {
    code: "phoenix",
    label: "PHO3NIX",
    primary: "#f97316",
    primarySoft: "rgba(249, 115, 22, 0.16)",
    primaryGlow: "rgba(249, 115, 22, 0.32)",
    secondary: "#fb923c",
    tertiary: "#ef4444",
    accent: "#f59e0b",
    bg: "#050505",
    card: "rgba(0, 0, 0, 0.48)",
    border: "rgba(249, 115, 22, 0.22)",
    textAccent: "#fb923c",
    banner: "",
  },
  ecuador: {
    code: "ecuador",
    label: "Vamos Ecuador",
    primary: "#facc15",
    primarySoft: "rgba(250, 204, 21, 0.12)",
    primaryGlow: "rgba(250, 204, 21, 0.28)",
    secondary: "#3b82f6",
    tertiary: "#ef4444",
    accent: "#facc15",
    bg: "#02050b",
    card: "rgba(4, 8, 16, 0.86)",
    border: "rgba(255, 255, 255, 0.12)",
    textAccent: "#facc15",
    banner: "¡Vamos Ecuador!",
  },
}

export function getThemeByCode(code) {
  return THEMES[code] || THEMES.phoenix
}

export function resolveThemeCode() {
  if (THEME_MODE && THEME_MODE !== "auto" && THEMES[THEME_MODE]) {
    return THEME_MODE
  }

  try {
    const stored = localStorage.getItem(PHOENIX_THEME_STORAGE_KEY)
    if (stored && stored !== "auto" && THEMES[stored]) return stored
  } catch {}

  return "phoenix"
}

export function setStoredThemeCode(code) {
  try {
    localStorage.setItem(PHOENIX_THEME_STORAGE_KEY, code || "auto")
  } catch {}
}
