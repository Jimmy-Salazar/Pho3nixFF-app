export default function BirthdayGreetingCard({ name }) {
  return (
    <article className="relative shrink-0 overflow-hidden rounded-[2rem] border border-orange-500/35 bg-gradient-to-r from-orange-500/20 via-black/75 to-orange-950/30 px-5 py-4 shadow-2xl shadow-orange-950/30">
      <div className="pointer-events-none absolute -left-12 top-0 h-36 w-36 rounded-full bg-orange-500/25 blur-3xl" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-40 w-40 rounded-full bg-red-500/15 blur-3xl" />
      <div className="pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 text-[7rem] opacity-10 lg:block">
        🔥
      </div>

      <div className="relative z-10 grid gap-4 md:grid-cols-[auto_1fr_auto] md:items-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-[1.7rem] border border-orange-400/30 bg-orange-500/15 text-5xl shadow-[0_0_30px_rgba(249,115,22,0.25)]">
          🎂
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-300">
            PHO3NIX celebra contigo
          </p>

          <h2 className="mt-1 text-3xl font-black uppercase leading-none text-white md:text-4xl">
            ¡Feliz cumpleaños,{" "}
            <span className="text-orange-500">{firstName(name)}</span>! 🎉
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70 md:text-base">
            Hoy renaces más fuerte. Que este nuevo año venga cargado de PRs,
            disciplina y fuego. 🔥
          </p>
        </div>

        <div className="hidden rounded-2xl border border-orange-500/30 bg-black/35 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-orange-300 md:block">
          Sé Fénix
        </div>
      </div>
    </article>
  )
}

function firstName(name) {
  return String(name || "Alumno").trim().split(" ")[0] || "Alumno"
}