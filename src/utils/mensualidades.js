export function normalizeMensualidadEstado(value) {
  return String(value || "").trim().toLowerCase()
}

export function parseEndOfDay(dateString) {
  if (!dateString) return null
  const d = new Date(`${dateString}T23:59:59`)
  return Number.isNaN(d.getTime()) ? null : d
}

export function isMensualidadActiva(mensualidad, now = new Date()) {
  if (!mensualidad) return false

  const estado = normalizeMensualidadEstado(mensualidad.estado)
  const endDate = parseEndOfDay(mensualidad.fecha_fin)

  if (estado !== "activo") return false
  if (!endDate) return false

  return endDate.getTime() >= now.getTime()
}

export function daysUntilFechaFin(fechaFin, now = new Date()) {
  const endDate = parseEndOfDay(fechaFin)
  if (!endDate) return null

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())

  const diffMs = endDay.getTime() - today.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

export function mensualidadStatusInfo(mensualidad, now = new Date()) {
  const active = isMensualidadActiva(mensualidad, now)
  const daysLeft = mensualidad?.fecha_fin
    ? daysUntilFechaFin(mensualidad.fecha_fin, now)
    : null

  return {
    active,
    daysLeft,
    fechaFin: mensualidad?.fecha_fin || null,
    estado: normalizeMensualidadEstado(mensualidad?.estado),
  }
}