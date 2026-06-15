import { supabase } from "../../../../supabase"

const METAS_LABELS = {
  perder_grasa: "Perder grasa",
  recomposicion: "Mantener / recomposición corporal",
  ganar_masa_muscular: "Ganar masa muscular",
  mejorar_rendimiento: "Mejorar rendimiento deportivo",
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10)
}

function fechaHaceDias(dias = 30) {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() - dias)
  return fecha.toISOString().slice(0, 10)
}

function sumarDiasISO(fechaBase, dias = 30) {
  const fecha = new Date(`${fechaBase}T00:00:00`)
  fecha.setDate(fecha.getDate() + dias)
  return fecha.toISOString().slice(0, 10)
}

function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null

  const hoy = new Date()
  const nacimiento = new Date(`${fechaNacimiento}T00:00:00`)

  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const mes = hoy.getMonth() - nacimiento.getMonth()

  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--
  }

  return edad
}

function calcularIMC(pesoKg, estaturaCm) {
  const peso = Number(pesoKg)
  const estaturaM = Number(estaturaCm) / 100

  if (!peso || !estaturaM) return null

  return peso / (estaturaM * estaturaM)
}

function calcularRangoSaludable(estaturaCm) {
  const estaturaM = Number(estaturaCm) / 100

  if (!estaturaM) {
    return {
      min: null,
      max: null,
    }
  }

  return {
    min: 18.5 * estaturaM * estaturaM,
    max: 24.9 * estaturaM * estaturaM,
  }
}

function calcularDiferenciaRango(pesoKg, rango) {
  const peso = Number(pesoKg)

  if (!peso || !rango?.min || !rango?.max) return null

  if (peso > rango.max) return peso - rango.max
  if (peso < rango.min) return peso - rango.min

  return 0
}

