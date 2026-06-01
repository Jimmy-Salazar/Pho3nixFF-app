import { formatDateCompact } from "../utils/prAlumnoUtils"

const ICONS = ["🏋️", "🏋️‍♂️", "💪", "🔥", "⚡", "🏆"]

export default function PrBestMarksGrid({ bestMarks = [] }) {
  const visibleMarks = bestMarks.slice(0, 6)

  return (
    <article className="min-h-0 overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 p-5 shadow-2xl shadow-black/30">
      <div className="mb-4">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
          🏅 Mis mejores marcas por ejercicio
        </p>

        <h3 className="mt-1 text-xl font-black uppercase text-white">
          Top por movimiento
        </h3>
      </div>

      {visibleMarks.length === 0 ? (
        <EmptyState text="Registra tus primeras marcas para ver este resumen." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visibleMarks.map((mark, index) => (
            <article
              key={mark.id}
              className="grid grid-cols-[44px_1fr] gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 text-2xl">
                {ICONS[index % ICONS.length]}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white">
                  {mark.ejercicio_nombre}
                </p>

                <p className="mt-1 text-2xl font-black text-orange-500">
                  {mark.peso_libras} lb
                </p>

                <p className="text-xs text-white/45">
                  {formatDateCompact(mark.fecha)}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </article>
  )
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-black/25 p-4 text-sm text-white/40">
      {text}
    </div>
  )
}
