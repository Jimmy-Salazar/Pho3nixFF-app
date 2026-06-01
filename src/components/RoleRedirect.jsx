import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { supabase } from "../supabase"

function normalizeRole(role) {
  const value = String(role || "").trim().toLowerCase()

  if (value === "admin" || value === "administrador") return "admin"
  if (value === "coach") return "coach"
  if (value === "alumno" || value === "student") return "alumno"

  return value
}

export default function RoleRedirect() {
  const [target, setTarget] = useState(null)

  useEffect(() => {
    let alive = true

    async function resolveTarget() {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser()

        if (authError) throw authError

        const user = authData?.user

        if (!user?.id) {
          if (alive) setTarget("/login")
          return
        }

        let role = ""

        const { data: usuarioData } = await supabase
          .from("usuarios")
          .select("role")
          .eq("id", user.id)
          .maybeSingle()

        role = usuarioData?.role || ""

        if (!role) {
          const { data: perfilData } = await supabase
            .from("perfiles")
            .select("rol")
            .eq("id", user.id)
            .maybeSingle()

          role = perfilData?.rol || ""
        }

        const normalizedRole = normalizeRole(role)

        if (!alive) return

        if (normalizedRole === "admin" || normalizedRole === "coach") {
          setTarget("/admin/dashboard")
          return
        }

        setTarget("/alumno/dashboard")
      } catch (error) {
        console.error("Error resolviendo redirección por rol:", error)

        if (alive) {
          setTarget("/login")
        }
      }
    }

    resolveTarget()

    return () => {
      alive = false
    }
  }, [])

  if (!target) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        Redirigiendo...
      </div>
    )
  }

  return <Navigate to={target} replace />
}