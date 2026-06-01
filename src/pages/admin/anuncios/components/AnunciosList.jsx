// src/pages/admin/anuncios/components/AnunciosList.jsx

import AnuncioCard from "./AnuncioCard"

export default function AnunciosList({ loading, error, anuncios, onEdit, onDelete }) {
  return (
    <section className="phoenix-card min-h-0 overflow-hidden p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white">Listado de anuncios</h2>
          <p className="text-xs text-white/45">{anuncios.length} anuncio(s) encontrados</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-black/25 p-5 text-sm text-white/60">
          Cargando anuncios...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">
          {error}
        </div>
      ) : anuncios.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-black/25 p-5 text-sm text-white/60">
          No hay anuncios registrados.
        </div>
      ) : (
        <div className="h-full space-y-3 overflow-y-auto pr-1">
          {anuncios.map((anuncio) => (
            <AnuncioCard
              key={anuncio.id}
              anuncio={anuncio}
              onEdit={() => onEdit(anuncio)}
              onDelete={() => onDelete(anuncio)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