function calcularDiasRestantes(proximoAnalisis) {
  if (!proximoAnalisis) return 0

  const hoy = new Date(`${hoyISO()}T00:00:00`)
  const proximo = new Date(`${proximoAnalisis}T00:00:00`)
  const diff = proximo.getTime() - hoy.getTime()

  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function obtenerMejorModalidad(resultados = []) {
  const conteo = {}

  resultados.forEach((item) => {
    const modalidad = item.modalidad || "Sin modalidad"
    conteo[modalidad] = (conteo[modalidad] || 0) + 1
  })

  const ordenado = Object.entries(conteo).sort((a, b) => b[1] - a[1])

  return ordenado[0]?.[0] || null
}

function calcularScorePho3nix({
  wods30Dias = 0,
  calorias30Dias = 0,
  diasEntrenados30Dias = 0,
  prs30Dias = 0,
}) {
  let score = 0

  // Constancia: hasta 40 puntos
  if (diasEntrenados30Dias >= 16) score += 40
  else if (diasEntrenados30Dias >= 12) score += 34
  else if (diasEntrenados30Dias >= 8) score += 26
  else if (diasEntrenados30Dias >= 4) score += 16
  else score += diasEntrenados30Dias * 3

  // Participación WOD: hasta 30 puntos
  if (wods30Dias >= 18) score += 30
  else if (wods30Dias >= 14) score += 25
  else if (wods30Dias >= 10) score += 20
  else if (wods30Dias >= 6) score += 12
  else score += wods30Dias

  // Calorías: hasta 15 puntos
  if (calorias30Dias >= 6000) score += 15
  else if (calorias30Dias >= 4500) score += 12
  else if (calorias30Dias >= 3000) score += 9
  else if (calorias30Dias >= 1500) score += 5

  // PRs: hasta 15 puntos
  if (prs30Dias >= 3) score += 15
  else if (prs30Dias === 2) score += 12
  else if (prs30Dias === 1) score += 8

  return Math.max(0, Math.min(100, Math.round(score)))
}

function validarPerfilNutricional(payload) {
  const peso = Number(payload?.peso_kg)
  const estatura = Number(payload?.estatura_cm)

  if (!peso || peso <= 0) {
    throw new Error("Ingresa un peso válido.")
  }

  if (!estatura || estatura <= 0) {
    throw new Error("Ingresa una estatura válida.")
  }

  if (!payload?.meta) {
    throw new Error("Selecciona una meta.")
  }

  if (!METAS_LABELS[payload.meta]) {
    throw new Error("La meta seleccionada no es válida.")
  }
}

function limpiarResultadosParaIA(resultados = []) {
  return resultados.slice(0, 30).map((item) => ({
    id: item.id,
    wod_id: item.wod_id,
    resultado: item.resultado,
    calorias_estimadas: item.calorias_estimadas,
    fecha: item.fecha,
    modalidad: item.modalidad,
    tiempo_segundos: item.tiempo_segundos,
    tiempo_texto: item.tiempo_texto,
    repeticiones: item.repeticiones,
    notas: item.notas,
  }))
}

function limpiarPrsParaIA(prs = []) {
  return prs.slice(0, 20).map((item) => ({
    id: item.id,
    ejercicio_id: item.ejercicio_id,
    ejercicio_nombre: item.ejercicio_nombre || item.ejercicios?.nombre || null,
    peso_libras: item.peso_libras,
    fecha: item.fecha,
  }))
}

function limpiarHistorialParaIA(historial = []) {
  return historial.slice(0, 3).map((item) => ({
    fecha_analisis: item.fecha_analisis,
    peso_kg: item.peso_kg,
    estatura_cm: item.estatura_cm,
    imc: item.imc,
    meta: item.meta,
    wods_30_dias: item.wods_30_dias,
    calorias_30_dias: item.calorias_30_dias,
    dias_entrenados_30_dias: item.dias_entrenados_30_dias,
    prs_30_dias: item.prs_30_dias,
    score_pho3nix: item.score_pho3nix,
    resumen: item.resumen,
    diagnostico: item.diagnostico,
  }))
}

function normalizarAnalisisIA(respuestaIA) {
  const analisis = respuestaIA?.analisis || respuestaIA

  if (!analisis || typeof analisis !== "object") {
    throw new Error("La IA no devolvió un análisis válido.")
  }

  return {
    resumen: analisis.resumen || "",
    diagnostico: analisis.diagnostico || "",
    nutricion: analisis.nutricion || "",
    entrenamiento: analisis.entrenamiento || "",
    pre_wod: analisis.pre_wod || "",
    post_wod: analisis.post_wod || "",
    hidratacion: analisis.hidratacion || "",
    descanso: analisis.descanso || "",
    alerta:
      analisis.alerta ||
      "Este análisis es orientativo y no reemplaza consulta médica o nutricional profesional.",
  }
}

function construirPayloadIA({
  usuario,
  perfil,
  resumen,
  resumenWods,
  resumenPrs,
  historial,
  imc,
  rango,
  diferenciaRango,
}) {
  return {
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      edad: usuario.edad,
      sexo: usuario.sexo || null,
    },

    perfil_nutricional: {
      peso_kg: Number(perfil.peso_kg),
      estatura_cm: Number(perfil.estatura_cm),
      meta: perfil.meta,
      meta_label: METAS_LABELS[perfil.meta] || perfil.meta,
    },

    referencia_corporal: {
      imc: imc ? Number(imc.toFixed(2)) : null,
      peso_referencia_min: rango?.min ? Number(rango.min.toFixed(2)) : null,
      peso_referencia_max: rango?.max ? Number(rango.max.toFixed(2)) : null,
      diferencia_rango:
        diferenciaRango !== null ? Number(diferenciaRango.toFixed(2)) : null,
      nota:
        "El rango saludable es una referencia basada en IMC. En atletas de fuerza o CrossFit debe analizarse junto con rendimiento, masa muscular, asistencia y evolución.",
    },

    rendimiento_30_dias: {
      wods_30_dias: resumen.wods30Dias,
      calorias_30_dias: resumen.calorias30Dias,
      dias_entrenados_30_dias: resumen.diasEntrenados30Dias,
      prs_30_dias: resumen.prs30Dias,
      promedio_calorias: resumen.promedioCalorias,
      mejor_modalidad: resumen.mejorModalidad,
      resultados_wods: limpiarResultadosParaIA(resumenWods.resultados || []),
      prs: limpiarPrsParaIA(resumenPrs.prs || []),
    },

    historial_analisis: limpiarHistorialParaIA(historial || []),

    reglas: {
      analisis_cada_dias: 30,
      enfoque: "nutrición deportiva y entrenamiento funcional tipo CrossFit",
      idioma: "español",
      tono: "claro, motivador, profesional y práctico",
      seguridad: [
        "No diagnosticar enfermedades.",
        "No reemplazar consulta médica o nutricional profesional.",
        "No recomendar medicamentos.",
        "No recomendar quemadores de grasa.",
        "No recomendar esteroides, hormonas ni sustancias prohibidas.",
        "No recomendar dietas extremas.",
        "Si hay señales de riesgo, recomendar consulta profesional.",
      ],
      formato_respuesta: {
        resumen: "string",
        diagnostico: "string",
        nutricion: "string",
        entrenamiento: "string",
        pre_wod: "string",
        post_wod: "string",
        hidratacion: "string",
        descanso: "string",
        alerta: "string",
      },
    },
  }
}

