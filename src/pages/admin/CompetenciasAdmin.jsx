import { useEffect, useMemo, useState } from "react"
import { supabase } from "../../supabase"

const ESTADO_STYLES = {
  registrado: "bg-amber-500/15 text-amber-300 border border-amber-400/20",
  inscrito: "bg-emerald-500/15 text-emerald-300 border border-emerald-400/20",
}

const PUBLICACION_STYLES = {
  borrador: "bg-amber-500/15 text-amber-300 border border-amber-400/20",
  publicado: "bg-emerald-500/15 text-emerald-300 border border-emerald-400/20",
  cerrado: "bg-zinc-500/15 text-zinc-300 border border-zinc-400/20",
}

const initialForm = {
  nombres: "",
  categoria_id: "",
  estado: "registrado",
}

const initialCompetenciaForm = {
  titulo: "",
  descripcion: "",
  fecha_inicio: "",
  fecha_fin: "",
  estado: "borrador",
}

const initialWodForm = {
  titulo: "",
  descripcion: "",
  estado: "borrador",
}

function normalizeName(value) {
  return (value || "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim()
}

function formatDate(value) {
  if (!value) return "Sin fecha"
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default function CompetenciasAdmin() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingCompetencia, setSavingCompetencia] = useState(false)
  const [savingWod, setSavingWod] = useState(false)

  const [categorias, setCategorias] = useState([])
  const [competidores, setCompetidores] = useState([])
  const [competencias, setCompetencias] = useState([])
  const [wods, setWods] = useState([])

  const [expandedCompetenciaId, setExpandedCompetenciaId] = useState("")

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(initialForm)

  const [showCompetenciaModal, setShowCompetenciaModal] = useState(false)
  const [competenciaForm, setCompetenciaForm] = useState(initialCompetenciaForm)
  const [editingCompetenciaId, setEditingCompetenciaId] = useState(null)

  const [showWodModal, setShowWodModal] = useState(false)
  const [wodForm, setWodForm] = useState(initialWodForm)
  const [editingWodId, setEditingWodId] = useState(null)

  const [activeCompetenciaIdForModal, setActiveCompetenciaIdForModal] = useState("")

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      setError("")

      const [
        { data: categoriasData, error: categoriasError },
        { data: competidoresData, error: competidoresError },
        { data: competenciasData, error: competenciasError },
        { data: wodsData, error: wodsError },
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
            nombres,
            apellidos,
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
          .from("competencias")
          .select("*")
          .eq("activo", true)
          .order("created_at", { ascending: false }),

        supabase
          .from("competencia_wods")
          .select("*")
          .eq("activo", true)
          .order("orden", { ascending: true })
          .order("created_at", { ascending: true }),
      ])

      if (categoriasError) throw categoriasError
      if (competidoresError) throw competidoresError
      if (competenciasError) throw competenciasError
      if (wodsError) throw wodsError

      const competenciasList = competenciasData || []

      setCategorias(categoriasData || [])
      setCompetidores(competidoresData || [])
      setCompetencias(competenciasList)
      setWods(wodsData || [])

      setExpandedCompetenciaId((prev) => {
        if (prev && competenciasList.some((item) => item.id === prev)) return prev
        return competenciasList[0]?.id || ""
      })
    } catch (err) {
      console.error("ERROR CARGANDO COMPETENCIAS ADMIN:", err)
      setError(err.message || "No se pudo cargar la administración del evento.")
    } finally {
      setLoading(false)
    }
  }

  function resetMessages() {
    setError("")
    setSuccess("")
  }

  function openModal(competenciaId) {
    if (!competenciaId) {
      setError("Primero debes seleccionar una competencia.")
      return
    }

    setActiveCompetenciaIdForModal(competenciaId)
    setForm(initialForm)
    resetMessages()
    setShowModal(true)
  }

  function closeModal() {
    if (saving) return
    setShowModal(false)
    setForm(initialForm)
    setActiveCompetenciaIdForModal("")
  }

  function openCompetenciaModal(competencia = null) {
    resetMessages()

    if (competencia) {
      setEditingCompetenciaId(competencia.id)
      setCompetenciaForm({
        titulo: competencia.titulo || competencia.nombre || "",
        descripcion: competencia.descripcion || "",
        fecha_inicio: competencia.fecha_inicio_competencia || "",
        fecha_fin: competencia.fecha_fin || "",
        estado: competencia.estado || "borrador",
      })
    } else {
      setEditingCompetenciaId(null)
      setCompetenciaForm(initialCompetenciaForm)
    }

    setShowCompetenciaModal(true)
  }

  function closeCompetenciaModal() {
    if (savingCompetencia) return
    setShowCompetenciaModal(false)
    setEditingCompetenciaId(null)
    setCompetenciaForm(initialCompetenciaForm)
  }

  function openWodModal(competenciaId, wod = null) {
    resetMessages()

    if (!competenciaId) {
      setError("Primero debes seleccionar una competencia.")
      return
    }

    setActiveCompetenciaIdForModal(competenciaId)

    if (wod) {
      setEditingWodId(wod.id)
      setWodForm({
        titulo: wod.titulo || "",
        descripcion: wod.descripcion || "",
        estado: wod.estado || "borrador",
      })
    } else {
      setEditingWodId(null)
      setWodForm(initialWodForm)
    }

    setShowWodModal(true)
  }

  function closeWodModal() {
    if (savingWod) return
    setShowWodModal(false)
    setEditingWodId(null)
    setWodForm(initialWodForm)
    setActiveCompetenciaIdForModal("")
  }

  function onChangeField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  function onChangeCompetenciaField(field, value) {
    setCompetenciaForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  function onChangeWodField(field, value) {
    setWodForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const nombreNormalizado = useMemo(() => normalizeName(form.nombres), [form.nombres])

  const duplicateCompetidor = useMemo(() => {
    if (!nombreNormalizado || !activeCompetenciaIdForModal) return null

    return (
      competidores.find((item) => {
        if (!item?.activo) return false
        if (item.competencia_id !== activeCompetenciaIdForModal) return false
        const existingName = normalizeName(item.nombre_completo || item.nombres)
        return existingName === nombreNormalizado
      }) || null
    )
  }, [competidores, nombreNormalizado, activeCompetenciaIdForModal])

  async function handleSaveCompetidor(e) {
    e.preventDefault()

    const nombres = normalizeName(form.nombres)

    if (!activeCompetenciaIdForModal) {
      setError("Primero debes seleccionar una competencia.")
      return
    }

    if (!nombres) {
      setError("El nombre del competidor es obligatorio.")
      return
    }

    if (!form.categoria_id) {
      setError("Debes seleccionar una categoría.")
      return
    }

    if (duplicateCompetidor) {
      setError("Ese competidor ya está registrado en este Challenger y no puede repetirse en ninguna categoría.")
      return
    }

    try {
      setSaving(true)
      resetMessages()

      const { data: dbCompetidores, error: dbCheckError } = await supabase
        .from("competidores")
        .select("id,nombres,nombre_completo,activo,competencia_id")
        .eq("activo", true)
        .eq("competencia_id", activeCompetenciaIdForModal)

      if (dbCheckError) throw dbCheckError

      const duplicateInDb = (dbCompetidores || []).find((item) => {
        const existingName = normalizeName(item.nombre_completo || item.nombres)
        return existingName === nombres
      })

      if (duplicateInDb) {
        setError("Ese competidor ya está registrado en este Challenger y no puede repetirse en ninguna categoría.")
        setSaving(false)
        return
      }

      const { error } = await supabase.from("competidores").insert({
        nombres,
        categoria_id: form.categoria_id,
        estado: form.estado,
        competencia_id: activeCompetenciaIdForModal,
        es_alumno_registrado: false,
        activo: true,
      })

      if (error) throw error

      setSuccess("Competidor registrado correctamente.")
      setShowModal(false)
      setForm(initialForm)
      setActiveCompetenciaIdForModal("")
      await loadData()
    } catch (err) {
      console.error("ERROR REGISTRANDO COMPETIDOR:", err)
      setError(err.message || "No se pudo registrar el competidor.")
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveCompetencia(e) {
    e.preventDefault()

    const titulo = (competenciaForm.titulo || "").trim()

    if (!titulo) {
      setError("El nombre de la competencia es obligatorio.")
      return
    }

    if (!competenciaForm.fecha_inicio) {
      setError("La fecha de inicio es obligatoria.")
      return
    }

    if (
      competenciaForm.fecha_inicio &&
      competenciaForm.fecha_fin &&
      competenciaForm.fecha_fin < competenciaForm.fecha_inicio
    ) {
      setError("La fecha fin no puede ser menor a la fecha inicio.")
      return
    }

    try {
      setSavingCompetencia(true)
      resetMessages()

      const payload = {
        titulo,
        descripcion: competenciaForm.descripcion.trim() || null,
        fecha_inicio_competencia: competenciaForm.fecha_inicio || null,
        fecha_fin: competenciaForm.fecha_fin || null,
        estado: competenciaForm.estado,
        activo: true,
      }

      let resultError = null
      let competenciaId = editingCompetenciaId

      if (editingCompetenciaId) {
        const { error } = await supabase
          .from("competencias")
          .update(payload)
          .eq("id", editingCompetenciaId)

        resultError = error
      } else {
        const { data, error } = await supabase
          .from("competencias")
          .insert(payload)
          .select("id")
          .single()

        resultError = error
        competenciaId = data?.id || ""
      }

      if (resultError) throw resultError

      setSuccess(
        editingCompetenciaId
          ? "Competencia actualizada correctamente."
          : "Competencia creada correctamente."
      )

      setShowCompetenciaModal(false)
      setCompetenciaForm(initialCompetenciaForm)
      setEditingCompetenciaId(null)

      await loadData()

      if (competenciaId) {
        setExpandedCompetenciaId(competenciaId)
      }
    } catch (err) {
      console.error("ERROR GUARDANDO COMPETENCIA:", err)
      setError(err.message || "No se pudo guardar la competencia.")
    } finally {
      setSavingCompetencia(false)
    }
  }

  async function handleSaveWod(e) {
    e.preventDefault()

    const titulo = (wodForm.titulo || "").trim()

    if (!activeCompetenciaIdForModal) {
      setError("Primero debes seleccionar una competencia.")
      return
    }

    if (!titulo) {
      setError("El nombre del WOD / Challenge es obligatorio.")
      return
    }

    try {
      setSavingWod(true)
      resetMessages()

      const wodsActuales = wods.filter(
        (item) =>
          item.competencia_id === activeCompetenciaIdForModal &&
          (!editingWodId || item.id !== editingWodId)
      )

      const nextOrder =
        editingWodId
          ? (wods.find((item) => item.id === editingWodId)?.orden || 1)
          : wodsActuales.length > 0
            ? Math.max(...wodsActuales.map((item) => Number(item.orden || 0))) + 1
            : 1

      const payload = {
        competencia_id: activeCompetenciaIdForModal,
        titulo,
        descripcion: wodForm.descripcion.trim() || null,
        estado: wodForm.estado,
        orden: nextOrder,
        activo: true,
      }

      let resultError = null

      if (editingWodId) {
        const { error } = await supabase
          .from("competencia_wods")
          .update(payload)
          .eq("id", editingWodId)

        resultError = error
      } else {
        const { error } = await supabase.from("competencia_wods").insert(payload)
        resultError = error
      }

      if (resultError) throw resultError

      setSuccess(
        editingWodId
          ? "WOD / Challenge actualizado correctamente."
          : "WOD / Challenge registrado correctamente."
      )

      setShowWodModal(false)
      setWodForm(initialWodForm)
      setEditingWodId(null)
      setActiveCompetenciaIdForModal("")
      await loadData()
    } catch (err) {
      console.error("ERROR REGISTRANDO WOD:", err)
      setError(err.message || "No se pudo registrar el WOD / Challenge.")
    } finally {
      setSavingWod(false)
    }
  }

  async function handleChangeEstado(competidorId, nuevoEstado) {
    try {
      resetMessages()

      const { error } = await supabase
        .from("competidores")
        .update({ estado: nuevoEstado })
        .eq("id", competidorId)

      if (error) throw error

      setSuccess(`Estado actualizado a "${nuevoEstado}".`)
      await loadData()
    } catch (err) {
      console.error("ERROR ACTUALIZANDO ESTADO:", err)
      setError(err.message || "No se pudo actualizar el estado.")
    }
  }

  async function handleChangeCompetenciaStatus(competenciaId, nuevoEstado) {
    try {
      resetMessages()

      const { error } = await supabase
        .from("competencias")
        .update({ estado: nuevoEstado })
        .eq("id", competenciaId)

      if (error) throw error

      setSuccess(`Estado de la competencia actualizado a "${nuevoEstado}".`)
      await loadData()
    } catch (err) {
      console.error("ERROR ACTUALIZANDO ESTADO COMPETENCIA:", err)
      setError(err.message || "No se pudo actualizar el estado de la competencia.")
    }
  }

  async function handleChangeWodStatus(wodId, nuevoEstado) {
    try {
      resetMessages()

      const { error } = await supabase
        .from("competencia_wods")
        .update({ estado: nuevoEstado })
        .eq("id", wodId)

      if (error) throw error

      setSuccess(`Estado del WOD actualizado a "${nuevoEstado}".`)
      await loadData()
    } catch (err) {
      console.error("ERROR ACTUALIZANDO ESTADO WOD:", err)
      setError(err.message || "No se pudo actualizar el estado del WOD.")
    }
  }

  async function handleRemoveCompetidor(competidorId, nombre) {
    const ok = window.confirm(
      `¿Seguro que deseas retirar a "${nombre}" del Challenger? Se ocultará del listado.`
    )
    if (!ok) return

    try {
      resetMessages()

      const { error } = await supabase
        .from("competidores")
        .update({ activo: false })
        .eq("id", competidorId)

      if (error) throw error

      setSuccess(`"${nombre}" fue retirado correctamente.`)
      await loadData()
    } catch (err) {
      console.error("ERROR RETIRANDO COMPETIDOR:", err)
      setError(err.message || "No se pudo retirar al competidor.")
    }
  }

  async function handleRemoveWod(wodId, titulo) {
    const ok = window.confirm(
      `¿Seguro que deseas retirar el WOD / Challenge "${titulo}"? Se ocultará del listado.`
    )
    if (!ok) return

    try {
      resetMessages()

      const { error } = await supabase
        .from("competencia_wods")
        .update({ activo: false })
        .eq("id", wodId)

      if (error) throw error

      setSuccess(`"${titulo}" fue retirado correctamente.`)
      await loadData()
    } catch (err) {
      console.error("ERROR RETIRANDO WOD:", err)
      setError(err.message || "No se pudo retirar el WOD / Challenge.")
    }
  }

  const categoriasConCompetidoresPorCompetencia = useMemo(() => {
    const grouped = {}

    competencias.forEach((competencia) => {
      const competidoresDeCompetencia = competidores.filter(
        (item) => item.competencia_id === competencia.id
      )

      grouped[competencia.id] = categorias.map((categoria) => ({
        ...categoria,
        competidores: competidoresDeCompetencia.filter(
          (item) => item.categoria_id === categoria.id
        ),
      }))
    })

    return grouped
  }, [categorias, competidores, competencias])

  function toggleCompetencia(competenciaId) {
    setExpandedCompetenciaId((prev) => (prev === competenciaId ? "" : competenciaId))
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
            Administración del Evento
          </p>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">
            Competencias / Challenger
          </h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-white/70 md:text-base">
            Cada Challenger se comporta como un módulo desplegable. Al abrirlo, se muestran
            sus competidores, sus WODs y su estado general. Si está cerrado, se muestra solo
            la vista final de consulta.
          </p>
        </div>

        {(error || success) && (
          <div className="mb-6 space-y-3">
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

        <div className="mb-8 flex justify-end">
          <button
            type="button"
            onClick={() => openCompetenciaModal()}
            className="rounded-2xl bg-fuchsia-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:scale-[1.02] hover:bg-fuchsia-300 active:scale-[0.99]"
          >
            + Nuevo Challenger
          </button>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center text-white/60">
            Cargando challengers...
          </div>
        ) : competencias.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 p-10 text-center text-white/50">
            Aún no has creado ningún Challenger.
          </div>
        ) : (
          <div className="space-y-6">
            {competencias.map((competencia) => {
              const isExpanded = expandedCompetenciaId === competencia.id
              const isClosed = competencia.estado === "cerrado"

              const competidoresDeCompetencia = competidores.filter(
                (item) => item.competencia_id === competencia.id
              )

              const wodsDeCompetencia = wods.filter(
                (item) => item.competencia_id === competencia.id
              )

              const categoriasConCompetidores =
                categoriasConCompetidoresPorCompetencia[competencia.id] || []

              const totalRegistrados = competidoresDeCompetencia.filter(
                (item) => item.estado === "registrado"
              ).length

              const totalInscritos = competidoresDeCompetencia.filter(
                (item) => item.estado === "inscrito"
              ).length

              const totalWodsPublicados = wodsDeCompetencia.filter(
                (item) => item.estado === "publicado"
              ).length

              return (
                <div
                  key={competencia.id}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur"
                >
                  <button
                    type="button"
                    onClick={() => toggleCompetencia(competencia.id)}
                    className="w-full p-5 text-left transition hover:bg-white/[0.03]"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-fuchsia-300/80">
                          Challenger
                        </p>
                        <h2 className="text-2xl font-black tracking-tight text-white">
                          {competencia.titulo || competencia.nombre || "Competencia sin nombre"}
                        </h2>
                        <p className="mt-2 text-sm text-white/60">
                          {competencia.descripcion || "Sin descripción"}
                        </p>
                        <p className="mt-3 text-xs text-white/45">
                          Inicio: {formatDate(competencia.fecha_inicio_competencia)} • Fin:{" "}
                          {formatDate(competencia.fecha_fin)}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            PUBLICACION_STYLES[competencia.estado] || PUBLICACION_STYLES.borrador
                          }`}
                        >
                          {competencia.estado}
                        </span>

                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
                          {competidoresDeCompetencia.length} competidores
                        </span>

                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
                          {wodsDeCompetencia.length} WODs
                        </span>

                        <span className="text-xl text-white/70">
                          {isExpanded ? "▾" : "▸"}
                        </span>
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-white/10 px-5 pb-5 pt-5">
                      <div className="mb-6 grid gap-4 md:grid-cols-4">
                        <StatCard label="Competidores" value={competidoresDeCompetencia.length} />
                        <StatCard label="Inscritos" value={totalInscritos} />
                        <StatCard label="WODs" value={wodsDeCompetencia.length} />
                        <StatCard
                          label="WODs publicados"
                          value={totalWodsPublicados}
                        />
                      </div>

                      {!isClosed ? (
                        <>
                          <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                            <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                              <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-fuchsia-300/80">
                                  Configuración del Challenger
                                </p>
                                <h3 className="text-xl font-black text-white">
                                  Datos generales
                                </h3>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <select
                                  value={competencia.estado || "borrador"}
                                  onChange={(e) =>
                                    handleChangeCompetenciaStatus(competencia.id, e.target.value)
                                  }
                                  className="rounded-xl border border-white/10 bg-[#0c1224] px-3 py-2 text-xs text-white outline-none"
                                >
                                  <option value="borrador">Borrador</option>
                                  <option value="publicado">Publicado</option>
                                  <option value="cerrado">Cerrado</option>
                                </select>

                                <button
                                  type="button"
                                  onClick={() => openCompetenciaModal(competencia)}
                                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                                >
                                  Editar challenger
                                </button>
                              </div>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/70">
                              <strong className="text-white">Descripción:</strong>{" "}
                              {competencia.descripcion || "Sin descripción"}
                            </div>
                          </div>

                          <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                              <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
                                  Registro de Competidores
                                </p>
                                <h3 className="text-xl font-black text-white">
                                  Competidores de {competencia.titulo || competencia.nombre}
                                </h3>
                              </div>

                              <button
                                type="button"
                                onClick={() => openModal(competencia.id)}
                                className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-300 active:scale-[0.99]"
                              >
                                + Registrar competidor
                              </button>
                            </div>

                            {categorias.length === 0 ? (
                              <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-center text-white/45">
                                No hay categorías activas disponibles.
                              </div>
                            ) : (
                              <div className="grid gap-5 md:grid-cols-2">
                                {categoriasConCompetidores.map((categoria) => (
                                  <div
                                    key={categoria.id}
                                    className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
                                  >
                                    <div className="mb-4">
                                      <h4 className="text-lg font-black text-white">
                                        {categoria.nombre}
                                      </h4>
                                      <p className="mt-1 text-sm text-white/50">
                                        {categoria.competidores.length} competidor
                                        {categoria.competidores.length === 1 ? "" : "es"}
                                      </p>
                                    </div>

                                    {categoria.competidores.length === 0 ? (
                                      <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-4 text-sm text-white/45">
                                        Sin competidores en esta categoría.
                                      </div>
                                    ) : (
                                      <div className="space-y-3">
                                        {categoria.competidores.map((item) => (
                                          <div
                                            key={item.id}
                                            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                                          >
                                            <div>
                                              <div className="font-semibold text-white">
                                                {item.nombre_completo ||
                                                  item.nombres ||
                                                  "Competidor sin nombre"}
                                              </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2">
                                              <select
                                                value={item.estado}
                                                onChange={(e) =>
                                                  handleChangeEstado(item.id, e.target.value)
                                                }
                                                className={`rounded-full border px-3 py-1 text-xs font-semibold outline-none ${
                                                  ESTADO_STYLES[item.estado] ||
                                                  ESTADO_STYLES.registrado
                                                }`}
                                              >
                                                <option value="registrado">Registrado</option>
                                                <option value="inscrito">Inscrito</option>
                                              </select>

                                              <IconButton
                                                title="Borrar"
                                                danger
                                                onClick={() =>
                                                  handleRemoveCompetidor(
                                                    item.id,
                                                    item.nombre_completo ||
                                                      item.nombres ||
                                                      "este competidor"
                                                  )
                                                }
                                                icon="🗑️"
                                              />
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                              <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-violet-300/80">
                                  Registro de WODs de Competencia
                                </p>
                                <h3 className="text-xl font-black text-white">
                                  WODs / Challenges de {competencia.titulo || competencia.nombre}
                                </h3>
                              </div>

                              <button
                                type="button"
                                onClick={() => openWodModal(competencia.id)}
                                className="rounded-2xl bg-violet-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:scale-[1.02] hover:bg-violet-300 active:scale-[0.99]"
                              >
                                + Registrar WOD
                              </button>
                            </div>

                            {wodsDeCompetencia.length === 0 ? (
                              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-6 text-sm text-white/45">
                                Aún no hay WODs / Challenges registrados para este Challenger.
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {wodsDeCompetencia.map((wod) => (
                                  <div
                                    key={wod.id}
                                    className="rounded-2xl border border-white/6 bg-black/20 p-4"
                                  >
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                      <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <h4 className="text-lg font-bold text-white">
                                            {wod.titulo}
                                          </h4>
                                          <span
                                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                              PUBLICACION_STYLES[wod.estado] ||
                                              PUBLICACION_STYLES.borrador
                                            }`}
                                          >
                                            {wod.estado}
                                          </span>
                                        </div>
                                        <p className="mt-1 text-sm text-white/55">
                                          {wod.descripcion || "Sin descripción"}
                                        </p>
                                      </div>

                                      <div className="flex flex-wrap items-center gap-2">
                                        <select
                                          value={wod.estado}
                                          onChange={(e) =>
                                            handleChangeWodStatus(wod.id, e.target.value)
                                          }
                                          className="rounded-xl border border-white/10 bg-[#0c1224] px-3 py-2 text-xs text-white outline-none"
                                        >
                                          <option value="borrador">Borrador</option>
                                          <option value="publicado">Publicado</option>
                                          <option value="cerrado">Cerrado</option>
                                        </select>

                                        <button
                                          type="button"
                                          onClick={() => openWodModal(competencia.id, wod)}
                                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                                        >
                                          Editar
                                        </button>

                                        <IconButton
                                          title="Borrar"
                                          danger
                                          onClick={() =>
                                            handleRemoveWod(wod.id, wod.titulo || "este WOD")
                                          }
                                          icon="🗑️"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                            <div className="mb-4">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-zinc-300/80">
                                Vista final del Challenger
                              </p>
                              <h3 className="text-xl font-black text-white">
                                Resumen final
                              </h3>
                              <p className="mt-2 text-sm text-white/60">
                                Este Challenger está cerrado. Ya no se permiten cambios y se
                                muestra solo información final de consulta.
                              </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-4">
                              <StatCard label="Competidores" value={competidoresDeCompetencia.length} />
                              <StatCard label="Registrados" value={totalRegistrados} />
                              <StatCard label="Inscritos" value={totalInscritos} />
                              <StatCard label="WODs" value={wodsDeCompetencia.length} />
                            </div>
                          </div>

                          <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                            <div className="mb-6">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
                                Puestos por categoría
                              </p>
                              <h3 className="text-xl font-black text-white">
                                Categorías del Challenger
                              </h3>
                              <p className="mt-2 text-sm text-white/60">
                                Vista final de categorías. El ranking definitivo por resultados
                                se conecta luego con el módulo de `competencia_resultados`.
                              </p>
                            </div>

                            <div className="grid gap-5 md:grid-cols-2">
                              {categoriasConCompetidores.map((categoria) => (
                                <div
                                  key={categoria.id}
                                  className="rounded-3xl border border-white/10 bg-black/20 p-5"
                                >
                                  <div className="mb-4">
                                    <h4 className="text-lg font-black text-white">
                                      {categoria.nombre}
                                    </h4>
                                    <p className="mt-1 text-sm text-white/50">
                                      {categoria.competidores.length} atleta
                                      {categoria.competidores.length === 1 ? "" : "s"}
                                    </p>
                                  </div>

                                  {categoria.competidores.length === 0 ? (
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white/45">
                                      Sin competidores en esta categoría.
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      {categoria.competidores.map((item, index) => (
                                        <div
                                          key={item.id}
                                          className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-black text-white/80">
                                              {index + 1}
                                            </div>
                                            <div className="font-semibold text-white">
                                              {item.nombre_completo ||
                                                item.nombres ||
                                                "Competidor sin nombre"}
                                            </div>
                                          </div>

                                          <span
                                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                              ESTADO_STYLES[item.estado] ||
                                              ESTADO_STYLES.registrado
                                            }`}
                                          >
                                            {item.estado}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                            <div className="mb-6">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-violet-300/80">
                                WODs y estadísticas
                              </p>
                              <h3 className="text-xl font-black text-white">
                                WODs del Challenger
                              </h3>
                            </div>

                            {wodsDeCompetencia.length === 0 ? (
                              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-6 text-sm text-white/45">
                                No hay WODs registrados para este Challenger.
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {wodsDeCompetencia.map((wod) => (
                                  <div
                                    key={wod.id}
                                    className="rounded-2xl border border-white/6 bg-black/20 p-4"
                                  >
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                      <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <h4 className="text-lg font-bold text-white">
                                            {wod.titulo}
                                          </h4>
                                          <span
                                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                              PUBLICACION_STYLES[wod.estado] ||
                                              PUBLICACION_STYLES.borrador
                                            }`}
                                          >
                                            {wod.estado}
                                          </span>
                                        </div>
                                        <p className="mt-1 text-sm text-white/55">
                                          {wod.descripcion || "Sin descripción"}
                                        </p>
                                      </div>

                                      <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70">
                                        Orden {wod.orden || 1}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#071122] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.55)] md:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
                  Competidores
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">
                  Registrar competidor
                </h2>
              </div>

              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleSaveCompetidor} className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                  Nombre del Atleta
                </label>
                <input
                  type="text"
                  value={form.nombres}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/\s+/g, " ")
                    onChangeField("nombres", value)
                  }}
                  placeholder="Ej: JUAN PEREZ"
                  className={`w-full rounded-2xl border bg-[#0c1224] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 ${
                    duplicateCompetidor
                      ? "border-red-400/40 focus:border-red-400/60"
                      : "border-white/10 focus:border-cyan-400/40"
                  }`}
                />

                {duplicateCompetidor && (
                  <p className="mt-2 text-sm text-red-300">
                    Este nombre ya existe en este Challenger y no puede repetirse en ninguna categoría.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                  Categoría
                </label>
                <select
                  value={form.categoria_id}
                  onChange={(e) => onChangeField("categoria_id", e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#0c1224] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/40"
                >
                  <option value="">
                    {categorias.length === 0 ? "No hay categorías disponibles" : "Seleccionar categoría"}
                  </option>
                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                  Estado
                </label>
                <select
                  value={form.estado}
                  onChange={(e) => onChangeField("estado", e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#0c1224] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/40"
                >
                  <option value="registrado">Registrado</option>
                  <option value="inscrito">Inscrito</option>
                </select>
              </div>

              <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/5 p-4 text-sm leading-6 text-cyan-100/90">
                <strong>Registrado:</strong> aún no paga el valor de la competencia. <br />
                <strong>Inscrito:</strong> ya pagó y queda confirmado dentro del Challenger.
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving || categorias.length === 0 || !!duplicateCompetidor || !nombreNormalizado}
                  className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Guardando..." : "Guardar competidor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCompetenciaModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#071122] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.55)] md:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-fuchsia-300/80">
                  Challenger
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">
                  {editingCompetenciaId ? "Editar challenger" : "Nuevo challenger"}
                </h2>
              </div>

              <button
                onClick={closeCompetenciaModal}
                disabled={savingCompetencia}
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleSaveCompetencia} className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                  Nombre del challenger
                </label>
                <input
                  type="text"
                  value={competenciaForm.titulo}
                  onChange={(e) => onChangeCompetenciaField("titulo", e.target.value)}
                  placeholder="Ej: PHO3NIX 26.1"
                  className="w-full rounded-2xl border border-white/10 bg-[#0c1224] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-fuchsia-400/40"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                  Descripción
                </label>
                <textarea
                  rows={4}
                  value={competenciaForm.descripcion}
                  onChange={(e) => onChangeCompetenciaField("descripcion", e.target.value)}
                  placeholder="Describe el challenger..."
                  className="w-full rounded-2xl border border-white/10 bg-[#0c1224] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-fuchsia-400/40"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                    Fecha inicio
                  </label>
                  <input
                    type="date"
                    value={competenciaForm.fecha_inicio}
                    onChange={(e) => onChangeCompetenciaField("fecha_inicio", e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#0c1224] px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-400/40"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                    Fecha fin
                  </label>
                  <input
                    type="date"
                    value={competenciaForm.fecha_fin}
                    onChange={(e) => onChangeCompetenciaField("fecha_fin", e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#0c1224] px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-400/40"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                  Estado
                </label>
                <select
                  value={competenciaForm.estado}
                  onChange={(e) => onChangeCompetenciaField("estado", e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#0c1224] px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-400/40"
                >
                  <option value="borrador">Borrador</option>
                  <option value="publicado">Publicado</option>
                  <option value="cerrado">Cerrado</option>
                </select>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeCompetenciaModal}
                  disabled={savingCompetencia}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={savingCompetencia}
                  className="rounded-2xl bg-fuchsia-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:scale-[1.02] hover:bg-fuchsia-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingCompetencia ? "Guardando..." : "Guardar challenger"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showWodModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#071122] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.55)] md:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-300/80">
                  WODs / Challenges
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">
                  {editingWodId ? "Editar WOD / Challenge" : "Registrar WOD / Challenge"}
                </h2>
              </div>

              <button
                onClick={closeWodModal}
                disabled={savingWod}
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleSaveWod} className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                  Nombre del WOD / Challenge
                </label>
                <input
                  type="text"
                  value={wodForm.titulo}
                  onChange={(e) => onChangeWodField("titulo", e.target.value)}
                  placeholder="Ej: DÍA 1 / WOD 1"
                  className="w-full rounded-2xl border border-white/10 bg-[#0c1224] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-violet-400/40"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                  Descripción
                </label>
                <textarea
                  rows={4}
                  value={wodForm.descripcion}
                  onChange={(e) => onChangeWodField("descripcion", e.target.value)}
                  placeholder="Describe el challenge..."
                  className="w-full rounded-2xl border border-white/10 bg-[#0c1224] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-violet-400/40"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                  Estado inicial
                </label>
                <select
                  value={wodForm.estado}
                  onChange={(e) => onChangeWodField("estado", e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#0c1224] px-4 py-3 text-sm text-white outline-none focus:border-violet-400/40"
                >
                  <option value="borrador">Borrador</option>
                  <option value="publicado">Publicado</option>
                  <option value="cerrado">Cerrado</option>
                </select>
              </div>

              <div className="rounded-2xl border border-violet-400/10 bg-violet-400/5 p-4 text-sm leading-6 text-violet-100/90">
                Este módulo trabaja únicamente con <strong>máximas repeticiones</strong> y
                cada WOD quedará ligado al Challenger seleccionado.
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeWodModal}
                  disabled={savingWod}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={savingWod}
                  className="rounded-2xl bg-violet-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:scale-[1.02] hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingWod ? "Guardando..." : "Guardar WOD"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">{label}</p>
      <div className="mt-3 text-3xl font-black tracking-tight text-white">{value}</div>
    </div>
  )
}

function IconButton({ title, icon, onClick, danger = false }) {
  return (
    <button
      type="button"
      title={title}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
      className={[
        "flex h-9 w-9 items-center justify-center rounded-xl border transition",
        "bg-white/5 hover:bg-white/10 border-white/10",
        danger ? "hover:border-red-500/30" : "hover:border-white/20",
      ].join(" ")}
    >
      <span className="text-base leading-none">{icon}</span>
    </button>
  )
}