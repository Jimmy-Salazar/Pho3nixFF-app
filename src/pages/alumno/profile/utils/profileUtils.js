export function normalizeRole(role) {
  const r = String(role || "").trim().toLowerCase()
  if (r === "admin" || r === "administrador") return "admin"
  if (r === "coach") return "coach"
  if (r === "alumno" || r === "student") return "alumno"
  return r || "alumno"
}

export function getInitials(name) {
  const parts = String(name || "PH")
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) return "PH"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function buildExerciseMap(exercises = []) {
  return new Map((exercises || []).map((item) => [item.id, item.nombre]))
}

export function normalizeRmRows(rows = [], exerciseMap = new Map()) {
  return (rows || []).map((row) => ({
    ...row,
    exerciseName: exerciseMap.get(row.ejercicio_id) || "Ejercicio",
    peso_libras: Number(row.peso_libras || 0),
  }))
}

export function calculateProfileStats(rows = []) {
  const safeRows = [...(rows || [])].sort((a, b) => {
    const dateA = new Date(`${a.fecha || a.created_at}`).getTime()
    const dateB = new Date(`${b.fecha || b.created_at}`).getTime()
    return dateB - dateA
  })

  const latestPr = safeRows[0] || null

  const bestGeneral = safeRows.reduce((best, item) => {
    if (!best) return item
    return Number(item.peso_libras || 0) > Number(best.peso_libras || 0) ? item : best
  }, null)

  const bestByExerciseMap = new Map()

  for (const item of safeRows) {
    const key = item.ejercicio_id || item.exerciseName
    const current = bestByExerciseMap.get(key)

    if (!current || Number(item.peso_libras || 0) > Number(current.peso_libras || 0)) {
      bestByExerciseMap.set(key, item)
    }
  }

  const bestByExercise = Array.from(bestByExerciseMap.values()).sort(
    (a, b) => Number(b.peso_libras || 0) - Number(a.peso_libras || 0)
  )

  const strongestExercise = bestByExercise[0] || null

  return {
    total: safeRows.length,
    latestPr,
    bestGeneral,
    strongestExercise,
    bestByExercise,
    recent: safeRows.slice(0, 5),
  }
}

export function getMembershipLabel(mensualidad, info) {
  if (!mensualidad || !info) {
    return {
      status: "vencida",
      title: "Sin membresía",
      subtitle: "Consulta con administración",
      progress: 15,
    }
  }

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
        info.daysLeft === 0 ? "Vence hoy" : `Vence en ${info.daysLeft} día(s)`,
      progress: 72,
    }
  }

  return {
    status: "activa",
    title: "Activa",
    subtitle:
      info.daysLeft !== null ? `Vence en ${info.daysLeft} día(s)` : "Mensualidad activa",
    progress: 92,
  }
}

export function formatDateLong(value) {
  if (!value) return "Sin fecha"

  try {
    const date = normalizeDate(value)
    return new Intl.DateTimeFormat("es-EC", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date)
  } catch {
    return String(value)
  }
}

export function formatDateShort(value) {
  if (!value) return "-"

  try {
    const date = normalizeDate(value)
    return new Intl.DateTimeFormat("es-EC", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
      .format(date)
      .replace(".", "")
  } catch {
    return String(value)
  }
}

export function formatDateDMY(value) {
  if (!value) return ""
  try {
    const [year, month, day] = String(value).split("-")
    if (!year || !month || !day) return String(value)
    return `${day}/${month}/${year}`
  } catch {
    return String(value)
  }
}

export function relativeDate(value) {
  if (!value) return "Sin fecha"

  try {
    const date = normalizeDate(value)
    const today = new Date()
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const diff = Math.floor((start.getTime() - end.getTime()) / (1000 * 60 * 60 * 24))

    if (diff <= 0) return "Hoy"
    if (diff === 1) return "Hace 1 día"
    return `Hace ${diff} días`
  } catch {
    return "Sin fecha"
  }
}

function normalizeDate(value) {
  if (value instanceof Date) return value
  const raw = String(value)
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return new Date(`${raw}T00:00:00`)
  }
  return new Date(raw)
}
