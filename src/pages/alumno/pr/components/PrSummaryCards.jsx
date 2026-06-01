import { formatDateCompact } from "../utils/prAlumnoUtils"

export default function PrSummaryCards({ loading, summary }) {
  const latest = summary.latestPr
  const best = summary.bestPr
  const strongest = summary.strongest

  const cards = [
    {
      icon: "🏆",
      title: "PR registrados",
      value: loading ? "..." : summary.total || 0,
      main: "Total de marcas personales",
      sub: "Tus registros guardados",
      tone: "orange",
    },
    {
      icon: "🕒",
      title: "Último PR",
      value: loading ? "..." : latest?.peso_libras ? `${latest.peso_libras} lb` : "--",
      main: latest?.ejercicio_nombre || "Sin PR",
      sub: latest?.fecha ? formatDateCompact(latest.fecha) : "Registra tu primera marca",
      tone: "amber",
    },
    {
      icon: "⭐",
      title: "Mejor PR general",
      value: loading ? "..." : best?.peso_libras ? `${best.peso_libras} lb` : "--",
      main: best?.ejercicio_nombre || "Sin marca",
      sub: "Tu mejor marca hasta ahora",
      tone: "gold",
    },
    {
      icon: "💪",
      title: "Ejercicio más fuerte",
      value: strongest?.ejercicio_nombre || "--",
      main: strongest?.peso_libras ? `${strongest.peso_libras} lb` : "Sin marca",
      sub: "Mejor marca registrada",
      tone: "red",
    },
  ]

  return (
    <section className="grid shrink-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.title}
          className="relative min-h-[145px] overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 p-5 shadow-2xl shadow-black/25"
        >
          <div
            className={[
              "absolute inset-0",
              card.tone === "red"
                ? "bg-[radial-gradient(circle_at_20%_20%,rgba(239,68,68,0.18),transparent_34%)]"
                : "bg-[radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.18),transparent_34%)]",
            ].join(" ")}
          />

          <div className="relative z-10 grid grid-cols-[72px_1fr] items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-orange-500/20 bg-orange-500/10 text-4xl">
              {card.icon}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white/55">
                {card.title}
              </p>

              <div className="mt-2 truncate text-4xl font-black leading-none text-white">
                {card.value}
              </div>

              <p className="mt-2 truncate text-sm font-black text-orange-400">
                {card.main}
              </p>

              <p className="mt-1 truncate text-xs text-white/45">
                {card.sub}
              </p>
            </div>
          </div>
        </article>
      ))}
    </section>
  )
}
