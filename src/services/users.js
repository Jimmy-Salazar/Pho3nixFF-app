import { supabase } from "../supabase"

const USERS_SELECT =
  "id,nombre,cedula,email,telefono,role,fecha_nacimiento,foto_url"

export async function fetchUsers({ search = "", role = "all", limit = 100 }) {
  let q = supabase
    .from("usuarios")
    .select(USERS_SELECT)
    .order("nombre", { ascending: true })
    .limit(limit)

  if (role !== "all") q = q.eq("role", role)

  const s = search.trim()
  if (s) {
    const like = `%${s}%`
    q = q.or(`nombre.ilike.${like},email.ilike.${like},cedula.ilike.${like}`)
  }

  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

/**
 * Trae la última mensualidad por usuario para un conjunto de usuarios.
 * Estrategia: trae todas las mensualidades de esos users ordenadas por fecha_fin DESC,
 * y en JS nos quedamos con la primera por usuario_id.
 */
export async function fetchLatestMensualidadesByUserIds(userIds) {
  if (!userIds?.length) return new Map()

  const { data, error } = await supabase
    .from("mensualidades")
    .select("id,usuario_id,fecha_inicio,fecha_fin,estado,created_at")
    .in("usuario_id", userIds)
    .order("fecha_fin", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) throw error

  const map = new Map()
  for (const m of data ?? []) {
    if (!map.has(m.usuario_id)) map.set(m.usuario_id, m) // primera = más reciente
  }
  return map
}

export async function createStudent(payload) {
  const { data, error } = await supabase.functions.invoke("create-student", {
    body: payload,
  })
  if (error) throw error
  return data
}

/**
 * Activa: inserta una nueva mensualidad (recomendado para historial)
 */
export async function activateMensualidad({ usuario_id, fecha_inicio, fecha_fin }) {
  const { error } = await supabase
    .from("mensualidades")
    .insert([
      {
        usuario_id,
        fecha_inicio, // "YYYY-MM-DD"
        fecha_fin,    // "YYYY-MM-DD"
        estado: "Activo",
      },
    ])

  if (error) throw error
}

/**
 * Desactiva: marca como Inactivo la mensualidad más reciente (no borra historial)
 */
export async function deactivateLatestMensualidad({ mensualidad_id }) {
  const { error } = await supabase
    .from("mensualidades")
    .update({ estado: "Inactivo" })
    .eq("id", mensualidad_id)

  if (error) throw error
}

export async function updateUserBasic(userId, { telefono, role, fecha_nacimiento }) {
  const patch = {}
  if (telefono !== undefined) patch.telefono = telefono
  if (role !== undefined) patch.role = role
  if (fecha_nacimiento !== undefined) patch.fecha_nacimiento = fecha_nacimiento

  const { data, error } = await supabase
    .from("usuarios")
    .update(patch)
    .eq("id", userId)
    .select("id,telefono,role,fecha_nacimiento")
    .single()

  if (error) throw error
  return data
}