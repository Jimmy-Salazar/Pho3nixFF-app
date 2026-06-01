// src/pages/admin/pr/components/PRRankingList.jsx

import { formatLb } from "../utils/formatPR"

export default function PRRankingList({ rows, maxWeight, sessionUserId, onOpenHistory }) {
  return (
    <section className="phoenix-card min-h-0 overflow-hidden p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-white/45">
            Ranking extendido
          </div>
          <h2 className="mt-1 text-2xl font-black text-white">Top 20</h2>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-1 text-xs text-white/45">
          Auto 5s
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/25 p-5 text-center text-sm text-white/45">
          Aún no hay suficientes registros para mostrar del puesto 4 al 20.
        </div>
      ) : (
        <div className="max-h-full space-y-2 overflow-y-auto pr-1">
          {rows.map((item, index) => {
            const position = index + 4
            const isCurrentUser = item.usuario_id === sessionUserId
            const percentage = Math.max((Number(item.mejor_rm || 0) / Number(maxWeight || 1)) * 100, 4)

            return (
              <article
                key={`${item.usuario_id}-${position}`}
                className={[
                  "grid items-center gap-3 rounded-2xl border p-3 md:grid-cols-[62px_1fr_120px]",
                  isCurrentUser
                    ? "border-green-400/50 bg-green-500/10"
                    : "border-white/10 bg-white/[0.04]",
                ].join(" ")}
              >
                <div className="text-sm font-black text-white/45">
                  #{position}
                </div>

                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onOpenHistory(item)}
                    className="truncate text-left font-bold text-white transition hover:text-orange-300"
                  >
                    {item.nombre} {isCurrentUser ? <span className="text-green-300">(TÚ)</span> : null}
                  </button>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-300 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                <div className="text-right text-base font-black text-white">
                  {formatLb(item.mejor_rm)}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
