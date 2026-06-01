import { supabase } from "../../../../supabase"
import { hydratePrRows } from "./prAlumnoUtils"

function throwIfError(error) {
  if (error) {
    throw new Error(error.message || "Error de Supabase")
  }
}

export async function fetchAlumnoPrBundle(userId) {
  if (!userId) {
    throw new Error("No se recibió el usuario autenticado.")
  }

  const [exercisesResponse, prResponse] = await Promise.all([
    supabase
      .from("ejercicios")
      .select("id,nombre,created_at")
      .order("nombre", { ascending: true }),

    supabase
      .from("rm")
      .select("id,usuario,ejercicio_id,peso_libras,fecha,registrado_por,created_at")
      .eq("usuario", userId)
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false }),
  ])

  throwIfError(exercisesResponse.error)
  throwIfError(prResponse.error)

  const exercises = exercisesResponse.data || []
  const rawRows = prResponse.data || []

  return {
    exercises,
    prRows: hydratePrRows(rawRows, exercises),
  }
}

export async function saveAlumnoPr(userId, payload) {
  if (!userId) {
    throw new Error("No se recibió el usuario autenticado.")
  }

  const ejercicioId = payload.ejercicio_id
  const pesoLibras = Number(payload.peso_libras || 0)
  const fecha = payload.fecha

  if (!ejercicioId) {
    throw new Error("Selecciona un ejercicio.")
  }

  if (!pesoLibras || pesoLibras <= 0) {
    throw new Error("Ingresa un peso válido en libras.")
  }

  if (!fecha) {
    throw new Error("Selecciona la fecha del PR.")
  }

  const cleanPayload = {
    usuario: userId,
    ejercicio_id: ejercicioId,
    peso_libras: pesoLibras,
    fecha,
    registrado_por: userId,
  }

  const { data, error } = await supabase
    .from("rm")
    .insert(cleanPayload)
    .select("id,usuario,ejercicio_id,peso_libras,fecha,registrado_por,created_at")
    .single()

  throwIfError(error)
  return data
}

export async function deleteAlumnoPr(userId, id) {
  if (!userId) {
    throw new Error("No se recibió el usuario autenticado.")
  }

  if (!id) {
    throw new Error("No se recibió el registro a eliminar.")
  }

  const { error } = await supabase
    .from("rm")
    .delete()
    .eq("id", id)
    .eq("usuario", userId)

  throwIfError(error)
}
