import {
  formatResultValue,
  getInitials,
} from "../utils/wodAlumnoUtils"

export default function WodHistoryDay({ rows = [], loading = false, currentUserId }) {
  const visibleRows = rows.slice(0, 4)

  return (
    <article className="min-h-[250px] min-w-0 w-full max-w-full overflow-hidden rounded-[2rem] border border-orange-500/20 bg-black/45 p-4 shadow-2xl shadow-black/30">
      <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
        <p className="truncate text-xs font-black uppercase tracking-[0.22em] text-orange-400">
          🕒 Historial del día
        </p>

        <span className="shrink-0 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase text-orange-300">
          {rows.length}
        </span>
      </div>

      {loading ? (
        <Empty text="Cargando historial..." />
      ) : visibleRows.length === 0 ? (
        <Empty text="Todavía no hay resultados registrados para este WOD." />
      ) : (
        <div className="space-y-2">
          {visibleRows.map((item, index) => {
            const isMine =
              item.usuario_id === currentUserId ||
              item.usuario === currentUserId ||
              item.user_id === currentUserId

            return (
              <article
                key={item.id || `${item.nombre}-${index}`}
                className={[
                  "grid min-w-0 grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border p-3",
                  isMine
                    ? "border-orange-500/35 bg-orange-500/10"
                    : "border-white/10 bg-white/[0.03]",
                ].join(" ")}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-orange-500/25 bg-orange-500/10 text-xs font-black text-orange-300">
                  {getInitials(item.nombre || item.usuario_nombre || "PH")}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-white">
                    {item.nombre || item.usuario_nombre || "Alumno PHO3NIX"}
                    {isMine ? " (Tú)" : ""}
                  </p>
                  <p className="mt-1 truncate text-xs text-white/40">
                    {item.modalidad || "RX"}
                  </p>
                </div>

                <div className="shrink-0 text-right text-sm font-black text-white">
                  {formatResultValue(item)}
                  <div className="text-[10px] text-orange-300">
                    {index + 1}°
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <button
        type="button"
        className="mt-3 w-full rounded-2xl border border-orange-500/35 px-4 py-3 text-xs font-black uppercase text-orange-400 transition hover:bg-orange-500/10"
      >
        Ver historial completo
      </button>
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
