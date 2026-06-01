import { formatKcal } from "../utils/wodAlumnoUtils"

export default function WodCaloriesCard({ calories, loading }) {
  const value = Number(calories?.value || 0)

  return (
    <article className="relative h-full min-h-[210px] min-w-0 w-full max-w-full overflow-hidden rounded-[2rem] border border-orange-500/25 bg-black/45 p-5 shadow-2xl shadow-black/30 xl:min-h-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_84%_22%,rgba(249,115,22,0.24),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.05),transparent_45%)]" />
      <div className="absolute -right-10 -bottom-10 h-36 w-36 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative z-10 flex h-full min-w-0 flex-col justify-between">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-black uppercase tracking-[0.22em] text-orange-400">
              🔥 Calorías del WOD
            </p>

            <h3 className="mt-2 text-lg font-black uppercase text-white/85">
              Entrenamiento de hoy
            </h3>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-500/25 bg-orange-500/10 text-2xl">
            🔥
          </div>
        </div>

        <div className="py-4 text-center">
          <div className="text-6xl font-black leading-none text-white">
            {loading ? "..." : formatKcal(value)}
          </div>

          <div className="mt-2 text-xl font-black uppercase tracking-[0.16em] text-orange-400">
            kcal
          </div>
        </div>

        <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.12em] text-orange-300">
          Calorías calculadas
        </div>
      </div>
    </article>
  )
}
