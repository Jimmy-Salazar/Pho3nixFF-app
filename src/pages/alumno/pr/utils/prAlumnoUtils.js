export function normalizeNumber(value) {
  const number = Number(value || 0)
  return Number.isFinite(number) ? number : 0
}

export function formatLb(value) {
  const number = normalizeNumber(value)
  if (!number) return "--"
  return `${number} lb`
}

export function formatDateShort(value) {
  if (!value) return "Sin fecha"

  try {
    const date = new Date(`${value}T00:00:00`)
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

export function formatDateCompact(value) {
  if (!value) return "--"

  try {
    const date = new Date(`${value}T00:00:00`)
    return new Intl.DateTimeFormat("es-EC", {
      day: "2-digit",
      month: "short",
    })
      .format(date)
      .replace(".", "")
  } catch {
    return String(value)
  }
}

export function formatRelativeDate(value) {
  if (!value) return "Sin fecha"

  try {
    const date = value.includes("T") ? new Date(value) : new Date(`${value}T00:00:00`)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const diff = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24))

    if (diff <= 0) return "Hoy"
    if (diff === 1) return "Hace 1 día"
    return `Hace ${diff} días`
  } catch {
    return "Sin fecha"
  }
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

export function firstName(name) {
  return String(name || "Alumno").trim().split(" ")[0] || "Alumno"
}

export function buildExerciseNameMap(exercises = []) {
  const map = new Map()

  exercises.forEach((exercise) => {
    map.set(exercise.id, exercise.nombre || "Ejercicio")
  })

  return map
}

export function hydratePrRows(rows = [], exercises = []) {
  const exerciseMap = buildExerciseNameMap(exercises)

  return (rows || []).map((row) => ({
    ...row,
    peso_libras: normalizeNumber(row.peso_libras),
    ejercicio_nombre: exerciseMap.get(row.ejercicio_id) || "Ejercicio",
  }))
}

export function getLatestPr(rows = []) {
  return [...rows].sort((a, b) => {
    const dateA = new Date(`${a.fecha || "1900-01-01"}T00:00:00`).getTime()
    const dateB = new Date(`${b.fecha || "1900-01-01"}T00:00:00`).getTime()

    if (dateA !== dateB) return dateB - dateA

    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  })[0] || null
}

export function getBestPrOverall(rows = []) {
  return [...rows].sort((a, b) => normalizeNumber(b.peso_libras) - normalizeNumber(a.peso_libras))[0] || null
}

export function getBestMarksByExercise(rows = []) {
  const bestMap = new Map()

  rows.forEach((row) => {
    const current = bestMap.get(row.ejercicio_id)

    if (!current || normalizeNumber(row.peso_libras) > normalizeNumber(current.peso_libras)) {
      bestMap.set(row.ejercicio_id, row)
    }
  })

  return Array.from(bestMap.values()).sort((a, b) =>
    String(a.ejercicio_nombre).localeCompare(String(b.ejercicio_nombre))
  )
}

export function getStrongestExercise(rows = []) {
  const best = getBestPrOverall(rows)
  return best || null
}

export function getExerciseProgressRows(rows = [], exerciseId) {
  return rows
    .filter((row) => row.ejercicio_id === exerciseId)
    .sort((a, b) => {
      const dateA = new Date(`${a.fecha || "1900-01-01"}T00:00:00`).getTime()
      const dateB = new Date(`${b.fecha || "1900-01-01"}T00:00:00`).getTime()

      if (dateA !== dateB) return dateA - dateB

      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
    })
}

export function buildSummary(rows = []) {
  const latestPr = getLatestPr(rows)
  const bestPr = getBestPrOverall(rows)
  const strongest = getStrongestExercise(rows)
  const bestByExercise = getBestMarksByExercise(rows)

  return {
    total: rows.length,
    latestPr,
    bestPr,
    strongest,
    bestByExercise,
  }
}

export function todayISO() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
