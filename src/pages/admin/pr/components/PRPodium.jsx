// src/pages/admin/pr/components/PRPodium.jsx

import { formatLb } from "../utils/formatPR"

export default function PRPodium({ top3, maxWeight, sessionUserId, onOpenHistory }) {
  return (
    <section className="phoenix-card min-h-0 overflow-hidden p-4">
      <div className="mb-4">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">
          Podio
        </div>
        <h2 className="mt-1 text-2xl font-black text-white">Top 3</h2>
      </div>

      {top3.length === 0 ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/25 text-center text-sm text-white/45">
          No hay registros todavía para este ejercicio.
        </div>
      ) : (
        <div className="space-y-3">
          {top3.map((item, index) => {
            const isCurrentUser = item.usuario_id === sessionUserId
            const percentage = Math.max((Number(item.mejor_rm || 0) / Number(maxWeight || 1)) * 100, 6)

            return (
              <article
                key={`${item.usuario_id}-${index}`}
                className={[
                  "rounded-2xl border p-4 transition",
                  isCurrentUser
                    ? "border-green-400/50 bg-green-500/10"
                    : "border-white/10 bg-white/[0.04] hover:border-orange-500/25",
                ].join(" ")}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-lg font-black text-orange-300">
                      #{index + 1}
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => onOpenHistory(item)}
                        className="text-left font-black text-white transition hover:text-orange-300"
                      >
                        {item.nombre} {isCurrentUser ? <span className="text-green-300">(TÚ)</span> : null}
                      </button>
                      <p className="mt-1 text-xs text-white/45">Mejor PR</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-black text-orange-300">
                      {formatLb(item.mejor_rm)}
                    </div>
                  </div>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-300 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
