import { useState, useEffect } from "react"
import { supabase } from "../supabase"
import { useNavigate } from "react-router-dom"

export default function SetPassword() {
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [validSession, setValidSession] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()

      if (data.session) {
        setValidSession(true)
      } else {
        alert("Link inválido o expirado")
        navigate("/")
      }
    }

    checkSession()
  }, [navigate])

  const handleSetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      alert("Error: " + error.message)
    } else {
      alert("Contraseña creada correctamente 🔥")
      navigate("/")
    }

    setLoading(false)
  }

  if (!validSession) return <p>Verificando sesión...</p>

  return (
    <div style={{ padding: "40px" }}>
      <h2>Crear nueva contraseña</h2>

      <form onSubmit={handleSetPassword}>
        <input
          type="password"
          placeholder="Nueva contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <br /><br />

        <button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar contraseña"}
        </button>
      </form>
    </div>
  )
}