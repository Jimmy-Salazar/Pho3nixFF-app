import { useMemo, useState } from "react"
import { todayISO } from "../utils/prAlumnoUtils"

export default function RegisterPrPanel({
  exercises = [],
  saving = false,
  onSave,
}) {
  const [form, setForm] = useState({
    ejercicio_id: "",
    peso_libras: "",
    fecha: todayISO(),
  })

  const canSubmit = useMemo(() => {
    return !!form.ejercicio_id && Number(form.peso_libras || 0) > 0 && !!form.fecha
  }, [form])

  const handleChange = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!canSubmit || saving) return

    await onSave({
      ejercicio_id: form.ejercicio_id,
      peso_libras: Number(form.peso_libras || 0),
      fecha: form.fecha,
    })

    setForm((current) => ({
      ...current,
      peso_libras: "",
      fecha: todayISO(),
    }))
  }

  return (
    <article className="rounded-[2rem] border border-orange-500/20 bg-black/45 p-5 shadow-2xl shadow-black/30">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
        🔥 Registrar nueva marca personal
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label className="mb-2 block text-xs font-bold text-white/75">
            Ejercicio
          </label>

          <select
            value={form.ejercicio_id}
            onChange={(e) => handleChange("ejercicio_id", e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500/50"
          >
            <option value="">Selecciona un ejercicio</option>

            {exercises.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold text-white/75">
            Peso en libras
          </label>

          <input
            type="number"
            min="1"
            step="0.5"
            value={form.peso_libras}
            onChange={(e) => handleChange("peso_libras", e.target.value)}
            placeholder="Ej: 185"
            className="w-full rounded-xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-orange-500/50"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold text-white/75">
            Fecha
          </label>

          <input
            type="date"
            value={form.fecha}
            onChange={(e) => handleChange("fecha", e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500/50"
          />
        </div>

        <button
          type="submit"
          disabled={!canSubmit || saving}
          className="w-full rounded-xl bg-orange-500 px-5 py-3 text-sm font-black uppercase text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar PR"}
        </button>
      </form>
    </article>
  )
}
