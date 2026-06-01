import { useMemo, useState } from "react"
import {
  parseTimeToSeconds,
  shouldUseTimeResult,
} from "../utils/wodAlumnoUtils"

export default function RegisterResultPanel({
  wod,
  loading = false,
  saving = false,
  onSave,
}) {
  const isTime = useMemo(() => shouldUseTimeResult(wod), [wod])

  const [modalidad, setModalidad] = useState("RX")
  const [timeValue, setTimeValue] = useState("")
  const [repeticiones, setRepeticiones] = useState("")
  const [notas, setNotas] = useState("")

  const disabled = loading || saving || !wod?.id

  const handleSubmit = (e) => {
    e.preventDefault()

    const payload = {
      modalidad,
      tiempo_segundos: isTime ? parseTimeToSeconds(timeValue) : null,
      tiempo_texto: isTime ? timeValue : "",
      repeticiones: Number(repeticiones || 0),
      notas,
    }

    onSave?.(payload)
  }

  return (
    <article className="min-h-[250px] min-w-0 w-full max-w-full overflow-hidden rounded-[2rem] border border-orange-500/20 bg-black/45 p-4 shadow-2xl shadow-black/30">
      <p className="truncate text-xs font-black uppercase tracking-[0.22em] text-orange-400">
        📝 Registra tu resultado
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div className="grid min-w-0 gap-3 sm:grid-cols-[150px_minmax(0,1fr)]">
          <label className="block min-w-0">
            <span className="mb-2 block text-xs font-bold text-white/65">
              Modalidad
            </span>
            <select
              value={modalidad}
              onChange={(e) => setModalidad(e.target.value)}
              disabled={disabled}
              className="w-full min-w-0 rounded-xl border border-white/10 bg-black/50 px-3 py-3 text-sm font-bold text-white outline-none transition focus:border-orange-500 disabled:opacity-50"
            >
              <option value="RX">RX</option>
              <option value="SC">Scaled</option>
              <option value="PR">Principiante</option>
            </select>
          </label>

          {isTime ? (
            <label className="block min-w-0">
              <span className="mb-2 block text-xs font-bold text-white/65">
                Tiempo total
              </span>
              <input
                value={timeValue}
                onChange={(e) => setTimeValue(e.target.value)}
                disabled={disabled}
                placeholder="Ej: 14:32"
                className="w-full min-w-0 rounded-xl border border-white/10 bg-black/50 px-3 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-orange-500 disabled:opacity-50"
              />
            </label>
          ) : (
            <label className="block min-w-0">
              <span className="mb-2 block text-xs font-bold text-white/65">
                Repeticiones
              </span>
              <input
                type="number"
                min="0"
                value={repeticiones}
                onChange={(e) => setRepeticiones(e.target.value)}
                disabled={disabled}
                placeholder="Ej: 120"
                className="w-full min-w-0 rounded-xl border border-white/10 bg-black/50 px-3 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-orange-500 disabled:opacity-50"
              />
            </label>
          )}
        </div>

        {isTime ? (
          <label className="block min-w-0">
            <span className="mb-2 block text-xs font-bold text-white/65">
              Repeticiones si no completaste
            </span>
            <input
              type="number"
              min="0"
              value={repeticiones}
              onChange={(e) => setRepeticiones(e.target.value)}
              disabled={disabled}
              placeholder="Ej: 120"
              className="w-full min-w-0 rounded-xl border border-white/10 bg-black/50 px-3 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-orange-500 disabled:opacity-50"
            />
          </label>
        ) : null}

        <label className="block min-w-0">
          <span className="mb-2 block text-xs font-bold text-white/65">
            Notas opcionales
          </span>
          <input
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            disabled={disabled}
            placeholder="Ej: Terminé RX / modifiqué peso / observación"
            className="w-full min-w-0 rounded-xl border border-white/10 bg-black/50 px-3 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-orange-500 disabled:opacity-50"
          />
        </label>

        <button
          type="submit"
          disabled={disabled}
          className="w-full rounded-2xl bg-orange-500 px-4 py-3 text-sm font-black uppercase text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar resultado"}
        </button>
      </form>
    </article>
  )
}