export async function obtenerUsuarioActualNutricion() {
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError) throw authError

  const user = authData?.user

  if (!user?.id) {
    throw new Error("No hay usuario autenticado.")
  }

  const { data, error } = await supabase
    .from("usuarios")
    .select("id,nombre,email,role,foto_url,fecha_nacimiento,sexo,activo")
    .eq("id", user.id)
    .single()

  if (error) throw error

  return {
    ...data,
    edad: calcularEdad(data?.fecha_nacimiento),
  }
}

export async function obtenerPerfilNutricional(usuarioId) {
  const { data, error } = await supabase
    .from("nutricion_perfil")
    .select("*")
    .eq("usuario_id", usuarioId)
    .maybeSingle()

  if (error) throw error

  return data
}

export async function guardarPerfilNutricional(usuarioId, payload) {
  validarPerfilNutricional(payload)

  const perfil = {
    usuario_id: usuarioId,
    peso_kg: Number(payload.peso_kg),
    estatura_cm: Number(payload.estatura_cm),
    meta: payload.meta,
  }

  const { data, error } = await supabase
    .from("nutricion_perfil")
    .upsert(perfil, {
      onConflict: "usuario_id",
    })
    .select()
    .single()

  if (error) throw error

  return data
}

export async function obtenerResumenWods30Dias(usuarioId) {
  const desde = fechaHaceDias(30)

  const { data, error } = await supabase
    .from("wod_resultados")
    .select(
      `
      id,
      wod_id,
      usuario_id,
      resultado,
      calorias_estimadas,
      fecha,
      modalidad,
      tiempo_segundos,
      tiempo_texto,
      repeticiones,
      notas,
      created_at
      `
    )
    .eq("usuario_id", usuarioId)
    .gte("fecha", desde)
    .order("fecha", { ascending: false })

  if (error) throw error

  const resultados = data || []

  const wods30Dias = resultados.length

  const calorias30Dias = resultados.reduce((total, item) => {
    return total + Number(item.calorias_estimadas || 0)
  }, 0)

  const diasUnicos = new Set(
    resultados
      .map((item) => item.fecha)
      .filter(Boolean)
  )

  const diasEntrenados30Dias = diasUnicos.size

  const promedioCalorias =
    wods30Dias > 0 ? Number((calorias30Dias / wods30Dias).toFixed(2)) : 0

  const mejorModalidad = obtenerMejorModalidad(resultados)

  return {
    desde,
    resultados,
    wods30Dias,
    calorias30Dias,
    diasEntrenados30Dias,
    promedioCalorias,
    mejorModalidad,
  }
}

