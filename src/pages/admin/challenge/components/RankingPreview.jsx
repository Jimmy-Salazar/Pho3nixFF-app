import { useMemo } from "react"
import { CATEGORIES } from "../utils/constants"
import { buildRanking } from "../utils/ranking"

export default function RankingPreview({
  competitors = [],
  results = [],
  wods = [],
  rankingGeneral = [],
  rankingWodReal = [],
}) {
  const fallbackRanking = useMemo(() => {
    return buildRanking({ competitors, results, wods })
  }, [competitors, results, wods])

  const rankingByCategory = useMemo(() => {
    return CATEGORIES.map((category) => {
      const rowsFromView = (rankingGeneral || [])
        .filter((row) => row.categoria === category.value)
        .sort((a, b) => Number(a.position || 0) - Number(b.position || 0))

      const rows =
        rowsFromView.length > 0
          ? rowsFromView
          : fallbackRanking[category.value] || []

      return {
        ...category,
        rows,
      }
    })
  }, [rankingGeneral, fallbackRanking])

  const rankingByWod = useMemo(() => {
    const grouped = {}

    ;(rankingWodReal || []).forEach((row) => {
      const key = row.wod_id || "sin-wod"

      if (!grouped[key]) {
        grouped[key] = {
          wod_id: row.wod_id,
          wod_orden: row.wod_orden || 1,
          wod: row.wod || "WOD",
          wod_descripcion: row.wod_descripcion || "",
          nivel: row.nivel || "",
          rows: [],
        }
      }

      grouped[key].rows.push(row)
    })

    return Object.values(grouped)
      .map((group) => ({
        ...group,
        rows: group.rows.sort(
          (a, b) => Number(a.position || a.puesto_wod || 0) - Number(b.position || b.puesto_wod || 0)
        ),
      }))
      .sort((a, b) => Number(a.wod_orden || 0) - Number(b.wod_orden || 0))
  }, [rankingWodReal])

  return (
    <div className="space-y-6">
      <header className="rounded-[2rem] border border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-white/[0.03] to-black p-5">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-400">
          Ranking Challenge
        </p>

        <h2 className="mt-2 text-3xl font-black uppercase text-white">
          Resultados oficiales
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
          Vista general por categoría y detalle por WOD. El ranking se ordena por
          repeticiones totales y posición calculada desde Supabase.
        </p>
      </header>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-black uppercase text-white">
              Ranking general
            </h3>
            <p className="mt-1 text-sm text-white/45">
              Total acumulado por atleta.
            </p>
          </div>

          <span className="rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-xs font-black uppercase text-orange-300">
            {rankingGeneral.length || results.length} resultado(s)
          </span>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {rankingByCategory.map((category) => (
            <CategoryRankingCard
              key={category.value}
              title={category.label}
              rows={category.rows}
            />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-black uppercase text-white">
              Ranking por WOD
            </h3>
            <p className="mt-1 text-sm text-white/45">
              Posiciones individuales por cada WOD del challenge.
            </p>
          </div>

          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-black uppercase text-white/50">
            {rankingByWod.length} WOD(s)
          </span>
        </div>

        {rankingByWod.length === 0 ? (
          <EmptyBox text="Todavía no hay resultados por WOD." />
        ) : (
          <div className="space-y-4">
            {rankingByWod.map((wod) => (
              <WodRankingCard key={wod.wod_id} wod={wod} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function CategoryRankingCard({ title, rows }) {
  return (
    <article className="rounded-[2rem] border border-white/10 bg-black/35 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h4 className="text-lg font-black uppercase text-orange-500">
          {title}
        </h4>

        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-white/45">
          {rows.length} atleta(s)
        </span>
      </div>

      {rows.length === 0 ? (
        <EmptyBox text="Sin atletas con resultados en esta categoría." />
      ) : (
        <div className="space-y-2">
          {rows.map((row, index) => (
            <RankingRow
              key={row.id || row.inscripcion_id || `${title}-${index}`}
              position={row.position || row.puesto_general || index + 1}
              name={row.nombre || row.nombre_completo}
              value={row.total || row.repeticiones_totales || 0}
              label="reps"
            />
          ))}
        </div>
      )}
    </article>
  )
}

function WodRankingCard({ wod }) {
  const groupedByCategory = wod.rows.reduce((acc, row) => {
    const key = row.categoria_nombre || row.categoria || "Sin categoría"

    if (!acc[key]) acc[key] = []
    acc[key].push(row)

    return acc
  }, {})

  return (
    <article className="overflow-hidden rounded-[2rem] border border-white/10 bg-black/35">
      <div className="border-b border-white/10 bg-white/[0.03] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-500">
              WOD {wod.wod_orden}
            </p>

            <h4 className="mt-1 text-xl font-black uppercase text-white">
              {wod.wod}
            </h4>

            {wod.wod_descripcion ? (
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-white/55">
                {wod.wod_descripcion}
              </p>
            ) : null}
          </div>

          {wod.nivel ? (
            <span className="rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-xs font-black uppercase text-orange-300">
              {wod.nivel}
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 p-4 xl:grid-cols-2">
        {Object.entries(groupedByCategory).map(([categoryName, rows]) => (
          <div
            key={`${wod.wod_id}-${categoryName}`}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
          >
            <h5 className="mb-3 text-sm font-black uppercase text-orange-400">
              {categoryName}
            </h5>

            <div className="space-y-2">
              {rows.map((row, index) => (
                <RankingRow
                  key={row.id || row.inscripcion_id || `${categoryName}-${index}`}
                  position={row.position || row.puesto_wod || index + 1}
                  name={row.nombre || row.nombre_completo}
                  value={row.total || row.resultado_valor || 0}
                  label="reps"
                  evidenceUrl={row.evidencia_url}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}

function RankingRow({
  position,
  name,
  value,
  label = "pts",
  evidenceUrl = "",
}) {
  return (
    <div className="grid grid-cols-[42px_1fr_auto] items-center gap-3 rounded-2xl border border-white/10 bg-black/35 p-3">
      <PositionBadge number={position} />

      <div className="min-w-0">
        <p className="truncate text-sm font-black uppercase text-white">
          {name || "Competidor"}
        </p>

        {evidenceUrl ? (
          <a
            href={evidenceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex text-xs font-bold text-orange-400 hover:text-orange-300"
          >
            Ver evidencia →
          </a>
        ) : (
          <p className="mt-1 text-xs text-white/35">
            Sin evidencia
          </p>
        )}
      </div>

      <div className="text-right">
        <p className="text-xl font-black text-orange-500">
          {Number(value || 0)}
        </p>
        <p className="text-[10px] font-black uppercase text-white/35">
          {label}
        </p>
      </div>
    </div>
  )
}

function PositionBadge({ number }) {
  const n = Number(number || 0)

  const medal =
    n === 1
      ? "bg-yellow-500 text-black"
      : n === 2
      ? "bg-zinc-300 text-black"
      : n === 3
      ? "bg-orange-800 text-white"
      : "bg-white/10 text-white/55"

  return (
    <div
      className={[
        "flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black",
        medal,
      ].join(" ")}
    >
      {n || "-"}
    </div>
  )
}

function EmptyBox({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-black/25 p-4 text-sm text-white/40">
      {text}
    </div>
  )
}