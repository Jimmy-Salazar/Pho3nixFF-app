import {
  formatHumanDate,
  formatModoRanking,
  formatModalidad,
} from "../utils/dashboardUtils"

export default function WodSection({ todayWod, todayWodLoading, navigate, compact = false }) {
  return (
    <section className={compact ? "" : ""}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white/85">WOD del día</h2>
        <span className="text-xs text-white/40">{formatHumanDate(new Date())}</span>
      </div>

      {todayWodLoading ? (
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-sm text-white/60">
          Cargando WOD...
        </div>
      ) : todayWod ? (
        <button
          type="button"
          onClick={() =>
            navigate("/wods", {
              state: { openTodayWodModal: true },
            })
          }
          className="group relative flex min-h-[360px] w-full flex-col overflow-hidden rounded-[2rem] border border-orange-500/20 bg-black p-6 text-left shadow-2xl transition hover:border-orange-400/40 md:p-8 xl:h-full"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-white/[0.04] to-transparent" />
          <div className="absolute -right-16 top-10 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl transition group-hover:bg-orange-500/30" />

          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-orange-300">
                WOD publicado
              </span>

              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/70">
                {formatModoRanking(todayWod.modo_ranking)}
              </span>

              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/70">
                {formatModalidad(todayWod.modalidad)}
              </span>
            </div>

            <h3 className="mt-5 text-3xl font-black text-white md:text-5xl">
              {todayWod.nombre || "WOD del día"}
            </h3>

            <p className="mt-5 max-w-3xl whitespace-pre-line text-sm leading-7 text-white/70 md:text-base">
              {todayWod.descripcion || "Sin descripción disponible."}
            </p>

            <div className="mt-auto pt-6">
              <div className="inline-flex rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold text-black">
                Registrar resultado →
              </div>
            </div>
          </div>
        </button>
      ) : (
        <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/5 p-6 text-sm text-white/60">
          No hay WOD publicado para hoy.
        </div>
      )}
    </section>
  )
}
