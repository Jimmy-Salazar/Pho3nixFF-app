import { supabase } from "../../../../supabase"

export const META_LABELS = {
  perder_grasa: "Perder grasa",
  recomposicion: "Recomposición corporal",
  ganar_masa_muscular: "Ganar masa muscular",
  mejorar_rendimiento: "Mejorar rendimiento",
}

export const META_COLORS = {
  perder_grasa: {
    text: "text-orange-300",
    bg: "bg-orange-500/10",
    border: "border-orange-500/25",
    label: "bg-orange-500/15 text-orange-300 border-orange-500/25",
  },
  recomposicion: {
    text: "text-lime-300",
    bg: "bg-lime-500/10",
    border: "border-lime-500/25",
    label: "bg-lime-500/15 text-lime-300 border-lime-500/25",
  },
  ganar_masa_muscular: {
    text: "text-sky-300",
    bg: "bg-sky-500/10",
    border: "border-sky-500/25",
    label: "bg-sky-500/15 text-sky-300 border-sky-500/25",
  },
  mejorar_rendimiento: {
    text: "text-violet-300",
    bg: "bg-violet-500/10",
    border: "border-violet-500/25",
    label: "bg-violet-500/15 text-violet-300 border-violet-500/25",
  },
}

export function getMetaLabel(meta) {
  return META_LABELS[meta] || "Sin meta"
}

export function getMetaColor(meta) {
  return META_COLORS[meta] || {
    text: "text-white/60",
    bg: "bg-white/[0.04]",
    border: "border-white/10",
    label: "bg-white/[0.04] text-white/60 border-white/10",
  }
}

export function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined || value === "") return "--"
  const number = Number(value)
  if (Number.isNaN(number)) return "--"
  return new Intl.NumberFormat("es-EC", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number)
}

export function formatDate(value) {
  if (!value) return "--"
  try {
    return new Intl.DateTimeFormat("es-EC", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(`${String(value).slice(0, 10)}T00:00:00`))
  } catch {
    return "--"
  }
}

export function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null
  const hoy = new Date()
  const nacimiento = new Date(`${fechaNacimiento}T00:00:00`)
  if (Number.isNaN(nacimiento.getTime())) return null
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const mes = hoy.getMonth() - nacimiento.getMonth()
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--
  return edad
}

export function getInitials(name = "") {
  const clean = String(name || "").trim()
  if (!clean) return "PH"
  return clean
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
}

export function clasificarIMC(imcValue) {
  const imc = Number(imcValue)
  if (!imc || Number.isNaN(imc)) return { label: "Sin IMC", className: "text-white/45", level: "none" }
  if (imc < 18.5) return { label: "Bajo peso", className: "text-sky-300", level: "low" }
  if (imc < 25) return { label: "Normal", className: "text-lime-300", level: "normal" }
  if (imc < 30) return { label: "Sobrepeso", className: "text-yellow-300", level: "overweight" }
  if (imc < 35) return { label: "Obesidad I", className: "text-orange-300", level: "obesity_1" }
  if (imc < 40) return { label: "Obesidad II", className: "text-red-300", level: "obesity_2" }
  return { label: "Obesidad III", className: "text-red-400", level: "obesity_3" }
}

