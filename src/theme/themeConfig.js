// src/theme/themeConfig.js

export const PHOENIX_THEME_STORAGE_KEY = "pho3nix_theme_override"

/*
  NO TOCAR MAIN.
  NO AGREGAR ARCHIVOS EXTRA.

  Este archivo solo decide qué tema está activo.
  El diseño del tema Ecuador queda en src/theme/theme.css.

  Opciones:
  - "manual"   => permite cambiar desde consola/app.
  - "auto"     => cambia por fecha automáticamente.
  - "phoenix"  => fuerza tema normal.
  - "ecuador"  => fuerza tema Ecuador.
  - "julianas" => fuerza tema Fiestas Julianas si el CSS existe en theme.css.
  - "navidad"  => fuerza Navidad si el CSS existe en theme.css.
  - "fin_anio" => fuerza Fin de Año si el CSS existe en theme.css.
*/
export const THEME_MODE = "julianas"

export const THEMES = {
  phoenix: {
    code: "phoenix",
    label: "PHO3NIX Normal",
  },

  ecuador: {
    code: "ecuador",
    label: "Ecuador",
  },

  julianas: {
    code: "julianas",
    label: "Fiestas Julianas",
  },

  navidad: {
    code: "navidad",
    label: "Navidad",
  },

  fin_anio: {
    code: "fin_anio",
    label: "Fin de Año",
  },
}

export function getThemeByCode(code) {
  return THEMES[code] || THEMES.phoenix
}

export function getStoredThemeCode() {
  try {
    return localStorage.getItem(PHOENIX_THEME_STORAGE_KEY)
  } catch {
    return null
  }
}

export function setStoredThemeCode(code) {
  try {
    if (!code || code === "auto") {
      localStorage.setItem(PHOENIX_THEME_STORAGE_KEY, "auto")
      return
    }

    if (THEMES[code]) {
      localStorage.setItem(PHOENIX_THEME_STORAGE_KEY, code)
    }
  } catch {}
}

export function clearStoredThemeCode() {
  try {
    localStorage.removeItem(PHOENIX_THEME_STORAGE_KEY)
  } catch {}
}

export function resolveAutoTheme(date = new Date()) {
  const month = date.getMonth() + 1
  const day = date.getDate()

  if (month === 7) return "julianas"

  if (month === 12 && day <= 25) return "navidad"

  if ((month === 12 && day >= 26) || (month === 1 && day <= 2)) {
    return "fin_anio"
  }

  return "phoenix"
}

export function resolveThemeCode() {
  switch (THEME_MODE) {
    case "auto":
      return resolveAutoTheme()

    case "manual": {
      const stored = getStoredThemeCode()

      if (stored === "auto") {
        return resolveAutoTheme()
      }

      if (stored && THEMES[stored]) {
        return stored
      }

      return "phoenix"
    }

    case "phoenix":
    case "ecuador":
    case "julianas":
    case "navidad":
    case "fin_anio":
      return THEME_MODE

    default:
      return "phoenix"
  }
}

export function getThemeOptions() {
  return Object.values(THEMES)
}
