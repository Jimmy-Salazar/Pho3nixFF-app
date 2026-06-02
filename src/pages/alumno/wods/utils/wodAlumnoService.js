import { supabase } from "../../../../supabase"
import { mensualidadStatusInfo } from "../../../../utils/mensualidades"
import {
  buildDefaultMembership,
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

const WOD_SELECT_FIELDS =
  "id,nombre,descripcion,modo_ranking,modalidad,fecha,activo,publicado,fecha_publicacion,calorias_min,calorias_max,calorias_nota,intensidad_estimada,duracion_estimada"

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

  const estimatedCalories = {
    ...estimateWodCalories(todayWod),
    value: getWodMaxCalories(todayWod, estimateWodCalories(todayWod)?.value || 0),
  }

  const weeklyCalories = buildWeekCaloriesFromResultsMaxCalories(weekResults, weekRange)

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
    .select("id,nombre,email,role,fecha_nacimiento,foto_url")
    .eq("id", authUser.id)
    .maybeSingle()

  if (error) throw error

  return data || {
    id: authUser.id,
    nombre: authUser.email || "Alumno PHO3NIX",
    email: authUser.email,
    role: "alumno",
    foto_url: null,
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
    .select(WOD_SELECT_FIELDS)
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
    .select(WOD_SELECT_FIELDS)
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
        nombre,
        foto_url
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
    foto_url: row.usuarios?.foto_url || row.foto_url || null,
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
        descripcion,
        fecha,
        modo_ranking,
        modalidad,
        calorias_max
      )
    `
    )
    .eq("usuario_id", userId)
    .order("created_at", { ascending: false })
    .limit(8)

  if (error) throw error

  return (data || [])
    .filter(hasRegisteredResultValue)
    .map((row) => {
      const maxCalories = getWodMaxCalories(row.wod, row.calorias_estimadas)

      return {
        ...row,
        calorias_estimadas: maxCalories,
        wod_nombre: row.wod?.nombre,
        wod_fecha: row.wod?.fecha,
        fecha: row.wod?.fecha || row.created_at,
      }
    })
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
        modalidad,
        calorias_max
      )
    `
    )
    .eq("usuario_id", userId)
    .gte("fecha", weekRange.startIso)
    .lte("fecha", weekRange.endIso)
    .order("fecha", { ascending: true })

  if (error) throw error

  return (data || []).map((row) => {
    const maxCalories = getWodMaxCalories(row.wod, row.calorias_estimadas)

    return {
      ...row,
      calorias_estimadas: maxCalories,
      wod_fecha: row.wod?.fecha,
      fecha: row.fecha || row.wod?.fecha || row.created_at,
    }
  })
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
    calorias_estimadas: getWodMaxCalories(wod, estimatedCalories),
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

function hasRegisteredResultValue(row) {
  const hasTime =
    Number(row?.tiempo_segundos || 0) > 0 ||
    String(row?.tiempo_texto || "").trim().length > 0

  const hasReps = Number(row?.repeticiones || 0) > 0
  const hasOldResult =
    row?.resultado !== null &&
    row?.resultado !== undefined &&
    String(row?.resultado).trim() !== ""

  return hasTime || hasReps || hasOldResult
}

function getWodMaxCalories(wod, fallback = 0) {
  const maxCalories = Number(wod?.calorias_max || 0)

  if (maxCalories > 0) {
    return maxCalories
  }

  const directValue =
    wod?.calorias_wod ??
    wod?.calorias ??
    wod?.calorias_estimadas ??
    wod?.calorias_estimada ??
    wod?.kcal ??
    null

  if (directValue !== null && directValue !== undefined && Number(directValue) > 0) {
    return Number(directValue)
  }

  return Number(fallback || 0)
}


function buildWeekCaloriesFromResultsMaxCalories(results = [], weekRange) {
  const days = buildWeekDays(weekRange)
  const counted = new Set()

  results.forEach((row) => {
    const resultDate = row.fecha || row.wod_fecha || row.wod?.fecha || row.created_at
    const index = getWeekDayIndex(resultDate, weekRange)

    if (index < 0 || index > 6) return

    const uniqueKey = row.wod_id || row.wod?.id || row.id

    if (uniqueKey) {
      const key = `${index}-${uniqueKey}`

      if (counted.has(key)) return
      counted.add(key)
    }

    const calories = getWodMaxCalories(row.wod, row.calorias_estimadas)

    days[index].calories += Number(calories || 0)
  })

  const total = days.reduce((sum, item) => sum + Number(item.calories || 0), 0)

  return {
    total,
    target: 6000,
    days,
  }
}

function buildWeekDays(weekRange) {
  const labels = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"]

  return labels.map((label) => ({
    label,
    calories: 0,
  }))
}

function getWeekDayIndex(value, weekRange) {
  if (!value) return -1

  const dateString = String(value).slice(0, 10)
  const startString = String(weekRange?.startIso || "").slice(0, 10)

  if (!dateString || !startString) return -1

  const date = new Date(`${dateString}T00:00:00`)
  const start = new Date(`${startString}T00:00:00`)

  if (Number.isNaN(date.getTime()) || Number.isNaN(start.getTime())) return -1

  return Math.floor((date.getTime() - start.getTime()) / 86400000)
}


async function safeFetch(callback, fallback) {
  try {
    return await callback()
  } catch (error) {
    console.warn("Consulta opcional WOD alumno falló:", error)
    return fallback
  }
}
