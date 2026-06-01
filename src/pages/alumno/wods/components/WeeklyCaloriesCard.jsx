import { formatKcal } from "../utils/wodAlumnoUtils"

const DAY_LABELS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"]

export default function WeeklyCaloriesCard({ data, loading }) {
  const total = Number(data?.total || 0)
  const target = Number(data?.target || 6000)
  const percentage = target > 0 ? Math.min(Math.round((total / target) * 100), 100) : 0
  const days = normalizeDays(data?.days || [])

  const maxValue = Math.max(...days.map((item) => Number(item.calories || 0)), 1)

  return (
    <article className="relative h-full min-h-[315px] min-w-0 w-full max-w-full overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 p-5 shadow-2xl shadow-black/30 xl:min-h-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(249,115,22,0.18),transparent_30%)]" />

      <div className="relative z-10 flex h-full min-w-0 flex-col">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-black uppercase tracking-[0.22em] text-orange-400">
              📊 Tu semana 🔥 calorías
            </p>

            <div className="mt-3 flex min-w-0 items-end gap-2">
              <div className="max-w-full truncate text-5xl font-black leading-none text-white">
                {loading ? "..." : formatKcal(total)}
              </div>
              <div className="shrink-0 pb-1 text-sm font-black text-white/55">kcal</div>
            </div>
          </div>

          <div className="shrink-0 text-right text-xs">
            <p className="font-bold text-white/45">Meta</p>
            <p className="mt-1 font-black text-white">{formatKcal(target)}</p>
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-orange-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="mt-1 flex items-center justify-between text-xs">
          <span className="truncate text-white/40">Acumulado semanal</span>
          <span className="shrink-0 font-black text-emerald-300">{percentage}%</span>
        </div>

        <div className="mt-4 grid min-h-0 min-w-0 flex-1 grid-cols-7 items-end gap-1.5 sm:gap-2">
          {days.map((item, index) => {
            const value = Number(item.calories || 0)
            const height = value > 0 ? Math.max((value / maxValue) * 100, 18) : 18

            return (
              <div
                key={`${item.label}-${index}`}
                className="flex h-full min-h-[96px] min-w-0 flex-col items-center justify-end gap-1"
              >
                <div className="max-w-full truncate text-[8px] font-black text-white/60 sm:text-[9px]">
                  {value > 0 ? formatKcal(value) : "-"}
                </div>

                <div
                  className={[
                    "w-full rounded-t-lg border",
                    value > 0
                      ? "border-orange-500/40 bg-orange-500 shadow-[0_0_18px_rgba(249,115,22,0.25)]"
                      : "border-dashed border-white/20 bg-white/[0.03]",
                  ].join(" ")}
                  style={{ height: `${height}%` }}
                />

                <div className="text-[9px] font-black uppercase text-white/45">
                  {item.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </article>
  )
}

function normalizeDays(days) {
  if (days.length >= 7) {
    return days.slice(0, 7).map((item, index) => ({
      label: item.label || DAY_LABELS[index],
      calories: Number(item.calories || 0),
    }))
  }

  return DAY_LABELS.map((label, index) => ({
    label,
    calories: Number(days[index]?.calories || 0),
  }))
}
