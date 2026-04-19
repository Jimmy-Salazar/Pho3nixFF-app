import { useEffect, useMemo, useState } from "react"
import { supabase } from "../supabase"

const DEFAULT_EVIDENCE_URL =
  "https://rmolvzjluxutxmxzthjp.supabase.co/storage/v1/object/public/challenge-evidencias/default%20-challenger-evidencias.jpg"

const ESTADO_STYLES = {
  registrado: "bg-amber-500/15 text-amber-300 border border-amber-400/20",
  inscrito: "bg-emerald-500/15 text-emerald-300 border border-emerald-400/20",
}

const COMPETENCIA_STATUS_STYLES = {
  borrador: "bg-amber-500/15 text-amber-300 border border-amber-400/20",
  publicado: "bg-emerald-500/15 text-emerald-300 border border-emerald-400/20",
  cerrado: "bg-zinc-500/15 text-zinc-300 border border-zinc-400/20",
}

const WOD_STATUS_STYLES = {
  borrador: "bg-amber-500/15 text-amber-300 border border-amber-400/20",
  publicado: "bg-emerald-500/15 text-emerald-300 border border-emerald-400/20",
  abierto: "bg-emerald-500/15 text-emerald-300 border border-emerald-400/20",
  cerrado: "bg-zinc-500/15 text-zinc-300 border border-zinc-400/20",
}

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function parseDateOnly(value) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDate(value) {
  if (!value) return "Sin fecha"
  const date = parseDateOnly(value)
  if (!date) return value
  return date.toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function diffInDays(fromDate, toDate) {
  const from = startOfDay(fromDate)
  const to = startOfDay(toDate)
  return Math.round((to - from) / 86400000)
}

function getCompetitionPhase(competencia, now = new Date()) {
  const start = parseDateOnly(competencia.fecha_inicio_competencia)
  const end = parseDateOnly(competencia.fecha_fin)

  if (!start) return "hidden"

  const today = startOfDay(now)
  const daysToStart = diffInDays(today, start)

  if (competencia.estado === "cerrado") return "closed"
  if (end && today > end) return "closed"
  if (today >= start && (!end || today <= end)) return "active"

  if (daysToStart >= 0 && daysToStart <= 20 && competencia.estado === "publicado") {
    return "upcoming"
  }

  return "hidden"
}

function canShowCategories(competencia, now = new Date()) {
  const start = parseDateOnly(competencia.fecha_inicio_competencia)
  if (!start) return false
  const daysToStart = diffInDays(startOfDay(now), start)
  return daysToStart <= 2
}

function canShowFirstDayWods(competencia, now = new Date()) {
  const start = parseDateOnly(competencia.fecha_inicio_competencia)
  if (!start) return false

  const startDay = startOfDay(start)
  const today = startOfDay(now)
  const diff = Math.round((startDay - today) / 86400000)

  if (diff < 0) return true
  if (diff === 0) return true
  if (diff === 1) return now.getHours() >= 17

  return false
}

function sortByEstadoThenNombre(items) {
  return [...items].sort((a, b) => {
    const aWeight = a.estado === "inscrito" ? 0 : 1
    const bWeight = b.estado === "inscrito" ? 0 : 1
    if (aWeight !== bWeight) return aWeight - bWeight

    const aName = (a.nombre_completo || "").toUpperCase()
    const bName = (b.nombre_completo || "").toUpperCase()
    return aName.localeCompare(bName)
  })
}

function groupByCategoria(items) {
  const map = new Map()

  items.forEach((item) => {
    const key = item.categoria || "Sin categoría"
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(item)
  })

  return Array.from(map.entries()).map(([categoria, groupedItems]) => ({
    categoria,
    items: groupedItems,
  }))
}

function groupByWod(items) {
  const map = new Map()

  items.forEach((item) => {
    const key = item.wod_id
    if (!map.has(key)) {
      map.set(key, {
        wod_id: item.wod_id,
        wod: item.wod,
        wod_orden: item.wod_orden,
        nivel: item.nivel,
        descripcion: item.descripcion || item.wod_descripcion || "",
        items: [],
      })
    }
    map.get(key).items.push(item)
  })

  return Array.from(map.values()).sort((a, b) => {
    if ((a.nivel || "") !== (b.nivel || "")) {
      return (a.nivel || "").localeCompare(b.nivel || "")
    }
    return (a.wod_orden || 9999) - (b.wod_orden || 9999)
  })
}

function getRowHighlight(position) {
  if (position === 1) return "bg-yellow-400/10"
  if (position === 2) return "bg-slate-300/10"
  if (position === 3) return "bg-amber-700/10"
  return ""
}

function getNivelFromCategoria(categoria = "") {
  const value = categoria.toLowerCase()
  if (value.includes("principiante")) return "principiante"
  if (value.includes("avanzado")) return "avanzado"
  return ""
}

function getNivelLabel(nivel) {
  if (nivel === "principiante") return "Principiantes"
  if (nivel === "avanzado") return "Avanzados"
  return "Sin nivel"
}

function sortCategoriasForPodio(groups) {
  const categoryPriority = (categoria) => {
    const value = (categoria || "").toLowerCase()
    if (value.includes("masculino") && value.includes("principiante")) return 1
    if (value.includes("femenino") && value.includes("principiante")) return 2
    if (value.includes("masculino") && value.includes("avanzado")) return 3
    if (value.includes("femenino") && value.includes("avanzado")) return 4
    return 99
  }

  return [...groups].sort((a, b) => categoryPriority(a.categoria) - categoryPriority(b.categoria))
}

function buildPodioSections(topThreeByCategory) {
  const sorted = sortCategoriasForPodio(topThreeByCategory)

  const principiantes = sorted.filter(
    (item) => getNivelFromCategoria(item.categoria) === "principiante"
  )
  const avanzados = sorted.filter(
    (item) => getNivelFromCategoria(item.categoria) === "avanzado"
  )

  return [
    { key: "principiantes", title: "Principiantes", items: principiantes },
    { key: "avanzados", title: "Avanzados", items: avanzados },
  ].filter((section) => section.items.length > 0)
}

export default function Challenger() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [userId, setUserId] = useState("")
  const [userName, setUserName] = useState("")

  const [categorias, setCategorias] = useState([])
  const [competidores, setCompetidores] = useState([])
  const [wods, setWods] = useState([])
  const [competencias, setCompetencias] = useState([])
  const [inscripciones, setInscripciones] = useState([])
  const [usuariosMap, setUsuariosMap] = useState({})

  const [rankingGeneral, setRankingGeneral] = useState([])
  const [rankingWod, setRankingWod] = useState([])

  const [expandedPastId, setExpandedPastId] = useState("")
  const [selectedAthleteModal, setSelectedAthleteModal] = useState(null)
  const [selectedWodLevelModal, setSelectedWodLevelModal] = useState(null)
  const [selectedEvidenceModal, setSelectedEvidenceModal] = useState(null)
  const [tableModalTab, setTableModalTab] = useState("general")
  const [selectedModalWodId, setSelectedModalWodId] = useState("")

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      setError("")
      setSuccess("")

      const {
        data: { user },
      } = await supabase.auth.getUser()

      const currentUserId = user?.id || ""
      setUserId(currentUserId)

      let currentUserName = ""
      if (currentUserId) {
        const { data: currentUserData } = await supabase
          .from("usuarios")
          .select("id,nombre")
          .eq("id", currentUserId)
          .single()

        currentUserName = currentUserData?.nombre || ""
        setUserName(currentUserName)
      }

      const [
        { data: categoriasData, error: categoriasError },
        { data: competidoresData, error: competidoresError },
        { data: wodsData, error: wodsError },
        { data: competenciasData, error: competenciasError },
        { data: inscripcionesData, error: inscripcionesError },
        { data: rankingGeneralData, error: rankingGeneralError },
        { data: rankingWodData, error: rankingWodError },
      ] = await Promise.all([
        supabase
          .from("competencia_categorias")
          .select("*")
          .eq("activo", true)
          .order("nombre", { ascending: true }),

        supabase
          .from("competidores")
          .select(`
            id,
            nombre_completo,
            categoria_id,
            estado,
            activo,
            competencia_id,
            created_at
          `)
          .eq("activo", true)
          .order("created_at", { ascending: true }),

        supabase
          .from("competencia_wods")
          .select("*")
          .eq("activo", true)
          .order("nivel", { ascending: true })
          .order("orden", { ascending: true })
          .order("created_at", { ascending: true }),

        supabase
          .from("competencias")
          .select("*")
          .eq("activo", true)
          .in("estado", ["publicado", "cerrado"])
          .order("fecha_inicio_competencia", { ascending: false }),

        supabase
          .from("competencia_inscripciones")
          .select("id,competencia_id,competidor_id,categoria_id,numero_participante,estado,created_at")
          .order("created_at", { ascending: true }),

        supabase.from("v_competencia_ranking_general").select("*"),
        supabase.from("v_competencia_ranking_wod_real").select("*"),
      ])

      if (categoriasError) throw categoriasError
      if (competidoresError) throw competidoresError
      if (wodsError) throw wodsError
      if (competenciasError) throw competenciasError
      if (inscripcionesError) throw inscripcionesError
      if (rankingGeneralError) throw rankingGeneralError
      if (rankingWodError) throw rankingWodError

      const safeInscripciones = inscripcionesData || []
      const competidorIds = [
        ...new Set(safeInscripciones.map((item) => item.competidor_id).filter(Boolean)),
      ]

      let usersMapResult = {}
      if (competidorIds.length > 0) {
        const { data: competidoresConNombre, error: competidorNombreError } = await supabase
          .from("competidores")
          .select("id,nombre_completo")
          .in("id", competidorIds)

        if (competidorNombreError) throw competidorNombreError

        usersMapResult = (competidoresConNombre || []).reduce((acc, item) => {
          acc[item.id] = item.nombre_completo || "Alumno"
          return acc
        }, {})
      }

      if (currentUserId && currentUserName) {
        usersMapResult[currentUserId] = currentUserName
      }

      setCategorias(categoriasData || [])
      setCompetidores(competidoresData || [])
      setWods(wodsData || [])
      setCompetencias(competenciasData || [])
      setInscripciones(safeInscripciones)
      setUsuariosMap(usersMapResult)
      setRankingGeneral(rankingGeneralData || [])
      setRankingWod(rankingWodData || [])

      const now = new Date()
      const closedCompetitions = (competenciasData || []).filter(
        (item) => getCompetitionPhase(item, now) === "closed"
      )

      const initialExpandedId = closedCompetitions[0]?.id || ""
      setExpandedPastId(initialExpandedId)
    } catch (err) {
      console.error("ERROR CARGANDO CHALLENGES:", err)
      setError(err.message || "No se pudo cargar Challenges.")
    } finally {
      setLoading(false)
    }
  }

  async function handleInscribirme(competencia) {
    if (!userId) {
      setError("Debes iniciar sesión para inscribirte en el Challenge.")
      return
    }

    try {
      setSubmitting(true)
      setError("")
      setSuccess("")

      const yaExiste = inscripciones.some(
        (item) => item.competencia_id === competencia.id && item.competidor_id === userId
      )

      if (yaExiste) {
        setError("Ya estás inscrito en este Challenge.")
        return
      }

      setError(
        "La inscripción automática aún necesita conectarse con el flujo real de alumno → competidor. Primero debes definir cómo se creará el competidor del alumno."
      )
    } catch (err) {
      console.error("ERROR INSCRIBIENDO ALUMNO:", err)
      setError(err.message || "No se pudo registrar tu inscripción.")
    } finally {
      setSubmitting(false)
    }
  }

  function togglePastCompetition(competenciaId) {
    setExpandedPastId((prev) => (prev === competenciaId ? "" : competenciaId))
  }

  function openAthleteModal(competencia, athlete) {
    if (athlete?.tipo === "tabla") {
      const allWods = groupByWod(competencia.rankingWodDeCompetencia)
      setTableModalTab(athlete.tab || "general")
      setSelectedModalWodId(allWods[0]?.wod_id || "")
      setSelectedAthleteModal({
        tipo: "tabla",
        competenciaId: competencia.id,
        competenciaTitulo: competencia.titulo || competencia.nombre,
        rankingGeneral: competencia.rankingGeneralDeCompetencia,
        rankingWod: competencia.rankingWodDeCompetencia,
      })
      return
    }

    const athleteGeneral = competencia.rankingGeneralDeCompetencia.find(
      (item) => item.competidor_id === athlete.competidor_id
    )

    const athleteLevel = getNivelFromCategoria(athlete.categoria)
    const athleteWods = competencia.rankingWodDeCompetencia.filter(
      (item) =>
        item.competidor_id === athlete.competidor_id &&
        (!athleteLevel || item.nivel === athleteLevel)
    )

    setSelectedAthleteModal({
      tipo: "atleta",
      competenciaId: competencia.id,
      competenciaTitulo: competencia.titulo || competencia.nombre,
      nombre: athlete.nombre_completo,
      categoria: athlete.categoria,
      puestoGeneral: athleteGeneral?.puesto_general || null,
      repeticionesTotales: athleteGeneral?.repeticiones_totales || null,
      resultados: athleteWods,
    })
  }

  function openWodLevelModal(competencia, nivel) {
    const wodsDelNivel = competencia.wodsDeCompetencia.filter((item) => item.nivel === nivel)

    setSelectedWodLevelModal({
      competenciaTitulo: competencia.titulo || competencia.nombre,
      nivel,
      wods: wodsDelNivel,
    })
  }

  function closeWodLevelModal() {
    setSelectedWodLevelModal(null)
  }

  function openEvidenceModal(src, title, isDefault = false) {
    setSelectedEvidenceModal({
      src: src || DEFAULT_EVIDENCE_URL,
      title: title || "Evidencia",
      isDefault,
    })
  }

  function closeEvidenceModal() {
    setSelectedEvidenceModal(null)
  }

  function closeAthleteModal() {
    setSelectedAthleteModal(null)
    setSelectedModalWodId("")
  }

  const computed = useMemo(() => {
    const now = new Date()

    const prepared = competencias
      .map((competencia) => {
        const phase = getCompetitionPhase(competencia, now)

        const competidoresDeCompetencia = sortByEstadoThenNombre(
          competidores.filter((item) => item.competencia_id === competencia.id)
        )

        const categoriasConCompetidores = categorias.map((categoria) => ({
          ...categoria,
          competidores: competidoresDeCompetencia.filter(
            (item) => item.categoria_id === categoria.id
          ),
        }))

        const inscripcionesDeCompetencia = inscripciones.filter(
          (item) => item.competencia_id === competencia.id
        )

        const inscritosConNombre = inscripcionesDeCompetencia.map((item) => ({
          ...item,
          nombre:
            usersMap[item.competidor_id] ||
            competidoresDeCompetencia.find((c) => c.id === item.competidor_id)?.nombre_completo ||
            "Alumno",
        }))

        const wodsDeCompetencia = wods.filter((item) => item.competencia_id === competencia.id)
        const wodsPrincipiantes = wodsDeCompetencia.filter((item) => item.nivel === "principiante")
        const wodsAvanzados = wodsDeCompetencia.filter((item) => item.nivel === "avanzado")

        const rankingGeneralDeCompetencia = rankingGeneral
          .filter((item) => item.competencia_id === competencia.id)
          .sort((a, b) => {
            if (a.categoria !== b.categoria) {
              return (a.categoria || "").localeCompare(b.categoria || "")
            }
            if ((a.puesto_general || 9999) !== (b.puesto_general || 9999)) {
              return (a.puesto_general || 9999) - (b.puesto_general || 9999)
            }
            return (a.nombre_completo || "").localeCompare(b.nombre_completo || "")
          })

        const rankingWodDeCompetencia = rankingWod
          .filter((item) => item.competencia_id === competencia.id)
          .map((item) => {
            const wodInfo = wodsDeCompetencia.find((w) => w.id === item.wod_id)
            return {
              ...item,
              wod_descripcion: item.wod_descripcion || wodInfo?.descripcion || "",
              descripcion: item.descripcion || wodInfo?.descripcion || "",
              detalle_ejercicios: item.detalle_ejercicios || [],
            }
          })
          .sort((a, b) => {
            if ((a.nivel || "") !== (b.nivel || "")) {
              return (a.nivel || "").localeCompare(b.nivel || "")
            }
            if ((a.wod_orden || 9999) !== (b.wod_orden || 9999)) {
              return (a.wod_orden || 9999) - (b.wod_orden || 9999)
            }
            if (a.categoria !== b.categoria) {
              return (a.categoria || "").localeCompare(b.categoria || "")
            }
            if ((a.puesto_wod || 9999) !== (b.puesto_wod || 9999)) {
              return (a.puesto_wod || 9999) - (b.puesto_wod || 9999)
            }
            return (a.nombre_completo || "").localeCompare(b.nombre_completo || "")
          })

        const topThreeByCategory = groupByCategoria(rankingGeneralDeCompetencia).map(
          ({ categoria, items }) => ({
            categoria,
            top3: items.slice(0, 3),
            total: items.length,
          })
        )

        return {
          ...competencia,
          phase,
          competidoresDeCompetencia,
          categoriasConCompetidores,
          inscripcionesDeCompetencia: inscritosConNombre,
          wodsDeCompetencia,
          wodsPrincipiantes,
          wodsAvanzados,
          showCategories: canShowCategories(competencia, now),
          showWods:
            phase === "active" || phase === "closed" || canShowFirstDayWods(competencia, now),
          rankingGeneralDeCompetencia,
          rankingWodDeCompetencia,
          topThreeByCategory,
          podioSections: buildPodioSections(topThreeByCategory),
        }
      })
      .filter((item) => item.phase !== "hidden")

    return {
      upcoming: prepared.find((item) => item.phase === "upcoming") || null,
      active: prepared.find((item) => item.phase === "active") || null,
      closed: prepared.filter((item) => item.phase === "closed"),
    }
  }, [
    categorias,
    competidores,
    competencias,
    inscripciones,
    rankingGeneral,
    rankingWod,
    usuariosMap,
    wods,
  ])

  const modalGroupedWods = useMemo(() => {
    if (!selectedAthleteModal || selectedAthleteModal.tipo !== "tabla") return []
    return groupByWod(selectedAthleteModal.rankingWod)
  }, [selectedAthleteModal])

  const filteredModalWodGroups = useMemo(() => {
    if (!selectedAthleteModal || selectedAthleteModal.tipo !== "tabla") return []
    if (!selectedModalWodId) return modalGroupedWods
    return modalGroupedWods.filter((wod) => wod.wod_id === selectedModalWodId)
  }, [selectedAthleteModal, modalGroupedWods, selectedModalWodId])

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <div className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-4 md:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.14),transparent_28%),linear-gradient(135deg,#071122_0%,#050816_45%,#02040a_100%)] p-4 shadow-[0_30px_120px_rgba(0,0,0,0.45)] sm:p-5 md:rounded-[32px] md:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:28px_28px] opacity-20" />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.28em] text-cyan-300">
                Challenges Board
              </div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl md:text-5xl">
                Challenges
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70 md:text-base">
                Aquí podrás ver Challenges pasados, el Challenge activo y el próximo
                Challenge con inscripción previa cuando esté disponible.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
              <MiniStat label="Próximo" value={computed.upcoming ? 1 : 0} />
              <MiniStat label="Activo" value={computed.active ? 1 : 0} />
              <MiniStat label="Pasados" value={computed.closed.length} />
              <MiniStat label="Rankings" value={rankingGeneral.length} />
            </div>
          </div>
        </section>

        {(error || success) && (
          <div className="mt-6 space-y-3">
            {error && (
              <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {success}
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-6 text-center text-white/60 sm:p-8">
            Cargando Challenges...
          </div>
        )}

        {!loading && computed.closed.length > 0 && (
          <section className="mt-8 rounded-[26px] border border-white/10 bg-white/[0.035] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur sm:p-5 md:rounded-[30px] md:p-6">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-zinc-300/80">
                  Historial de Challenges
                </p>
                <h2 className="text-xl font-black uppercase tracking-tight text-white sm:text-2xl md:text-3xl">
                  Challenges pasados
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">
                  Vista histórica tipo acordeón con estadísticas y rankings reales.
                </p>
              </div>

              <div className="self-start rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                Archive
              </div>
            </div>

            <div className="space-y-4">
              {computed.closed.map((competencia) => {
                const isOpen = expandedPastId === competencia.id

                return (
                  <div
                    key={competencia.id}
                    className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]"
                  >
                    <button
                      type="button"
                      onClick={() => togglePastCompetition(competencia.id)}
                      className="flex w-full flex-col items-start justify-between gap-4 px-4 py-4 text-left transition hover:bg-white/[0.03] sm:flex-row sm:items-center sm:px-5"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-300/80">
                          Challenge cerrado
                        </p>
                        <h3 className="mt-1 text-xl font-black uppercase tracking-tight text-white">
                          {competencia.titulo || competencia.nombre}
                        </h3>
                        <p className="mt-1 text-sm text-white/55">
                          Inicio: {formatDate(competencia.fecha_inicio_competencia)} • Fin:{" "}
                          {formatDate(competencia.fecha_fin)}
                        </p>
                      </div>

                      <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${
                            COMPETENCIA_STATUS_STYLES[competencia.estado] ||
                            COMPETENCIA_STATUS_STYLES.cerrado
                          }`}
                        >
                          {competencia.estado}
                        </span>
                        <span className="text-xl text-white/70">{isOpen ? "▾" : "▸"}</span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-white/10 p-4 sm:p-5">
                        <div className="mb-6 grid gap-4 md:grid-cols-4">
                          <MiniPanel title="Atletas" value={competencia.competidoresDeCompetencia.length} subtitle="Final" />
                          <MiniPanel
                            title="Inscritos"
                            value={competencia.competidoresDeCompetencia.filter((item) => item.estado === "inscrito").length}
                            subtitle="Confirmados"
                          />
                          <MiniPanel title="WODs" value={competencia.wodsDeCompetencia.length} subtitle="Completados" />
                          <MiniPanel title="Rankings" value={competencia.rankingGeneralDeCompetencia.length} subtitle="Reales" />
                        </div>

                        <div className="mb-6 rounded-[24px] border border-white/10 bg-black/20 p-4 sm:rounded-[28px] sm:p-5">
                          <div className="mb-4">
                            <h4 className="text-lg font-black uppercase tracking-tight text-white">Podio</h4>
                            <p className="mt-1 text-sm text-white/60">
                              Principiantes primero y luego avanzados. El top 3 se muestra como medallas y el resto en tabla compacta.
                            </p>
                          </div>

                          {competencia.rankingGeneralDeCompetencia.length === 0 ? (
                            <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-5 text-sm text-white/45">
                              No hay ranking general disponible para este Challenge.
                            </div>
                          ) : (
                            <div className="space-y-7">
                              {competencia.podioSections.map((section) => (
                                <div key={`${competencia.id}-${section.key}`} className="space-y-5">
                                  <div className="flex items-center justify-between gap-3">
                                    <h5 className="text-base font-black uppercase tracking-tight text-white">
                                      {section.title}
                                    </h5>
                                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                                      Leaderboard
                                    </span>
                                  </div>

                                  <div className="space-y-5">
                                    {section.items.map(({ categoria, top3, total }) => {
                                      const rankingCompleto = competencia.rankingGeneralDeCompetencia.filter(
                                        (item) => item.categoria === categoria
                                      )
                                      const restantes = rankingCompleto.slice(3)

                                      return (
                                        <div key={`${competencia.id}-${section.key}-${categoria}`} className="space-y-4">
                                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <h6 className="text-sm font-black uppercase tracking-[0.16em] text-white/75">
                                              {categoria}
                                            </h6>
                                            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/35">
                                              {total} atletas
                                            </span>
                                          </div>

                                          <div className="grid gap-3 md:grid-cols-3">
                                            {[1, 2, 3].map((position) => {
                                              const athlete = top3[position - 1] || null
                                              return (
                                                <MedalAthleteCard
                                                  key={`${competencia.id}-${section.key}-${categoria}-medal-${position}`}
                                                  athlete={athlete}
                                                  position={position}
                                                  onClick={() => athlete && openAthleteModal(competencia, athlete)}
                                                />
                                              )
                                            })}
                                          </div>

                                          {restantes.length > 0 && (
                                            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#081120]/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                                              <div className="overflow-x-auto">
                                                <table className="w-full table-fixed min-w-[270px] text-[10px] sm:min-w-[320px] sm:text-[11px] md:min-w-0 md:text-sm">
                                                  <thead className="bg-white/5 text-[10px] uppercase tracking-[0.12em] text-white/60">
                                                    <tr>
                                                      <th className="w-8 px-2 py-2 text-left md:w-10 md:px-3 md:py-3">#</th>
                                                      <th className="px-2 py-2 text-left md:px-3 md:py-3">Atleta</th>
                                                      <th className="w-16 whitespace-nowrap px-2 py-2 text-left md:w-24 md:px-3 md:py-3">
                                                        <span className="md:hidden">Reps</span>
                                                        <span className="hidden md:inline">Repeticiones</span>
                                                      </th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {restantes.map((item) => (
                                                      <tr
                                                        key={`${competencia.id}-${section.key}-${categoria}-${item.competidor_id}-rest`}
                                                        className={`border-t border-white/10 transition duration-300 hover:-translate-y-[1px] hover:bg-white/[0.05] ${getRowHighlight(item.puesto_general)}`}
                                                      >
                                                        <td className="w-8 px-2 py-2 font-bold text-white/85 md:w-10 md:px-3 md:py-3">
                                                          {item.puesto_general}
                                                        </td>
                                                        <td className="max-w-0 px-2 py-2 md:px-3 md:py-3">
                                                          <button
                                                            type="button"
                                                            onClick={() => openAthleteModal(competencia, item)}
                                                            className="block w-full truncate text-left text-[10px] font-semibold uppercase leading-tight text-white transition duration-300 hover:text-cyan-300 sm:text-[11px] md:text-sm"
                                                          >
                                                            {item.nombre_completo}
                                                          </button>
                                                        </td>
                                                        <td className="w-16 whitespace-nowrap px-2 py-2 text-white/70 md:w-24 md:px-3 md:py-3">
                                                          {item.repeticiones_totales}
                                                        </td>
                                                      </tr>
                                                    ))}
                                                  </tbody>
                                                </table>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="rounded-[24px] border border-white/10 bg-black/20 p-4 sm:rounded-[28px] sm:p-5">
                          <div className="mb-4">
                            <h4 className="text-lg font-black uppercase tracking-tight text-white">
                              WODs de Competencia
                            </h4>
                            <p className="mt-1 text-sm text-white/60">
                              Puedes ver los WODs por nivel o abrir directamente el modal de resultados.
                            </p>
                          </div>

                          <div className="grid gap-3 md:grid-cols-2 md:gap-4">
                            <button
                              type="button"
                              onClick={() => openWodLevelModal(competencia, "principiante")}
                              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:bg-white/[0.06]"
                            >
                              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300/80">
                                WODs Principiantes
                              </p>
                              <div className="mt-2 text-lg font-black uppercase text-white">
                                {competencia.wodsPrincipiantes.length}
                              </div>
                              <div className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-cyan-300/70">
                                Ver WODs
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => openWodLevelModal(competencia, "avanzado")}
                              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:bg-white/[0.06]"
                            >
                              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-violet-300/80">
                                WODs Avanzados
                              </p>
                              <div className="mt-2 text-lg font-black uppercase text-white">
                                {competencia.wodsAvanzados.length}
                              </div>
                              <div className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-violet-300/70">
                                Ver WODs
                              </div>
                            </button>
                          </div>

                          <div className="mt-4 flex justify-stretch sm:justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                openAthleteModal(competencia, {
                                  tipo: "tabla",
                                  tab: "wod",
                                })
                              }
                              className="w-full rounded-xl border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-center text-xs font-bold uppercase tracking-[0.14em] text-violet-300 transition hover:bg-violet-400/20 sm:w-auto"
                            >
                              Ver resultados
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {selectedWodLevelModal && (
          <div className="fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto bg-black/75 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6 md:items-center">
            <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[24px] border border-white/10 bg-[#071122] p-4 shadow-[0_30px_120px_rgba(0,0,0,0.55)] sm:rounded-[30px] sm:p-5 md:p-6">
              <div className="mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300/80">
                    {selectedWodLevelModal.nivel === "principiante" ? "WODs Principiantes" : "WODs Avanzados"}
                  </p>
                  <h2 className="mt-2 text-xl font-black uppercase tracking-tight text-white sm:text-2xl">
                    {selectedWodLevelModal.competenciaTitulo}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeWodLevelModal}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10 sm:w-auto"
                >
                  Cerrar
                </button>
              </div>

              {selectedWodLevelModal.wods.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-6 text-sm text-white/45">
                  No hay WODs registrados para este nivel.
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedWodLevelModal.wods.map((wod) => (
                    <div
                      key={wod.id}
                      className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]"
                    >
                      <div className="border-b border-white/10 bg-white/[0.03] px-5 py-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-violet-300/80">
                              {getNivelLabel(wod.nivel)} · WOD #{wod.orden || "—"}
                            </p>
                            <h3 className="mt-1 text-lg font-black uppercase tracking-tight text-white">
                              {wod.titulo}
                            </h3>
                          </div>

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${
                              WOD_STATUS_STYLES[wod.estado] || WOD_STATUS_STYLES.abierto
                            }`}
                          >
                            {wod.estado}
                          </span>
                        </div>
                      </div>

                      <div className="p-5">
                        <ExerciseList description={wod.descripcion} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {selectedAthleteModal && selectedAthleteModal.tipo === "tabla" && (
          <div className="fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto bg-black/75 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6 md:items-center">
            <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[24px] border border-white/10 bg-[#071122] p-4 shadow-[0_30px_120px_rgba(0,0,0,0.55)] sm:rounded-[30px] sm:p-5 md:p-6">
              <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300/80">
                    Tabla de posiciones
                  </p>
                  <h2 className="mt-2 text-xl font-black uppercase tracking-tight text-white sm:text-2xl">
                    {selectedAthleteModal.competenciaTitulo}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeAthleteModal}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white hover:bg-white/10 sm:w-auto"
                >
                  Cerrar
                </button>
              </div>

              <div className="mb-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setTableModalTab("general")}
                  className={[
                    "rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] transition",
                    tableModalTab === "general"
                      ? "border-cyan-400/30 bg-cyan-400/15 text-cyan-200"
                      : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10",
                  ].join(" ")}
                >
                  General
                </button>

                <button
                  type="button"
                  onClick={() => setTableModalTab("wod")}
                  className={[
                    "rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] transition",
                    tableModalTab === "wod"
                      ? "border-violet-400/30 bg-violet-400/15 text-violet-200"
                      : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10",
                  ].join(" ")}
                >
                  Por WOD
                </button>
              </div>

              {tableModalTab === "general" && (
                <div className="space-y-6">
                  {groupByCategoria(selectedAthleteModal.rankingGeneral).map(({ categoria, items }) => (
                    <div key={categoria} className="space-y-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-xs font-black uppercase tracking-[0.16em] text-white sm:text-sm sm:tracking-[0.18em]">
                          {categoria}
                        </h3>
                        <span className="text-[11px] text-white/40 sm:text-xs">{items.length} atletas</span>
                      </div>

                      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#081120]/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                        <div className="max-h-[340px] overflow-y-auto">
                          <div className="overflow-x-auto">
                            <table className="w-full table-fixed min-w-[320px] text-[11px] sm:min-w-[360px] md:min-w-[520px] md:text-sm">
                            <thead className="sticky top-0 z-10 bg-[#0d172a] text-xs uppercase tracking-[0.12em] text-white/60">
                              <tr>
                                <th className="w-8 px-2 py-2 text-left md:w-10 md:px-4 md:py-3">#</th>
                                <th className="px-2 py-2 text-left md:px-4 md:py-3">Atleta</th>
                                <th className="w-20 whitespace-nowrap px-2 py-2 text-left md:w-36 md:px-4 md:py-3"><span className="md:hidden">Reps</span><span className="hidden md:inline">Repeticiones totales</span></th>
                                                              </tr>
                            </thead>

                            <tbody>
                              {items.map((item) => (
                                <tr
                                  key={`${item.inscripcion_id}-${item.nombre_completo}`}
                                  className={`border-t border-white/10 hover:bg-white/[0.04] ${getRowHighlight(item.puesto_general)}`}
                                >
                                  <td className="w-8 px-2 py-2 font-bold md:w-10 md:px-4 md:py-3">{item.puesto_general}</td>
                                  <td className="max-w-0 px-2 py-2 md:px-4 md:py-3">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const athleteLevel = getNivelFromCategoria(item.categoria)
                                        const athleteWods = selectedAthleteModal.rankingWod.filter(
                                          (r) =>
                                            r.competidor_id === item.competidor_id &&
                                            (!athleteLevel || r.nivel === athleteLevel)
                                        )

                                        setSelectedAthleteModal({
                                          tipo: "atleta",
                                          competenciaTitulo: selectedAthleteModal.competenciaTitulo,
                                          nombre: item.nombre_completo,
                                          categoria: item.categoria,
                                          puestoGeneral: item.puesto_general,
                                          repeticionesTotales: item.repeticiones_totales,
                                          resultados: athleteWods,
                                        })
                                      }}
                                      className="block w-full truncate text-left text-[11px] font-semibold uppercase leading-tight text-white transition hover:text-cyan-300 md:text-sm"
                                    >
                                      {item.nombre_completo}
                                    </button>
                                  </td>
                                  <td className="w-20 whitespace-nowrap px-2 py-2 text-white/70 md:w-24 md:px-4 md:py-3">{item.repeticiones_totales}</td>
                                </tr>
                              ))}
                            </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tableModalTab === "wod" && (
                <div className="space-y-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-[0.16em] text-white sm:text-sm sm:tracking-[0.18em]">
                        Filtro por WOD
                      </h3>
                      <p className="mt-1 text-sm text-white/50">Elige el WOD que deseas consultar.</p>
                    </div>

                    <select
                      value={selectedModalWodId}
                      onChange={(e) => setSelectedModalWodId(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none md:w-auto"
                    >
                      {modalGroupedWods.map((wod) => (
                        <option key={wod.wod_id} value={wod.wod_id} className="bg-[#071122]">
                          {getNivelLabel(wod.nivel)} · {wod.wod}
                        </option>
                      ))}
                    </select>
                  </div>

                  {filteredModalWodGroups.map((wodGroup) => (
                    <div key={wodGroup.wod_id} className="space-y-4">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-violet-300/80">
                          {getNivelLabel(wodGroup.nivel)} · WOD #{wodGroup.wod_orden || "—"}
                        </p>
                        <h3 className="text-lg font-black uppercase text-white">{wodGroup.wod}</h3>

                        {wodGroup.descripcion ? (
                          <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <ExerciseList description={wodGroup.descripcion} />
                          </div>
                        ) : null}
                      </div>

                      {groupByCategoria(wodGroup.items).map(({ categoria, items }) => (
                        <div key={`${wodGroup.wod_id}-${categoria}`} className="space-y-3">
                          <h4 className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
                            {categoria}
                          </h4>

                          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#081120]/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                            <div className="max-h-[340px] overflow-y-auto">
                              <div className="overflow-x-auto">
                                <table className="w-full table-fixed min-w-[320px] text-[11px] sm:min-w-[360px] md:min-w-[520px] md:text-sm">
                                <thead className="sticky top-0 z-10 bg-[#0d172a] text-xs uppercase tracking-[0.12em] text-white/60">
                                  <tr>
                                    <th className="w-8 px-2 py-2 text-left md:w-10 md:px-4 md:py-3">#</th>
                                    <th className="px-2 py-2 text-left md:px-4 md:py-3">Atleta</th>
                                    <th className="w-16 whitespace-nowrap px-2 py-2 text-left md:w-24 md:px-4 md:py-3">Reps</th>
                                                                      </tr>
                                </thead>

                                <tbody>
                                  {items.map((item) => (
                                    <tr
                                      key={`${item.wod_id}-${item.inscripcion_id}`}
                                      className={`border-t border-white/10 hover:bg-white/[0.04] ${getRowHighlight(item.puesto_wod)}`}
                                    >
                                      <td className="w-8 px-2 py-2 font-bold md:w-10 md:px-4 md:py-3">{item.puesto_wod}</td>
                                      <td className="max-w-0 px-2 py-2 md:px-4 md:py-3">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const athleteGeneral = selectedAthleteModal.rankingGeneral.find(
                                              (g) => g.competidor_id === item.competidor_id
                                            )

                                            const athleteLevel = getNivelFromCategoria(item.categoria)
                                            const athleteWods = selectedAthleteModal.rankingWod.filter(
                                              (r) =>
                                                r.competidor_id === item.competidor_id &&
                                                (!athleteLevel || r.nivel === athleteLevel)
                                            )

                                            setSelectedAthleteModal({
                                              tipo: "atleta",
                                              competenciaTitulo: selectedAthleteModal.competenciaTitulo,
                                              nombre: item.nombre_completo,
                                              categoria: item.categoria,
                                              puestoGeneral: athleteGeneral?.puesto_general || null,
                                              repeticionesTotales: athleteGeneral?.repeticiones_totales || null,
                                              resultados: athleteWods,
                                            })
                                          }}
                                          className="block w-full truncate text-left text-[11px] font-semibold uppercase leading-tight text-white transition hover:text-violet-300 md:text-sm"
                                        >
                                          {item.nombre_completo}
                                        </button>
                                      </td>
                                      <td className="w-20 whitespace-nowrap px-2 py-2 text-white/70 md:w-24 md:px-4 md:py-3">{item.resultado_valor}</td>
                                    </tr>
                                  ))}
                                </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {selectedAthleteModal && selectedAthleteModal.tipo === "atleta" && (
          <div className="fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto bg-black/75 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6 md:items-center">
            <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[24px] border border-white/10 bg-[#071122] p-4 shadow-[0_30px_120px_rgba(0,0,0,0.55)] sm:rounded-[30px] sm:p-5 md:p-6">
              <div className="mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300/80">
                    Detalle del atleta
                  </p>
                  <h2 className="mt-2 text-xl font-black uppercase tracking-tight text-white sm:text-2xl">
                    {selectedAthleteModal.nombre}
                  </h2>
                  <p className="mt-2 text-sm text-white/60">
                    {selectedAthleteModal.categoria} • {selectedAthleteModal.competenciaTitulo}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeAthleteModal}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10 sm:w-auto"
                >
                  Cerrar
                </button>
              </div>

              <div className="mb-6 grid gap-4 md:grid-cols-3">
                <MiniPanel title="Puesto general" value={selectedAthleteModal.puestoGeneral ?? "—"} subtitle="Ranking final" />
                <MiniPanel title="Repeticiones totales" value={selectedAthleteModal.repeticionesTotales ?? "—"} subtitle="Acumulado" />
                <MiniPanel title="WODs" value={selectedAthleteModal.resultados.length} subtitle="Registrados" />
              </div>

              <div className="space-y-4">
                {selectedAthleteModal.resultados.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-6 text-sm text-white/45">
                    No hay resultados registrados para este atleta.
                  </div>
                ) : (
                  selectedAthleteModal.resultados.map((resultado) => (
                    <div
                      key={`${resultado.wod_id}-${resultado.inscripcion_id}`}
                      className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03]"
                    >
                      <div className="border-b border-white/10 bg-white/[0.03] px-5 py-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-violet-300/80">
                              {getNivelLabel(resultado.nivel)} · WOD #{resultado.wod_orden || "—"}
                            </p>
                            <h3 className="mt-1 text-lg font-black uppercase tracking-tight text-white">
                              {resultado.wod}
                            </h3>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-violet-300">
                              Puesto {resultado.puesto_wod}
                            </span>
                            <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-cyan-300">
                              {resultado.resultado_valor} reps
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="mb-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
                            Total del WOD
                          </div>
                          <div className="mt-2 text-3xl font-black text-cyan-300">
                            {resultado.resultado_valor ?? "—"} reps
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <div className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
                            Ejercicios y repeticiones
                          </div>
                          <ExerciseRepsList
                            details={resultado.detalle_ejercicios}
                            description={
                              resultado.wod_descripcion ||
                              resultado.descripcion ||
                              resultado.resultado_texto ||
                              ""
                            }
                          />
                        </div>

                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={() =>
                              openEvidenceModal(
                                resultado.evidencia_url || DEFAULT_EVIDENCE_URL,
                                `${resultado.wod} - ${selectedAthleteModal.nombre}`,
                                !resultado.evidencia_url
                              )
                            }
                            className="w-full rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-center text-sm font-bold uppercase tracking-[0.14em] text-cyan-300 transition hover:bg-cyan-400/20 sm:w-auto"
                          >
                            Ver hoja de evidencia
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {selectedEvidenceModal && (
          <div className="fixed inset-0 z-[400] flex items-start justify-center overflow-y-auto bg-black/85 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6 md:items-center">
            <div className="max-h-[95vh] w-full max-w-5xl overflow-hidden rounded-[24px] border border-white/10 bg-[#071122] shadow-[0_30px_120px_rgba(0,0,0,0.65)] sm:rounded-[30px]">
              <div className="flex flex-col items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:flex-row sm:px-5">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300/80">
                    {selectedEvidenceModal.isDefault ? "Imagen por defecto" : "Evidencia"}
                  </p>
                  <h3 className="mt-1 text-lg font-black uppercase tracking-tight text-white">
                    {selectedEvidenceModal.title}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={closeEvidenceModal}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10 sm:w-auto"
                >
                  Cerrar
                </button>
              </div>

              <div className="p-4">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                  <img
                    src={selectedEvidenceModal.src}
                    alt={selectedEvidenceModal.title}
                    className="max-h-[78vh] w-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


function getMedalVisual(position) {
  if (position === 1) {
    return {
      emoji: "🥇",
      label: "1er lugar",
      badgeClass:
        "border-yellow-400/25 bg-yellow-400/12 text-yellow-200",
      cardClass:
        "border-yellow-400/20 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.16),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]",
      ringClass: "shadow-[0_0_0_1px_rgba(250,204,21,0.14),0_18px_45px_rgba(250,204,21,0.12)]",
    }
  }

  if (position === 2) {
    return {
      emoji: "🥈",
      label: "2do lugar",
      badgeClass:
        "border-slate-300/25 bg-slate-300/10 text-slate-200",
      cardClass:
        "border-slate-300/15 bg-[radial-gradient(circle_at_top,rgba(226,232,240,0.12),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))]",
      ringClass: "shadow-[0_0_0_1px_rgba(226,232,240,0.12),0_18px_45px_rgba(148,163,184,0.10)]",
    }
  }

  return {
    emoji: "🥉",
    label: "3er lugar",
    badgeClass:
      "border-amber-700/25 bg-amber-700/10 text-amber-200",
    cardClass:
      "border-amber-700/20 bg-[radial-gradient(circle_at_top,rgba(180,83,9,0.18),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))]",
    ringClass: "shadow-[0_0_0_1px_rgba(180,83,9,0.12),0_18px_45px_rgba(120,53,15,0.12)]",
  }
}

function MedalAthleteCard({ athlete, position, onClick }) {
  const medal = getMedalVisual(position)

  if (!athlete) {
    return (
      <div
        className={`rounded-[20px] border px-3 py-2.5 sm:rounded-[24px] sm:p-5 ${medal.cardClass} ${medal.ringClass}`}
      >
        <div className="flex items-center justify-between gap-3 sm:block">
          <div className="flex min-w-0 items-center gap-2.5 sm:block">
            <div className="text-2xl leading-none sm:text-3xl">{medal.emoji}</div>
            <div className="truncate text-xs font-black uppercase tracking-[0.04em] text-white/70 sm:mt-4 sm:text-base">
              Sin atleta
            </div>
          </div>
          <span
            className={`hidden rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] sm:inline-flex ${medal.badgeClass}`}
          >
            {medal.label}
          </span>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-[20px] border px-3 py-2.5 text-left transition duration-300 hover:bg-white/[0.06] sm:rounded-[24px] sm:p-5 sm:hover:-translate-y-1 sm:hover:scale-[1.01] ${medal.cardClass} ${medal.ringClass}`}
    >
      <div className="flex items-center justify-between gap-3 sm:block">
        <div className="flex min-w-0 items-center gap-2.5 sm:block">
          <div className="text-2xl leading-none transition duration-300 sm:text-3xl sm:group-hover:scale-110">
            {medal.emoji}
          </div>
          <div className="min-w-0 sm:mt-4">
            <div className="truncate text-xs font-black uppercase tracking-[0.04em] text-white sm:text-base">
              {athlete.nombre_completo}
            </div>
            <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/40 sm:mt-2 sm:text-[11px] sm:tracking-[0.18em]">
              {athlete.repeticiones_totales ?? "—"} reps
            </div>
          </div>
        </div>

        <div className="shrink-0 text-right sm:mt-5 sm:flex sm:items-end sm:justify-between sm:gap-4">
          <span
            className={`hidden rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] sm:inline-flex ${medal.badgeClass}`}
          >
            {medal.label}
          </span>
          <div>
            <div className="hidden text-[10px] font-black uppercase tracking-[0.18em] text-white/40 sm:block">
              Repeticiones
            </div>
            <div className="text-lg font-black text-white sm:mt-1 sm:text-3xl">
              {athlete.repeticiones_totales ?? "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 hidden text-[11px] font-bold uppercase tracking-[0.18em] text-white/45 sm:block">
        {athlete.categoria}
      </div>
    </button>
  )
}

function ExerciseList({ description }) {
  if (!description) {
    return <p className="text-sm text-white/55">Sin descripción del WOD.</p>
  }

  const lines = description
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  const header = lines[0]?.toLowerCase().includes("máximas repeticiones")
    ? lines[0]
    : null

  const ejercicios = header ? lines.slice(1) : lines

  return (
    <div>
      {header && (
        <p className="mb-3 text-sm font-semibold text-white/70">
          {header}
        </p>
      )}

      {ejercicios.length > 0 ? (
        <div className="space-y-2">
          {ejercicios.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/80"
            >
              {item}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-white/55">Sin ejercicios cargados.</p>
      )}
    </div>
  )
}

function ExerciseRepsList({ details, description }) {
  const parsedDetails = Array.isArray(details) ? details : []

  if (parsedDetails.length > 0) {
    return (
      <div className="space-y-2">
        {parsedDetails.map((item, index) => (
          <div
            key={`${item.ejercicio || "ejercicio"}-${index}`}
            className="flex flex-col items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 sm:flex-row sm:items-center"
          >
            <div className="text-sm font-semibold text-white/80">
              {item.ejercicio || `Ejercicio ${index + 1}`}
            </div>
            <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-cyan-300">
              {item.repeticiones ?? 0} reps
            </div>
          </div>
        ))}
      </div>
    )
  }

  return <ExerciseList description={description} />
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-center sm:px-4">
      <div className="text-[11px] font-black uppercase tracking-[0.2em] text-white/45">
        {label}
      </div>
      <div className="mt-1 text-2xl font-black text-white">{value}</div>
    </div>
  )
}

function MiniPanel({ title, value, subtitle }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-4 sm:px-4">
      <div className="text-[11px] font-black uppercase tracking-[0.2em] text-white/45">
        {title}
      </div>
      <div className="mt-2 text-2xl font-black text-white">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.16em] text-white/40">
        {subtitle}
      </div>
    </div>
  )
}