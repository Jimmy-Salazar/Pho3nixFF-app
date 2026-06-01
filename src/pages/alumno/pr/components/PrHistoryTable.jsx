import { formatDateCompact, formatRelativeDate } from "../utils/prAlumnoUtils"

export default function PrHistoryTable({ rows = [], deletingId = null, onDelete }) {
  const visibleRows = rows.slice(0, 7)

  return (
    <article className="min-h-0 overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 p-5 shadow-2xl shadow-black/30">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
            🕒 Historial de mis PR
          </p>

          <h3 className="mt-1 text-xl font-black uppercase text-white">
            Últimos registros
          </h3>
        </div>

        <span className="rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase text-orange-300">
          {rows.length}
        </span>
      </div>

      {visibleRows.length === 0 ? (
        <EmptyState text="Todavía no tienes registros de PR." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <div className="grid grid-cols-[1fr_1.2fr_1fr_1fr_40px] bg-white/[0.04] px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white/40">
            <div>Fecha</div>
            <div>Ejercicio</div>
            <div>Peso</div>
            <div>Registrado</div>
            <div />
          </div>

          <div className="divide-y divide-white/10">
            {visibleRows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[1fr_1.2fr_1fr_1fr_40px] items-center px-4 py-3 text-sm"
              >
                <div className="text-white/75">
                  {formatDateCompact(row.fecha)}
                </div>

                <div className="font-bold text-white">
                  {row.ejercicio_nombre}
                </div>

                <div>
                  <span className="font-black text-orange-400">
                    {row.peso_libras} lb
                  </span>
                </div>

                <div className="text-white/50">
                  {formatRelativeDate(row.created_at || row.fecha)}
                </div>

                <button
                  type="button"
                  onClick={() => onDelete(row.id)}
                  disabled={deletingId === row.id}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/20 text-red-300 transition hover:bg-red-500/10 disabled:opacity-40"
                  title="Eliminar PR"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
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
