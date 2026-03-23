import { useState } from "react"
import { supabase } from "../../../supabase"

export default function UserForm({ onClose }) {
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [rol, setRol] = useState("Alumno")
  const [loading, setLoading] = useState(false)

  const handleCreate = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.functions.invoke(
      "create-student",
      {
        body: { nombre, email, rol }
      }
    )

    if (error) {
      alert(error.message)
    } else {
      alert("Usuario creado correctamente")
      onClose()
    }

    setLoading(false)
  }

  return (
    <div style={{
      background: "#eee",
      padding: "20px",
      marginTop: "20px"
    }}>
      <form onSubmit={handleCreate}>
        <input
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />

        <br /><br />

        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <br /><br />

        <select
          value={rol}
          onChange={(e) => setRol(e.target.value)}
        >
          <option value="Alumno">Alumno</option>
          <option value="Administrador">Administrador</option>
        </select>

        <br /><br />

        <button disabled={loading}>
          {loading ? "Creando..." : "Crear"}
        </button>

        <button type="button" onClick={onClose}>
          Cancelar
        </button>
      </form>
    </div>
  )
}