import {
  extractWorkoutLines,
  formatDateLong,
  formatModalidad,
  formatModoRanking,
} from "../utils/wodAlumnoUtils"

export default function WodTodayPanel({ wod, loading, onBack }) {
  const workoutLines = extractWorkoutLines(wod?.descripcion)

  return (
    <article className="relative min-w-0 w-full max-w-full overflow-hidden rounded-[2rem] border border-white/10 bg-black/50 p-4 shadow-2xl shadow-black/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_24%,rgba(249,115,22,0.20),transparent_30%)]" />
      <div className="absolute right-0 top-0 h-48 w-full bg-[url('/images/imagenchallenge.png')] bg-cover bg-center opacity-20 sm:h-full sm:w-1/2 xl:opacity-15" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/90 to-black sm:bg-gradient-to-r sm:from-black sm:via-black/85 sm:to-black/45" />

      <div className="relative z-10 min-w-0">
        <div className="mb-4 flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-black uppercase tracking-[0.22em] text-orange-400">
              🔥 WOD del día
            </p>

            <h2 className="mt-3 max-w-full text-3xl font-black uppercase leading-none text-white md:text-4xl">
              {loading ? "Cargando..." : wod?.nombre || "Sin WOD publicado"}
            </h2>

            <div className="mt-3 flex min-w-0 flex-wrap gap-2">
              <Badge active>{formatModoRanking(wod?.modo_ranking)}</Badge>
              <Badge>{formatModalidad(wod?.modalidad)}</Badge>
              <Badge>{formatDateLong(wod?.fecha)}</Badge>
            </div>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="hidden shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black uppercase text-white/55 transition hover:border-orange-500/40 hover:text-orange-300 sm:block"
          >
            Dashboard
          </button>
        </div>

        <div className="grid min-w-0 gap-3 xl:grid-cols-2">
          <section className="min-w-0 rounded-2xl border border-white/10 bg-black/35 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-400">
              🧩 Workout
            </p>

            {loading ? (
              <p className="mt-4 text-sm text-white/45">Cargando entrenamiento...</p>
            ) : wod ? (
              <div className="mt-4 space-y-2 text-sm leading-6 text-white/75">
                {workoutLines.length ? (
                  workoutLines.map((line, index) => (
                    <p key={`${line}-${index}`} className="break-words">
                      {index > 0 ? <span className="text-orange-400">• </span> : null}
                      {line}
                    </p>
                  ))
                ) : (
                  <p className="whitespace-pre-line break-words">
                    {wod.descripcion || "El coach aún no agregó descripción."}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-white/55">
                Cuando el coach publique el WOD del día, aparecerá aquí.
              </p>
            )}
          </section>

          <section className="min-w-0 rounded-2xl border border-white/10 bg-black/35 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-400">
              📋 Instrucciones
            </p>

            <div className="mt-4 space-y-3 text-sm leading-6 text-white/70">
              <Instruction text="El cronómetro inicia con la primera repetición." />
              <Instruction text="Registra tu tiempo total o tus repeticiones al finalizar." />
              <Instruction text="Si no completas el WOD, registra el total de repeticiones." />
              <Instruction text="El historial del día se actualiza con los resultados cargados." />
            </div>
          </section>
        </div>
      </div>
    </article>
  )
}

function Badge({ children, active = false }) {
  return (
    <span
      className={[
        "min-w-0 rounded-xl border px-3 py-2 text-xs font-black uppercase",
        active
          ? "border-orange-500 bg-orange-500 text-black"
          : "border-white/10 bg-white/[0.05] text-white/75",
      ].join(" ")}
    >
      {children}
    </span>
  )
}

function Instruction({ text }) {
  return (
    <div className="flex min-w-0 gap-3">
      <span className="shrink-0 text-orange-400">✓</span>
      <span className="min-w-0 break-words">{text}</span>
    </div>
  )
}
