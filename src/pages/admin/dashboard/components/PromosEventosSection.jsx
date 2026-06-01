export default function PromosEventosSection({ visualItems, promoRef, compact = false }) {
  return (
    <section className={compact ? "xl:h-full" : "mt-10"}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white/85">Promos y eventos</h2>
        <span className="text-xs text-white/40">PHO3NIX</span>
      </div>

      <div
        ref={promoRef}
        className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:h-[calc(100%-40px)]"
      >
        {visualItems.length === 0 ? (
          <div className="flex min-h-[360px] w-full items-center rounded-[2rem] border border-dashed border-white/10 bg-white/5 p-6 text-sm text-white/60">
            Aquí aparecerán eventos, promociones y publicidad agregada por Coach/Admin.
          </div>
        ) : (
          visualItems.map((item, index) => {
            const Wrapper = item.url ? "a" : "div"
            const wrapperProps = item.url
              ? {
                  href: item.url,
                  target: "_blank",
                  rel: "noreferrer",
                }
              : {}

            return (
              <Wrapper
                key={`${item.tipoVisual}-${item.id || index}`}
                {...wrapperProps}
                data-promo-card
                className="relative h-[360px] w-[310px] shrink-0 snap-start overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 md:w-[360px] xl:h-full xl:w-full xl:min-w-full"
              >
                <img
                  src={item.imagen_url || "/images/news-default.jpg"}
                  alt={item.titulo || "PHO3NIX"}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/images/news-default.jpg"
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-5">
                  <span className="rounded-full border border-orange-400/20 bg-orange-500/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-orange-300">
                    {item.tipoVisual}
                  </span>

                  <h3 className="mt-3 text-xl font-black text-white">
                    {item.titulo || "Anuncio PHO3NIX"}
                  </h3>

                  <p className="mt-2 line-clamp-2 text-sm text-white/65">
                    {item.descripcion || "Sin descripción disponible."}
                  </p>
                </div>
              </Wrapper>
            )
          })
        )}
      </div>
    </section>
  )
}
