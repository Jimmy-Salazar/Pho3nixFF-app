import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "../supabase"

const LANG_KEY = "pho3nix_language"

function normalizeEntries(entries = []) {
  return entries.map((item) => {
    if (Array.isArray(item)) {
      return {
        clave: item[0],
        texto_es: item[1],
        texto_en: item[2] || "",
      }
    }

    return {
      clave: item.clave,
      texto_es: item.texto_es,
      texto_en: item.texto_en || "",
    }
  })
}

export function useSemiAutoTranslation({ modulo = "general", entries = [] } = {}) {
  const normalizedEntries = useMemo(() => normalizeEntries(entries), [entries])

  const localMap = useMemo(() => {
    return new Map(normalizedEntries.map((item) => [item.clave, item]))
  }, [normalizedEntries])

  const [language, setLanguageState] = useState(() => {
    if (typeof window === "undefined") return "es"

    const saved = window.localStorage.getItem(LANG_KEY)

    return saved === "en" ? "en" : "es"
  })

  const [remoteMap, setRemoteMap] = useState({})

  const setLanguage = useCallback((nextLanguage) => {
    const safeLanguage = nextLanguage === "en" ? "en" : "es"

    setLanguageState(safeLanguage)

    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANG_KEY, safeLanguage)
    }
  }, [])

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "es" ? "en" : "es")
  }, [language, setLanguage])

  useEffect(() => {
    if (!normalizedEntries.length) return

    let alive = true
    const keys = normalizedEntries.map((item) => item.clave).filter(Boolean)

    async function loadAndRegisterTranslations() {
      try {
        const { data, error } = await supabase
          .from("traducciones")
          .select("clave,texto_es,texto_en,revisado,pendiente")
          .in("clave", keys)

        if (error) throw error

        if (!alive) return

        const foundRows = data || []
        const foundMap = new Map(foundRows.map((item) => [item.clave, item]))

        setRemoteMap(
          Object.fromEntries(
            foundRows.map((item) => [
              item.clave,
              {
                texto_es: item.texto_es || "",
                texto_en: item.texto_en || "",
              },
            ])
          )
        )

        const missingRows = normalizedEntries
          .filter((item) => item.clave && !foundMap.has(item.clave))
          .map((item) => ({
            clave: item.clave,
            texto_es: item.texto_es,
            texto_en: item.texto_en || null,
            modulo,
            pendiente: !item.texto_en,
            revisado: false,
          }))

        if (missingRows.length > 0) {
          const { error: insertError } = await supabase
            .from("traducciones")
            .insert(missingRows)

          if (insertError) {
            console.warn("No se pudieron registrar algunas traducciones:", insertError)
          }
        }
      } catch (error) {
        console.warn("No se pudieron cargar traducciones:", error)
      }
    }

    loadAndRegisterTranslations()

    return () => {
      alive = false
    }
  }, [modulo, normalizedEntries, keysKey(normalizedEntries)])

  const t = useCallback(
    (clave, fallbackEs = "") => {
      const localEntry = localMap.get(clave)
      const remoteEntry = remoteMap[clave]

      if (language === "es") {
        return remoteEntry?.texto_es || localEntry?.texto_es || fallbackEs
      }

      return (
        remoteEntry?.texto_en ||
        localEntry?.texto_en ||
        remoteEntry?.texto_es ||
        localEntry?.texto_es ||
        fallbackEs
      )
    },
    [language, localMap, remoteMap]
  )

  return {
    language,
    setLanguage,
    toggleLanguage,
    t,
  }
}

function keysKey(entries = []) {
  return entries.map((item) => item.clave).join("|")
}
