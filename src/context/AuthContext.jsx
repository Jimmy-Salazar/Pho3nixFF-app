// src/context/AuthContext.jsx

import { createContext, useContext, useEffect, useRef, useState } from "react"
import { supabase } from "../supabase"

const AuthContext = createContext()

const normalizeRole = (v) => String(v || "").toLowerCase().trim()

const needsMensualidad = (role) => {
  const r = normalizeRole(role)
  return r === "coach" || r === "alumno"
}

function todayISO() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function parseDate(d) {
  if (!d) return null
  const [y, m, day] = String(d).split("-").map(Number)
  return new Date(y, m - 1, day)
}

function daysUntil(dateStr) {
  const t = parseDate(dateStr)
  if (!t) return null

  const now = parseDate(todayISO())
  const diff = t.getTime() - now.getTime()

  return Math.floor(diff / 86400000)
}

function isBirthdayToday(fecha) {
  if (!fecha) return false

  const today = todayISO().split("-")
  const f = String(fecha).split("-")

  return today[1] === f[1] && today[2] === f[2]
}

function consumeRecentManualLoginFlag() {
  const raw = sessionStorage.getItem("login_intent_at")
  sessionStorage.removeItem("login_intent_at")

  if (!raw) return false

  const at = Number(raw)
  if (!Number.isFinite(at)) return false

  const ageMs = Date.now() - at

  // válido solo si ocurrió hace poco
  return ageMs >= 0 && ageMs <= 15000
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [rol, setRol] = useState(null)
  const [nombre, setNombre] = useState(null)

  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  const [birthdayPopup, setBirthdayPopup] = useState(null)
  const [mensualidadWarning, setMensualidadWarning] = useState(null)

  const aliveRef = useRef(true)

  useEffect(() => {
    aliveRef.current = true

    const clearAuth = () => {
      setUser(null)
      setRol(null)
      setNombre(null)
      setProfileLoading(false)
    }

    const denyAccess = async (msg) => {
      sessionStorage.setItem("auth_error", msg)

      await supabase.auth.signOut()

      clearAuth()

      setLoading(false)
      setProfileLoading(false)
      setBirthdayPopup(null)
    }

    const loadIdentityAndAccess = async (sessionUser, options = {}) => {
      const { showBirthdayPopup = false } = options

      try {
        setLoading(true)
        setProfileLoading(true)

        let resolvedNombre =
          sessionUser.user_metadata?.nombre ||
          sessionUser.email

        let resolvedRol =
          sessionUser.user_metadata?.role ||
          null

        let fechaNacimiento = null

        const { data: usr } = await supabase
          .from("usuarios")
          .select("nombre,role,fecha_nacimiento")
          .eq("id", sessionUser.id)
          .single()

        if (usr) {
          resolvedNombre = usr.nombre
          resolvedRol = usr.role
          fechaNacimiento = usr.fecha_nacimiento
        }

        if (!resolvedRol) {
          await denyAccess("No se pudo determinar tu rol")
          return
        }

        if (needsMensualidad(resolvedRol)) {
          const { data: m } = await supabase
            .from("mensualidades")
            .select("*")
            .eq("usuario_id", sessionUser.id)
            .order("fecha_fin", { ascending: false })
            .limit(1)

          const last = m?.[0]

          const estado = last?.estado?.toLowerCase()
          const dias = daysUntil(last?.fecha_fin)

          const ok =
            last &&
            estado === "activo" &&
            dias >= 0

          if (!ok) {
            await denyAccess(
              "Tu membresía está inactiva o vencida"
            )
            return
          }

          if (dias <= 2) {
            setMensualidadWarning({
              diasRestantes: dias,
              fechaFin: last.fecha_fin,
            })
          } else {
            setMensualidadWarning(null)
          }
        } else {
          setMensualidadWarning(null)
        }

        setUser(sessionUser)
        setRol(resolvedRol)
        setNombre(resolvedNombre)

        if (showBirthdayPopup && isBirthdayToday(fechaNacimiento)) {
          setBirthdayPopup({
            nombre: resolvedNombre,
			rol: resolvedRol,
          })
        } else if (!showBirthdayPopup) {
          setBirthdayPopup(null)
        }

        setProfileLoading(false)
        setLoading(false)
      } catch (e) {
        console.error(e)
        clearAuth()
        setLoading(false)
        setProfileLoading(false)
      }
    }

    const bootstrap = async () => {
      const { data } = await supabase.auth.getSession()
      const u = data?.session?.user

      if (!u) {
        setLoading(false)
        return
      }

      // ✅ recarga / sesión restaurada: NO cumpleaños
      await loadIdentityAndAccess(u, { showBirthdayPopup: false })
    }

    bootstrap()

    const { data: listener } =
      supabase.auth.onAuthStateChange((event, session) => {
        if (!aliveRef.current) return

        if (event === "TOKEN_REFRESHED") return

        const u = session?.user

        if (!u) {
          clearAuth()
          setLoading(false)
          return
        }

        const shouldShowBirthday = consumeRecentManualLoginFlag()

        setTimeout(() => {
          loadIdentityAndAccess(u, {
            showBirthdayPopup: shouldShowBirthday,
          })
        }, 0)
      })

    return () => {
      aliveRef.current = false
      listener?.subscription?.unsubscribe()
    }
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  const dismissBirthdayPopup = () => setBirthdayPopup(null)
  const dismissMensualidadWarning = () => setMensualidadWarning(null)

  return (
    <AuthContext.Provider
      value={{
        user,
        rol,
        nombre,
        loading,
        profileLoading,
        logout,
        birthdayPopup,
        mensualidadWarning,
        dismissBirthdayPopup,
        dismissMensualidadWarning,
        setBirthdayPopup,
        setMensualidadWarning,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}