// src/pages/admin/pr/components/PRTableRow.jsx

import { formatDate, formatWeight } from "../utils/formatPR"

export default function PRTableRow({ record }) {
  return (
    <tr className="border-b border-white/10 transition hover:bg-orange-500/[0.04]">
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-2xl">
            🏋️
          </div>

          <div>
            <div className="font-black text-white">
              {record.ejercicio}
            </div>
            <div className="mt-1 text-xs text-white/40">
              {record.nombre}
            </div>
          </div>
        </div>
      </td>

      <td className="px-4 py-4">
        <span className="rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-black text-orange-300">
          {record.tipo || "1RM"}
        </span>
      </td>

      <td className="px-4 py-4">
        <div className="text-2xl font-black text-white">
          {formatWeight(record.marca, record.unidad)}
        </div>
      </td>

      <td className="px-4 py-4">
        <span className="text-white/35">—</span>
      </td>

      <td className="px-4 py-4">
        <span className="text-white/35">—</span>
      </td>

      <td className="px-4 py-4 text-white/70">
        {formatDate(record.fecha)}
      </td>

      <td className="px-4 py-4 text-right">
        <button
          type="button"
          className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs font-bold text-white/55 transition hover:border-orange-400/40 hover:text-orange-300"
        >
          ⋮
        </button>
      </td>
    </tr>
  )
}
