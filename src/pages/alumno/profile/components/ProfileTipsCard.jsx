export default function ProfileTipsCard() {
  const tips = [
    "Duerme bien y recupera tu cuerpo.",
    "Técnica primero, peso después.",
    "Progresión constante, no ego.",
    "Registra tus PR y celebra cada avance.",
  ]

  return (
    <article className="relative overflow-hidden rounded-[2rem] border border-orange-500/20 bg-black/45 p-4 shadow-2xl shadow-black/30">
      <div className="absolute bottom-0 right-0 hidden text-[8rem] opacity-10 xl:block">🪽</div>

      <div className="relative z-10">
        <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-orange-400">
          🔥 Tips PHO3NIX
        </p>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {tips.map((tip) => (
            <div key={tip} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
                ✓
              </span>
              <p className="text-sm text-white/70">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </article>
  )
}
