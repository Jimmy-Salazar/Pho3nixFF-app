export default function StatCard({
  icon,
  title,
  value,
  subtitle,
  tone = "blue",
  onClick,
}) {
  const toneMap = {
    blue: "from-blue-500/25 via-cyan-500/10 to-transparent border-blue-400/20",
    green:
      "from-emerald-500/25 via-lime-500/10 to-transparent border-emerald-400/20",
    amber:
      "from-amber-500/25 via-yellow-500/10 to-transparent border-amber-400/20",
    purple:
      "from-fuchsia-500/25 via-violet-500/10 to-transparent border-violet-400/20",
  }

  const clickable = typeof onClick === "function"

  const Comp = clickable ? "button" : "div"

  return (
    <Comp
      type={clickable ? "button" : undefined}
      onClick={onClick}
      className={[
        "relative overflow-hidden rounded-3xl border p-4 sm:p-5 text-left w-full",
        "bg-gradient-to-br",
        toneMap[tone] ?? toneMap.blue,
        clickable
          ? "cursor-pointer transition hover:scale-[1.01] hover:bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-orange-400/40"
          : "",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_35%)]" />
      <div className="pointer-events-none absolute -top-10 -right-10 h-24 w-24 rounded-full bg-white/10 blur-2xl opacity-70" />

      <div className="relative flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/10">
            <span className="text-xl">{icon}</span>
          </div>

          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-200">{title}</p>
            {subtitle ? (
              <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">{subtitle}</p>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-3xl font-bold tracking-tight text-white">{value}</p>
        </div>
      </div>
    </Comp>
  )
}