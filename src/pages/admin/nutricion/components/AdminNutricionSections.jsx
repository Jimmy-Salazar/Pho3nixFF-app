import { useEffect, useMemo, useState } from "react"
import {
  Avatar,
  CardTitle,
  EmptyState,
  MetaBadge,
  ScoreRing,
  SearchInput,
  SectionCard,
  SelectControl,
  StatCard,
} from "./AdminNutricionUi"

function pct(value) {
  return `${Math.max(0, Math.min(100, Number(value || 0)))}%`
}

export function HeaderSection({ title = "Nutrición", subtitle, onReload, compact = false }) {
  return (
    <header
      className={[
        "flex flex-col gap-2.5 lg:flex-row lg:items-start lg:justify-between",
        compact ? "mb-2.5" : "mb-4",
      ].join(" ")}
    >
      <div>
        <h1
          className={[
            "font-black tracking-tight text-white",
            compact ? "text-2xl" : "text-3xl xl:text-4xl",
          ].join(" ")}
        >
          {title}
        </h1>
        <p
          className={[
            "mt-1 max-w-3xl font-medium text-white/55",
            compact ? "text-xs leading-4" : "text-sm leading-5",
          ].join(" ")}
        >
          {subtitle || "Vista general del estado nutricional de los atletas y recomendaciones para la programación de WODs."}
        </p>
      </div>

      <div className="flex gap-1.5 sm:gap-2">
        <button
          type="button"
          className={[
            "flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/45 font-black text-white/75 transition hover:border-orange-500/35 hover:text-orange-300",
            compact ? "h-8 px-2 text-[10px]" : "h-10 px-3 text-xs",
          ].join(" ")}
        >
          📅 Últimos 30 días
        </button>
        <button
          type="button"
          onClick={onReload}
          className={[
            "flex items-center gap-1.5 rounded-xl border border-orange-500/25 bg-orange-500/10 font-black text-orange-300 transition hover:bg-orange-500/15",
            compact ? "h-8 px-2 text-[10px]" : "h-10 px-3 text-xs",
          ].join(" ")}
        >
          ↻ Actualizar
        </button>
      </div>
    </header>
  )
}

export function StatsGrid({ resumen, utils }) {
  return (
    <section className="mb-3 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-2 xl:mb-4 xl:grid-cols-5">
      <StatCard
        icon="👥"
        label="Atletas analizados"
        value={utils.formatNumber(resumen?.totalAnalizados || 0)}
        footer={`${utils.formatNumber(resumen?.porcentajeAnalizados || 0)}% del total activo`}
        accent
      />
      <StatCard
        icon="🎯"
        label="Score promedio"
        value={`${utils.formatNumber(resumen?.scorePromedio || 0)}/100`}
        footer="Últimos análisis"
      />
      <StatCard
        icon="🏋️"
        label="WODs promedio"
        value={utils.formatNumber(resumen?.wodsPromedio || 0)}
        footer="Últimos 30 días"
      />
      <StatCard
        icon="🔥"
        label="Calorías promedio"
        value={utils.formatNumber(resumen?.caloriasPromedio || 0)}
        footer="Últimos 30 días"
      />
      <StatCard
        icon="🏆"
        label="PRs logrados"
        value={utils.formatNumber(resumen?.prsLogrados || 0)}
        footer="Últimos 30 días"
      />
    </section>
  )
}

