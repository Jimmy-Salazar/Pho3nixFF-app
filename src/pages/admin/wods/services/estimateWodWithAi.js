// src/pages/admin/wods/services/estimateWodWithAi.js

import { supabase } from "../../../../supabase"
import { estimateWodCalories } from "../utils/estimateCalories"

export async function estimateWodWithAi({
  nombre,
  descripcion,
  modalidad,
  modoRanking,
}) {
  try {
    const { data, error } = await supabase.functions.invoke("estimate-wod-calories", {
      body: {
        nombre,
        descripcion,
        modalidad,
        modo_ranking: modoRanking,
      },
    })

    if (error) throw error
    if (!data?.ok) throw new Error(data?.error || "No se pudo estimar con IA")

    return normalizeAiEstimate(data.estimate)
  } catch (error) {
    console.warn("IA no disponible, usando estimación local:", error)

    const local = estimateWodCalories({
      nombre,
      descripcion,
      modalidad,
      modoRanking,
    })

    return {
      ...local,
      nota: `${local.nota} (estimación local de respaldo)`,
      source: "local",
    }
  }
}

function normalizeAiEstimate(input) {
  const intensidadScore = clamp(input?.intensidad_score, 0, 100)

  return {
    caloriasMin: clamp(input?.calorias_min, 80, 2500),
    caloriasMax: clamp(input?.calorias_max, 120, 3000),
    intensidad: input?.intensidad_estimada || "Media",
    duracion: input?.duracion_estimada || "15-30 min",
    cargaMetabolica: clamp(input?.carga_metabolica, 0, 100),
    cardio: clamp(input?.cardio, 0, 100),
    fuerza: clamp(input?.fuerza, 0, 100),
    intensidadScore,
    intensidadPuntos: getIntensityPoints(intensidadScore),
    nota:
      input?.calorias_nota ||
      "Estimación IA basada en movimientos, duración, volumen e intensidad.",
    tip: input?.tip || "Usa esta cifra como referencia aproximada.",
    source: "gemini",
  }
}

function getIntensityPoints(score) {
  if (score >= 85) return 5
  if (score >= 68) return 4
  if (score >= 48) return 3
  if (score >= 30) return 2
  return 1
}

function clamp(value, min, max) {
  const n = Math.round(Number(value))
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, n))
}
