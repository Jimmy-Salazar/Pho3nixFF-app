// src/pages/admin/pr/components/PRRankingCard.jsx

import { formatWeight } from "../utils/formatPR"

export default function PRRankingCard({ ranking, ejercicioActual, sessionUserId }) {
  const top3 = ranking.slice(0, 3)
  const rows = ranking.slice(3, 7)

  return (
    <section className="phoenix-card min-h-0 overflow-hidden p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black uppercase text-white">
            Ranking PR — {ejercicioActual?.nombre || "Ejercicio"} (1RM)
          </h2>
          <p className="mt-1 text-xs text-white/45">Top del box</p>
        </div>

        <button className="text-xs font-black text-orange-300 hover:text-orange-200">
          Ver todos
        </button>
      </div>

      {ranking.length === 0 ? (
        <div className="flex min-h-[340px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/25 p-5 text-center text-sm text-white/45">
          No hay ranking registrado para este ejercicio.
        </div>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-3 items-end gap-2">
            {top3.map((athlete, index) => {
              const position = index + 1
              const isMe = athlete.usuario_id === sessionUserId

              return (
                <div
                  key={athlete.usuario_id}
                  className={[
                    "flex flex-col items-center rounded-2xl border p-3 text-center",
                    position === 1
                      ? "border-yellow-400/35 bg-yellow-500/10"
                      : "border-white/10 bg-white/[0.03]",
                    isMe ? "ring-1 ring-green-400/60" : "",
                  ].join(" ")}
                >
                  <div className="text-xl">
                    {position === 1 ? "👑" : position === 2 ? "🥈" : "🥉"}
                  </div>

                  <div className="mt-2 flex h-14 w-14 items-center justify-center rounded-full border border-orange-500/30 bg-black/45 text-xl font-black text-orange-300">
                    {String(athlete.nombre || "?").slice(0, 1)}
                  </div>

                  <div className="mt-2 line-clamp-1 text-xs font-black text-white">
                    {athlete.nombre} {isMe ? "(Tú)" : ""}
                  </div>

                  <div className="mt-1 text-sm font-black text-orange-300">
                    {formatWeight(athlete.mejor_rm)}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="space-y-2">
            {rows.map((row, index) => {
              const position = index + 4
              const isMe = row.usuario_id === sessionUserId

              return (
                <div
                  key={row.usuario_id}
                  className={[
                    "flex items-center justify-between rounded-xl px-3 py-2 text-sm",
                    isMe ? "border border-orange-500/20 bg-orange-500/10" : "bg-white/[0.04]",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-xs font-black text-white/45">
                      {position}
                    </span>
                    <span className={isMe ? "font-black text-orange-300" : "text-white/80"}>
                      {row.nombre} {isMe ? "(Tú)" : ""}
                    </span>
                  </div>

                  <span className="font-black text-white">
                    {formatWeight(row.mejor_rm)}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}
