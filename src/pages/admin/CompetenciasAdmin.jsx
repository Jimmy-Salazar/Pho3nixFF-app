import { useEffect, useMemo, useState } from "react"
import { supabase } from "../../supabase"

const ESTADO_STYLES = {
  registrado: "bg-amber-500/15 text-amber-300 border border-amber-400/20",
  inscrito: "bg-emerald-500/15 text-emerald-300 border border-emerald-400/20",
}

const initialForm = {
  nombres: "",
  categoria_id: "",
  estado: "registrado",
}

function normalizeName(value) {
  return (value || "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim()
}

export default function CompetenciasAdmin() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [categorias, setCategorias] = useState([])
  const [competidores, setCompetidores] = useState([])

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(initialForm)

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
            created_at
          `)
          .eq("activo", true)
          .order("created_at", { ascending: true }),
      ])

      if (categoriasError) throw categoriasError
      if (competidoresError) throw competidoresError

      setCategorias(categoriasData || [])
      setCompetidores(competidoresData || [])
    } catch (err) {
      console.error("ERROR CARGANDO COMPETENCIAS ADMIN:", err)
      setError(err.message || "No se pudo cargar la administración del evento.")
    } finally {
      setLoading(false)
    }
  }

  function openModal() {
    setForm(initialForm)
    setError("")
    setSuccess("")
    setShowModal(true)
  }

  function closeModal() {
    if (saving) return
    setShowModal(false)
    setForm(initialForm)
  }

  function onChangeField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const nombreNormalizado = useMemo(() => normalizeName(form.nombres), [form.nombres])

  const duplicateCompetidor = useMemo(() => {
    if (!nombreNormalizado) return null

    return (
      competidores.find((item) => {
        if (!item?.activo) return false
        const existingName = normalizeName(item.nombre_completo || item.nombres)
        return existingName === nombreNormalizado
      }) || null
    )
  }, [competidores, nombreNormalizado])

  async function handleSaveCompetidor(e) {
    e.preventDefault()

    const nombres = normalizeName(form.nombres)

    if (!nombres) {
      setError("El nombre del competidor es obligatorio.")
      return
    }

    if (!form.categoria_id) {
      setError("Debes seleccionar una categoría.")
      return
    }

    if (duplicateCompetidor) {
      setError("Ese competidor ya está registrado en el evento y no puede repetirse en ninguna categoría.")
      return
    }

    try {
      setSaving(true)
      setError("")
      setSuccess("")

      const { data: dbCompetidores, error: dbCheckError } = await supabase
        .from("competidores")
        .select("id,nombres,nombre_completo,activo")
        .eq("activo", true)

      if (dbCheckError) throw dbCheckError

      const duplicateInDb = (dbCompetidores || []).find((item) => {
        const existingName = normalizeName(item.nombre_completo || item.nombres)
        return existingName === nombres
      })

      if (duplicateInDb) {
        setError("Ese competidor ya está registrado en el evento y no puede repetirse en ninguna categoría.")
        setSaving(false)
        return
      }

      const { error } = await supabase.from("competidores").insert({
        nombres,
        categoria_id: form.categoria_id,
        estado: form.estado,
        es_alumno_registrado: false,
        activo: true,
      })

      if (error) throw error

      setSuccess("Competidor registrado correctamente.")
      setShowModal(false)
      setForm(initialForm)
      await loadData()
    } catch (err) {
      console.error("ERROR REGISTRANDO COMPETIDOR:", err)
      setError(err.message || "No se pudo registrar el competidor.")
    } finally {
      setSaving(false)
    }
  }

  async function handleChangeEstado(competidorId, nuevoEstado) {
    try {
      setError("")
      setSuccess("")

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

  async function handleRemoveCompetidor(competidorId, nombre) {
    const ok = window.confirm(
      `¿Seguro que deseas retirar a "${nombre}" del evento? Se ocultará del listado.`
    )
    if (!ok) return

    try {
      setError("")
      setSuccess("")

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

  const categoriasConCompetidores = useMemo(() => {
    return categorias.map((categoria) => ({
      ...categoria,
      competidores: competidores.filter((item) => item.categoria_id === categoria.id),
    }))
  }, [categorias, competidores])

  const totalCompetidores = competidores.length
  const totalRegistrados = competidores.filter((i) => i.estado === "registrado").length
  const totalInscritos = competidores.filter((i) => i.estado === "inscrito").length

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
            Desde aquí se administra el evento. Primero gestionas los competidores y
            más abajo los WODs o Challenges de competencia.
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

        {/* CARD 1: REGISTRO DE COMPETIDORES */}
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
                Registro de Competidores
              </p>
              <h2 className="text-2xl font-black tracking-tight text-white">
                Competidores por categoría
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/65">
                Registra a los participantes mediante popup y visualízalos agrupados por
                categoría. <strong>Registrado</strong> significa que aún no paga;
                <strong> Inscrito</strong> significa que ya pagó la competencia.
              </p>
            </div>

            <button
              type="button"
              onClick={openModal}
              className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-300 active:scale-[0.99]"
            >
              + Registrar competidor
            </button>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <StatCard label="Total competidores" value={totalCompetidores} />
            <StatCard label="Registrados" value={totalRegistrados} />
            <StatCard label="Inscritos" value={totalInscritos} />
          </div>

          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center text-white/60">
              Cargando competidores...
            </div>
          ) : categorias.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center text-white/50">
              No hay categorías activas disponibles.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {categoriasConCompetidores.map((categoria) => (
                <div
                  key={categoria.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-black text-white">{categoria.nombre}</h3>
                      <p className="mt-1 text-sm text-white/50">
                        {categoria.competidores.length} competidor
                        {categoria.competidores.length === 1 ? "" : "es"}
                      </p>
                    </div>

                    <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-300">
                      {categoria.competidores.length}
                    </div>
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
                          className="rounded-2xl border border-white/6 bg-black/20 p-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <div className="font-semibold text-white">
                                {item.nombre_completo || item.nombres || "Competidor sin nombre"}
                              </div>
                              <div className="mt-1 text-sm text-white/50">
                                {categoria.nombre}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                  ESTADO_STYLES[item.estado] || ESTADO_STYLES.registrado
                                }`}
                              >
                                {item.estado}
                              </span>

                              <select
                                value={item.estado}
                                onChange={(e) => handleChangeEstado(item.id, e.target.value)}
                                className="rounded-xl border border-white/10 bg-[#0c1224] px-3 py-2 text-xs text-white outline-none"
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
                                    item.nombre_completo || item.nombres || "este competidor"
                                  )
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
              ))}
            </div>
          )}
        </div>

        {/* CARD 2: WODS / CHALLENGES */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-violet-300/80">
            Registro de WODs de Competencia
          </p>
          <h2 className="text-2xl font-black tracking-tight text-white">
            WODs / Challenger
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/60">
            Esta card va debajo de competidores, como pediste. En el siguiente paso
            aquí montamos el popup y la gestión de los WODs de competencia.
          </p>

          <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-6 text-sm text-white/45">
            Módulo WODs / Challenger pendiente.
          </div>
        </div>
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
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Registra al competidor y asígnalo a una categoría. El estado define
                  si solo está registrado o si ya quedó inscrito porque pagó el valor
                  de la competencia.
                </p>
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
                    const value = e.target.value
                      .toUpperCase()
                      .replace(/\s+/g, " ")
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
                    Este nombre ya existe en el evento y no puede repetirse en ninguna categoría.
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
                <strong>Inscrito:</strong> ya pagó y queda confirmado dentro del evento.
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
        "h-9 w-9 rounded-xl border flex items-center justify-center transition",
        "bg-white/5 hover:bg-white/10 border-white/10",
        danger ? "hover:border-red-500/30" : "hover:border-white/20",
      ].join(" ")}
    >
      <span className="text-base leading-none">{icon}</span>
    </button>
  )
}