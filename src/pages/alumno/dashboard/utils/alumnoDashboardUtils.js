export function normalizeRole(role) {
  const r = String(role || "").trim().toLowerCase()

  if (r === "admin" || r === "administrador") return "admin"
  if (r === "coach") return "coach"
  if (r === "alumno" || r === "student") return "alumno"

  return r
}

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
    startIso: formatDateISO(monday),
    endIso: formatDateISO(sunday),
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

export function getUpcomingBirthdays(users = [], date = new Date(), limit = 12) {
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const currentYear = today.getFullYear()

  return users
    .filter((user) => !!user.fecha_nacimiento)
    .map((user) => {
      const parts = String(user.fecha_nacimiento).split("-").map(Number)
      const month = parts[1]
      const day = parts[2]

      if (!month || !day) return null

      const thisYearBirthday = new Date(currentYear, month - 1, day)
      const nextBirthday =
        thisYearBirthday < today
          ? new Date(currentYear + 1, month - 1, day)
          : thisYearBirthday

      const daysUntil = Math.round(
        (nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      return {
        id: user.id,
        nombre: user.nombre || "Alumno PHO3NIX",
        fecha_nacimiento: user.fecha_nacimiento,
        nextBirthday,
        daysUntil,
        day,
        monthIndex: month - 1,
        monthLabel: getMonthName(month - 1),
        year: nextBirthday.getFullYear(),
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, limit)
}

export function getMonthName(monthIndex) {
  const months = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ]

  return months[monthIndex] || ""
}

export function formatShortDate(value) {
  if (!value) return "Sin fecha"

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
    const date = new Date(value)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) return "Hoy"
    if (diffDays === 1) return "Hace 1 día"

    return `Hace ${diffDays} días`
  } catch {
    return "Sin fecha"
  }
}