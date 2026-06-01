import { supabase } from "../../../../supabase"
import { mensualidadStatusInfo } from "../../../../utils/mensualidades"
import {
  buildDefaultMembership,
  buildWeekCaloriesFromResults,
  estimateWodCalories,
  formatDateISO,
  getCurrentWeekRange,
} from "./wodAlumnoUtils"

const TABLES = {
  users: "usuarios",
  memberships: "mensualidades",
  wods: "wod",
  results: "wod_resultados",
}

export async function fetchAlumnoWodData() {
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError) throw authError

  const authUser = authData?.user

  if (!authUser?.id) {
    throw new Error("No se encontró una sesión activa.")
  }

  const now = new Date()
  const todayIso = formatDateISO(now)
  const weekRange = getCurrentWeekRange(now)

  const [
    profile,
    membership,
    todayWod,
    previousWods,
  ] = await Promise.all([
    fetchProfile(authUser),
    fetchMembership(authUser.id, now),
    fetchTodayWod(todayIso, now),
    fetchPreviousWods(todayIso),
  ])

  const [
    dayHistory,
    recentResults,
    weekResults,
  ] = await Promise.all([
    todayWod?.id ? safeFetch(() => fetchDayHistory(todayWod.id), []) : [],
    safeFetch(() => fetchMyRecentResults(authUser.id), []),
    safeFetch(() => fetchWeekResults(authUser.id, weekRange), []),
  ])

  const estimatedCalories = estimateWodCalories(todayWod)
  const weeklyCalories = buildWeekCaloriesFromResults(weekResults, weekRange)

  return {
    profile,
    membership,
    todayWod,
    previousWods,
    dayHistory,
    recentResults,
    weeklyCalories,
    estimatedCalories,
  }
}

async function fetchProfile(authUser) {
  const { data, error } = await supabase
    .from(TABLES.users)
    .select("id,nombre,email,role,fecha_nacimiento")
    .eq("id", authUser.id)
    .maybeSingle()

  if (error) throw error

  return data || {
    id: authUser.id,
    nombre: authUser.email || "Alumno PHO3NIX",
    email: authUser.email,
    role: "alumno",
  }
}

async function fetchMembership(userId, now) {
  const { data, error } = await supabase
    .from(TABLES.memberships)
    .select("id,usuario_id,fecha_inicio,fecha_fin,estado,created_at")
    .eq("usuario_id", userId)
    .order("fecha_fin", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)

  if (error) throw error

  const membership = data?.[0] || null
  if (!membership) return buildDefaultMembership()

  const info = mensualidadStatusInfo(membership, now)

  if (!info.active) {
    return {
      status: "vencida",
      title: "Vencida",
      subtitle: "Renueva tu mensualidad",
      progress: 15,
    }
  }

  if (info.daysLeft !== null && info.daysLeft <= 7) {
    return {
      status: "por_vencer",
      title: "Por vencer",
      subtitle:
        info.daysLeft === 0
          ? "Vence hoy"
          : `Vence en ${info.daysLeft} día(s)`,
      progress: 72,
    }
  }

  return {
    status: "activa",
    title: "Activa",
    subtitle:
      info.daysLeft !== null
        ? `Vence en ${info.daysLeft} día(s)`
        : "Mensualidad activa",
    progress: 92,
  }
}

async function fetchTodayWod(todayIso, now) {
  const { data, error } = await supabase
    .from(TABLES.wods)
    .select("id,nombre,descripcion,modo_ranking,modalidad,fecha,activo,publicado,fecha_publicacion")
    .eq("fecha", todayIso)
    .eq("activo", true)
    .limit(5)

  if (error) throw error

  const visibleRows = (data || []).filter((item) => {
    if (item.publicado === true && item.fecha_publicacion) {
      return new Date(item.fecha_publicacion) <= now
    }

    return true
  })

  return visibleRows[0] || null
}

async function fetchPreviousWods(todayIso) {
  const { data, error } = await supabase
    .from(TABLES.wods)
    .select("id,nombre,descripcion,modo_ranking,modalidad,fecha,activo,publicado,fecha_publicacion")
    .eq("activo", true)
    .lt("fecha", todayIso)
    .order("fecha", { ascending: false })
    .limit(8)

  if (error) throw error
  return data || []
}

async function fetchDayHistory(wodId) {
  const { data, error } = await supabase
    .from(TABLES.results)
    .select(
      `
      *,
      usuarios (
        id,
        nombre
      )
    `
    )
    .eq("wod_id", wodId)
    .order("tiempo_segundos", { ascending: true, nullsFirst: false })
    .order("repeticiones", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: true })

  if (error) throw error

  return (data || []).map((row) => ({
    ...row,
    nombre: row.usuarios?.nombre || row.nombre || "Alumno PHO3NIX",
  }))
}

async function fetchMyRecentResults(userId) {
  const { data, error } = await supabase
    .from(TABLES.results)
    .select(
      `
      *,
      wod:wod_id (
        id,
        nombre,
        fecha,
        modo_ranking,
        modalidad
      )
    `
    )
    .eq("usuario_id", userId)
    .order("created_at", { ascending: false })
    .limit(8)

  if (error) throw error

  return (data || []).map((row) => ({
    ...row,
    wod_nombre: row.wod?.nombre,
    wod_fecha: row.wod?.fecha,
    fecha: row.wod?.fecha || row.created_at,
  }))
}

async function fetchWeekResults(userId, weekRange) {
  const { data, error } = await supabase
    .from(TABLES.results)
    .select(
      `
      *,
      wod:wod_id (
        id,
        nombre,
        descripcion,
        fecha,
        modo_ranking,
        modalidad
      )
    `
    )
    .eq("usuario_id", userId)
    .gte("fecha", weekRange.startIso)
    .lte("fecha", weekRange.endIso)
    .order("fecha", { ascending: true })

  if (error) throw error

  return (data || []).map((row) => ({
    ...row,
    wod_fecha: row.wod?.fecha,
    fecha: row.fecha || row.wod?.fecha || row.created_at,
  }))
}

export async function saveAlumnoWodResult({ wod, result, estimatedCalories }) {
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError) throw authError

  const authUser = authData?.user

  if (!authUser?.id) {
    throw new Error("No se encontró una sesión activa.")
  }

  const payload = {
    wod_id: wod.id,
    usuario_id: authUser.id,
    fecha: wod.fecha || formatDateISO(new Date()),
    modalidad: result.modalidad || "RX",
    tiempo_segundos: result.tiempo_segundos || null,
    tiempo_texto: result.tiempo_texto || null,
    repeticiones: Number(result.repeticiones || 0),
    notas: result.notas || null,
    calorias_estimadas: Number(estimatedCalories || 0),
  }

  const { data, error } = await supabase
    .from(TABLES.results)
    .insert(payload)
    .select()
    .single()

  if (error) {
    throw new Error(
      `${error.message}. Revisa que exista la tabla "${TABLES.results}" con las columnas esperadas.`
    )
  }

  return data
}

async function safeFetch(callback, fallback) {
  try {
    return await callback()
  } catch (error) {
    console.warn("Consulta opcional WOD alumno falló:", error)
    return fallback
  }
}
