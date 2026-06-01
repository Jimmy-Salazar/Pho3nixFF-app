// src/pages/admin/pr/modals/PRHistoryModal.jsx

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { formatDate, formatDateLong, formatLb } from "../utils/formatPR"

export default function PRHistoryModal({ loading, athlete, rows, onClose }) {
  const chartData = rows.map((item) => ({
    fecha: formatDate(item.fecha),
    peso: Number(item.peso_libras) || 0,
    fechaRaw: item.fecha,
  }))

  const recentRows = [...rows]
    .sort((a, b) => new Date(`${b.fecha}T00:00:00`) - new Date(`${a.fecha}T00:00:00`))
    .slice(0, 8)

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm">
      <div className="phoenix-card max-h-[94vh] w-full max-w-5xl overflow-hidden">
        <div className="border-b border-orange-500/15 bg-black/55 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">
                Evolución PR
              </div>

              <h3 className="mt-2 text-3xl font-black text-white">
                {athlete?.nombre || "Atleta"}
              </h3>

              <p className="mt-2 text-sm text-white/60">
                Ejercicio:{" "}
                <span className="font-black text-white">
                  {athlete?.ejercicio_nombre || "-"}
                </span>
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-white/70 transition hover:border-orange-400/40 hover:text-orange-300"
            >
              Cerrar
            </button>
          </div>
        </div>

        <div className="max-h-[72vh] overflow-y-auto p-5">
          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-white/10 bg-black/25 text-white/60">
              Cargando historial...
            </div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-[1.4fr_.8fr]">
              <section className="rounded-3xl border border-white/10 bg-black/25 p-4">
                <div className="mb-4">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-white/45">
                    Gráfico
                  </div>
                  <h4 className="mt-1 text-xl font-black text-white">
                    Evolución por fecha
                  </h4>
                </div>

                {chartData.length === 0 ? (
                  <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/25 text-white/45">
                    No hay datos para graficar.
                  </div>
                ) : (
                  <div className="h-[360px] w-full overflow-x-auto">
                    <ResponsiveContainer width={Math.max(chartData.length * 52, 430)} height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="fecha" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                        <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="peso" radius={[8, 8, 0, 0]} fill="#f97316" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-white/10 bg-black/25 p-4">
                <div className="mb-4">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-white/45">
                    Historial
                  </div>
                  <h4 className="mt-1 text-xl font-black text-white">
                    Registros recientes
                  </h4>
                </div>

                {recentRows.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-black/25 p-4 text-white/45">
                    No hay registros todavía.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentRows.map((registro) => (
                      <article
                        key={registro.id}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
                      >
                        <div>
                          <p className="font-black text-white">
                            {formatLb(registro.peso_libras)}
                          </p>
                          <p className="text-sm text-white/45">
                            {formatDateLong(registro.fecha)}
                          </p>
                        </div>

                        <span className="rounded-xl border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-black text-orange-300">
                          PR
                        </span>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="rounded-2xl border border-white/10 bg-black/95 px-4 py-3 shadow-2xl">
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="mt-1 text-sm text-orange-300">{payload[0].value} lb</p>
    </div>
  )
}
