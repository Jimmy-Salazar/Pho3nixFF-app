export default function HeroCard({
  title,
  dateText,
  description,
  ctaText,
  onCta,
  image, // opcional: si lo pasas, usa imagen de fondo tipo mock
}) {
  return (
    <div className="relative overflow-hidden px-card px-card-hover p-6">
      {image ? (
        <>
          <img
            src={image}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 opacity-30">
            <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-blue-500/30 blur-3xl" />
            <div className="absolute -right-24 -bottom-24 h-64 w-64 rounded-full bg-fuchsia-500/25 blur-3xl" />
          </div>
          <div className="px-shine" />
        </>
      )}

      <div className="relative">
        <p className="text-sm text-slate-300">Alertas</p>

        <h3 className="mt-3 text-2xl font-bold text-white">{title}</h3>
        <p className="mt-1 text-slate-300">
          <span className="font-semibold text-slate-200">{dateText}</span>
        </p>

        <p className="mt-3 max-w-2xl text-sm text-slate-300">{description}</p>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            onClick={onCta}
            className="rounded-xl bg-white/10 border border-white/10 px-4 py-2 text-sm font-semibold text-white
                       hover:bg-white/15 hover:border-white/15 transition"
            type="button"
          >
            {ctaText}
          </button>

          <div className="text-xs text-slate-400">
            *Luego conectamos con tabla de alertas/competencias en Supabase.
          </div>
        </div>
      </div>
    </div>
  )
}