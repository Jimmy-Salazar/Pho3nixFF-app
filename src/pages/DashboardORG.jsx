import { useEffect, useState } from "react"
import { supabase } from "../supabase"
import { Navigate } from "react-router-dom"

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [nombre, setNombre] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        setLoading(false)
        return
      }

      setUser(data.user)

      const { data: profile } = await supabase
        .from("profiles")
        .select("nombre")
        .eq("id", data.user.id)
        .single()

      if (profile) {
        setNombre(profile.nombre)
      }

      setLoading(false)
    }

    getUser()
  }, [])

  if (loading) return <p>Cargando...</p>
  if (!user) return <Navigate to="/login" replace />

  return (
    <div>
      <h2>Dashboard</h2>
      <p>Bienvenido {user.user_metadata?.nombre}</p>
    </div>
  )
}