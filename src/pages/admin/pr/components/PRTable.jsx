// src/pages/admin/pr/components/PRTable.jsx

import PRTableRow from "./PRTableRow"

export default function PRTable({ loading, records }) {
  return (
    <section className="phoenix-card min-h-0 overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <div>
          <h2 className="text-lg font-black uppercase text-white">
            Mis PR recientes
          </h2>

          <p className="mt-1 text-xs text-white/45">
            {loading ? "Cargando..." : `${records.length} registro(s) encontrados`}
          </p>
        </div>

        <button
          type="button"
          className="rounded-xl border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-xs font-black uppercase text-orange-300 transition hover:bg-orange-500/15"
        >
          Ver historial completo
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-[360px] items-center justify-center text-sm text-white/50">
          Cargando PR...
        </div>
      ) : records.length === 0 ? (
        <div className="flex min-h-[360px] items-center justify-center text-center text-sm text-white/50">
          No hay PR registrados para este filtro.
        </div>
      ) : (
        <div className="min-h-0 overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-[#0b0f14] text-xs uppercase tracking-[0.12em] text-white/45">
              <tr>
                <th className="px-4 py-4 text-left">Ejercicio</th>
                <th className="px-4 py-4 text-left">Tipo</th>
                <th className="px-4 py-4 text-left">Marca</th>
                <th className="px-4 py-4 text-left">Anterior</th>
                <th className="px-4 py-4 text-left">Mejora</th>
                <th className="px-4 py-4 text-left">Fecha</th>
                <th className="px-4 py-4 text-right">Acción</th>
              </tr>
            </thead>

            <tbody>
              {records.map((record) => (
                <PRTableRow key={record.id} record={record} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
