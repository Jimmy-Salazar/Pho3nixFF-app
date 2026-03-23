// src/pages/admin/Wods.jsx

import { useEffect, useState } from "react"
import { supabase } from "../../supabase"

const RANKING_OPTIONS = [
  { value: "sin_ranking", label: "Sin ranking" },
  { value: "mayor_es_mejor", label: "Más repeticiones" },
  { value: "menor_es_mejor", label: "Menor tiempo" },
]

const MODALIDAD_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "duo", label: "Duo" },
  { value: "trio", label: "Trio" },
]

export default function Wods() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishingId, setPublishingId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState("")
  const [wods, setWods] = useState([])

  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [modoRanking, setModoRanking] = useState("sin_ranking")
  const [modalidad, setModalidad] = useState("single")

  const [publishModalOpen, setPublishModalOpen] = useState(false)
  const [selectedWod, setSelectedWod] = useState(null)
  const [publishFecha, setPublishFecha] = useState("")
  const [publishError, setPublishError] = useState("")

  useEffect(() => {
    loadWods()
  }, [])

  async function loadWods() {
    try {
      setLoading(true)
      setError("")

      const { data, error } = await supabase
        .from("wod")
        .select(
          "id,nombre,fecha,descripcion,modo_ranking,modalidad,activo,publicado,fecha_publicacion,created_at"
        )
        .order("created_at", { ascending: false })

      if (error) throw error

      setWods(data || [])
    } catch (e) {
      setError(e?.message || "No se pudieron cargar los WODs")
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setNombre("")
    setDescripcion("")
    setModoRanking("sin_ranking")
    setModalidad("single")
    setEditingId(null)
  }

  async function handleSaveDraft(e) {
    e.preventDefault()

    if (!descripcion.trim()) {
      alert("Debes escribir la descripción del WOD.")
      return
    }

    try {
      setSaving(true)

      const payload = {
        nombre: nombre.trim() || null,
        descripcion: descripcion.trim(),
        modo_ranking: modoRanking,
        modalidad,
      }

      if (editingId) {
        const editingWod = wods.find((w) => w.id === editingId)
        const status = getWodStatus(editingWod)

        if (status !== "pendiente") {
          alert("Solo los WODs en estado PENDIENTE se pueden editar.")
          setSaving(false)
          return
        }

        const { error } = await supabase
          .from("wod")
          .update(payload)
          .eq("id", editingId)

        if (error) throw error
      } else {
        const { error } = await supabase.from("wod").insert({
          ...payload,
          fecha: null,
          activo: false,
          publicado: false,
          fecha_publicacion: null,
        })

        if (error) throw error
      }

      resetForm()
      await loadWods()
    } catch (e) {
      alert(e?.message || "No se pudo guardar el borrador.")
    } finally {
      setSaving(false)
    }
  }

  function handleEditDraft(wod) {
    const status = getWodStatus(wod)

    if (status !== "pendiente") {
      alert("Solo los WODs en estado PENDIENTE se pueden editar.")
      return
    }

    setEditingId(wod.id)
    setNombre(wod.nombre || "")
    setDescripcion(wod.descripcion || "")
    setModoRanking(wod.modo_ranking || "sin_ranking")
    setModalidad(wod.modalidad || "single")

    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function openPublishModal(wod) {
    const status = getWodStatus(wod)

    if (status !== "pendiente") {
      alert("Solo los WODs en estado PENDIENTE se pueden programar o publicar.")
      return
    }

    setSelectedWod(wod)
    setPublishFecha(wod.fecha || "")
    setPublishError("")
    setPublishModalOpen(true)
  }

  function closePublishModal() {
    if (publishingId) return
    setPublishModalOpen(false)
    setSelectedWod(null)
    setPublishFecha("")
    setPublishError("")
  }

  async function handlePublish(e) {
    e.preventDefault()

    if (!selectedWod) return

    const status = getWodStatus(selectedWod)

    if (status !== "pendiente") {
      setPublishError("Solo los WODs en estado PENDIENTE se pueden publicar o reprogramar.")
      return
    }

    if (!publishFecha) {
      setPublishError("Debes seleccionar la fecha del WOD.")
      return
    }

    if (isPastDate(publishFecha)) {
      setPublishError("No puedes publicar un WOD en una fecha anterior a hoy.")
      return
    }

    try {
      setPublishingId(selectedWod.id)
      setPublishError("")

      const { data: existingPublished, error: existingError } = await supabase
        .from("wod")
        .select("id,nombre,fecha")
        .eq("fecha", publishFecha)
        .eq("publicado", true)

      if (existingError) throw existingError

      const conflict = (existingPublished || []).find((row) => row.id !== selectedWod.id)

      if (conflict) {
        setPublishError("Ya existe un WOD publicado para esa fecha.")
        setPublishingId(null)
        return
      }

      const fechaPublicacion = buildPreviousDay2359(publishFecha)

      const { error } = await supabase
        .from("wod")
        .update({
          fecha: publishFecha,
          publicado: true,
          activo: true,
          fecha_publicacion: fechaPublicacion,
        })
        .eq("id", selectedWod.id)

      if (error) throw error

      await loadWods()
      closePublishModal()
    } catch (e) {
      setPublishError(e?.message || "No se pudo publicar el WOD.")
    } finally {
      setPublishingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-white md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-3xl border border-orange-500/20 bg-white/5 p-5 shadow-2xl backdrop-blur-xl">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">
            Admin Module
          </div>

          <h1 className="text-2xl font-black tracking-tight md:text-4xl">
            Gestión de WODs
          </h1>

          <p className="mt-2 text-sm text-slate-300 md:text-base">
            Crea borradores, define modalidad, edita solo pendientes y publica WODs sin duplicar fechas.
          </p>
        </div>

        <form
          onSubmit={handleSaveDraft}
          className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl"
        >
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {editingId ? "Editar borrador" : "Nuevo borrador"}
              </h2>
              <p className="mt-1 text-sm text-white/55">
                {editingId
                  ? "Solo los WODs pendientes se pueden editar."
                  : "Crea un WOD sin fecha. Luego lo publicas cuando quieras."}
              </p>
            </div>

            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/15"
              >
                Cancelar edición
              </button>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="xl:col-span-2">
              <label className="mb-2 block text-sm font-medium text-white/75">
                Nombre del WOD
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: FRAN / BARBARA / AMRAP 12"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-orange-400/30"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/75">
                Tipo de ranking
              </label>
              <select
                value={modoRanking}
                onChange={(e) => setModoRanking(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-orange-400/30"
              >
                {RANKING_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/75">
                Modalidad
              </label>
              <select
                value={modalidad}
                onChange={(e) => setModalidad(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-orange-400/30"
              >
                {MODALIDAD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-white/75">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder={`Ejemplo:
5 Rounds for Time
20 Pull-Ups
30 Push-Ups
40 Sit-Ups
50 Air Squats`}
              rows={6}
              className="w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-white/30 focus:border-orange-400/30"
              required
            />
          </div>

          <div className="mt-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl border border-orange-400/20 bg-orange-500/10 px-5 py-3 text-sm font-medium text-orange-200 transition hover:bg-orange-500/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Guardando..."
                : editingId
                ? "Guardar cambios"
                : "Guardar borrador"}
            </button>
          </div>
        </form>

        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">WODs creados</h2>
          <span className="text-xs text-white/45">{wods.length} registro(s)</span>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/60">
            Cargando WODs...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
            {error}
          </div>
        ) : wods.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-white/60">
            Aún no hay WODs creados.
          </div>
        ) : (
          <div className="space-y-4">
            {wods.map((wod) => {
              const status = getWodStatus(wod)

              return (
                <div
                  key={wod.id}
                  className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/60">
                        {wod.fecha ? formatHumanDate(wod.fecha) : "Borrador sin fecha"}
                      </div>

                      <h3 className="mt-3 text-xl font-bold text-white">
                        {wod.nombre || "WOD sin nombre"}
                      </h3>

                      <div className="mt-2 text-sm text-white/50">
                        {formatModoRanking(wod.modo_ranking)} • {formatModalidad(wod.modalidad)}
                      </div>

                      <div className="mt-3">
                        <StatusBadge status={status} />
                      </div>

                      {wod.fecha_publicacion ? (
                        <div className="mt-2 text-xs text-white/45">
                          Publicación: {formatDateTime(wod.fecha_publicacion)}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {status === "pendiente" ? (
                        <button
                          type="button"
                          onClick={() => handleEditDraft(wod)}
                          className="rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-200 transition hover:bg-blue-500/15"
                        >
                          Editar
                        </button>
                      ) : null}

                      {status === "pendiente" ? (
                        <button
                          type="button"
                          onClick={() => openPublishModal(wod)}
                          className="rounded-2xl border border-orange-400/20 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-200 transition hover:bg-orange-500/15"
                        >
                          {wod.publicado ? "Reprogramar" : "Publicar"}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 whitespace-pre-line rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/75">
                    {wod.descripcion}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {publishModalOpen && selectedWod ? (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={closePublishModal}
            />

            <div className="relative z-[121] w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#0b0f14] shadow-2xl">
              <div className="border-b border-white/10 bg-gradient-to-br from-orange-500/10 via-white/5 to-blue-500/10 p-5 sm:p-6">
                <div className="text-xs uppercase tracking-[0.2em] text-orange-300">
                  Publicar WOD
                </div>

                <h3 className="mt-2 text-xl font-semibold text-white sm:text-2xl">
                  {selectedWod.nombre || "WOD sin nombre"}
                </h3>

                <p className="mt-2 text-sm text-white/60">
                  Al publicarlo se activará a las 23:59 del día anterior.
                </p>
              </div>

              <form onSubmit={handlePublish} className="p-5 sm:p-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/80">
                    Fecha del WOD
                  </label>

                  <input
                    type="date"
                    value={publishFecha}
                    onChange={(e) => setPublishFecha(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-400/30"
                    required
                  />
                </div>

                {publishFecha ? (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                    Publicación automática:{" "}
                    <span className="font-medium text-orange-300">
                      {formatDateTime(buildPreviousDay2359(publishFecha))}
                    </span>
                  </div>
                ) : null}

                {publishError ? (
                  <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {publishError}
                  </div>
                ) : null}

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={publishingId === selectedWod.id}
                    className="rounded-2xl border border-orange-400/20 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-200 transition hover:bg-orange-500/15 disabled:opacity-60"
                  >
                    {publishingId === selectedWod.id ? "Publicando..." : "Guardar publicación"}
                  </button>

                  <button
                    type="button"
                    onClick={closePublishModal}
                    disabled={publishingId === selectedWod.id}
                    className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white/85 transition hover:bg-white/15 disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    pendiente: "border-yellow-400/20 bg-yellow-500/10 text-yellow-200",
    activo: "border-green-400/20 bg-green-500/10 text-green-200",
    inactivo: "border-red-400/20 bg-red-500/10 text-red-200",
  }

  const label = {
    pendiente: "PENDIENTE",
    activo: "ACTIVO",
    inactivo: "INACTIVO",
  }

  return (
    <div
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
        map[status] || map.pendiente
      }`}
    >
      {label[status] || "PENDIENTE"}
    </div>
  )
}

function getWodStatus(wod) {
  const now = new Date()

  if (!wod?.publicado || !wod?.fecha_publicacion || !wod?.fecha) {
    return "pendiente"
  }

  const publishAt = new Date(wod.fecha_publicacion)
  const endOfWodDay = new Date(`${wod.fecha}T23:59:59`)

  if (now < publishAt) return "pendiente"
  if (now > endOfWodDay) return "inactivo"
  return "activo"
}

function formatHumanDate(value) {
  if (!value) return "-"
  try {
    const date = new Date(`${value}T00:00:00`)
    return new Intl.DateTimeFormat("es-EC", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date)
  } catch {
    return String(value)
  }
}

function formatDateTime(value) {
  if (!value) return "-"
  try {
    const date = new Date(value)
    return new Intl.DateTimeFormat("es-EC", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date)
  } catch {
    return String(value)
  }
}

function formatModoRanking(modo) {
  const m = String(modo || "").trim().toLowerCase()

  if (m === "sin_ranking") return "Sin ranking"
  if (m === "mayor_es_mejor") return "Más repeticiones"
  if (m === "menor_es_mejor") return "Menor tiempo"

  return modo || "Sin definir"
}

function formatModalidad(modalidad) {
  const m = String(modalidad || "").trim().toLowerCase()

  if (m === "single") return "Single"
  if (m === "duo") return "Duo"
  if (m === "trio") return "Trio"

  return "Single"
}

function isPastDate(dateStr) {
  const today = new Date()
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const target = new Date(`${dateStr}T00:00:00`)
  return target < current
}

function buildPreviousDay2359(dateStr) {
  const target = new Date(`${dateStr}T00:00:00`)
  target.setDate(target.getDate() - 1)
  target.setHours(23, 59, 0, 0)
  return target.toISOString()
}