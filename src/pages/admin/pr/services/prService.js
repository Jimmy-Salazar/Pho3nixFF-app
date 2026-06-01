// src/pages/admin/pr/services/prService.js

import { supabase } from "../../../../supabase"

export async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error

  return data?.session?.user?.id || null
}

export async function fetchPerfil(userId) {
  const { data, error } = await supabase
    .from("perfiles")
    .select("rol,nombre")
    .eq("id", userId)
    .single()

  if (error) {
    console.warn("No se pudo cargar perfil:", error.message)
    return null
  }

  return data
}

export async function fetchEjerciciosPR() {
  const { data, error } = await supabase
    .from("ejercicios")
    .select("id,nombre")
    .order("nombre", { ascending: true })

  if (error) throw error

  return data || []
}

export async function fetchAlumnosPR() {
  const { data, error } = await supabase
    .from("usuarios")
    .select("id,nombre,email,role")
    .in("role", ["Alumno", "alumno", "Coach", "coach"])
    .order("nombre", { ascending: true })

  if (error) throw error

  return data || []
}

export async function fetchTop20PorEjercicio(ejercicioId) {
  if (!ejercicioId) return []

  const { data, error } = await supabase.rpc("top20_por_ejercicio", {
    ejercicio_id_param: ejercicioId,
  })

  if (error) throw error

  return data || []
}

export async function fetchAllPRRecords() {
  const joined = await fetchAllPRRecordsWithJoins()

  if (joined.ok) {
    return joined.rows
  }

  console.warn(
    "No se pudo leer rm con joins. Usando fallback manual:",
    joined.error?.message || joined.error
  )

  return fetchAllPRRecordsFallback()
}

async function fetchAllPRRecordsWithJoins() {
  const { data, error } = await supabase
    .from("rm")
    .select(`
      id,
      usuario,
      ejercicio_id,
      peso_libras,
      fecha,
      created_at,
      usuarios:usuario (
        id,
        nombre,
        email
      ),
      ejercicios:ejercicio_id (
        id,
        nombre
      )
    `)
    .order("peso_libras", { ascending: false })

  if (error) {
    return {
      ok: false,
      error,
      rows: [],
    }
  }

  return {
    ok: true,
    error: null,
    rows: data || [],
  }
}

async function fetchAllPRRecordsFallback() {
  const [{ data: rmRows, error: rmError }, { data: users }, { data: exercises }] =
    await Promise.all([
      supabase
        .from("rm")
        .select("id,usuario,ejercicio_id,peso_libras,fecha,created_at")
        .order("peso_libras", { ascending: false }),
      supabase.from("usuarios").select("id,nombre,email"),
      supabase.from("ejercicios").select("id,nombre"),
    ])

  if (rmError) throw rmError

  const usersMap = new Map((users || []).map((item) => [String(item.id), item]))
  const exercisesMap = new Map(
    (exercises || []).map((item) => [String(item.id), item])
  )

  return (rmRows || []).map((row) => ({
    ...row,
    usuarios: usersMap.get(String(row.usuario)) || null,
    ejercicios: exercisesMap.get(String(row.ejercicio_id)) || null,
  }))
}

export async function insertPRRecord({
  alumnoId,
  ejercicioId,
  pesoLibras,
  fecha,
  registradoPor,
}) {
  const { data, error } = await supabase
    .from("rm")
    .insert({
      usuario: alumnoId,
      ejercicio_id: ejercicioId,
      peso_libras: pesoLibras,
      fecha,
      registrado_por: registradoPor,
    })
    .select()

  if (error) throw error

  return data?.[0] || null
}

export async function fetchHistorialPR({ usuarioId, ejercicioId }) {
  const { data, error } = await supabase
    .from("rm")
    .select("id,fecha,peso_libras")
    .eq("usuario", usuarioId)
    .eq("ejercicio_id", ejercicioId)
    .order("fecha", { ascending: true })

  if (error) throw error

  return data || []
}
