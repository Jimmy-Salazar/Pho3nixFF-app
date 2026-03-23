import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { ROLES } from "../config/roles"

export default function ProtectedAdminRoute({ children }) {
  const { user, rol, loading, profileLoading } = useAuth()

  if (loading) return <p>Verificando servicios...</p>

  if (!user) return <Navigate to="/login" replace />

  // Para rutas admin sí esperamos el rol real
  if (profileLoading) return <p>Verificando servicios...</p>

  const norm = (v) => String(v || "").trim().toLowerCase()

  const isAdmin =
    norm(rol) === norm(ROLES.ADMIN) ||
    norm(rol) === "administrador" ||
    norm(rol) === "admin"

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}