export async function obtenerPrs30Dias(usuarioId) {
  const desde = fechaHaceDias(30)

  const { data: registrosRM, error: rmError } = await supabase
    .from("rm")
    .select(
      `
      id,
      usuario,
      ejercicio_id,
      peso_libras,
      fecha,
      created_at
      `
    )
    .eq("usuario", usuarioId)
    .gte("fecha", desde)
    .order("fecha", { ascending: false })

  if (rmError) throw rmError

  const prsBase = registrosRM || []

  const ejercicioIds = [
    ...new Set(
      prsBase
        .map((item) => item.ejercicio_id)
        .filter(Boolean)
    ),
  ]

  let ejerciciosMap = {}

  if (ejercicioIds.length > 0) {
    const { data: ejercicios, error: ejerciciosError } = await supabase
      .from("ejercicios")
      .select("id,nombre")
      .in("id", ejercicioIds)

    if (ejerciciosError) throw ejerciciosError

    ejerciciosMap = (ejercicios || []).reduce((acc, item) => {
      acc[item.id] = item.nombre
      return acc
    }, {})
  }

  const prs = prsBase.map((item) => ({
    ...item,
    ejercicio_nombre: ejerciciosMap[item.ejercicio_id] || "Ejercicio",
  }))

  return {
    desde,
    prs,
    prs30Dias: prs.length,
  }
}

export async function obtenerHistorialAnalisis(usuarioId) {
  const { data, error } = await supabase
    .from("nutricion_analisis")
    .select("*")
    .eq("usuario_id", usuarioId)
    .order("fecha_analisis", { ascending: false })
    .limit(12)

  if (error) throw error

  return data || []
}

export async function obtenerMensualidadActual(usuarioId) {
  const { data, error } = await supabase
    .from("mensualidades")
    .select("id,usuario_id,fecha_inicio,fecha_fin,estado,created_at")
    .eq("usuario_id", usuarioId)
    .order("fecha_fin", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)

  if (error) throw error

  return data?.[0] || null
}

export async function cargarDashboardNutricion() {
  const usuario = await obtenerUsuarioActualNutricion()

  const [perfil, resumenWods, resumenPrs, historial, mensualidad] =
    await Promise.all([
      obtenerPerfilNutricional(usuario.id),
      obtenerResumenWods30Dias(usuario.id),
      obtenerPrs30Dias(usuario.id),
      obtenerHistorialAnalisis(usuario.id),
      obtenerMensualidadActual(usuario.id),
    ])

  const ultimoAnalisis = historial?.[0] || null

  const proximoAnalisis =
    ultimoAnalisis?.proximo_analisis ||
    (ultimoAnalisis?.fecha_analisis
      ? sumarDiasISO(ultimoAnalisis.fecha_analisis, 30)
      : null)

  const diasParaAnalizar = proximoAnalisis
    ? calcularDiasRestantes(proximoAnalisis)
    : 0

  const puedeAnalizar = !ultimoAnalisis || diasParaAnalizar === 0

  const imc = perfil ? calcularIMC(perfil.peso_kg, perfil.estatura_cm) : null
  const rango = perfil ? calcularRangoSaludable(perfil.estatura_cm) : null
  const diferenciaRango = perfil
    ? calcularDiferenciaRango(perfil.peso_kg, rango)
    : null

  return {
    usuario,
    perfil,
    mensualidad,
    resumenWods,
    resumenPrs,
    historial,
    ultimoAnalisis,
    puedeAnalizar,
    diasParaAnalizar,
    proximoAnalisis,
    referencia: {
      imc,
      pesoMin: rango?.min || null,
      pesoMax: rango?.max || null,
      diferenciaRango,
    },
  }
}

