export function formatDateISO(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function getCurrentWeekRange(date = new Date()) {
  const current = new Date(date)
  const day = current.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day

  const monday = new Date(current)
  monday.setDate(current.getDate() + diffToMonday)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  return {
    start: monday,
    end: sunday,
    startIso: formatDateISO(monday),
    endIso: formatDateISO(sunday),
  }
}

export function buildDefaultMembership() {
  return {
    status: "vencida",
    title: "Sin membresía",
    subtitle: "Consulta con administración",
    progress: 15,
  }
}

export function getMembershipLabel(membership) {
  if (!membership) return buildDefaultMembership()
  return membership
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

export function formatModoRanking(modo) {
  const value = String(modo || "").trim().toLowerCase()

  if (value === "menor_es_mejor") return "For Time"
  if (value === "mayor_es_mejor") return "Max Reps"
  if (value === "sin_ranking") return "Sin ranking"

  return value ? value.replaceAll("_", " ") : "For Time"
}

export function formatModalidad(modalidad) {
  const value = String(modalidad || "").trim().toLowerCase()

  if (value === "single") return "CrossFit"
  if (value === "duo") return "Duo"
  if (value === "trio") return "Trio"

  return modalidad || "CrossFit"
}

export function formatDateLong(value) {
  if (!value) return "Sin fecha"

  try {
    const date = new Date(`${value}T00:00:00`)
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
  if (!value) return "Sin fecha"

  try {
    const date = String(value).includes("T") ? new Date(value) : new Date(`${value}T00:00:00`)
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

export function formatDateBadge(value) {
  if (!value) return { day: "--", month: "---" }

  try {
    const date = new Date(`${value}T00:00:00`)
    const day = new Intl.DateTimeFormat("es-EC", { day: "2-digit" }).format(date)
    const month = new Intl.DateTimeFormat("es-EC", { month: "short" })
      .format(date)
      .replace(".", "")
      .toUpperCase()

    return { day, month }
  } catch {
    return { day: "--", month: "---" }
  }
}

export function extractWorkoutLines(description) {
  const text = String(description || "").trim()
  if (!text) return []

  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 9)
}

export function shouldUseTimeResult(wod) {
  const modo = String(wod?.modo_ranking || "").toLowerCase()
  const nombre = String(wod?.nombre || "").toLowerCase()
  const desc = String(wod?.descripcion || "").toLowerCase()

  if (modo === "menor_es_mejor") return true
  if (nombre.includes("for time") || desc.includes("for time") || desc.includes("por tiempo")) return true

  return false
}

export function parseTimeToSeconds(value) {
  const text = String(value || "").trim()
  if (!text) return null

  const parts = text.split(":").map(Number)

  if (parts.length === 2) {
    const [minutes, seconds] = parts
    return Number(minutes || 0) * 60 + Number(seconds || 0)
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts
    return Number(hours || 0) * 3600 + Number(minutes || 0) * 60 + Number(seconds || 0)
  }

  const asNumber = Number(text)
  return Number.isFinite(asNumber) ? asNumber : null
}

export function formatSeconds(seconds) {
  const value = Number(seconds || 0)
  if (!value) return "--:--"

  const minutes = Math.floor(value / 60)
  const rest = value % 60

  return `${minutes}:${String(rest).padStart(2, "0")}`
}

export function formatResultValue(item) {
  if (!item) return "--"

  if (item.tiempo_texto) return item.tiempo_texto
  if (item.tiempo_total) return item.tiempo_total
  if (item.tiempo_segundos) return formatSeconds(item.tiempo_segundos)
  if (item.resultado_tiempo) return item.resultado_tiempo

  const reps =
    item.repeticiones ??
    item.total_repeticiones ??
    item.resultado_reps ??
    item.resultado_valor

  if (reps !== undefined && reps !== null && reps !== "") return `${reps}`

  return "--"
}

export function formatKcal(value) {
  return new Intl.NumberFormat("es-EC").format(Number(value || 0))
}

export function estimateWodCalories(wod) {
  if (!wod) {
    return {
      value: 0,
      min: 0,
      max: 0,
      source: "Sin WOD",
      notes: [],
    }
  }

  const text = `${wod.nombre || ""} ${wod.descripcion || ""}`.toLowerCase()
  const modo = String(wod.modo_ranking || "").toLowerCase()

  let base = 520

  if (text.includes("murph")) base = 1100
  if (text.includes("run") || text.includes("correr") || text.includes("200m") || text.includes("400m")) base += 160
  if (text.includes("burpee")) base += 180
  if (text.includes("thruster")) base += 160
  if (text.includes("deadlift") || text.includes("clean") || text.includes("snatch")) base += 180
  if (text.includes("pull") || text.includes("toes") || text.includes("bar")) base += 120
  if (text.includes("amrap")) base += 140
  if (modo === "menor_es_mejor") base += 80
  if (modo === "mayor_es_mejor") base += 120

  const rounds = text.match(/(\d+)\s*(rondas|rounds)/)
  if (rounds?.[1]) {
    base += Math.min(Number(rounds[1]) * 45, 250)
  }

  const value = Math.max(Math.round(base / 10) * 10, 350)

  return {
    value,
    min: Math.max(value - 120, 250),
    max: value + 180,
    source: "Estimación IA local",
    notes: [
      "Duración estimada según descripción del WOD",
      "Intensidad de movimientos funcionales",
      "Tipo de scoring y modalidad",
      "Valor referencial; puede variar según ritmo y condición física",
    ],
  }
}

export function buildWeekCaloriesFromResults(results = [], weekRange) {
  const labels = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"]

  const days = labels.map((label) => ({
    label,
    calories: 0,
  }))

  for (const result of results || []) {
    const dateValue =
      result.fecha ||
      result.wod_fecha ||
      result.wod?.fecha ||
      result.created_at

    if (!dateValue) continue

    const date = String(dateValue).includes("T")
      ? new Date(dateValue)
      : new Date(`${dateValue}T00:00:00`)

    const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1

    const calories =
      Number(result.calorias_quemadas || 0) ||
      Number(result.calorias_estimadas || 0) ||
      Number(result.calories || 0) ||
      estimateWodCalories(result.wod || result)?.value ||
      0

    if (days[dayIndex]) {
      days[dayIndex].calories += Number(calories || 0)
    }
  }

  const total = days.reduce((acc, item) => acc + Number(item.calories || 0), 0)

  return {
    total,
    target: 6000,
    days,
  }
}
