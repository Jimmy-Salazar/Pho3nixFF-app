import { formatDateShort } from "../utils/profileUtils"

export default function ProfileStatsSection({ stats, loading }) {
  const cards = [
    {
      key: "total",
      icon: "🏆",
      title: "PR registrados",
      value: loading ? "..." : stats.total,
      subtitle: "Total de marcas personales",
    },
    {
      key: "latest",
      icon: "🕒",
      title: "Último PR",
      value: loading ? "..." : stats.latestPr?.peso_libras ? `${stats.latestPr.peso_libras} lb` : "--",
      subtitle: stats.latestPr
        ? `${stats.latestPr.exerciseName} · ${formatDateShort(stats.latestPr.fecha)}`
        : "Sin marcas recientes",
    },
    {
      key: "best",
      icon: "⭐",
      title: "Mejor PR general",
      value: loading ? "..." : stats.bestGeneral?.peso_libras ? `${stats.bestGeneral.peso_libras} lb` : "--",
      subtitle: stats.bestGeneral ? stats.bestGeneral.exerciseName : "Sin marca registrada",
    },
    {
      key: "strongest",
      icon: "💪",
      title: "Ejercicio más fuerte",
      value: loading ? "..." : stats.strongestExercise?.exerciseName || "--",
      subtitle: stats.strongestExercise?.peso_libras
        ? `${stats.strongestExercise.peso_libras} lb · Mejor marca registrada`
        : "Sin marca registrada",
    },
  ]

  return (
    <article className="rounded-[2rem] border border-white/10 bg-black/45 p-4 shadow-2xl shadow-black/30">
      <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-orange-400">
        📈 Mis Estadísticas
      </p>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.key}
            className="relative min-h-[145px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center"
          >
            <div className="absolute inset-x-6 bottom-0 h-px bg-orange-500/70 shadow-[0_0_18px_rgba(249,115,22,0.5)]" />

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-3xl text-orange-300">
              {card.icon}
            </div>

            <p className="mt-3 text-[11px] font-black uppercase tracking-[0.14em] text-white/55">
              {card.title}
            </p>

            <p className="mt-2 truncate text-3xl font-black text-white">
              {card.value}
            </p>

            <p className="mt-1 line-clamp-2 text-xs text-white/45">
              {card.subtitle}
            </p>
          </div>
        ))}
      </div>
    </article>
  )
}
