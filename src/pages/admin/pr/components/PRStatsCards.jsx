// src/pages/admin/pr/components/PRStatsCards.jsx

const cards = [
  {
    key: "total",
    icon: "📊",
    label: "Total PR Registrados",
    suffix: "",
    helper: "registros reales",
  },
  {
    key: "monthlyImprovements",
    icon: "📈",
    label: "Mejoras este mes",
    suffix: "",
    helper: "según registros",
  },
  {
    key: "uniqueExercises",
    icon: "🔥",
    label: "Ejercicios con PR",
    suffix: "",
    helper: "desde registros",
  },
  {
    key: "averageImprovement",
    icon: "👑",
    label: "Promedio de Mejora",
    suffix: "%",
    helper: "próxima fase",
  },
]

export default function PRStatsCards({ stats, loading }) {
  return (
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {cards.map((card) => (
        <article key={card.key} className="phoenix-card relative overflow-hidden p-4">
          <div className="absolute bottom-0 right-0 h-16 w-24 rounded-full bg-orange-500/10 blur-2xl" />

          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-2xl text-orange-300">
              {card.icon}
            </div>

            <div className="min-w-0">
              <div className="text-xs font-black uppercase tracking-[0.12em] text-white/50">
                {card.label}
              </div>

              <div className="mt-1 text-3xl font-black text-white">
                {loading ? "..." : stats[card.key]}
                {!loading ? card.suffix : ""}
              </div>

              <div className="mt-1 text-xs font-bold text-green-300">
                {card.helper}
              </div>
            </div>
          </div>
        </article>
      ))}
    </section>
  )
}
