export default function WodTodayCard({ wod, loading, onView }) {
  return (
    <article className="relative min-h-[300px] min-w-0 w-full max-w-full overflow-hidden rounded-[2rem] border border-white/10 bg-black/55 shadow-2xl shadow-black/40 lg:min-h-[255px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(249,115,22,0.22),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.05),transparent_45%)]" />

      <div className="absolute inset-y-0 right-0 w-full bg-[url('/images/imagenchallenge.png')] bg-cover bg-center opacity-25 sm:w-1/2 sm:opacity-35" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/35" />

      <div className="relative z-10 flex h-full min-w-0 flex-col justify-between p-5">
        <div className="min-w-0">
          <p className="truncate text-xs font-black uppercase tracking-[0.2em] text-orange-400">
            🔥 WOD del día
          </p>

          <h2 className="mt-4 max-w-full text-3xl font-black uppercase leading-none text-white sm:text-4xl">
            {loading ? "Cargando..." : wod?.nombre || "Sin WOD publicado"}
          </h2>

          <p className="mt-4 max-w-full whitespace-pre-line text-sm leading-6 text-white/70">
            {loading
              ? "Buscando entrenamiento del día..."
              : wod?.descripcion ||
                "Cuando el coach publique el WOD del día, aparecerá aquí."}
          </p>
        </div>

        <div className="mt-6 grid min-w-0 gap-3 sm:flex sm:flex-wrap">
          <button
            type="button"
            onClick={onView}
            disabled={!wod}
            className="min-w-0 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black uppercase text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Ver WOD →
          </button>

          <button
            type="button"
            className="min-w-0 rounded-2xl border border-orange-500/30 px-5 py-3 text-sm font-black uppercase text-orange-300 transition hover:bg-orange-500/10"
          >
            Ver historial
          </button>
        </div>
      </div>
    </article>
  )
}