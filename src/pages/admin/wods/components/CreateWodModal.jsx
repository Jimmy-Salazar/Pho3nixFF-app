// src/pages/admin/wods/components/CreateWodModal.jsx

import { useState } from "react"
import WodCaloriesPanel from "./WodCaloriesPanel"
import { estimateWodWithAi } from "../services/estimateWodWithAi"

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

const EMPTY_ESTIMATE = {
  caloriasMin: 0,
  caloriasMax: 0,
  intensidad: "Sin analizar",
  duracion: "0 min",
  cargaMetabolica: 0,
  cardio: 0,
  fuerza: 0,
  intensidadScore: 0,
  intensidadPuntos: 0,
  nota: "Aún no hay análisis. Escribe el WOD y presiona Analizar con IA.",
  tip: "La estimación aparecerá después del análisis inteligente del WOD.",
  source: "empty",
}

export default function CreateWodModal({ initialWod = null, saving = false, onClose, onSave }) {
  const [nombre, setNombre] = useState(initialWod?.nombre || "")
  const [descripcion, setDescripcion] = useState(initialWod?.descripcion || "")
  const [modoRanking, setModoRanking] = useState(initialWod?.modo_ranking || "sin_ranking")
  const [modalidad, setModalidad] = useState(initialWod?.modalidad || "single")
  const [estimate, setEstimate] = useState(EMPTY_ESTIMATE)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState("")

  const resetEstimate = () => {
    setEstimate(EMPTY_ESTIMATE)
    setAiError("")
  }

  async function handleAiEstimate() {
    if (!descripcion.trim()) {
      alert("Primero escribe la descripción del WOD.")
      return
    }

    try {
      setAiLoading(true)
      setAiError("")

      const result = await estimateWodWithAi({
        nombre,
        descripcion,
        modalidad,
        modoRanking,
      })

      setEstimate(result)
    } catch (error) {
      setEstimate(EMPTY_ESTIMATE)
      setAiError(error?.message || "No se pudo estimar con IA.")
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!descripcion.trim()) {
      alert("Debes escribir la descripción del WOD.")
      return
    }

    onSave({
      nombre: nombre.trim() || null,
      descripcion: descripcion.trim(),
      modo_ranking: modoRanking,
      modalidad,
      calorias_min: estimate.source === "empty" ? null : estimate.caloriasMin,
      calorias_max: estimate.source === "empty" ? null : estimate.caloriasMax,
      intensidad_estimada: estimate.source === "empty" ? null : estimate.intensidad,
      duracion_estimada: estimate.source === "empty" ? null : estimate.duracion,
      calorias_nota: estimate.source === "empty" ? null : estimate.nota,
    })
  }

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-1.5 sm:p-3">
      <button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar"
      />

      <form
        onSubmit={handleSubmit}
        className="phoenix-card relative z-[141] flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-y-auto xl:grid xl:h-[92vh] xl:grid-cols-[1.05fr_.95fr] xl:overflow-hidden"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-black/60 text-base text-white/70 transition hover:border-orange-400/40 hover:text-orange-300 sm:right-4 sm:top-4 xl:h-9 xl:w-9"
          aria-label="Cerrar"
        >
          ×
        </button>

        <section className="border-b border-orange-500/15 p-3 sm:p-4 xl:min-h-0 xl:overflow-y-auto xl:border-b-0 xl:border-r">
          <div className="mb-3 pr-8">
            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-orange-300">
              🗓️ {initialWod ? "Editar WOD" : "Crear WOD"}
            </div>

            <h2 className="mt-1.5 text-xl font-black leading-tight text-white sm:text-2xl">
              {initialWod ? "Editar borrador" : "Crear WOD"}
            </h2>

            <p className="mt-1 text-xs leading-5 text-white/55">
              Completa los datos y usa IA para generar la estimación.
            </p>
          </div>

          <div className="space-y-2.5">
            <Field label="Nombre del WOD">
              <input
                type="text"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value)
                  resetEstimate()
                }}
                placeholder="Ej: Murph"
                className="phoenix-input h-10 text-xs"
              />
            </Field>

            <Field label="Descripción del WOD" required>
              <textarea
                value={descripcion}
                onChange={(e) => {
                  setDescripcion(e.target.value)
                  resetEstimate()
                }}
                placeholder={"For Time:\n1 mile run\n100 pull-ups\n200 push-ups\n300 squats\n1 mile run"}
                className="h-[110px] w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5 text-xs leading-5 text-white outline-none transition placeholder:text-white/30 focus:border-orange-500 focus:shadow-[0_0_0_4px_rgba(249,115,22,.15)] sm:h-[130px]"
              />
            </Field>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <Field label="Modalidad" required>
                <select
                  value={modalidad}
                  onChange={(e) => {
                    setModalidad(e.target.value)
                    resetEstimate()
                  }}
                  className="phoenix-input h-10 text-xs"
                >
                  {MODALIDAD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-black text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Ranking" required>
                <select
                  value={modoRanking}
                  onChange={(e) => {
                    setModoRanking(e.target.value)
                    resetEstimate()
                  }}
                  className="phoenix-input h-10 text-xs"
                >
                  {RANKING_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-black text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="rounded-xl border border-orange-500/15 bg-orange-500/10 p-2.5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs font-black text-orange-300">
                    Análisis inteligente del WOD
                  </div>
                  <div className="mt-0.5 text-[10px] leading-4 text-white/55">
                    Gemini analizará movimientos, volumen, modalidad y duración.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAiEstimate}
                  disabled={aiLoading || !descripcion.trim()}
                  className="rounded-xl border border-orange-500/30 bg-black/35 px-4 py-2 text-xs font-black text-orange-300 transition hover:bg-orange-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {aiLoading ? "Analizando..." : "Analizar con IA"}
                </button>
              </div>

              {aiError ? (
                <div className="mt-2 rounded-lg border border-red-500/25 bg-red-500/10 px-2.5 py-1.5 text-[10px] text-red-200">
                  {aiError}
                </div>
              ) : null}

              {estimate.source === "gemini" ? (
                <div className="mt-2 rounded-lg border border-green-500/20 bg-green-500/10 px-2.5 py-1.5 text-[10px] font-bold text-green-200">
                  IA aplicada. Esta estimación se guardará con el WOD.
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:flex sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving || aiLoading}
              className="phoenix-button-ghost w-full py-2 text-xs disabled:opacity-60 sm:w-auto"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving || aiLoading}
              className="phoenix-button-primary w-full py-2 text-xs disabled:opacity-60 sm:w-auto"
            >
              {saving ? "Guardando..." : initialWod ? "Guardar cambios" : "Guardar borrador"}
            </button>
          </div>
        </section>

        <section className="min-h-0 p-3 sm:p-4 xl:overflow-y-auto">
          <WodCaloriesPanel estimate={estimate} />
        </section>
      </form>
    </div>
  )
}

function Field({ label, required = false, children }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-black uppercase tracking-[0.14em] text-white/55">
        {label} {required ? <span className="text-orange-300">*</span> : null}
      </label>
      {children}
    </div>
  )
}
