// src/pages/admin/anuncios/components/AnuncioCard.jsx

import { formatDateTime, getAnuncioStatus } from "../utils/anunciosUtils"

export default function AnuncioCard({ anuncio, onEdit, onDelete }) {
  const status = getAnuncioStatus(anuncio)

  return (
    <article className="group grid gap-4 rounded-2xl border border-orange-500/10 bg-black/25 p-3 transition hover:border-orange-500/30 hover:bg-orange-500/[0.04] md:grid-cols-[210px_1fr_auto]">
      <div className="h-28 overflow-hidden rounded-xl border border-white/10 bg-black/40">
        {anuncio.media_url ? (
          anuncio.media_tipo === "video" ? (
            <video src={anuncio.media_url} className="h-full w-full object-cover" muted playsInline />
          ) : (
            <img src={anuncio.media_url} alt={anuncio.titulo || "Anuncio"} className="h-full w-full object-cover" />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-500/20 to-black text-4xl">
            📣
          </div>
        )}
      </div>

      <div className="min-w-0">
        <h3 className="truncate text-lg font-black text-white">
          {anuncio.titulo || "Anuncio sin título"}
        </h3>

        <p className="mt-1 line-clamp-2 text-sm leading-5 text-white/60">
          {anuncio.contenido || "Sin contenido."}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-orange-500/15 bg-orange-500/10 px-2.5 py-1 text-[11px] font-bold text-orange-200">
            🗓️ {formatDateTime(anuncio.fecha_publicacion)}
          </span>

          <StatusBadge status={status} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs font-bold text-white/75 transition hover:border-orange-400/40 hover:text-orange-300"
        >
          ✎ Editar
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-200 transition hover:bg-red-500/15"
        >
          🗑️
        </button>
      </div>
    </article>
  )
}

function StatusBadge({ status }) {
  const map = {
    activo: "border-green-400/25 bg-green-500/10 text-green-200",
    programado: "border-blue-400/25 bg-blue-500/10 text-blue-200",
    inactivo: "border-red-400/25 bg-red-500/10 text-red-200",
  }

  const label = {
    activo: "Activo",
    programado: "Programado",
    inactivo: "Inactivo",
  }

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.1em] ${map[status] || map.inactivo}`}>
      {label[status] || "Inactivo"}
    </span>
  )
}
