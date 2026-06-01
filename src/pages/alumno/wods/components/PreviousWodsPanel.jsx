import {
  estimateWodCalories,
  formatDateBadge,
  formatModoRanking,
} from "../utils/wodAlumnoUtils"

export default function PreviousWodsPanel({ items = [], loading = false }) {
  return (
    <article className="min-h-[170px] min-w-0 w-full max-w-full overflow-hidden rounded-[2rem] border border-orange-500/20 bg-black/45 p-4 shadow-2xl shadow-black/30">
      <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
        <p className="truncate text-xs font-black uppercase tracking-[0.22em] text-orange-400">
          WODs anteriores
        </p>

        <button
          type="button"
          className="shrink-0 rounded-xl border border-orange-500/25 px-3 py-2 text-[10px] font-black uppercase text-orange-300 transition hover:bg-orange-500/10"
        >
          Ver todos
        </button>
      </div>

      {loading ? (
        <Empty text="Cargando WODs anteriores..." />
      ) : items.length === 0 ? (
        <Empty text="Aún no hay WODs anteriores para mostrar." />
      ) : (
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {items.slice(0, 4).map((item) => {
            const kcal = estimateWodCalories(item)?.value || 0
            const badge = formatDateBadge(item.fecha)

            return (
              <article
                key={item.id}
                className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-3"
              >
                <div className="flex min-w-0 gap-3">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-orange-500/25 bg-orange-500/10 text-orange-300">
                    <span className="text-lg font-black leading-none">
                      {badge.day}
                    </span>
                    <span className="text-[10px] font-black uppercase">
                      {badge.month}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-black uppercase text-white">
                      {item.nombre || "WOD"}
                    </h3>

                    <p className="mt-1 truncate text-xs text-white/45">
                      {formatModoRanking(item.modo_ranking)}
                    </p>

                    <p className="mt-1 truncate text-xs text-orange-300">
                      {kcal} kcal
                    </p>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </article>
  )
}

function Empty({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-black/25 p-4 text-sm text-white/40">
      {text}
    </div>
  )
}
