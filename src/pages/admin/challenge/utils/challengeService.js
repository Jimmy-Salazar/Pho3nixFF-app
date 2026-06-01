//import { createClient } from "@supabase/supabase-js";
import { supabase } from "../../../../supabase"

const TABLES = {
  competitions: "competencias",
  wods: "competencia_wods",
  competitors: "competidores",
  inscriptions: "competencia_inscripciones",
  results: "competencia_resultados",
  categories: "competencia_categorias",
  inscriptionsView: "v_competencia_inscripciones",
  rankingGeneralView: "v_competencia_ranking_general",
  rankingWodRealView: "v_competencia_ranking_wod_real",
}

const CATEGORY_NAME_BY_VALUE = {
  masculino_principiante: "Masculino Principiante",
  femenino_principiante: "Femenino Principiante",
  masculino_avanzado: "Masculino Avanzado",
  femenino_avanzado: "Femenino Avanzado",
}

function throwIfError(error) {
  if (error) {
    throw new Error(error.message || "Error de Supabase")
  }
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function normalizeCompetitionStatus(status) {
  const value = String(status || "").trim().toLowerCase()

  if (value === "publicado" || value === "publicada" || value === "activa") {
    return "activa"
  }

  if (value === "cerrado" || value === "cerrada") {
    return "cerrada"
  }

  return "borrador"
}

function toDbCompetitionStatus(status) {
  const value = String(status || "").trim().toLowerCase()

  if (value === "activa") return "publicado"
  if (value === "cerrada") return "cerrado"

  return "borrador"
}

function normalizeWodStatus(status) {
  const value = String(status || "").trim().toLowerCase()

  if (value === "publicado" || value === "abierto") return "abierto"
  if (value === "cerrado") return "cerrado"

  return "borrador"
}

function toDbWodStatus(status) {
  const value = String(status || "").trim().toLowerCase()

  if (value === "abierto") return "publicado"
  if (value === "cerrado") return "cerrado"

  return "borrador"
}

function normalizeCategoryValue(categoryName, category = null) {
  const source = [
    categoryName,
    category?.nombre,
    category?.slug,
    category?.rama,
    category?.nivel,
  ]
    .filter(Boolean)
    .join(" ")

  const text = normalizeText(source)

  if (
    (text.includes("masculino") || text.includes("hombre")) &&
    text.includes("principiante")
  ) {
    return "masculino_principiante"
  }

  if (
    (text.includes("femenino") || text.includes("mujer")) &&
    text.includes("principiante")
  ) {
    return "femenino_principiante"
  }

  if (
    (text.includes("masculino") || text.includes("hombre")) &&
    text.includes("avanzado")
  ) {
    return "masculino_avanzado"
  }

  if (
    (text.includes("femenino") || text.includes("mujer")) &&
    text.includes("avanzado")
  ) {
    return "femenino_avanzado"
  }

  if (text.includes("principiante")) return "masculino_principiante"
  if (text.includes("avanzado")) return "masculino_avanzado"

  return "masculino_principiante"
}

function normalizeCompetition(row) {
  const fechaInicio =
    row.fecha_inicio_competencia || row.fecha_inicio || ""

  return {
    ...row,
    nombre: row.titulo || "Competencia sin nombre",
    titulo: row.titulo || "Competencia sin nombre",
    fecha_inicio: fechaInicio,
    fecha_fin: row.fecha_fin || "",
    flyer_url: null,
    estado: normalizeCompetitionStatus(row.estado),
  }
}

function normalizeWod(row) {
  const tipoResultado = String(row.tipo_resultado || "").toLowerCase()

  const scoring =
    tipoResultado === "menor_es_mejor" || tipoResultado.includes("tiempo")
      ? "time"
      : "reps"

  return {
    ...row,
    nombre: row.titulo || "WOD Challenge",
    titulo: row.titulo || "WOD Challenge",
    nivel: row.nivel || "principiante",
    descripcion: row.descripcion || "",
    time_cap: row.unidad_resultado || "",
    scoring,
    estado: normalizeWodStatus(row.estado),
    wod_id: row.id,
  }
}

function normalizeCompetitor(row, categories = []) {
  const category = categories.find((item) => item.id === row.categoria_id)

  const fullName =
    row.nombre_completo ||
    row.competidor_nombre ||
    "Competidor sin nombre"

  return {
    ...row,

    // En tu vista, id corresponde a la inscripción.
    id: row.id,
    inscripcion_id: row.id,

    nombre: fullName,
    nombre_completo: fullName,

    categoria: normalizeCategoryValue(row.categoria_nombre, category),
    categoria_id: row.categoria_id,
    categoria_nombre: row.categoria_nombre || category?.nombre || "",

    estado: row.estado || "registrado",
    activo: row.activo !== false,
  }
}

function normalizeResult(row) {
  const inscription = row.inscripcion || row.competencia_inscripciones || null
  const wod = row.wod || row.competencia_wods || null

  const competitorName =
    inscription?.competidor?.nombre_completo ||
    inscription?.competidores?.nombre_completo ||
    inscription?.nombre_completo ||
    "Competidor"

  const categoryName =
    inscription?.categoria?.nombre ||
    inscription?.competencia_categorias?.nombre ||
    inscription?.categoria_nombre ||
    ""

  return {
    ...row,

    // Compatibilidad con el frontend nuevo
    competidor_id: row.inscripcion_id,
    wod_id: row.competencia_wod_id,
    repeticiones: Number(row.resultado_valor || 0),
    juez: row.juez_nombre || "",
    evidencia_url: row.evidencia_url || "",
    notas: row.observaciones || "",

    competidores: {
      id: row.inscripcion_id,
      nombre: competitorName,
      nombre_completo: competitorName,
      categoria: normalizeCategoryValue(categoryName),
      categoria_nombre: categoryName,
    },

    competencia_wods: {
      id: row.competencia_wod_id,
      nombre: wod?.titulo || "WOD",
      titulo: wod?.titulo || "WOD",
      orden: wod?.orden || 1,
      nivel: wod?.nivel || "principiante",
    },
  }
}

async function fetchCategories() {
  const { data, error } = await supabase
    .from(TABLES.categories)
    .select("id,nombre,slug,rama,nivel,activo")
    .eq("activo", true)
    .order("nombre", { ascending: true })

  throwIfError(error)

  return data || []
}

async function getCategoryId(categoryValue) {
  const categories = await fetchCategories()

  if (!categoryValue) {
    throw new Error("No se recibió la categoría del competidor.")
  }

  const expectedName = CATEGORY_NAME_BY_VALUE[categoryValue] || categoryValue
  const expectedText = normalizeText(expectedName)

  const category =
    categories.find((item) => {
      const text = normalizeText(
        `${item.nombre || ""} ${item.slug || ""} ${item.rama || ""} ${item.nivel || ""}`
      )

      if (normalizeText(item.nombre) === expectedText) return true
      if (normalizeText(item.slug) === expectedText) return true

      const categoryNormalized = normalizeCategoryValue(item.nombre, item)
      return categoryNormalized === categoryValue
    }) || null

  if (!category) {
    throw new Error(
      `No encontré la categoría "${expectedName}" en competencia_categorias.`
    )
  }

  return category.id
}

export async function fetchCompetitions() {
  const { data, error } = await supabase
    .from(TABLES.competitions)
    .select("*")
    .eq("activo", true)
    .order("created_at", { ascending: false })

  throwIfError(error)

  return (data || []).map(normalizeCompetition)
}

export async function fetchChallengeBundle(competitionId) {
  const categories = await fetchCategories()

  const [
    wodsResponse,
    competitorsResponse,
    resultsResponse,
    rankingGeneralResponse,
    rankingWodRealResponse,
  ] = await Promise.all([
    supabase
      .from(TABLES.wods)
      .select("*")
      .eq("competencia_id", competitionId)
      .eq("activo", true)
      .order("orden", { ascending: true })
      .order("created_at", { ascending: true }),

    supabase
      .from(TABLES.inscriptionsView)
      .select("*")
      .eq("competencia_id", competitionId)
      .eq("activo", true)
      .order("created_at", { ascending: true }),

    supabase
      .from(TABLES.results)
      .select(
        `
        *,
        inscripcion:competencia_inscripciones (
          id,
          estado,
          categoria_id,
          competidor_id,
          competidor:competidores (
            id,
            nombre_completo
          ),
          categoria:competencia_categorias (
            id,
            nombre,
            slug,
            rama,
            nivel
          )
        ),
        wod:competencia_wods (
          id,
          titulo,
          orden,
          nivel,
          tipo_resultado,
          unidad_resultado
        )
      `
      )
      .eq("competencia_id", competitionId)
      .order("created_at", { ascending: false }),

    supabase
      .from(TABLES.rankingGeneralView)
      .select("*")
      .eq("competencia_id", competitionId)
      .order("categoria", { ascending: true })
      .order("puesto_general", { ascending: true }),

    supabase
      .from(TABLES.rankingWodRealView)
      .select("*")
      .eq("competencia_id", competitionId)
      .order("wod_orden", { ascending: true })
      .order("categoria", { ascending: true })
      .order("puesto_wod", { ascending: true }),
  ])

  throwIfError(wodsResponse.error)
  throwIfError(competitorsResponse.error)
  throwIfError(resultsResponse.error)
  throwIfError(rankingGeneralResponse.error)
  throwIfError(rankingWodRealResponse.error)

  return {
    wods: (wodsResponse.data || []).map(normalizeWod),

    competitors: (competitorsResponse.data || []).map((row) =>
      normalizeCompetitor(row, categories)
    ),

    results: (resultsResponse.data || []).map(normalizeResult),

    rankingGeneral: (rankingGeneralResponse.data || []).map(normalizeRankingGeneral),

    rankingWodReal: (rankingWodRealResponse.data || []).map(normalizeRankingWod),
  }
}

export async function saveCompetition(payload, id = null) {
  const titulo = payload.nombre?.trim() || payload.titulo?.trim()

  if (!titulo) {
    throw new Error("El nombre de la competencia es obligatorio.")
  }

  const fechaInicio = payload.fecha_inicio || todayISO()

  const cleanPayload = {
    titulo,
    descripcion: payload.descripcion || null,
    fecha_inicio_competencia: fechaInicio,
    fecha_inicio: fechaInicio,
    fecha_fin: payload.fecha_fin || null,
    estado: toDbCompetitionStatus(payload.estado),
    activo: true,
  }

  const query = id
    ? supabase
        .from(TABLES.competitions)
        .update(cleanPayload)
        .eq("id", id)
        .select()
        .single()
    : supabase
        .from(TABLES.competitions)
        .insert(cleanPayload)
        .select()
        .single()

  const { data, error } = await query

  throwIfError(error)

  return normalizeCompetition(data)
}

export async function saveWod(payload, id = null) {
  const titulo = payload.nombre?.trim() || payload.titulo?.trim()

  if (!titulo) {
    throw new Error("El nombre del WOD es obligatorio.")
  }

  const scoring = payload.scoring || "reps"

  const cleanPayload = {
    competencia_id: payload.competencia_id,
    titulo,
    descripcion: payload.descripcion || null,
    orden: Number(payload.orden || 1),
    nivel: payload.nivel || "principiante",
    tipo_resultado: scoring === "time" ? "menor_es_mejor" : "mayor_es_mejor",
    unidad_resultado: scoring === "time" ? "tiempo" : "reps",
    permite_resultado_texto: false,
    estado: toDbWodStatus(payload.estado),
    activo: true,
  }

  const query = id
    ? supabase
        .from(TABLES.wods)
        .update(cleanPayload)
        .eq("id", id)
        .select()
        .single()
    : supabase
        .from(TABLES.wods)
        .insert(cleanPayload)
        .select()
        .single()

  const { data, error } = await query

  throwIfError(error)

  return normalizeWod(data)
}

export async function deleteWod(id) {
  const { error } = await supabase
    .from(TABLES.wods)
    .update({ activo: false })
    .eq("id", id)

  throwIfError(error)
}

export async function saveCompetitor(payload, id = null) {
  const nombreCompleto = String(
    payload.nombre ||
      payload.nombre_completo ||
      payload.nombres ||
      ""
  )
    .trim()
    .toUpperCase()

  if (!nombreCompleto) {
    throw new Error("El nombre del competidor es obligatorio.")
  }

  const categoriaId =
    payload.categoria_id || (await getCategoryId(payload.categoria))

  const estado = payload.estado || "registrado"

  if (id) {
    const { data: inscription, error: inscriptionFindError } = await supabase
      .from(TABLES.inscriptions)
      .select("id,competidor_id")
      .eq("id", id)
      .single()

    throwIfError(inscriptionFindError)

    const { error: competitorUpdateError } = await supabase
      .from(TABLES.competitors)
      .update({
        nombre_completo: nombreCompleto,
        categoria_id: categoriaId,
        competencia_id: payload.competencia_id,
        estado,
        activo: true,
      })
      .eq("id", inscription.competidor_id)

    throwIfError(competitorUpdateError)

    const { data: updatedInscription, error: inscriptionUpdateError } =
      await supabase
        .from(TABLES.inscriptions)
        .update({
          categoria_id: categoriaId,
          estado,
        })
        .eq("id", id)
        .select()
        .single()

    throwIfError(inscriptionUpdateError)

    return {
      id: updatedInscription.id,
      inscripcion_id: updatedInscription.id,
      nombre: nombreCompleto,
      nombre_completo: nombreCompleto,
      categoria_id: categoriaId,
      categoria: payload.categoria || "",
      estado,
    }
  }

  const { data: competitor, error: competitorError } = await supabase
    .from(TABLES.competitors)
    .insert({
      nombre_completo: nombreCompleto,
      categoria_id: categoriaId,
      competencia_id: payload.competencia_id,
      estado,
      activo: true,
    })
    .select("id,nombre_completo,categoria_id,estado,competencia_id")
    .single()

  throwIfError(competitorError)

  const { data: inscription, error: inscriptionError } = await supabase
    .from(TABLES.inscriptions)
    .insert({
      competencia_id: payload.competencia_id,
      competidor_id: competitor.id,
      categoria_id: categoriaId,
      estado,
    })
    .select()
    .single()

  throwIfError(inscriptionError)

  return {
    id: inscription.id,
    inscripcion_id: inscription.id,
    nombre: competitor.nombre_completo,
    nombre_completo: competitor.nombre_completo,
    categoria_id: categoriaId,
    categoria: payload.categoria || "",
    estado,
  }
}

export async function deleteCompetitor(id) {
  const { data: inscription, error: inscriptionError } = await supabase
    .from(TABLES.inscriptions)
    .select("id,competidor_id")
    .eq("id", id)
    .single()

  throwIfError(inscriptionError)

  const { error: competitorError } = await supabase
    .from(TABLES.competitors)
    .update({ activo: false })
    .eq("id", inscription.competidor_id)

  throwIfError(competitorError)
}

export async function saveResult(payload, id = null) {
  const repeticiones = Number(payload.repeticiones || payload.resultado_valor || 0)

  const cleanPayload = {
    competencia_id: payload.competencia_id,
    competencia_wod_id: payload.wod_id || payload.competencia_wod_id,
    inscripcion_id: payload.competidor_id || payload.inscripcion_id,
    juez_nombre: payload.juez || payload.juez_nombre || "SIN JUEZ",
    juez_documento: payload.juez_documento || null,
    resultado_valor: repeticiones,
    resultado_texto: payload.resultado_texto || null,
    observaciones: payload.notas || payload.observaciones || null,
    evidencia_url: payload.evidencia_url || null,
  }

  if (!cleanPayload.competencia_wod_id) {
    throw new Error("Debes seleccionar un WOD.")
  }

  if (!cleanPayload.inscripcion_id) {
    throw new Error("Debes seleccionar un competidor.")
  }

  const query = id
    ? supabase
        .from(TABLES.results)
        .update(cleanPayload)
        .eq("id", id)
        .select()
        .single()
    : supabase
        .from(TABLES.results)
        .insert(cleanPayload)
        .select()
        .single()

  const { data, error } = await query

  throwIfError(error)

  return normalizeResult(data)
}

export async function deleteResult(id) {
  const { error } = await supabase
    .from(TABLES.results)
    .delete()
    .eq("id", id)

  throwIfError(error)
}

function normalizeRankingGeneral(row) {
  return {
    ...row,
    id: row.inscripcion_id,
    inscripcion_id: row.inscripcion_id,
    competidor_id: row.competidor_id,

    nombre: row.nombre_completo || "Competidor",
    nombre_completo: row.nombre_completo || "Competidor",

    categoria: normalizeCategoryValue(row.categoria),
    categoria_nombre: row.categoria || "",

    total: Number(row.repeticiones_totales || 0),
    repeticiones_totales: Number(row.repeticiones_totales || 0),

    position: Number(row.puesto_general || 0),
    puesto_general: Number(row.puesto_general || 0),
  }
}

function normalizeRankingWod(row) {
  return {
    ...row,
    id: `${row.wod_id}-${row.inscripcion_id}`,
    wod_id: row.wod_id,
    wod_orden: row.wod_orden,
    wod: row.wod || "WOD",
    wod_descripcion: row.wod_descripcion || "",
    nivel: row.nivel || "principiante",

    inscripcion_id: row.inscripcion_id,
    competidor_id: row.competidor_id,

    nombre: row.nombre_completo || "Competidor",
    nombre_completo: row.nombre_completo || "Competidor",

    categoria: normalizeCategoryValue(row.categoria),
    categoria_nombre: row.categoria || "",

    total: Number(row.resultado_valor || 0),
    resultado_valor: Number(row.resultado_valor || 0),

    position: Number(row.puesto_wod || 0),
    puesto_wod: Number(row.puesto_wod || 0),

    evidencia_url: row.evidencia_url || "",
    detalle_ejercicios: row.detalle_ejercicios || [],
  }
}