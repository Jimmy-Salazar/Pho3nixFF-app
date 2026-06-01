// src/pages/admin/pr/utils/formatPR.js

export function formatDate(value) {
  if (!value) return "-"

  try {
    const date = new Date(`${value}T00:00:00`)
    if (Number.isNaN(date.getTime())) return String(value)

    return date.toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch {
    return String(value)
  }
}

export function formatDateShort(value) {
  if (!value) return "-"

  try {
    const date = new Date(`${value}T00:00:00`)
    if (Number.isNaN(date.getTime())) return String(value)

    return date.toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    })
  } catch {
    return String(value)
  }
}

export function formatWeight(value, unit = "lb") {
  const n = Number(value || 0)
  return `${n} ${unit}`
}

export function formatISODate(date = new Date()) {
  return date.toISOString().split("T")[0]
}

export function calculateImprovement(previous, current) {
  const prev = Number(previous)
  const curr = Number(current)

  if (!prev || !curr || curr <= prev) return null

  const diff = curr - prev
  const percent = (diff / prev) * 100

  return {
    diff: round(diff, 1),
    percent: round(percent, 1),
  }
}

export function round(value, decimals = 1) {
  const factor = 10 ** decimals
  return Math.round(Number(value) * factor) / factor
}
