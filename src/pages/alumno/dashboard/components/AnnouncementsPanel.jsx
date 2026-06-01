import { useEffect, useState } from "react"
import { supabase } from "../../../../supabase"
import { formatRelativeDate } from "../utils/alumnoDashboardUtils"

export default function AnnouncementsPanel() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [error, setError] = useState("")

  useEffect(() => {
    let alive = true

    async function loadAnuncios() {
      try {
        setLoading(true)
        setError("")

        const { data, error } = await supabase
          .from("anuncios")
          .select(
            "id,titulo,resumen,contenido,fecha_publicacion,activo,created_at,media_url,media_tipo,boton_texto,boton_url,dirigido_a"
          )
          .eq("activo", true)
          .order("created_at", { ascending: false })
          .limit(12)

        if (error) throw error

        const rows = data || []

        console.table(
          rows.map((item) => ({
            titulo: item.titulo,
            activo: item.activo,
            dirigido_a: item.dirigido_a,
            fecha_publicacion: item.fecha_publicacion,
            created_at: item.created_at,
          }))
        )

        if (!alive) return

        setItems(rows.slice(0, 3))
      } catch (err) {
        console.error("Error cargando anuncios del alumno:", err)

        if (alive) {
          setError(err.message || "No se pudieron cargar los anuncios.")
          setItems([])
        }
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
    <article className="h-full overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 p-4 shadow-2xl shadow-black/30">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
            📣 Novedades del Box
          </p>

          <h3 className="mt-1 text-xl font-black uppercase text-white">
            Comunicados
          </h3>
        </div>

        <span className="rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase text-orange-300">
          {items.length}
        </span>
      </div>

      {loading ? (
        <Empty text="Cargando novedades..." />
      ) : error ? (
        <Empty text={error} />
      ) : items.length === 0 ? (
        <Empty text="No hay anuncios activos publicados." />
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const imageUrl =
              item.media_tipo !== "video" && item.media_url
                ? item.media_url
                : null

            return (
              <article
                key={item.id}
                className="grid grid-cols-[58px_1fr] gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3"
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={item.titulo || "Anuncio PHO3NIX"}
                    className="h-14 w-14 rounded-xl object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                    }}
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-orange-500/10 text-2xl">
                    📣
                  </div>
                )}

                <div className="min-w-0">
                  <h4 className="truncate text-sm font-black uppercase text-white">
                    {item.titulo || "Anuncio del box"}
                  </h4>

                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/50">
                    {item.resumen || item.contenido || "Sin contenido"}
                  </p>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-[10px] font-bold uppercase text-white/35">
                      {formatRelativeDate(item.fecha_publicacion || item.created_at)}
                    </p>

                    {item.boton_url ? (
                      <a
                        href={item.boton_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-black uppercase text-orange-400 hover:text-orange-300"
                      >
                        {item.boton_texto || "Ver"} →
                      </a>
                    ) : null}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </article>
  )
}

function Empty({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-black/25 p-4 text-sm text-white/40">
      {text}
    </div>
  )
}