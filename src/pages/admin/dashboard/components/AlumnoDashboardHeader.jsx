export default function AlumnoDashboardHeader({ currentUser }) {
  return (
    <section className="mb-6 overflow-hidden rounded-3xl border border-orange-500/20 bg-white/5 p-5 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">
            Alumno Module
          </div>

          <h1 className="text-2xl font-black tracking-tight md:text-4xl">
            Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-300 md:text-base">
            Tu espacio PHO3NIX: WOD del día, cumpleaños, eventos y comunidad.
          </p>
        </div>

        {currentUser?.nombre ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
            Hola, <span className="font-bold text-orange-200">{currentUser.nombre}</span>
          </div>
        ) : null}
      </div>
    </section>
  )
}
