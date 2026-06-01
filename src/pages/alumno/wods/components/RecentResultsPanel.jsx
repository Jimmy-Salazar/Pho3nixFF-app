import {
  formatDateShort,
  formatResultValue,
} from "../utils/wodAlumnoUtils"

export default function RecentResultsPanel({ items = [], loading = false }) {
  const visibleItems = items.slice(0, 3)

  return (
    <article className="flex h-full min-h-[250px] min-w-0 w-full max-w-full flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 p-5 shadow-2xl shadow-black/30 xl:min-h-0">
      <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
        <p className="truncate text-xs font-black uppercase tracking-[0.22em] text-orange-400">
          🏆 Tus últimos resultados
        </p>

        <span className="shrink-0 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase text-orange-300">
          {items.length}
        </span>
      </div>

      {loading ? (
        <Empty text="Cargando tus resultados..." />
      ) : visibleItems.length === 0 ? (
        <Empty text="Cuando registres resultados, aparecerán aquí." />
      ) : (
        <div className="min-h-0 min-w-0 flex-1 space-y-2 overflow-hidden">
          {visibleItems.map((item) => (
            <article
              key={item.id}
              className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3"
            >
              <div className="min-w-0">
                <h3 className="truncate text-sm font-black uppercase text-white">
                  {item.wod_nombre || item.wod?.nombre || item.wod?.titulo || "WOD"}
                </h3>

                <p className="mt-1 truncate text-xs text-white/45">
                  {formatDateShort(item.fecha || item.created_at)}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-sm font-black text-white">
                  {formatResultValue(item)}
                </p>
                <p className="mt-1 text-xs text-orange-300">
                  {item.modalidad || "RX"}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}

      <button
        type="button"
        className="mt-4 w-full shrink-0 rounded-2xl border border-orange-500/35 px-4 py-3 text-xs font-black uppercase text-orange-400 transition hover:bg-orange-500/10"
      >
        Ver todos mis resultados
      </button>
    </article>
  )
}

function Empty({ text }) {
  return (
    <div className="flex min-h-[120px] flex-1 items-center rounded-2xl border border-dashed border-white/10 bg-black/25 p-4 text-sm text-white/40">
      {text}
    </div>
  )
}
