// src/theme/ThemeProvider.jsx

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { getThemeByCode, resolveThemeCode, setStoredThemeCode } from "./themeConfig"

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [themeCode, setThemeCode] = useState(() => resolveThemeCode())
  const theme = useMemo(() => getThemeByCode(themeCode), [themeCode])

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute("data-phoenix-theme", theme.code)
    root.style.setProperty("--phoenix-theme-primary", theme.primary)
    root.style.setProperty("--phoenix-theme-primary-soft", theme.primarySoft)
    root.style.setProperty("--phoenix-theme-primary-glow", theme.primaryGlow)
    root.style.setProperty("--phoenix-theme-secondary", theme.secondary)
    root.style.setProperty("--phoenix-theme-tertiary", theme.tertiary)
    root.style.setProperty("--phoenix-theme-accent", theme.accent)
    root.style.setProperty("--phoenix-theme-bg", theme.bg)
    root.style.setProperty("--phoenix-theme-card", theme.card)
    root.style.setProperty("--phoenix-theme-border", theme.border)
    root.style.setProperty("--phoenix-theme-text-accent", theme.textAccent)
  }, [theme])

  useEffect(() => {
    window.phoenixThemes = {
      current: () => themeCode,
      set: (code) => {
        setStoredThemeCode(code)
        setThemeCode(resolveThemeCode())
      },
    }

    return () => {
      delete window.phoenixThemes
    }
  }, [themeCode])

  const value = useMemo(
    () => ({
      theme,
      themeCode,
      setTheme: (code) => {
        setStoredThemeCode(code)
        setThemeCode(resolveThemeCode())
      },
    }),
    [theme, themeCode]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function usePhoenixTheme() {
  return useContext(ThemeContext)
}
