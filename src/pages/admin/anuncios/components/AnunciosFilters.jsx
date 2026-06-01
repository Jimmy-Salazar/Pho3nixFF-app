// src/pages/admin/anuncios/components/AnunciosFilters.jsx

export default function AnunciosFilters({ search, onSearchChange, statusFilter, onStatusFilterChange }) {
  return (
    <section className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_auto]">
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35">
          🔍
        </span>

        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar anuncio..."
          className="phoenix-input pl-11"
        />
      </div>

      <select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value)}
        className="phoenix-input"
      >
        <option value="todos" className="bg-black text-white">Estado: Todos</option>
        <option value="activo" className="bg-black text-white">Activos</option>
        <option value="programado" className="bg-black text-white">Programados</option>
        <option value="inactivo" className="bg-black text-white">Inactivos</option>
      </select>

      <button
        type="button"
        className="rounded-xl border border-orange-500/25 bg-orange-500/10 px-5 py-3 text-sm font-black text-orange-300 transition hover:bg-orange-500/15"
      >
        Filtros
      </button>
    </section>
  )
}
