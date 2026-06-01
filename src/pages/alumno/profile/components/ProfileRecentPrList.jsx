import { formatDateShort } from "../utils/profileUtils"

export default function ProfileRecentPrList({ rows = [], loading }) {
  return (
    <article className="h-full overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 p-4 shadow-2xl shadow-black/30">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
            🕒 Mis últimos PR
          </p>
          <h3 className="mt-1 text-xl font-black uppercase text-white">
            Marcas recientes
          </h3>
        </div>
      </div>

      {loading ? (
        <Empty text="Cargando marcas..." />
      ) : rows.length === 0 ? (
        <Empty text="Aún no tienes PR registrados." />
      ) : (
        <div className="space-y-2">
          {rows.map((item) => (
            <article
              key={item.id}
              className="grid grid-cols-[42px_1fr_auto] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-500/25 bg-orange-500/10 text-xl">
                🏋️
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-black uppercase text-white">
                  {item.exerciseName}
                </p>
                <p className="mt-1 text-xs text-white/45">
                  {formatDateShort(item.fecha)}
                </p>
              </div>

              <p className="text-right text-xl font-black text-orange-500">
                {Number(item.peso_libras || 0)} <span className="text-xs text-white/55">lb</span>
              </p>
            </article>
          ))}
        </div>
      )}

      <button
        type="button"
        className="mt-4 w-full rounded-2xl border border-orange-500/35 px-4 py-3 text-sm font-black uppercase text-orange-400 transition hover:bg-orange-500/10"
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