export function MetaDistributionCard({ distribucion = [], utils }) {
  const stops = buildConicStops(distribucion)

  return (
    <SectionCard className="p-4">
      <CardTitle icon="◎" title="Distribución por meta principal" />

      {distribucion.some((item) => item.count > 0) ? (
        <div className="grid items-center gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
          <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-full p-4" style={{ background: stops }}>
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#070707] text-center text-xs font-black text-white/55">
              Metas
            </div>
          </div>

          <div className="space-y-3">
            {distribucion.map((item) => {
              const colors = utils.getMetaColor(item.meta)
              return (
                <div key={item.meta} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${getDotBg(item.meta)}`} />
                    <span className="truncate font-bold text-white/80">{item.label}</span>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-xs font-black ${colors.text}`}>{item.percent}%</p>
                    <p className="text-[10px] font-bold text-white/35">{item.count} atletas</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <EmptyState text="Todavía no hay análisis nutricionales generados por atletas." />
      )}
    </SectionCard>
  )
}

export function ObjectivesSummaryCard({ objetivos = [], utils }) {
  return (
    <SectionCard className="p-4">
      <CardTitle icon="▤" title="Resumen por objetivo" />

      <div className="grid gap-3 xl:grid-cols-4">
        {objetivos.map((item) => {
          const colors = utils.getMetaColor(item.meta)
          return (
            <article
              key={item.meta}
              className={`overflow-hidden rounded-2xl border ${colors.border} bg-black/35`}
            >
              <div className={`border-b border-white/10 px-3 py-3 ${colors.bg}`}>
                <p className={`text-sm font-black uppercase ${colors.text}`}>{item.label}</p>
                <p className="mt-0.5 text-xs font-bold text-white/55">{item.count} atletas</p>
              </div>

              <div className="divide-y divide-white/10 px-3 text-xs">
                <MetricRow label="IMC promedio" value={utils.formatNumber(item.imcPromedio, 1)} />
                <MetricRow label="WODs prom. (30 días)" value={utils.formatNumber(item.wodsPromedio, 0)} />
                <MetricRow label="Calorías prom. (30 días)" value={utils.formatNumber(item.caloriasPromedio, 0)} />
                <MetricRow label="Score promedio" value={`${utils.formatNumber(item.scorePromedio, 0)}/100`} />
              </div>

              <div className="m-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-5 text-white/70">
                {item.recomendacion}
              </div>
            </article>
          )
        })}
      </div>
    </SectionCard>
  )
}

export function FiltersBar({ filters, onFilterChange, onResetFilters, compact = false }) {
  return (
    <div className={compact ? "grid gap-2" : "flex flex-wrap items-center gap-2"}>
      <SearchInput
        value={filters.search}
        onChange={(value) => onFilterChange("search", value)}
      />

      <SelectControl value={filters.meta} onChange={(value) => onFilterChange("meta", value)}>
        <option value="todas">Todas las metas</option>
        <option value="perder_grasa">Perder grasa</option>
        <option value="recomposicion">Recomposición</option>
        <option value="ganar_masa_muscular">Ganar masa muscular</option>
        <option value="mejorar_rendimiento">Mejorar rendimiento</option>
      </SelectControl>

      <SelectControl value={filters.estado} onChange={(value) => onFilterChange("estado", value)}>
        <option value="todos">Todos los estados</option>
        <option value="con_analisis">Con análisis</option>
        <option value="sin_analisis">Sin análisis</option>
        <option value="normal">IMC normal</option>
        <option value="sobrepeso">Sobrepeso</option>
        <option value="imc_alto">IMC alto</option>
      </SelectControl>

      <SelectControl value={filters.score} onChange={(value) => onFilterChange("score", value)}>
        <option value="todos">Todos los scores</option>
        <option value="alto">Score alto</option>
        <option value="medio">Score medio</option>
        <option value="bajo">Score bajo</option>
      </SelectControl>

      <button
        type="button"
        onClick={onResetFilters}
        className="h-10 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-black text-white/55 transition hover:text-orange-300"
      >
        Limpiar
      </button>
    </div>
  )
}

export function AthletesTableCard({ atletas = [], filters, utils, onFilterChange, onResetFilters, onSelectAthlete, onOpenDetail, selectedAthlete }) {
  return (
    <SectionCard className="overflow-hidden">
      <div className="border-b border-white/10 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-black uppercase tracking-[0.08em] text-white/85">Atletas</h2>
          <p className="text-xs font-bold text-white/35">{atletas.length} resultados</p>
        </div>
        <FiltersBar filters={filters} onFilterChange={onFilterChange} onResetFilters={onResetFilters} />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full text-left text-xs">
          <thead className="border-b border-white/10 bg-white/[0.03] text-[10px] font-black uppercase tracking-[0.08em] text-white/40">
            <tr>
              <th className="px-4 py-3">Atleta</th>
              <th className="px-3 py-3">Meta</th>
              <th className="px-3 py-3 text-center">Peso</th>
              <th className="px-3 py-3 text-center">IMC</th>
              <th className="px-3 py-3">Estado IMC</th>
              <th className="px-3 py-3 text-center">WODs</th>
              <th className="px-3 py-3 text-center">Calorías</th>
              <th className="px-3 py-3 text-center">PRs</th>
              <th className="px-3 py-3 text-center">Score</th>
              <th className="px-3 py-3">Último análisis</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>

          <tbody className="divide-y divide-white/10">
            {atletas.length ? (
              atletas.slice(0, 12).map((item) => {
                const active = selectedAthlete?.id === item.id
                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectAthlete(item)}
                    className={[
                      "cursor-pointer transition hover:bg-orange-500/[0.06]",
                      active ? "bg-orange-500/[0.08]" : "bg-transparent",
                    ].join(" ")}
                  >
                    <td className="px-4 py-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Avatar item={item} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-bold text-white/85">{item.nombre}</p>
                          <p className="truncate text-[10px] text-white/35">{item.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3"><MetaBadge meta={item.meta} /></td>
                    <td className="px-3 py-3 text-center font-bold text-white/75">{utils.formatNumber(item.peso_kg, 1)}</td>
                    <td className="px-3 py-3 text-center font-bold text-white/75">{utils.formatNumber(item.imc, 1)}</td>
                    <td className={`px-3 py-3 font-black ${item.imc_className}`}>{item.imc_label}</td>
                    <td className="px-3 py-3 text-center font-bold text-white/75">{utils.formatNumber(item.wods_30_dias)}</td>
                    <td className="px-3 py-3 text-center font-bold text-white/75">{utils.formatNumber(item.calorias_30_dias)}</td>
                    <td className="px-3 py-3 text-center font-bold text-white/75">{utils.formatNumber(item.prs_30_dias)}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="text-base font-black text-white">{item.score_pho3nix || "--"}</span>
                        <ScoreRing score={item.score_pho3nix} size={34} />
                      </div>
                    </td>
                    <td className="px-3 py-3 font-bold text-white/55">{utils.formatDate(item.fecha_analisis)}</td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          onOpenDetail(item)
                        }}
                        className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-black text-orange-300"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan="11" className="px-4 py-8">
                  <EmptyState text="No hay atletas que coincidan con los filtros." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}

export function AthleteDetailPanel({ athlete, utils, onOpenDetail, className = "" }) {
  if (!athlete) {
    return (
      <SectionCard className={`p-4 ${className}`}>
        <EmptyState text="Selecciona un atleta para ver el detalle." />
      </SectionCard>
    )
  }

  return (
    <SectionCard className={`p-4 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
        <h2 className="text-sm font-black text-white">Detalle del atleta</h2>
        <button type="button" onClick={() => onOpenDetail(athlete)} className="text-xl text-white/45 hover:text-orange-300">↗</button>
      </div>

      <div className="flex items-center gap-3">
        <Avatar item={athlete} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-lg font-black text-white">{athlete.nombre}</p>
          <p className="text-sm font-bold text-white/45">{athlete.edad ? `${athlete.edad} años` : "Edad no registrada"}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-y border-white/10 py-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-white/35">Meta principal</p>
          <div className="mt-2"><MetaBadge meta={athlete.meta} /></div>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-white/35">Score PHO3NIX</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-2xl font-black text-white">{athlete.score_pho3nix || "--"}</span>
            <span className="text-sm font-bold text-white/45">/100</span>
            <ScoreRing score={athlete.score_pho3nix} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
        <MiniInfo label="Peso" value={`${utils.formatNumber(athlete.peso_kg, 1)} kg`} />
        <MiniInfo label="Estatura" value={`${utils.formatNumber(athlete.estatura_cm, 0)} cm`} />
        <MiniInfo label="IMC" value={utils.formatNumber(athlete.imc, 1)} footer={athlete.imc_label} footerClass={athlete.imc_className} />
      </div>

      <button
        type="button"
        onClick={() => onOpenDetail(athlete)}
        className="mt-4 flex h-11 w-full items-center justify-center rounded-xl border border-orange-500/35 bg-orange-500/10 text-sm font-black text-orange-300 transition hover:bg-orange-500/15"
      >
        Ver análisis completo
      </button>

      <p className="mt-3 text-center text-xs font-bold text-white/35">
        Último análisis: {utils.formatDate(athlete.fecha_analisis)}
      </p>
    </SectionCard>
  )
}

export function MobileAthleteList({ atletas, utils, onOpenDetail }) {
  const pageSize = 5
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil((atletas?.length || 0) / pageSize))

  useEffect(() => {
    setPage(1)
  }, [atletas])

  const safePage = Math.min(page, totalPages)

  const rows = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return (atletas || []).slice(start, start + pageSize)
  }, [atletas, safePage])

  if (!atletas.length) {
    return <EmptyState text="No hay atletas que coincidan con los filtros." />
  }

  return (
    <SectionCard className="overflow-hidden">
      <div className="border-b border-white/10 px-3 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.1em] text-white/80">
              Atletas
            </h2>
            <p className="text-[10px] font-bold text-white/35">
              {atletas.length} resultado(s)
            </p>
          </div>

          <span className="rounded-xl border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-[10px] font-black text-orange-300">
            {safePage}/{totalPages}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[445px] text-left text-[10px]">
          <thead className="border-b border-white/10 bg-white/[0.03] text-[8.5px] font-black uppercase tracking-[0.1em] text-white/40">
            <tr>
              <th className="px-2.5 py-2">Atleta</th>
              <th className="px-2 py-2">Meta</th>
              <th className="px-2 py-2 text-center">IMC</th>
              <th className="px-2 py-2 text-center">Score</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/10">
            {rows.map((item) => (
              <tr
                key={item.id}
                onClick={() => onOpenDetail(item)}
                className="cursor-pointer bg-black/20 transition hover:bg-orange-500/[0.06] active:bg-orange-500/[0.10]"
              >
                <td className="px-2.5 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar item={item} size="sm" />

                    <div className="min-w-0">
                      <p className="max-w-[150px] truncate text-[11px] font-black text-white">
                        {item.nombre}
                      </p>
                      <p className="mt-0.5 truncate text-[9px] font-bold text-white/35">
                        {utils.formatDate(item.fecha_analisis)}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-2 py-2.5">
                  <MetaBadge meta={item.meta} compact />
                </td>

                <td className="px-2 py-2.5 text-center">
                  <p className="font-black text-white/80">
                    {utils.formatNumber(item.imc, 1)}
                  </p>
                  <p className={`text-[8.5px] font-black ${item.imc_className}`}>
                    {item.imc_label}
                  </p>
                </td>

                <td className="px-2 py-2.5 text-center">
                  <span className="font-black text-orange-300">
                    {item.score_pho3nix || "--"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-white/10 px-3 py-2.5">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          className="h-8 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-[10px] font-black uppercase text-white/65 disabled:cursor-not-allowed disabled:opacity-35"
        >
          ‹ Anterior
        </button>

        <p className="text-[10px] font-bold text-white/40">
          Mostrando {(safePage - 1) * pageSize + 1}-{Math.min(safePage * pageSize, atletas.length)} de {atletas.length}
        </p>

        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          className="h-8 rounded-xl border border-orange-500/25 bg-orange-500/10 px-3 text-[10px] font-black uppercase text-orange-300 disabled:cursor-not-allowed disabled:opacity-35"
        >
          Siguiente ›
        </button>
      </div>
    </SectionCard>
  )
}


export function AthleteFullDetail({ athlete, utils }) {
  if (!athlete) return null

  const analysis = athlete.analisis || {}
  const quickRows = [
    ["WODs últimos 30 días", utils.formatNumber(athlete.wods_30_dias)],
    ["Calorías 30 días", utils.formatNumber(athlete.calorias_30_dias)],
    ["PRs últimos 30 días", utils.formatNumber(athlete.prs_30_dias)],
    ["Días entrenados", utils.formatNumber(athlete.dias_entrenados_30_dias)],
    ["Score PHO3NIX", `${athlete.score_pho3nix || "--"}/100`],
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Avatar item={athlete} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-lg font-black text-white">{athlete.nombre}</p>
          <p className="text-sm font-bold text-white/45">{athlete.edad ? `${athlete.edad} años` : "Edad no registrada"}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
        <MiniInfo label="Peso" value={`${utils.formatNumber(athlete.peso_kg, 1)} kg`} />
        <MiniInfo label="Estatura" value={`${utils.formatNumber(athlete.estatura_cm, 0)} cm`} />
        <MiniInfo label="IMC" value={utils.formatNumber(athlete.imc, 1)} footer={athlete.imc_label} footerClass={athlete.imc_className} />
      </div>

      <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-3">
        <p className="text-xs font-black uppercase tracking-[0.1em] text-orange-300">Meta principal</p>
        <p className="mt-1 text-lg font-black text-white">{athlete.meta_label}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
        <p className="mb-2 text-sm font-black text-white">Resumen rápido</p>
        <div className="divide-y divide-white/10">
          {quickRows.map(([label, value]) => (
            <MetricRow key={label} label={label} value={value} />
          ))}
        </div>
      </div>

      <AnalysisBlock title="Resumen" text={analysis.resumen} />
      <AnalysisBlock title="Diagnóstico" text={analysis.diagnostico} />
      <AnalysisBlock title="Nutrición" text={analysis.nutricion} />
      <AnalysisBlock title="Entrenamiento" text={analysis.entrenamiento} />
      <AnalysisBlock title="Pre-WOD" text={analysis.pre_wod} />
      <AnalysisBlock title="Post-WOD" text={analysis.post_wod} />
      <AnalysisBlock title="Hidratación" text={analysis.hidratacion} />
      <AnalysisBlock title="Descanso" text={analysis.descanso} />
      <AnalysisBlock title="Alerta" text={analysis.alerta} tone="alert" />
    </div>
  )
}

function AnalysisBlock({ title, text, tone = "default" }) {
  if (!text) return null

  return (
    <div
      className={[
        "rounded-2xl border p-3",
        tone === "alert"
          ? "border-sky-500/25 bg-sky-500/10"
          : "border-white/10 bg-black/35",
      ].join(" ")}
    >
      <p className="text-xs font-black uppercase tracking-[0.1em] text-orange-300">{title}</p>
      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-white/72">{text}</p>
    </div>
  )
}

function MetricRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-white/50">{label}</span>
      <strong className="text-right font-black text-white/85">{value}</strong>
    </div>
  )
}

function MiniInfo({ label, value, footer, footerClass = "text-white/35" }) {
  return (
    <div className="min-w-0 px-2">
      <p className="truncate text-[10px] font-black uppercase tracking-[0.1em] text-white/35">{label}</p>
      <p className="mt-1 truncate text-lg font-black text-white">{value}</p>
      {footer ? <p className={`mt-0.5 truncate text-[11px] font-black ${footerClass}`}>{footer}</p> : null}
    </div>
  )
}

function buildConicStops(distribucion) {
  const colors = {
    perder_grasa: "rgb(249,115,22)",
    recomposicion: "rgb(132,204,22)",
    ganar_masa_muscular: "rgb(56,189,248)",
    mejorar_rendimiento: "rgb(168,85,247)",
  }

  let start = 0
  const parts = []

  distribucion.forEach((item) => {
    const end = start + Number(item.percent || 0)
    if (end > start) {
      parts.push(`${colors[item.meta] || "rgb(120,120,120)"} ${start}% ${end}%`)
    }
    start = end
  })

  return `conic-gradient(${parts.length ? parts.join(", ") : "rgba(255,255,255,0.08) 0% 100%"})`
}

function getDotBg(meta) {
  if (meta === "perder_grasa") return "bg-orange-500"
  if (meta === "recomposicion") return "bg-lime-500"
  if (meta === "ganar_masa_muscular") return "bg-sky-500"
  if (meta === "mejorar_rendimiento") return "bg-violet-500"
  return "bg-white/30"
}
