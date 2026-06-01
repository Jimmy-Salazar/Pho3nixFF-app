import { formatShortDate } from "../utils/profileUtils"

export default function ProfileStatsCard({ loading, records = [], stats = {}, strongestRecord }) {
  const latestPr = stats.latestPr
  const bestPr = stats.bestPr

  return (
    <article className="relative h-full overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 p-5 shadow-2xl shadow-black/30">
      <div className="pointer-events-none absolute -right-12 top-0 h-48 w-48 rounded-full bg-orange-500/15 blur-3xl" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-4">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
            Rendimiento
          </p>
          <h2 className="mt-1 text-2xl font-black uppercase text-white">
            Tus marcas
          </h2>
        </div>

        {loading ? (
          <Empty text="Cargando estadísticas..." />
        ) : (
          <div className="grid gap-3">
            <Stat icon="🏋️" label="PR registrados" value={stats.totalPrs || 0} text="Marcas personales" />
            <Stat
              icon="🔥"
              label="Último PR"
              value={latestPr?.peso_libras ? `${latestPr.peso_libras} lb` : "--"}
              text={latestPr?.fecha ? formatShortDate(latestPr.fecha) : "Sin registro"}
            />
            <Stat
              icon="🏆"
              label="Mejor marca"
              value={bestPr?.peso_libras ? `${bestPr.peso_libras} lb` : "--"}
              text={bestPr?.ejercicio_nombre || "Sin registro"}
            />
            <Stat
              icon="⚡"
              label="Ejercicio fuerte"
              value={strongestRecord?.ejercicio_nombre || "--"}
              text={strongestRecord?.peso_libras ? `${strongestRecord.peso_libras} lb` : "Sin registro"}
            />
          </div>
        )}

        <div className="mt-4 min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-white/35">
            Últimos registros
          </p>

          {records.length === 0 ? (
            <p className="text-sm text-white/40">Aún no tienes registros.</p>
          ) : (
            <div className="space-y-2">
              {records.slice(0, 4).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black uppercase text-white">
                      {record.ejercicio_nombre || "Ejercicio"}
                    </p>
                    <p className="text-[10px] text-white/35">{formatShortDate(record.fecha)}</p>
                  </div>
                  <p className="shrink-0 text-sm font-black text-orange-400">
                    {record.peso_libras} lb
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

function Stat({ icon, label, value, text }) {
  return (
    <div className="grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-xl">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35">
          {label}
        </p>
        <p className="mt-1 truncate text-xs text-white/55">{text}</p>
      </div>
      <div className="max-w-[120px] truncate text-right text-lg font-black text-orange-400">
        {value}
      </div>
    </div>
  )
}

function Empty({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-black/25 p-4 text-sm text-white/40">
      {text}
    </div>
  )
}
