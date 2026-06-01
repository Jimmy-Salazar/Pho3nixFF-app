// src/pages/pr/utils/calculateImprovement.js

export function calculateImprovement(previousValue, currentValue) {
  const previous = Number(previousValue)
  const current = Number(currentValue)

  if (!previous || !current || current <= previous) return null

  const absolute = round(current - previous, 1)
  const percent = round(((current - previous) / previous) * 100, 1)

  return { absolute, percent }
}

export function calculatePRStats(records) {
  const uniqueExercises = new Set(records.map((record) => record.exercise)).size
  const improvements = records
    .map((record) => calculateImprovement(record.previousValue, record.value))
    .filter(Boolean)

  const averageImprovement = improvements.length
    ? round(improvements.reduce((sum, item) => sum + Number(item.percent), 0) / improvements.length, 1)
    : 0

  return {
    total: records.length,
    monthlyImprovements: improvements.length,
    uniqueExercises,
    averageImprovement,
  }
}

function round(value, decimals = 1) {
  const factor = 10 ** decimals
  return Math.round(Number(value) * factor) / factor
}
