// src/theme/ThemeProvider.jsx

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import {
  clearStoredThemeCode,
  getThemeByCode,
  getThemeOptions,
  resolveThemeCode,
  setStoredThemeCode,
} from "./themeConfig"

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [themeCode, setThemeCode] = useState(() => resolveThemeCode())

  const theme = useMemo(() => getThemeByCode(themeCode), [themeCode])

  const refreshTheme = () => {
    setThemeCode(resolveThemeCode())
  }

  const setTheme = (code) => {
    setStoredThemeCode(code)
    refreshTheme()
  }

  const setAutoTheme = () => {
    setStoredThemeCode("auto")
    refreshTheme()
  }

  const resetTheme = () => {
    clearStoredThemeCode()
    refreshTheme()
  }

  useEffect(() => {
    document.documentElement.setAttribute("data-phoenix-theme", theme.code)
  }, [theme])

  useEffect(() => {
    window.phoenixThemes = {
      current: () => themeCode,
      list: () => getThemeOptions(),
      set: (code) => setTheme(code),
      auto: () => setAutoTheme(),
      reset: () => resetTheme(),
    }

    return () => {
      delete window.phoenixThemes
    }
  }, [themeCode])

  const value = useMemo(
    () => ({
      theme,
      themeCode,
      options: getThemeOptions(),
      setTheme,
      setAutoTheme,
      resetTheme,
    }),
    [theme, themeCode]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function usePhoenixTheme() {
  return useContext(ThemeContext)
}
