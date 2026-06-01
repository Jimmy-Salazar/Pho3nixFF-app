export default function QuickAccessSection({ navigate }) {
  return (
    <section className="mt-10">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-white/85 text-lg font-semibold">Acceso rápido</h2>
        <span className="text-xs text-white/45">Módulos principales</span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => navigate("/registrar-rm")}
          className="group rounded-3xl border border-white/10 bg-white/5 p-5 text-left transition hover:bg-white/[0.07]"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">
            Strength Tracking
          </div>

          <h3 className="mt-4 text-xl font-bold text-white">RM</h3>

          <p className="mt-2 text-sm text-white/65">
            Registra marcas personales, revisa evolución y consulta el ranking por ejercicio.
          </p>

          <div className="mt-5 text-sm font-medium text-orange-300 group-hover:text-orange-200">
            Ir a RM →
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            navigate("/wods", {
              state: { openTodayWodModal: true },
            })
          }
          className="group rounded-3xl border border-white/10 bg-white/5 p-5 text-left transition hover:bg-white/[0.07]"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">
            Weekly Training
          </div>

          <h3 className="mt-4 text-xl font-bold text-white">WOD</h3>

          <p className="mt-2 text-sm text-white/65">
            Consulta los WODs semanales, rankings por entrenamiento y registra resultados del día.
          </p>

          <div className="mt-5 text-sm font-medium text-orange-300 group-hover:text-orange-200">
            Ir a WOD →
          </div>
        </button>
      </div>
    </section>
  )
}
