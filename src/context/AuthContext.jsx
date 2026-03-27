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
  return d.toISOString().slice(0, 10)
}

function parseDate(d) {
  if (!d) return null
  const [y, m, day] = d.split("-").map(Number)
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
  const f = fecha.split("-")

  return today[1] === f[1] && today[2] === f[2]
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
    }

    const loadIdentityAndAccess = async (sessionUser) => {
      try {
        setLoading(true)
        setProfileLoading(true)

        let resolvedNombre =
          sessionUser.user_metadata?.nombre || sessionUser.email

        let resolvedRol =
          sessionUser.user_metadata?.role || null

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

        let lastMensualidad = null

        if (needsMensualidad(resolvedRol)) {
          const { data: m } = await supabase
            .from("mensualidades")
            .select("*")
            .eq("usuario_id", sessionUser.id)
            .order("fecha_fin", { ascending: false })
            .limit(1)

          lastMensualidad = m?.[0] || null

          const estado = lastMensualidad?.estado?.toLowerCase()
          const dias = daysUntil(lastMensualidad?.fecha_fin)

          const ok =
            lastMensualidad &&
            estado === "activo" &&
            dias >= 0

          if (!ok) {
            await denyAccess("Tu membresía está inactiva o vencida")
            return
          }

          if (dias <= 2) {
            setMensualidadWarning({
              diasRestantes: dias,
              fechaFin: lastMensualidad.fecha_fin,
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

        // ✅ Mostrar SIEMPRE si hoy es cumpleaños y logró iniciar sesión
        if (isBirthdayToday(fechaNacimiento)) {
          setBirthdayPopup({
            nombre: resolvedNombre,
          })
        } else {
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

      await loadIdentityAndAccess(u)
    }

    bootstrap()

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!aliveRef.current) return

      if (event === "TOKEN_REFRESHED") return

      const u = session?.user

      if (!u) {
        clearAuth()
        setLoading(false)
        setProfileLoading(false)
        return
      }

      setTimeout(() => {
        loadIdentityAndAccess(u)
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