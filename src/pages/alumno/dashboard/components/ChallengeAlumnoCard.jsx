import { formatShortDate } from "../utils/alumnoDashboardUtils"

export default function ChallengeAlumnoCard({ challenge, loading, onView }) {
  return (
    <article className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 p-5 shadow-2xl shadow-black/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(249,115,22,0.18),transparent_32%)]" />

      <div className="relative z-10">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
          🏆 Challenge activo
        </p>

        <div className="mt-4 overflow-hidden rounded-2xl border border-orange-500/20 bg-black/55 p-4">
          <div className="bg-[url('/images/imagenchallenge.png')] bg-cover bg-center">
            <div className="rounded-xl bg-black/70 p-4">
              <h3 className="text-2xl font-black uppercase text-white">
                {loading
                  ? "Cargando..."
                  : challenge?.titulo || "Sin challenge activo"}
              </h3>

              <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/60">
                {challenge?.descripcion ||
                  "Cuando haya un challenge activo, aparecerá aquí."}
              </p>

              {challenge ? (
                <div className="mt-4 text-xs font-bold text-orange-300">
                  {formatShortDate(challenge.fecha_inicio_competencia || challenge.fecha_inicio)}{" "}
                  — {formatShortDate(challenge.fecha_fin)}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onView}
          className="mt-5 w-full rounded-2xl border border-orange-500/35 px-5 py-3 text-sm font-black uppercase text-orange-400 transition hover:bg-orange-500/10"
        >
          Ver Challenge
        </button>
      </div>
    </article>
  )
}