function promedio(items, key) {
  const values = items.map((item) => Number(item?.[key] || 0)).filter((value) => value > 0)
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function suma(items, key) {
  return items.reduce((total, item) => total + Number(item?.[key] || 0), 0)
}

function ordenarAnalisis(a, b) {
  const fechaA = new Date(`${String(a?.fecha_analisis || a?.created_at || "1900-01-01").slice(0, 10)}T00:00:00`).getTime()
  const fechaB = new Date(`${String(b?.fecha_analisis || b?.created_at || "1900-01-01").slice(0, 10)}T00:00:00`).getTime()
  if (fechaB !== fechaA) return fechaB - fechaA
  return new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime()
}

function dedupeUltimoAnalisis(analisis = []) {
  const map = new Map()
  analisis.slice().sort(ordenarAnalisis).forEach((item) => {
    if (!item?.usuario_id) return
    if (!map.has(item.usuario_id)) map.set(item.usuario_id, item)
  })
  return map
}

function agruparHistorialPorUsuario(analisis = []) {
  const map = new Map()
  analisis.slice().sort(ordenarAnalisis).forEach((item) => {
    if (!item?.usuario_id) return
    const current = map.get(item.usuario_id) || []
    current.push(item)
    map.set(item.usuario_id, current)
  })
  return map
}

function buildAtletas({ usuarios = [], perfilesMap, ultimoAnalisisMap, historialMap }) {
  return usuarios.map((usuario) => {
    const perfil = perfilesMap.get(usuario.id) || null
    const analisis = ultimoAnalisisMap.get(usuario.id) || null
    const historial = historialMap.get(usuario.id) || []
    const imcInfo = clasificarIMC(analisis?.imc)
    return {
      id: usuario.id,
      nombre: usuario.nombre || "Atleta PHO3NIX",
      email: usuario.email || "",
      foto_url: usuario.foto_url || "",
      sexo: usuario.sexo || "",
      fecha_nacimiento: usuario.fecha_nacimiento || null,
      edad: calcularEdad(usuario.fecha_nacimiento),
      activo: usuario.activo,
      perfil,
      analisis,
      historial,
      meta: analisis?.meta || perfil?.meta || null,
      meta_label: getMetaLabel(analisis?.meta || perfil?.meta),
      peso_kg: analisis?.peso_kg || perfil?.peso_kg || null,
      estatura_cm: analisis?.estatura_cm || perfil?.estatura_cm || null,
      imc: analisis?.imc || null,
      imc_label: imcInfo.label,
      imc_className: imcInfo.className,
      imc_level: imcInfo.level,
      wods_30_dias: Number(analisis?.wods_30_dias || 0),
      calorias_30_dias: Number(analisis?.calorias_30_dias || 0),
      dias_entrenados_30_dias: Number(analisis?.dias_entrenados_30_dias || 0),
      prs_30_dias: Number(analisis?.prs_30_dias || 0),
      score_pho3nix: Number(analisis?.score_pho3nix || 0),
      fecha_analisis: analisis?.fecha_analisis || null,
      proximo_analisis: analisis?.proximo_analisis || null,
      tiene_analisis: !!analisis,
      tiene_perfil: !!perfil,
    }
  })
}

function buildResumenGeneral(atletas = []) {
  const activos = atletas.filter((item) => item.activo !== false)
  const analizados = activos.filter((item) => item.tiene_analisis)
  const totalActivos = activos.length
  const totalAnalizados = analizados.length
  const porcentajeAnalizados = totalActivos ? Math.round((totalAnalizados / totalActivos) * 100) : 0
  return {
    totalActivos,
    totalAnalizados,
    porcentajeAnalizados,
    scorePromedio: promedio(analizados, "score_pho3nix"),
    wodsPromedio: promedio(analizados, "wods_30_dias"),
    caloriasPromedio: promedio(analizados, "calorias_30_dias"),
    prsLogrados: suma(analizados, "prs_30_dias"),
    imcPromedio: promedio(analizados, "imc"),
    metaPrincipal: getMetaPrincipal(analizados),
  }
}

function getMetaPrincipal(atletas = []) {
  const counts = {}
  atletas.forEach((item) => {
    if (!item.meta) return
    counts[item.meta] = (counts[item.meta] || 0) + 1
  })
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  if (!sorted.length) return { meta: null, label: "Sin datos", count: 0 }
  return { meta: sorted[0][0], label: getMetaLabel(sorted[0][0]), count: sorted[0][1] }
}

function buildDistribucionMetas(atletas = []) {
  const analizados = atletas.filter((item) => item.tiene_analisis)
  const total = analizados.length || 1
  return Object.keys(META_LABELS).map((meta) => {
    const count = analizados.filter((item) => item.meta === meta).length
    return { meta, label: getMetaLabel(meta), count, percent: Math.round((count / total) * 100), colors: getMetaColor(meta) }
  })
}

function getRecomendacionObjetivo(meta) {
  if (meta === "perder_grasa") return "Priorizar WODs metabólicos, intervalos controlados, cargas moderadas y volumen progresivo."
  if (meta === "recomposicion") return "Combinar fuerza técnica con bloques metabólicos. Mantener estímulos medibles y buena recuperación."
  if (meta === "ganar_masa_muscular") return "Incluir bloques de fuerza, accesorios, cargas progresivas y volumen suficiente para hipertrofia."
  if (meta === "mejorar_rendimiento") return "Enfocar en performance: fuerza, skills, gimnasia, resistencia y WODs con medición de tiempos/reps."
  return "Mantener programación equilibrada y escalable."
}

function buildResumenObjetivos(atletas = []) {
  const analizados = atletas.filter((item) => item.tiene_analisis)
  return Object.keys(META_LABELS).map((meta) => {
    const rows = analizados.filter((item) => item.meta === meta)
    return {
      meta,
      label: getMetaLabel(meta),
      count: rows.length,
      imcPromedio: promedio(rows, "imc"),
      wodsPromedio: promedio(rows, "wods_30_dias"),
      caloriasPromedio: promedio(rows, "calorias_30_dias"),
      scorePromedio: promedio(rows, "score_pho3nix"),
      prsTotal: suma(rows, "prs_30_dias"),
      colors: getMetaColor(meta),
      recomendacion: getRecomendacionObjetivo(meta),
    }
  })
}

export async function obtenerAdminActual() {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  const authUser = authData?.user
  if (!authUser?.id) throw new Error("No se encontró una sesión activa.")
  const { data, error } = await supabase
    .from("usuarios")
    .select("id,nombre,email,role,foto_url,activo")
    .eq("id", authUser.id)
    .maybeSingle()
  if (error) throw error
  const role = String(data?.role || "").toLowerCase()
  if (!["admin", "coach"].includes(role)) throw new Error("No tienes permisos para ver el panel de nutrición.")
  return data
}

export async function fetchAdminNutricionData() {
  const admin = await obtenerAdminActual()
  const [usuariosResult, perfilesResult, analisisResult] = await Promise.all([
    supabase
      .from("usuarios")
      .select("id,nombre,email,role,foto_url,fecha_nacimiento,sexo,activo")
      .order("nombre", { ascending: true }),
    supabase.from("nutricion_perfil").select("*").order("updated_at", { ascending: false }),
    supabase
      .from("nutricion_analisis")
      .select("*")
      .order("fecha_analisis", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1000),
  ])
  if (usuariosResult.error) throw usuariosResult.error
  if (perfilesResult.error) throw perfilesResult.error
  if (analisisResult.error) throw analisisResult.error
  const usuarios = (usuariosResult.data || []).filter((item) => {
    return String(item?.role || "").trim().toLowerCase() === "alumno"
  })
  const perfiles = perfilesResult.data || []
  const analisis = analisisResult.data || []
  const perfilesMap = new Map(perfiles.map((item) => [item.usuario_id, item]))
  const ultimoAnalisisMap = dedupeUltimoAnalisis(analisis)
  const historialMap = agruparHistorialPorUsuario(analisis)
  const atletas = buildAtletas({ usuarios, perfilesMap, ultimoAnalisisMap, historialMap })
  return {
    admin,
    atletas,
    resumen: buildResumenGeneral(atletas),
    distribucionMetas: buildDistribucionMetas(atletas),
    resumenObjetivos: buildResumenObjetivos(atletas),
    generadoEn: new Date().toISOString(),
  }
}

export function filtrarAtletas(atletas = [], filtros = {}) {
  const search = String(filtros.search || "").trim().toLowerCase()
  const meta = filtros.meta || "todas"
  const estado = filtros.estado || "todos"
  const score = filtros.score || "todos"
  return atletas.filter((item) => {
    const matchesSearch = !search || String(item.nombre || "").toLowerCase().includes(search) || String(item.email || "").toLowerCase().includes(search)
    const matchesMeta = meta === "todas" || item.meta === meta
    let matchesEstado = true
    if (estado === "con_analisis") matchesEstado = item.tiene_analisis
    if (estado === "sin_analisis") matchesEstado = !item.tiene_analisis
    if (estado === "imc_alto") matchesEstado = Number(item.imc || 0) >= 30
    if (estado === "sobrepeso") matchesEstado = Number(item.imc || 0) >= 25 && Number(item.imc || 0) < 30
    if (estado === "normal") matchesEstado = Number(item.imc || 0) >= 18.5 && Number(item.imc || 0) < 25
    let matchesScore = true
    if (score === "alto") matchesScore = Number(item.score_pho3nix || 0) >= 80
    if (score === "medio") matchesScore = Number(item.score_pho3nix || 0) >= 60 && Number(item.score_pho3nix || 0) < 80
    if (score === "bajo") matchesScore = item.tiene_analisis && Number(item.score_pho3nix || 0) < 60
    return matchesSearch && matchesMeta && matchesEstado && matchesScore
  })
}

export const adminNutricionUtils = {
  META_LABELS,
  META_COLORS,
  getMetaLabel,
  getMetaColor,
  getInitials,
  formatNumber,
  formatDate,
  calcularEdad,
  clasificarIMC,
  filtrarAtletas,
}
