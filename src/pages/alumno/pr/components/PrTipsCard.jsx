export default function PrTipsCard() {
  return (
    <article className="relative overflow-hidden rounded-[2rem] border border-orange-500/20 bg-black/45 p-5 shadow-2xl shadow-black/30">
      <div className="pointer-events-none absolute -right-8 bottom-0 text-[9rem] opacity-10">
        🔥
      </div>

      <div className="relative z-10">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
          🔥 Tips PHO3NIX
        </p>

        <div className="mt-5 space-y-4 text-sm leading-6 text-white/75">
          <Tip text="Duerme bien y recupera tu cuerpo." />
          <Tip text="Técnica primero, peso después." />
          <Tip text="Progresión constante, no ego." />
          <Tip text="Registra tus PR y celebra cada avance." />
        </div>

        <p className="mt-7 text-sm font-black text-orange-400">
          Sé Fénix. Renace más fuerte cada día.
        </p>
      </div>
    </article>
  )
}

function Tip({ text }) {
  return (
    <div className="flex gap-3">
      <span className="text-orange-400">✓</span>
      <span>{text}</span>
    </div>
  )
}