export async function crearAnalisisNutricion(usuario, perfil) {
  if (!usuario?.id) {
    throw new Error("No se encontró el usuario.")
  }

  validarPerfilNutricional(perfil)

  const [resumenWods, resumenPrs, historial] = await Promise.all([
    obtenerResumenWods30Dias(usuario.id),
    obtenerPrs30Dias(usuario.id),
    obtenerHistorialAnalisis(usuario.id),
  ])

  const ultimoAnalisis = historial?.[0] || null

  if (ultimoAnalisis) {
    const proximoAnalisis =
      ultimoAnalisis?.proximo_analisis ||
      sumarDiasISO(ultimoAnalisis.fecha_analisis, 30)

    const diasRestantes = calcularDiasRestantes(proximoAnalisis)

    if (diasRestantes > 0) {
      throw new Error(
        `Faltan ${diasRestantes} días para generar un nuevo análisis.`
      )
    }
  }

  const imc = calcularIMC(perfil.peso_kg, perfil.estatura_cm)
  const rango = calcularRangoSaludable(perfil.estatura_cm)
  const diferenciaRango = calcularDiferenciaRango(perfil.peso_kg, rango)

  const resumen = {
    wods30Dias: resumenWods.wods30Dias,
    calorias30Dias: resumenWods.calorias30Dias,
    diasEntrenados30Dias: resumenWods.diasEntrenados30Dias,
    prs30Dias: resumenPrs.prs30Dias,
    promedioCalorias: resumenWods.promedioCalorias,
    mejorModalidad: resumenWods.mejorModalidad,
  }

  const score = calcularScorePho3nix(resumen)

  const payloadIA = construirPayloadIA({
    usuario,
    perfil,
    resumen,
    resumenWods,
    resumenPrs,
    historial,
    imc,
    rango,
    diferenciaRango,
  })

  const { data: respuestaIA, error: iaError } = await supabase.functions.invoke(
    "analizar-nutricion-ia",
    {
      body: payloadIA,
    }
  )

  if (iaError) {
    console.error("ERROR EDGE FUNCTION:", iaError)

    let detalle = iaError.message || "Error al ejecutar la función de IA."

    try {
      if (iaError.context) {
        const body = await iaError.context.clone().json()
        console.error("DETALLE EDGE FUNCTION:", body)

        detalle =
          body?.error ||
          body?.message ||
          body?.detalle?.error?.message ||
          JSON.stringify(body)
      }
    } catch (parseError) {
      console.error("No se pudo leer el detalle del error:", parseError)
    }

    throw new Error(detalle)
  }

  const analisisIA = normalizarAnalisisIA(respuestaIA)
  const fechaAnalisis = hoyISO()

  const insertPayload = {
    usuario_id: usuario.id,

    fecha_analisis: fechaAnalisis,
    proximo_analisis: sumarDiasISO(fechaAnalisis, 30),

    edad: usuario.edad,
    sexo: usuario.sexo || null,

    peso_kg: Number(perfil.peso_kg),
    estatura_cm: Number(perfil.estatura_cm),
    imc: imc ? Number(imc.toFixed(2)) : null,

    peso_referencia_min: rango?.min ? Number(rango.min.toFixed(2)) : null,
    peso_referencia_max: rango?.max ? Number(rango.max.toFixed(2)) : null,
    diferencia_rango:
      diferenciaRango !== null ? Number(diferenciaRango.toFixed(2)) : null,

    meta: perfil.meta,

    wods_30_dias: resumen.wods30Dias,
    calorias_30_dias: resumen.calorias30Dias,
    dias_entrenados_30_dias: resumen.diasEntrenados30Dias,
    prs_30_dias: resumen.prs30Dias,

    promedio_calorias: resumen.promedioCalorias,
    mejor_modalidad: resumen.mejorModalidad,
    score_pho3nix: score,

    resumen: analisisIA.resumen,
    diagnostico: analisisIA.diagnostico,
    nutricion: analisisIA.nutricion,
    entrenamiento: analisisIA.entrenamiento,
    pre_wod: analisisIA.pre_wod,
    post_wod: analisisIA.post_wod,
    hidratacion: analisisIA.hidratacion,
    descanso: analisisIA.descanso,
    alerta: analisisIA.alerta,

    respuesta_json: {
      payload_ia: payloadIA,
      respuesta_ia: analisisIA,
    },
  }

  const { data, error } = await supabase
    .from("nutricion_analisis")
    .insert(insertPayload)
    .select()
    .single()

  if (error) throw error

  return data
}

export const nutricionUtils = {
  METAS_LABELS,
  calcularEdad,
  calcularIMC,
  calcularRangoSaludable,
  calcularDiferenciaRango,
  calcularDiasRestantes,
}
