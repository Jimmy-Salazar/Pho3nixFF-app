import { useEffect, useState } from "react"
import { supabase } from "../../../supabase"

export default function HomeNovedades() {
  const [loading, setLoading] = useState(true)
  const [anuncios, setAnuncios] = useState([])
  const [selectedAnuncio, setSelectedAnuncio] = useState(null)

  useEffect(() => {
    let alive = true

    async function loadAnuncios() {
      try {
        setLoading(true)

        const { data, error } = await supabase
          .from("anuncios")
          .select(
            "id,titulo,resumen,contenido,fecha_publicacion,activo,created_at,media_url,media_tipo,boton_texto,boton_url,dirigido_a"
          )
          .eq("activo", true)
          .order("fecha_publicacion", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false })
          .limit(6)

        console.log("ANUNCIOS HOME:", data)
        console.log("ERROR ANUNCIOS HOME:", error)

        if (error) throw error

        if (alive) {
          setAnuncios(data || [])
        }
      } catch (error) {
        console.error("Error cargando anuncios del Home:", error)
        if (alive) setAnuncios([])
      } finally {
        if (alive) setLoading(false)
      }
    }

    loadAnuncios()

    return () => {
      alive = false
    }
  }, [])

  return (
    <>
      <section
        id="novedades"
        className="relative overflow-hidden bg-[#050505] px-4 py-20 text-white sm:px-6 lg:px-8"
      >
        <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-orange-600/15 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-80 w-80 rounded-full bg-red-600/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">
              Novedades PHO3NIX
            </p>

            <h2 className="mt-3 text-4xl font-black uppercase text-white md:text-5xl">
              Anuncios del Box
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/55">
              Comunicados, eventos y actualizaciones oficiales de PHO3NIX.
            </p>
          </div>

          {loading ? (
            <div className="mt-10 rounded-[2rem] border border-white/10 bg-black/45 p-8 text-center text-white/45">
              Cargando novedades...
            </div>
          ) : anuncios.length === 0 ? (
            <div className="mt-10 rounded-[2rem] border border-white/10 bg-black/45 p-8 text-center text-white/45">
              Aún no hay anuncios publicados.
            </div>
          ) : (
            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {anuncios.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedAnuncio(item)}
                  className="group overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 text-left shadow-2xl shadow-black/30 transition hover:border-orange-500/35"
                >
                  <div className="relative h-52 overflow-hidden bg-orange-500/10">
                    <AnuncioMedia item={item} />

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />

                    <div className="absolute left-4 top-4 rounded-full border border-orange-500/30 bg-black/55 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-orange-300 backdrop-blur">
                      PHO3NIX
                    </div>
                  </div>

                  <div className="p-5">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-orange-400">
                      {formatDate(item.fecha_publicacion || item.created_at)}
                    </p>

                    <h3 className="mt-3 line-clamp-2 text-xl font-black uppercase text-white">
                      {item.titulo || "Anuncio PHO3NIX"}
                    </h3>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/55">
                      {item.resumen ||
                        item.contenido ||
                        "Sin contenido disponible."}
                    </p>

                    <span className="mt-5 inline-flex rounded-2xl border border-orange-500/30 px-4 py-2 text-xs font-black uppercase text-orange-300 transition group-hover:bg-orange-500/10">
                      Ver detalle →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {selectedAnuncio ? (
        <AnuncioPopup
          item={selectedAnuncio}
          onClose={() => setSelectedAnuncio(null)}
        />
      ) : null}
    </>
  )
}

function AnuncioMedia({ item }) {
  if (item?.media_url && item?.media_tipo === "video") {
    return (
      <video
        src={item.media_url}
        className="h-full w-full object-cover opacity-90"
        muted
        playsInline
      />
    )
  }

  if (item?.media_url) {
    return (
      <img
        src={item.media_url}
        alt={item.titulo || "Anuncio PHO3NIX"}
        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />
    )
  }

  return (
    <div className="flex h-full w-full items-center justify-center text-5xl">
      🦅
    </div>
  )
}

function AnuncioPopup({ item, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose()
    }

    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        aria-label="Cerrar anuncio"
      />

      <article className="relative z-10 max-h-[92dvh] w-full max-w-4xl overflow-hidden rounded-[2.5rem] border border-orange-500/25 bg-[#070707] shadow-2xl shadow-orange-950/40">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/65 text-2xl text-white/80 backdrop-blur transition hover:border-orange-500/40 hover:text-orange-300"
          aria-label="Cerrar"
        >
          ×
        </button>

        <div className="max-h-[92dvh] overflow-y-auto">
          <div className="relative h-[260px] overflow-hidden bg-orange-500/10 sm:h-[360px]">
            {item.media_url && item.media_tipo === "video" ? (
              <video
                src={item.media_url}
                className="h-full w-full object-cover"
                controls
                playsInline
              />
            ) : item.media_url ? (
              <img
                src={item.media_url}
                alt={item.titulo || "Anuncio PHO3NIX"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-7xl">
                🦅
              </div>
            )}

            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#070707] via-black/25 to-transparent" />

            <div className="absolute bottom-5 left-5 right-16">
              <span className="rounded-full border border-orange-500/30 bg-black/55 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-orange-300 backdrop-blur">
                PHO3NIX
              </span>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-400">
              {formatDate(item.fecha_publicacion || item.created_at)}
            </p>

            <h2 className="mt-3 text-3xl font-black uppercase leading-tight text-white sm:text-5xl">
              {item.titulo || "Anuncio PHO3NIX"}
            </h2>

            {item.resumen ? (
              <p className="mt-4 text-base font-semibold leading-7 text-orange-100/75">
                {item.resumen}
              </p>
            ) : null}

            <div className="mt-6 whitespace-pre-line text-sm leading-8 text-white/65 sm:text-base">
              {item.contenido || item.resumen || "Sin contenido disponible."}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {item.boton_url ? (
                <a
                  href={item.boton_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-orange-500 px-5 py-3 text-center text-sm font-black uppercase text-black transition hover:bg-orange-400"
                >
                  {item.boton_texto || "Abrir enlace"} →
                </a>
              ) : (
                <span className="text-sm text-white/35">
                  Anuncio publicado en PHO3NIX.
                </span>
              )}

              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-black uppercase text-white/70 transition hover:border-orange-500/35 hover:text-orange-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}

function formatDate(value) {
  if (!value) return "PHO3NIX"

  try {
    return new Intl.DateTimeFormat("es-EC", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
      .format(new Date(value))
      .replace(".", "")
  } catch {
    return "PHO3NIX"
  }
}