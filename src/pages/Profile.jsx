import { useEffect, useState } from "react"
import { supabase } from "../supabase"
import { useNavigate } from "react-router-dom"

export default function Profile() {
  const [user, setUser] = useState(null)
  const [datos, setDatos] = useState(null)
  const [telefono, setTelefono] = useState("")
  const [foto, setFoto] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const loadProfile = async () => {
      const { data } = await supabase.auth.getSession()

      if (!data.session) {
        navigate("/login")
        return
      }

      const currentUser = data.session.user
      setUser(currentUser)

      const { data: usuario, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", currentUser.id)
        .single()

      if (error) {
        console.error(error)
      } else {
        setDatos(usuario)
        setTelefono(usuario.telefono || "")
      }

      setLoading(false)
    }

    loadProfile()
  }, [navigate])

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)

    let fotoUrl = datos.foto_url

    if (foto) {
      const fileName = `${user.id}_${Date.now()}`

      const { error: uploadError } = await supabase.storage
        .from("usuarios")
        .upload(fileName, foto, { upsert: true })

      if (uploadError) {
        alert("Error subiendo imagen")
        setLoading(false)
        return
      }

      const { data } = supabase.storage
        .from("usuarios")
        .getPublicUrl(fileName)

      fotoUrl = data.publicUrl
    }

    const { error } = await supabase
      .from("usuarios")
      .update({
        telefono,
        foto_url: fotoUrl
      })
      .eq("id", user.id)

    if (error) {
      alert("Error actualizando datos")
    } else {
      alert("Perfil actualizado correctamente 🔥")
    }

    setLoading(false)
  }

  if (loading) return <p>Cargando perfil...</p>

  return (
    <div style={{ padding: "40px" }}>
      <h2>Mi Perfil</h2>

      <p><strong>Nombre:</strong> {datos.nombre}</p>
      <p><strong>Cédula:</strong> {datos.cedula}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Rol:</strong> {datos.rol}</p>

      {datos.foto_url && (
        <div>
          <img
            src={datos.foto_url}
            alt="Foto perfil"
            width="150"
          />
        </div>
      )}

      <form onSubmit={handleUpdate}>
        <br />
        <input
          placeholder="Teléfono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        />
        <br /><br />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFoto(e.target.files[0])}
        />
        <br /><br />

        <button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Actualizar Perfil"}
        </button>
      </form>
    </div>
  )
}