import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function ProtectedRoute({ children }) {
  const { user, loading, profileLoading } = useAuth()

  if (loading || profileLoading) return <p>Verificando permisos...</p>

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}