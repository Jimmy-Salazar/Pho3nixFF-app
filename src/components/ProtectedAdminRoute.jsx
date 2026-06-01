import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { ROLES } from "../config/roles"

function norm(value) {
  return String(value || "").trim().toLowerCase()
}

export default function ProtectedAdminRoute({ children }) {
  const { user, rol, loading, profileLoading } = useAuth()

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        Verificando servicios...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const userRole = norm(rol)

  const isAdmin =
    userRole === norm(ROLES.ADMIN) ||
    userRole === "administrador" ||
    userRole === "admin"

  const isCoach =
    userRole === norm(ROLES.COACH) ||
    userRole === "coach"

  if (!isAdmin && !isCoach) {
    return <Navigate to="/alumno/dashboard" replace />
  }

  return children
}