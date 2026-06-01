// src/pages/admin/pr/components/PRMotivationCard.jsx

export default function PRMotivationCard() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-orange-500/20 bg-gradient-to-br from-orange-500/15 via-black to-black p-5">
      <div className="absolute -right-8 -bottom-8 text-[8rem] leading-none text-orange-500/15">
        🦅
      </div>

      <div className="relative z-10">
        <div className="text-3xl">🔥</div>

        <h2 className="mt-4 text-2xl font-black uppercase text-white">
          Supera tus límites
        </h2>

        <p className="mt-2 max-w-xs text-sm leading-6 text-white/65">
          Cada PR te hace más fuerte que ayer.
        </p>
      </div>
    </section>
  )
}
