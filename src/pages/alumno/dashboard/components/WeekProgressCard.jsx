export default function WeekProgressCard({ completed = 0, target = 5 }) {
  const safeTarget = Math.max(Number(target || 5), 1)
  const safeCompleted = Math.min(Number(completed || 0), safeTarget)
  const percentage = Math.round((safeCompleted / safeTarget) * 100)

  const days = ["L", "M", "M", "J", "V", "S", "D"]

  return (
    <article className="rounded-[2rem] border border-white/10 bg-black/45 p-5 shadow-2xl shadow-black/30">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
        📅 Tu semana
      </p>

      <div className="mt-5 flex items-center justify-between gap-2">
        {days.map((day, index) => {
          const done = index < safeCompleted
          const current = index === safeCompleted

          return (
            <div key={`${day}-${index}`} className="text-center">
              <p className="mb-2 text-xs font-bold text-white/60">{day}</p>

              <div
                className={[
                  "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-black",
                  done
                    ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
                    : current
                    ? "border-orange-500 bg-orange-500/10 text-orange-400 shadow-[0_0_18px_rgba(249,115,22,0.45)]"
                    : "border-white/10 bg-white/[0.03] text-white/35",
                ].join(" ")}
              >
                {done ? "✓" : index + 1}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 flex items-center justify-between text-sm">
        <span className="text-white/60">
          {safeCompleted} de {safeTarget} entrenamientos completados
        </span>

        <span className="font-black text-emerald-300">
          {percentage}%
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-emerald-400"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </article>
  )
}