// src/pages/admin/anuncios/components/AnunciosHeader.jsx

export default function AnunciosHeader({ onCreate }) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-orange-500/20 bg-black/45 p-5 shadow-[0_0_35px_rgba(249,115,22,.14)] backdrop-blur-xl">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
      <div className="absolute right-10 top-1/2 hidden -translate-y-1/2 text-[8rem] leading-none text-orange-500/10 xl:block">
        📣
      </div>

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-orange-300">
            Comunicaciones
          </div>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-white xl:text-4xl">
            Gestión de <span className="text-orange-400">Anuncios</span>
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
            Publica novedades, eventos, promociones y comunicados visibles para la comunidad.
          </p>
        </div>

        <button type="button" onClick={onCreate} className="phoenix-button-primary shrink-0 text-sm uppercase">
          + Nuevo anuncio
        </button>
      </div>
    </section>
  )
}
