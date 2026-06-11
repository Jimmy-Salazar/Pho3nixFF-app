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
  const visibleWodIso = getAlumnoVisibleWodDateISO(now)
  const weekRange = getCurrentWeekRange(now)

  const [
    profile,
    membership,
    todayWod,
    previousWods,
    currentWeekWods,
    archivedWods,
  ] = await Promise.all([
    fetchProfile(authUser),
    fetchMembership(authUser.id, now),
    fetchTodayWod(visibleWodIso, now),
    fetchPreviousWods(visibleWodIso),
    fetchCurrentWeekWods(authUser.id, weekRange, now),
    fetchArchivedWods(authUser.id, weekRange),
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
    currentWeekWods,
    archivedWods,
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
    return isAlumnoWodVisibleByDate(item.fecha, now)
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

async function fetchCurrentWeekWods(userId, weekRange, now) {
  const saturdayIso = addDaysISO(weekRange.startIso, 5)

  const { data, error } = await supabase
    .from(TABLES.wods)
    .select(WOD_SELECT_FIELDS)
    .eq("activo", true)
    .eq("publicado", true)
    .gte("fecha", weekRange.startIso)
    .lte("fecha", saturdayIso)
    .order("fecha", { ascending: true })

  if (error) throw error

  const visibleWods = (data || []).filter((item) => {
    return isAlumnoWodVisibleByDate(item.fecha, now)
  })

  return attachUserResultsToWods(visibleWods, userId)
}

async function fetchArchivedWods(userId, weekRange) {
  const { data, error } = await supabase
    .from(TABLES.wods)
    .select(WOD_SELECT_FIELDS)
    .eq("activo", true)
    .eq("publicado", true)
    .gte("fecha", "2026-06-01")
    .lt("fecha", weekRange.startIso)
    .order("fecha", { ascending: false })
    .limit(80)

  if (error) throw error

  return attachUserResultsToWods(data || [], userId)
}

async function attachUserResultsToWods(wods = [], userId) {
  const safeWods = Array.isArray(wods) ? wods : []
  const wodIds = safeWods.map((item) => item.id).filter(Boolean)

  if (!userId || wodIds.length === 0) {
    return safeWods.map((wod) => buildWodListRow(wod, null))
  }

  const { data, error } = await supabase
    .from(TABLES.results)
    .select(
      "id,wod_id,usuario_id,fecha,modalidad,tiempo_segundos,tiempo_texto,repeticiones,notas,observacion,resultado,calorias_estimadas,created_at"
    )
    .eq("usuario_id", userId)
    .in("wod_id", wodIds)
    .order("created_at", { ascending: false })

  if (error) {
    console.warn("No se pudieron cargar resultados del alumno para WODs:", error)
    return safeWods.map((wod) => buildWodListRow(wod, null))
  }

  const resultMap = new Map()

  ;(data || []).forEach((result) => {
    if (!resultMap.has(result.wod_id)) {
      resultMap.set(result.wod_id, result)
    }
  })

  return safeWods.map((wod) => {
    return buildWodListRow(wod, resultMap.get(wod.id) || null)
  })
}

function buildWodListRow(wod, result) {
  const maxCalories = getWodMaxCalories(wod, result?.calorias_estimadas)

  return {
    id: `${wod?.id || "wod"}-${result?.id || "sin-resultado"}`,
    wod_id: wod?.id,
    wod,
    wod_nombre: wod?.nombre,
    wod_fecha: wod?.fecha,
    fecha: wod?.fecha,
    registered: !!result && hasRegisteredResultValue(result),
    result_id: result?.id || null,
    modalidad: result?.modalidad || null,
    tiempo_segundos: result?.tiempo_segundos || null,
    tiempo_texto: result?.tiempo_texto || null,
    repeticiones: result?.repeticiones || 0,
    notas: result?.notas || null,
    observacion: result?.observacion || null,
    resultado: result?.resultado ?? null,
    calorias_estimadas: maxCalories,
    created_at: result?.created_at || wod?.fecha,
  }
}

function addDaysISO(value, amount) {
  const dateString = String(value || "").slice(0, 10)
  const date = new Date(`${dateString}T00:00:00`)

  if (Number.isNaN(date.getTime())) return dateString

  date.setDate(date.getDate() + Number(amount || 0))

  return formatDateISO(date)
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

  const selectedWod =
    result?.__selectedWod ||
    result?.wodSeleccionado ||
    result?.selectedWod ||
    null

  const effectiveWod = selectedWod?.id ? selectedWod : wod

  if (!effectiveWod?.id) {
    throw new Error("No se pudo identificar el WOD seleccionado para registrar el resultado.")
  }

  const registerAvailability = getAlumnoWodRegisterAvailability(
    effectiveWod?.fecha,
    new Date()
  )

  if (!registerAvailability.canRegister) {
    throw new Error(registerAvailability.message)
  }

  const payload = {
    wod_id: effectiveWod.id,
    usuario_id: authUser.id,
    fecha: effectiveWod.fecha || formatDateISO(new Date()),
    modalidad: result.modalidad || "RX",
    tiempo_segundos: result.tiempo_segundos || null,
    tiempo_texto: result.tiempo_texto || null,
    repeticiones: Number(result.repeticiones || 0),
    notas: result.notas || null,
    calorias_estimadas: getWodMaxCalories(effectiveWod, estimatedCalories),
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


function getAlumnoWodRegisterAvailability(wodDate, now = new Date()) {
  const window = getAlumnoWodRegisterWindow(wodDate)

  if (!window) {
    return {
      canRegister: false,
      message: "No se pudo validar la fecha del WOD.",
    }
  }

  const current = now instanceof Date ? now : new Date(now)

  if (current < window.startAt) {
    return {
      canRegister: false,
      message: "El resultado se puede registrar desde las 4AM del día del WOD.",
    }
  }

  return {
    canRegister: true,
    message: "",
  }
}

function getAlumnoWodRegisterWindow(wodDate) {
  if (!wodDate) return null

  const dateString = String(wodDate).slice(0, 10)
  const wodDay = new Date(`${dateString}T00:00:00`)

  if (Number.isNaN(wodDay.getTime())) return null

  const startAt = new Date(wodDay)
  startAt.setHours(4, 0, 0, 0)

  const endAt = new Date(wodDay)
  const day = endAt.getDay()
  const daysUntilSunday = (7 - day) % 7

  endAt.setDate(endAt.getDate() + daysUntilSunday)
  endAt.setHours(17, 0, 0, 0)

  return {
    startAt,
    endAt,
  }
}

function getAlumnoVisibleWodDateISO(now = new Date()) {
  const current = now instanceof Date ? now : new Date(now)
  const cutoff = new Date(current)

  cutoff.setHours(17, 0, 0, 0)

  if (current >= cutoff) {
    const tomorrow = new Date(current)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return formatDateISO(tomorrow)
  }

  return formatDateISO(current)
}

function isAlumnoWodVisibleByDate(wodDate, now = new Date()) {
  if (!wodDate) return true

  const current = now instanceof Date ? now : new Date(now)
  const dateString = String(wodDate).slice(0, 10)
  const wodDay = new Date(`${dateString}T00:00:00`)

  if (Number.isNaN(wodDay.getTime())) return true

  const visibleAt = new Date(wodDay)
  visibleAt.setDate(visibleAt.getDate() - 1)
  visibleAt.setHours(17, 0, 0, 0)

  return current >= visibleAt
}

async function safeFetch(callback, fallback) {
  try {
    return await callback()
  } catch (error) {
    console.warn("Consulta opcional WOD alumno falló:", error)
    return fallback
  }
}
