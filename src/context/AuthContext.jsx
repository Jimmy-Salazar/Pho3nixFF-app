import { createContext, useContext, useEffect, useRef, useState } from "react"
import { supabase } from "../supabase"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [rol, setRol] = useState(null)
  const [nombre, setNombre] = useState(null)

  // loading global: SOLO sesión inicial
  const [loading, setLoading] = useState(true)

  // perfil/rol cargando aparte
  const [profileLoading, setProfileLoading] = useState(false)

  const aliveRef = useRef(true)
  const profileRequestIdRef = useRef(0)

  useEffect(() => {
    aliveRef.current = true

    const clearAuth = () => {
      setUser(null)
      setRol(null)
      setNombre(null)
      setProfileLoading(false)
    }

    const applyIfCurrentProfileRequest = (requestId, fn) => {
      if (!aliveRef.current) return
      if (requestId !== profileRequestIdRef.current) return
      fn()
    }

    const fetchProfile = async (sessionUser) => {
      if (!sessionUser) return

      const requestId = ++profileRequestIdRef.current
      const metadata = sessionUser?.user_metadata || {}
      const fallbackNombre =
        metadata.nombre || metadata.display_name || sessionUser.email || "Usuario"

      applyIfCurrentProfileRequest(requestId, () => {
        setProfileLoading(true)
      })

      // Fallback visual rápido desde usuarios
      try {
        const { data: usr, error: usrErr } = await supabase
          .from("usuarios")
          .select("nombre, role")
          .eq("id", sessionUser.id)
          .single()

        if (!usrErr && usr) {
          applyIfCurrentProfileRequest(requestId, () => {
            setNombre(usr.nombre || fallbackNombre)
            setRol((prev) => prev || usr.role || null)
          })
        }
      } catch {}

      // Fuente principal: perfiles
      try {
        const { data: perfil, error: perfilErr } = await supabase
          .from("perfiles")
          .select("nombre, rol")
          .eq("id", sessionUser.id)
          .single()

        if (!perfilErr && perfil) {
          applyIfCurrentProfileRequest(requestId, () => {
            setNombre(perfil.nombre || fallbackNombre)
            setRol(perfil.rol || null)
          })
        }
      } catch (e) {
        console.error("[AUTH] Error cargando perfiles:", e)
      } finally {
        applyIfCurrentProfileRequest(requestId, () => {
          setProfileLoading(false)
        })
      }
    }

    const bootstrap = async () => {
      try {
        setLoading(true)

        const { data, error } = await supabase.auth.getSession()
        if (error) throw error

        const sessionUser = data?.session?.user || null

        if (!sessionUser) {
          clearAuth()
          return
        }

        const metadata = sessionUser?.user_metadata || {}
        const fallbackNombre =
          metadata.nombre || metadata.display_name || sessionUser.email || "Usuario"

        // ✅ resolver sesión YA, sin esperar perfil
        setUser(sessionUser)
        setNombre(fallbackNombre)

        // ✅ quitar loading global inmediatamente
        if (aliveRef.current) setLoading(false)

        // ✅ cargar perfil en segundo plano
        fetchProfile(sessionUser)
      } catch (e) {
        console.error("[AUTH] bootstrap error:", e)
        clearAuth()
        if (aliveRef.current) setLoading(false)
      }
    }

    bootstrap()

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!aliveRef.current) return

        if (event === "TOKEN_REFRESHED") return

        const sessionUser = session?.user || null

        if (!sessionUser) {
          clearAuth()
          setLoading(false)
          return
        }

        const metadata = sessionUser?.user_metadata || {}
        const fallbackNombre =
          metadata.nombre || metadata.display_name || sessionUser.email || "Usuario"

        // ✅ no reactivar loading global
        setUser(sessionUser)
        setNombre(fallbackNombre)

        // ✅ actualizar perfil aparte
        fetchProfile(sessionUser)
      }
    )

    return () => {
      aliveRef.current = false
      authListener?.subscription?.unsubscribe?.()
    }
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
	window.location.href="/"
  }

  return (
    <AuthContext.Provider
      value={{ user, rol, nombre, loading, profileLoading, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}