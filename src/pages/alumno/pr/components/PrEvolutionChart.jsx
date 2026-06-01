import { useMemo } from "react"
import { formatDateCompact } from "../utils/prAlumnoUtils"

export default function PrEvolutionChart({
  exercises = [],
  selectedExerciseId,
  onExerciseChange,
  progressRows = [],
}) {
  const chart = useMemo(() => {
    const values = progressRows.map((row) => Number(row.peso_libras || 0))
    const max = Math.max(...values, 200)
    const min = 0
    const width = 720
    const height = 260
    const paddingX = 48
    const paddingY = 34
    const usableW = width - paddingX * 2
    const usableH = height - paddingY * 2

    const points = progressRows.map((row, index) => {
      const x =
        progressRows.length <= 1
          ? paddingX + usableW / 2
          : paddingX + (usableW / (progressRows.length - 1)) * index

      const y = paddingY + usableH - ((Number(row.peso_libras || 0) - min) / (max - min || 1)) * usableH

      return {
        x,
        y,
        row,
      }
    })

    const line = points.map((point) => `${point.x},${point.y}`).join(" ")
    const area =
      points.length > 0
        ? `${points[0].x},${height - paddingY} ${line} ${points[points.length - 1].x},${height - paddingY}`
        : ""

    return {
      width,
      height,
      max,
      points,
      line,
      area,
      yTicks: [0, Math.round(max * 0.25), Math.round(max * 0.5), Math.round(max * 0.75), max],
    }
  }, [progressRows])

  const selectedExercise = exercises.find((item) => item.id === selectedExerciseId)

  return (
    <article className="relative min-h-0 overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 p-5 shadow-2xl shadow-black/30">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
            📈 Evolución de tus PR
          </p>

          <h3 className="mt-1 text-xl font-black uppercase text-white">
            {selectedExercise?.nombre || "Selecciona un ejercicio"}
          </h3>
        </div>

        <select
          value={selectedExerciseId || ""}
          onChange={(e) => onExerciseChange(e.target.value)}
          className="rounded-xl border border-white/10 bg-black/70 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-orange-500/50"
        >
          {exercises.map((exercise) => (
            <option key={exercise.id} value={exercise.id}>
              {exercise.nombre}
            </option>
          ))}
        </select>
      </div>

      {progressRows.length === 0 ? (
        <EmptyState text="Todavía no tienes marcas para este ejercicio." />
      ) : (
        <div className="relative h-[315px] overflow-hidden rounded-2xl border border-white/10 bg-black/25 p-3">
          <svg
            viewBox={`0 0 ${chart.width} ${chart.height}`}
            className="h-full w-full"
            role="img"
            aria-label="Gráfico de evolución de PR"
          >
            {chart.yTicks.map((tick) => {
              const y = chart.height - 34 - (tick / (chart.max || 1)) * (chart.height - 68)

              return (
                <g key={tick}>
                  <line x1="48" x2={chart.width - 48} y1={y} y2={y} stroke="rgba(255,255,255,0.08)" />
                  <text x="12" y={y + 4} fill="rgba(255,255,255,0.55)" fontSize="12">
                    {tick} lb
                  </text>
                </g>
              )
            })}

            {chart.area ? (
              <polygon points={chart.area} fill="rgba(249,115,22,0.20)" />
            ) : null}

            {chart.line ? (
              <polyline
                points={chart.line}
                fill="none"
                stroke="rgb(249,115,22)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {chart.points.map((point) => (
              <g key={point.row.id}>
                <circle cx={point.x} cy={point.y} r="7" fill="rgb(249,115,22)" />
                <text x={point.x - 18} y={point.y - 14} fill="white" fontSize="13" fontWeight="800">
                  {point.row.peso_libras} lb
                </text>
              </g>
            ))}
          </svg>

          <div className="mt-2 grid grid-cols-5 gap-2 text-center text-[11px] text-white/45">
            {progressRows.slice(-5).map((row) => (
              <span key={row.id}>{formatDateCompact(row.fecha)}</span>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}

function EmptyState({ text }) {
  return (
    <div className="flex h-[315px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/25 p-6 text-center text-sm text-white/45">
      {text}
    </div>
  )
}
