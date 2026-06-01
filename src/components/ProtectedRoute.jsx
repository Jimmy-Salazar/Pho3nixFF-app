import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function ProtectedRoute({ children }) {
  const { user, loading, profileLoading } = useAuth()

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        Verificando permisos...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}