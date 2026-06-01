// src/pages/admin/pr/modals/RegisterPRModal.jsx

import { useMemo, useState } from "react"
import { formatISODate } from "../utils/formatPR"

const DISCOS = [
  { key: "d45", label: "45 lb", value: 45 },
  { key: "d35", label: "35 lb", value: 35 },
  { key: "d25", label: "25 lb", value: 25 },
  { key: "d15", label: "15 lb", value: 15 },
  { key: "d10", label: "10 lb", value: 10 },
  { key: "d5", label: "5 lb", value: 5 },
  { key: "d2_5", label: "2.5 lb", value: 2.5 },
]

const EMPTY = {
  d45: 0,
  d35: 0,
  d25: 0,
  d15: 0,
  d10: 0,
  d5: 0,
  d2_5: 0,
}

export default function RegisterPRModal({
  saving,
  sessionUserId,
  esAdminOCoach,
  alumnos,
  ejercicios,
  ejercicioActual,
  onClose,
  onSave,
}) {
  const [alumnoId, setAlumnoId] = useState(esAdminOCoach ? "" : sessionUserId)
  const [ejercicioId, setEjercicioId] = useState(ejercicioActual?.id || ejercicios[0]?.id || "")
  const [fecha, setFecha] = useState(formatISODate())
  const [tipoBarra, setTipoBarra] = useState(45)
  const [discos, setDiscos] = useState(EMPTY)

  const totalPorLado = useMemo(() => {
    return DISCOS.reduce((sum, item) => sum + Number(discos[item.key] || 0) * item.value, 0)
  }, [discos])

  const total = useMemo(() => Number(tipoBarra) + totalPorLado * 2, [tipoBarra, totalPorLado])

  function changeDisco(key, value) {
    setDiscos((prev) => ({
      ...prev,
      [key]: value === "" ? 0 : Number(value),
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()

    if (!alumnoId || !ejercicioId || !fecha) {
      alert("Completa alumno, ejercicio y fecha.")
      return
    }

    onSave({
      alumnoId,
      ejercicioId,
      fecha,
      tipoBarra,
      discos,
      total,
    })
  }

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar"
      />

      <form onSubmit={handleSubmit} className="phoenix-card relative z-[141] w-full max-w-4xl overflow-hidden">
        <div className="relative border-b border-orange-500/15 bg-black/55 p-5">
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-orange-500/20 blur-3xl" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-black uppercase tracking-[0.16em] text-orange-300">
                🏆 Registrar PR
              </div>

              <h2 className="mt-2 text-2xl font-black text-white">
                Nueva marca personal
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-xl text-white/60 transition hover:border-orange-400/40 hover:text-orange-300 disabled:opacity-60"
            >
              ×
            </button>
          </div>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-[1fr_1fr]">
          <section className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {esAdminOCoach ? (
                <Field label="Alumno">
                  <select value={alumnoId} onChange={(e) => setAlumnoId(e.target.value)} className="phoenix-input">
                    <option value="" className="bg-black text-white">Seleccionar alumno</option>
                    {alumnos.map((alumno) => (
                      <option key={alumno.id} value={alumno.id} className="bg-black text-white">
                        {alumno.nombre || alumno.email}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : null}

              <Field label="Ejercicio">
                <select value={ejercicioId} onChange={(e) => setEjercicioId(e.target.value)} className="phoenix-input">
                  {ejercicios.map((ejercicio) => (
                    <option key={ejercicio.id} value={ejercicio.id} className="bg-black text-white">
                      {ejercicio.nombre}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Fecha">
                <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="phoenix-input" />
              </Field>

              <Field label="Barra">
                <select value={tipoBarra} onChange={(e) => setTipoBarra(Number(e.target.value))} className="phoenix-input">
                  <option value={45} className="bg-black text-white">45 lb</option>
                  <option value={35} className="bg-black text-white">35 lb</option>
                  <option value={25} className="bg-black text-white">25 lb</option>
                </select>
              </Field>
            </div>

            <div className="rounded-3xl border border-orange-500/15 bg-orange-500/10 p-5">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-orange-300">
                Peso total
              </div>

              <div className="mt-2 text-5xl font-black text-white">
                {total} <span className="text-2xl text-orange-300">lb</span>
              </div>

              <p className="mt-2 text-sm text-white/55">
                Barra {tipoBarra} lb + {totalPorLado} lb por lado.
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-black/25 p-4">
            <div className="mb-4">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-white/45">
                Calculadora
              </div>
              <h3 className="mt-1 text-xl font-black text-white">
                Discos por lado
              </h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {DISCOS.map((disco) => (
                <Field key={disco.key} label={disco.label}>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={discos[disco.key] === 0 ? "" : discos[disco.key]}
                    onChange={(e) => changeDisco(disco.key, e.target.value)}
                    placeholder="0"
                    className="phoenix-input"
                  />
                </Field>
              ))}
            </div>
          </section>
        </div>

        <div className="flex justify-end gap-3 border-t border-orange-500/15 bg-black/45 p-5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="phoenix-button-ghost min-w-[140px] text-sm disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={saving}
            className="phoenix-button-primary min-w-[180px] text-sm disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar PR"}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
        {label}
      </label>
      {children}
    </div>
  )
}
