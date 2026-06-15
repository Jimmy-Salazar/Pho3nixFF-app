const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

type AnalisisNutricion = {
  resumen: string
  diagnostico: string
  nutricion: string
  entrenamiento: string
  pre_wod: string
  post_wod: string
  hidratacion: string
  descanso: string
  alerta: string
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  })
}

function extraerTextoGemini(data: any) {
  return (
    data?.candidates?.[0]?.content?.parts
      ?.map((part: any) => part?.text || "")
      .join("")
      .trim() || ""
  )
}

function limpiarJson(texto: string) {
  return texto
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim()
}

function validarAnalisis(analisis: Partial<AnalisisNutricion>): AnalisisNutricion {
  return {
    resumen: String(analisis.resumen || ""),
    diagnostico: String(analisis.diagnostico || ""),
    nutricion: String(analisis.nutricion || ""),
    entrenamiento: String(analisis.entrenamiento || ""),
    pre_wod: String(analisis.pre_wod || ""),
    post_wod: String(analisis.post_wod || ""),
    hidratacion: String(analisis.hidratacion || ""),
    descanso: String(analisis.descanso || ""),
    alerta:
      String(analisis.alerta || "") ||
      "Este análisis es orientativo y no reemplaza consulta médica o nutricional profesional.",
  }
}

function crearPrompt(payload: any) {
  return `
Actúa como nutricionista deportivo y entrenador experto en entrenamiento funcional tipo CrossFit.

Tu tarea es generar un análisis nutricional y deportivo mensual para un atleta de PHO3NIX Functional Fitness.

REGLAS OBLIGATORIAS:
- Responde únicamente en español.
- No diagnostiques enfermedades.
- No reemplaces consulta médica ni nutricional profesional.
- No recomiendes medicamentos, quemadores de grasa, hormonas, esteroides ni sustancias prohibidas.
- No recomiendes dietas extremas.
- No des menús médicos cerrados.
- No prometas resultados exactos.
- Usa tono profesional, claro, práctico y motivador.
- Considera que el rango saludable por IMC es solo una referencia.
- En atletas de fuerza o CrossFit, evalúa peso junto con rendimiento, asistencia, PRs, calorías, recuperación y evolución.
- Si detectas riesgo, fatiga, peso muy bajo, cambios bruscos o lesión, recomienda consultar a un profesional.

DATOS DEL ATLETA:
${JSON.stringify(payload, null, 2)}

Devuelve SOLO un JSON válido con esta estructura exacta:

{
  "resumen": "",
  "diagnostico": "",
  "nutricion": "",
  "entrenamiento": "",
  "pre_wod": "",
  "post_wod": "",
  "hidratacion": "",
  "descanso": "",
  "alerta": ""
}

Instrucciones para cada campo:

resumen:
Resumen corto de la situación del atleta y su objetivo.

diagnostico:
Análisis del peso, estatura, edad, IMC, rango saludable de referencia, meta y rendimiento. Aclara que el peso no se interpreta solo.

nutricion:
Recomendación práctica de alimentación deportiva según meta:
perder grasa, recomposición, ganar masa muscular o mejorar rendimiento.

entrenamiento:
Recomendación sobre constancia, frecuencia, intensidad, recuperación y progreso.

pre_wod:
Consejo simple antes del entrenamiento.

post_wod:
Consejo simple después del entrenamiento.

hidratacion:
Consejo de hidratación aplicable a entrenamiento funcional.

descanso:
Consejo sobre sueño, recuperación y fatiga.

alerta:
Advertencia profesional obligatoria indicando que es una guía orientativa y no reemplaza consulta médica/nutricional.
`
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders })
    }

    if (req.method !== "POST") {
      return jsonResponse(
        {
          error: "Método no permitido. Usa POST.",
        },
        405
      )
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY")
    const model = Deno.env.get("GEMINI_MODEL") || "gemini-3.1-flash-lite"

    if (!apiKey) {
      return jsonResponse(
        {
          error: "Falta configurar GEMINI_API_KEY en Supabase Secrets.",
        },
        500
      )
    }

    const payload = await req.json()

    if (!payload?.usuario?.id) {
      return jsonResponse(
        {
          error: "Payload inválido: falta usuario.id.",
        },
        400
      )
    }

    if (!payload?.perfil_nutricional?.peso_kg) {
      return jsonResponse(
        {
          error: "Payload inválido: falta peso_kg.",
        },
        400
      )
    }

    if (!payload?.perfil_nutricional?.estatura_cm) {
      return jsonResponse(
        {
          error: "Payload inválido: falta estatura_cm.",
        },
        400
      )
    }

    if (!payload?.perfil_nutricional?.meta) {
      return jsonResponse(
        {
          error: "Payload inválido: falta meta.",
        },
        400
      )
    }

    const prompt = crearPrompt(payload)

    const endpoint =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    const geminiResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.35,
          topP: 0.9,
          maxOutputTokens: 1600,
          responseMimeType: "application/json",
        },
      }),
    })

    const geminiData = await geminiResponse.json()

    if (!geminiResponse.ok) {
      return jsonResponse(
        {
          error: "Error al consultar Gemini.",
          detalle: geminiData,
        },
        500
      )
    }

    const texto = extraerTextoGemini(geminiData)

    if (!texto) {
      return jsonResponse(
        {
          error: "Gemini no devolvió texto.",
          detalle: geminiData,
        },
        500
      )
    }

    let parsed: any

    try {
      parsed = JSON.parse(limpiarJson(texto))
    } catch (_error) {
      return jsonResponse(
        {
          error: "No se pudo convertir la respuesta de IA a JSON.",
          respuesta_raw: texto,
        },
        500
      )
    }

    const analisis = validarAnalisis(parsed)

    return jsonResponse({
      ok: true,
      analisis,
    })
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Error inesperado.",
      },
      500
    )
  }
})