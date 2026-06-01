// src/pages/admin/wods/utils/estimateCalories.js

export function estimateWodCalories({
  nombre = "",
  descripcion = "",
  modoRanking = "sin_ranking",
  modalidad = "single",
}) {
  const text = `${nombre} ${descripcion}`.toLowerCase()
  const isMurph = text.includes("murph")

  if (isMurph) {
    return {
      caloriasMin: 900,
      caloriasMax: 1400,
      intensidad: "Extrema",
      intensidadPuntos: 5,
      duracion: "70 - 100 min",
      cargaMetabolica: 94,
      cardio: 85,
      fuerza: 70,
      intensidadScore: 95,
      nota: "Estimación local basada en Hero WOD, carrera, alto volumen y trabajo gimnástico.",
      tip: "Asegura hidratación, movilidad y estrategia de ritmo.",
      source: "local",
    }
  }

  let score = 30
  let cardio = 25
  let fuerza = 25

  const add = (terms, s, c, f) => {
    if (terms.some((term) => text.includes(term))) {
      score += s
      cardio += c
      fuerza += f
    }
  }

  add(["run", "mile", "carrera", "correr"], 18, 28, 2)
  add(["row", "remo"], 14, 24, 5)
  add(["bike", "assault", "echo"], 15, 28, 4)
  add(["burpee"], 20, 22, 8)
  add(["thruster"], 18, 14, 18)
  add(["wall ball", "wallball"], 14, 12, 14)
  add(["box jump"], 13, 16, 8)
  add(["pull-up", "pull up", "pullup"], 12, 4, 20)
  add(["push-up", "push up", "pushup"], 9, 4, 14)
  add(["squat", "sentadilla"], 8, 6, 12)
  add(["deadlift", "clean", "snatch", "jerk"], 13, 8, 22)
  add(["double under", "du"], 12, 20, 3)

  if (text.includes("amrap")) score += 12
  if (text.includes("emom")) score += 8
  if (text.includes("for time") || modoRanking === "menor_es_mejor") score += 14
  if (modalidad === "duo") score -= 6
  if (modalidad === "trio") score -= 10

  const duration = estimateDuration(text, score)
  const intensidadScore = clamp(score, 20, 96)
  const intensidad = getIntensityLabel(intensidadScore)
  const basePerMin = intensidadScore >= 80 ? 13 : intensidadScore >= 60 ? 10 : intensidadScore >= 40 ? 8 : 6

  const caloriasMin = Math.round((duration.min * basePerMin * 0.8) / 10) * 10
  const caloriasMax = Math.max(
    Math.round((duration.max * basePerMin * 1.25) / 10) * 10,
    caloriasMin + 80
  )

  return {
    caloriasMin,
    caloriasMax,
    intensidad,
    intensidadPuntos: getIntensityPoints(intensidadScore),
    duracion: `${duration.min} - ${duration.max} min`,
    cargaMetabolica: clamp(Math.round((intensidadScore + cardio + fuerza) / 3), 18, 96),
    cardio: clamp(cardio, 15, 95),
    fuerza: clamp(fuerza, 15, 95),
    intensidadScore,
    nota: "Estimación local basada en tipo de ejercicios, volumen, duración e intensidad.",
    tip: getTip(intensidad),
    source: "local",
  }
}

function estimateDuration(text, score) {
  const explicitMin = text.match(/(\d+)\s*(min|mins|minute|minutes|'|’)/)
  if (explicitMin) {
    const value = Number(explicitMin[1])
    return { min: Math.max(8, value - 3), max: value + 8 }
  }

  if (text.includes("amrap")) return { min: 18, max: 28 }
  if (text.includes("emom")) return { min: 12, max: 24 }
  if (score > 85) return { min: 45, max: 75 }
  if (score > 70) return { min: 25, max: 45 }
  if (score > 55) return { min: 18, max: 32 }
  return { min: 12, max: 24 }
}

function getIntensityLabel(score) {
  if (score >= 85) return "Extrema"
  if (score >= 68) return "Alta"
  if (score >= 48) return "Media"
  return "Moderada"
}

function getIntensityPoints(score) {
  if (score >= 85) return 5
  if (score >= 68) return 4
  if (score >= 48) return 3
  if (score >= 30) return 2
  return 1
}

function getTip(intensity) {
  if (intensity === "Extrema") return "Asegura hidratación, movilidad y estrategia de ritmo."
  if (intensity === "Alta") return "Controla el pacing desde el inicio y evita salir demasiado rápido."
  if (intensity === "Media") return "Buen WOD para trabajar técnica e intensidad sostenible."
  return "Ideal para técnica, movilidad y control de respiración."
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0))
}
