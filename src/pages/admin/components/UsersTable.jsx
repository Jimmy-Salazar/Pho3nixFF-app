import { useEffect, useState } from "react"
import { supabase } from "../../../supabase"

export default function UsersTable() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("perfiles")
      .select("id, nombre, email, rol")

    setUsers(data || [])
  }

  return (
    <table border="1" cellPadding="10" style={{ marginTop: "20px" }}>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Email</th>
          <th>Rol</th>
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <tr key={user.id}>
            <td>{user.nombre}</td>
            <td>{user.email}</td>
            <td>{user.rol}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}