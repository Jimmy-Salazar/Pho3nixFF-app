// src/pages/admin/anuncios/components/AnunciosStats.jsx

const CARDS = [
  { key: "total", label: "Total anuncios", icon: "📣", subtitle: "en total" },
  { key: "activos", label: "Activos", icon: "✅", subtitle: "publicados" },
  { key: "programados", label: "Programados", icon: "🗓️", subtitle: "por publicar" },
  { key: "inactivos", label: "Inactivos", icon: "✕", subtitle: "desactivados" },
]

export default function AnunciosStats({ stats }) {
  return (
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {CARDS.map((card) => (
        <article key={card.key} className="phoenix-card relative overflow-hidden p-4">
          <div className="absolute bottom-0 right-0 h-16 w-24 rounded-full bg-orange-500/10 blur-2xl" />

          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-2xl text-orange-300">
              {card.icon}
            </div>

            <div>
              <div className="text-xs font-black uppercase tracking-[0.12em] text-white/50">
                {card.label}
              </div>
              <div className="mt-1 text-3xl font-black text-white">
                {stats[card.key] || 0}
              </div>
              <div className="mt-1 text-xs text-white/45">
                {card.subtitle}
              </div>
            </div>
          </div>
        </article>
      ))}
    </section>
  )
}
