import { useEffect, useState } from "react"
import {
  CardTitle,
  EmptyCard,
  HeroInfo,
  MetricCard,
  formatDate,
  numberText,
} from "./NutricionUi"

export function NutricionIntro({ score }) {
  const scoreText = score || "--"
  const numericScore = Number(score)
  const scoreValue = Number.isFinite(numericScore) ? Math.max(0, Math.min(100, numericScore)) : 0

  return (
    <section className="phoenix-nutrition-hero relative z-10 mb-3 flex items-start justify-between gap-3 overflow-hidden rounded-[1.35rem] border border-orange-500/25 bg-black/55 p-3.5 shadow-2xl shadow-black/40">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-black uppercase leading-none tracking-tight text-white">
          Nutrición
        </h1>
        <p className="mt-2 max-w-[230px] text-[11px] font-medium leading-4 text-white/55 sm:max-w-md sm:text-xs">
          Análisis nutricional y deportivo basado en tu objetivo, evolución, WODs, calorías, asistencia y rendimiento.
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="text-right">
          <p className="text-[8px] font-black uppercase tracking-[0.12em] text-orange-400">
            Score actual
          </p>
          <div className="mt-1 flex items-end justify-end gap-1">
            <strong className="text-3xl font-black leading-none text-white">
              {scoreText}
            </strong>
            <span className="pb-1 text-[11px] font-black text-white/50">/100</span>
          </div>
        </div>

        <div className="relative h-16 w-16 shrink-0 rounded-full p-[4px] shadow-[0_0_24px_rgba(249,115,22,0.22)]">
          <div
            className="h-full w-full rounded-full"
            style={{
              background: `conic-gradient(#f97316 ${scoreValue * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
            }}
          >
            <div className="m-[5px] h-[calc(100%-10px)] w-[calc(100%-10px)] rounded-full bg-[#050505]" />
          </div>
          <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_70%_25%,rgba(249,115,22,0.32),transparent_45%)]" />
        </div>
      </div>
    </section>
  )
}

export function DatosAtletaCard({
  usuario,
  form,
  saving,
  analyzing,
  onSave,
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({
    peso_kg: form?.peso_kg || "",
    estatura_cm: form?.estatura_cm || "",
  })

  useEffect(() => {
    if (!editing) {
      setDraft({
        peso_kg: form?.peso_kg || "",
        estatura_cm: form?.estatura_cm || "",
      })
    }
  }, [form?.peso_kg, form?.estatura_cm, editing])

  const handleOpen = () => {
    setDraft({
      peso_kg: form?.peso_kg || "",
      estatura_cm: form?.estatura_cm || "",
    })
    setEditing(true)
  }

  const handleSave = async () => {
    await onSave?.({
      ...form,
      peso_kg: draft.peso_kg,
      estatura_cm: draft.estatura_cm,
    })
    setEditing(false)
  }

  return (
    <>
      <article className="phoenix-nutrition-card relative z-10 mb-3 overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/45 p-3 shadow-2xl shadow-black/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_12%,rgba(249,115,22,0.16),transparent_42%)]" />

        <div className="relative z-10">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-orange-500/25 bg-orange-500/10 text-sm text-orange-400">
                🧑‍🤝‍🧑
              </span>
              <p className="truncate text-[12px] font-black uppercase tracking-[0.12em] text-white/80">
                Datos del atleta
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpen}
              disabled={saving || analyzing}
              className="shrink-0 text-[11px] font-black text-orange-400 transition hover:text-orange-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Editar
            </button>
          </div>

          <div className="mb-4 flex items-center gap-3">
            <AthleteAvatar usuario={usuario} />

            <div className="min-w-0">
              <p className="truncate text-base font-black text-white">
                {usuario?.nombre || "Atleta PHO3NIX"}
              </p>
              <p className="mt-0.5 truncate text-[11px] font-bold text-white/55">
                {usuario?.edad ? `${usuario.edad} años` : "Edad no registrada"}
              </p>
              <p className="mt-0.5 truncate text-[10px] font-bold text-white/40">
                Nac.: {formatBirthDate(usuario?.fecha_nacimiento)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <MetricDisplay label="Peso actual" value={form?.peso_kg} unit="kg" />
            <MetricDisplay label="Estatura" value={form?.estatura_cm} unit="cm" />
          </div>
        </div>
      </article>

      {editing ? (
        <EditAthleteModal
          draft={draft}
          setDraft={setDraft}
          saving={saving}
          analyzing={analyzing}
          onClose={() => setEditing(false)}
          onSave={handleSave}
        />
      ) : null}
    </>
  )
}

function AthleteAvatar({ usuario }) {
  if (usuario?.foto_url) {
    return (
      <img
        src={usuario.foto_url}
        alt={usuario?.nombre || "Atleta"}
        className="h-16 w-16 shrink-0 rounded-full border border-white/15 object-cover shadow-[0_0_20px_rgba(255,255,255,0.08)]"
      />
    )
  }

  const initial = String(usuario?.nombre || "A").trim().charAt(0).toUpperCase() || "A"

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/15 text-3xl font-light text-white shadow-[inset_0_0_24px_rgba(255,255,255,0.08)]">
      {initial}
    </div>
  )
}

function MetricDisplay({ label, value, unit }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <p className="text-[11px] font-medium text-white/50">{label}</p>
      <div className="mt-2 flex items-end gap-1.5">
        <strong className="text-xl font-black leading-none text-white">
          {value || "--"}
        </strong>
        <span className="pb-0.5 text-[10px] font-black text-white/55">
          {unit}
        </span>
      </div>
    </div>
  )
}

function EditAthleteModal({ draft, setDraft, saving, analyzing, onClose, onSave }) {
  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/75 px-3 py-4 backdrop-blur-sm">
      <div className="phoenix-nutrition-modal w-full max-w-md overflow-hidden rounded-[1.35rem] border border-orange-500/25 bg-[#080808] p-4 shadow-2xl shadow-black/60">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-orange-400">
              Actualizar datos
            </p>
            <h3 className="mt-1 text-lg font-black text-white">
              Peso y estatura
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving || analyzing}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-lg font-black text-white/60 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <div className="grid gap-3">
          <ModalMetricInput
            label="Peso actual"
            unit="kg"
            value={draft.peso_kg}
            placeholder="Ej: 98.9"
            onChange={(value) => setDraft((prev) => ({ ...prev, peso_kg: value }))}
          />

          <ModalMetricInput
            label="Estatura"
            unit="cm"
            value={draft.estatura_cm}
            placeholder="Ej: 170"
            onChange={(value) => setDraft((prev) => ({ ...prev, estatura_cm: value }))}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving || analyzing}
            className="h-11 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-black uppercase text-white/60 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={saving || analyzing}
            className="h-11 rounded-xl bg-orange-500 text-xs font-black uppercase text-black shadow-[0_0_24px_rgba(249,115,22,0.22)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalMetricInput({ label, unit, value, placeholder, onChange }) {
  return (
    <label className="block rounded-2xl border border-white/10 bg-black/45 p-3 focus-within:border-orange-500/45">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-white/45">
          {label}
        </span>
        <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-[9px] font-black uppercase text-orange-300">
          {unit}
        </span>
      </div>

      <input
        type="number"
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full border-none bg-transparent text-2xl font-black text-white outline-none placeholder:text-white/20"
      />
    </label>
  )
}

function formatBirthDate(value) {
  if (!value) return "No registrada"

  try {
    return new Intl.DateTimeFormat("es-EC", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(`${value}T00:00:00`))
  } catch (_error) {
    return String(value)
  }
}

export function RangoReferenciaCard({ referencia, hasReference }) {
  const imcInfo = getImcInfo(referencia?.imc)
  const diferenciaInfo = getDiferenciaInfo(referencia?.diferenciaRango)

  return (
    <article className="phoenix-nutrition-card relative z-10 mb-3 overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/45 p-3 shadow-2xl shadow-black/30">
      <CardTitle
        title="Rango saludable"
        subtitle="Referencia según estatura"
        right={<span className="rounded-xl border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-[10px] font-black uppercase text-orange-300">IMC</span>}
      />

      {!hasReference ? (
        <EmptyCard text="Ingresa peso y estatura para calcular tu rango de referencia, IMC y diferencia." />
      ) : (
        <>
          <div className="phoenix-nutrition-highlight rounded-[1.15rem] border border-orange-500/20 bg-orange-500/10 p-3 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-orange-300">
              Rango estimado
            </p>
            <p className="mt-2 text-xl font-black leading-none text-white sm:text-2xl">
              {numberText(referencia.pesoMin)} - {numberText(referencia.pesoMax)} kg
            </p>
            <p className="mt-1 text-[10px] font-bold text-white/45">
              (IMC saludable: 18.5 - 24.9)
            </p>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="phoenix-nutrition-mini-card rounded-2xl border border-white/10 bg-black/35 p-3 text-center">
              <p className="text-[9px] font-black uppercase text-white/40">IMC actual</p>
              <p className="mt-1 text-lg font-black leading-none text-orange-400">
                {numberText(referencia.imc)}
              </p>
              <p className={["mt-1 text-[10px] font-black uppercase", imcInfo.color].join(" ")}> 
                {imcInfo.label}
              </p>
            </div>

            <div className="phoenix-nutrition-mini-card rounded-2xl border border-white/10 bg-black/35 p-3 text-center">
              <p className="text-[9px] font-black uppercase text-white/40">Diferencia</p>
              <p className="mt-1 text-lg font-black leading-none text-orange-400">
                {diferenciaInfo.value}
              </p>
              <p className={["mt-1 text-[10px] font-black uppercase", diferenciaInfo.color].join(" ")}> 
                {diferenciaInfo.label}
              </p>
            </div>
          </div>

          <p className="mt-3 text-[11px] leading-4 text-white/45">
            El rango es una referencia. En atletas funcionales también se analiza rendimiento,
            fuerza, calorías, PRs y evolución mensual.
          </p>
        </>
      )}
    </article>
  )
}

function getImcInfo(imc) {
  const value = Number(imc)

  if (!value || Number.isNaN(value)) {
    return {
      label: "Sin dato",
      color: "text-white/35",
    }
  }

  if (value < 18.5) {
    return {
      label: "Bajo peso",
      color: "text-sky-300",
    }
  }

  if (value < 25) {
    return {
      label: "Peso normal",
      color: "text-emerald-300",
    }
  }

  if (value < 30) {
    return {
      label: "Sobrepeso",
      color: "text-yellow-300",
    }
  }

  if (value < 35) {
    return {
      label: "Obesidad nivel I",
      color: "text-orange-300",
    }
  }

  if (value < 40) {
    return {
      label: "Obesidad nivel II",
      color: "text-red-300",
    }
  }

  return {
    label: "Obesidad nivel III",
    color: "text-red-400",
  }
}

function getDiferenciaInfo(diferencia) {
  const value = Number(diferencia)

  if (diferencia === null || diferencia === undefined || Number.isNaN(value)) {
    return {
      value: "--",
      label: "Sin dato",
      color: "text-white/35",
    }
  }

  if (value === 0) {
    return {
      value: "En rango",
      label: "Peso dentro del rango",
      color: "text-emerald-300",
    }
  }

  if (value > 0) {
    return {
      value: `+${numberText(value)} kg`,
      label: "Sobre límite superior",
      color: "text-orange-300",
    }
  }

  return {
    value: `${numberText(Math.abs(value))} kg`,
    label: "Bajo límite inferior",
    color: "text-sky-300",
  }
}

export function Resumen30DiasCard({ resumenWods, resumenPrs }) {
  const wods = Number(resumenWods?.wods30Dias || 0)
  const calorias = Number(resumenWods?.calorias30Dias || 0)
  const diasEntrenados = Number(resumenWods?.diasEntrenados30Dias || 0)
  const diasSemana = diasEntrenados > 0 ? diasEntrenados / 4 : 0
  const prs = Number(resumenPrs?.prs30Dias || 0)

  return (
    <article className="phoenix-nutrition-card relative z-10 mb-3 overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/45 p-3 shadow-2xl shadow-black/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_15%,rgba(249,115,22,0.12),transparent_42%)]" />

      <div className="relative z-10">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-orange-500/25 bg-orange-500/10 text-sm text-orange-400">
            🗓️
          </span>
          <p className="truncate text-[12px] font-black uppercase tracking-[0.12em] text-white/80">
            Resumen últimos 30 días
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          <ResumenMetricItem
            icon="🏋️"
            value={formatCompactNumber(wods)}
            label="WODs"
            sublabel="completados"
          />

          <ResumenMetricItem
            icon="🔥"
            value={formatCompactNumber(calorias)}
            label="Calorías"
            sublabel="totales"
          />

          <ResumenMetricItem
            icon="🗓️"
            value={diasSemana ? numberText(diasSemana, 1) : "0"}
            label="Días por"
            sublabel="semana"
          />

          <ResumenMetricItem
            icon="🏆"
            value={formatCompactNumber(prs)}
            label="PRs"
            sublabel="alcanzados"
          />
        </div>
      </div>
    </article>
  )
}

function ResumenMetricItem({ icon, value, label, sublabel }) {
  return (
    <div className="phoenix-nutrition-mini-card flex min-h-[72px] items-center gap-3 rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center text-2xl text-orange-400">
        {icon}
      </span>

      <div className="min-w-0 flex-1 text-center">
        <p className="text-xl font-black leading-none text-white">
          {value}
        </p>
        <p className="mt-1 text-[11px] font-medium leading-3 text-white/55">
          {label}
        </p>
        <p className="text-[11px] font-medium leading-3 text-white/55">
          {sublabel}
        </p>
      </div>
    </div>
  )
}

function formatCompactNumber(value) {
  const number = Number(value || 0)

  if (!Number.isFinite(number)) return "0"

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(number)
}

export function AnalisisMensualCard({
  ultimoAnalisis,
  puedeAnalizar,
  diasParaAnalizar,
  proximoAnalisis,
  analyzing,
  saving,
  onAnalizar,
}) {
  return (
    <article className="phoenix-nutrition-card relative z-10 mb-3 overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/45 p-3 shadow-2xl shadow-black/30">
      <CardTitle title="Análisis mensual" subtitle="Se genera cada 30 días" />

      <div className="grid grid-cols-2 gap-2">
        <HeroInfo icon="🕒" label="Último" value={formatDate(ultimoAnalisis?.fecha_analisis)} />
        <HeroInfo icon="⏭" label="Próximo" value={formatDate(proximoAnalisis)} accent />
      </div>

      {!puedeAnalizar ? (
        <div className="mt-3 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-3 text-xs font-bold text-orange-100">
          Faltan <span className="font-black text-orange-300">{diasParaAnalizar}</span> días para un nuevo análisis.
        </div>
      ) : null}

      <button
        type="button"
        onClick={onAnalizar}
        disabled={!puedeAnalizar || analyzing || saving}
        className={[
          "mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-center text-xs font-black uppercase leading-4 shadow-[0_0_24px_rgba(249,115,22,0.25)] disabled:cursor-not-allowed",
          puedeAnalizar
            ? "bg-orange-500 text-black"
            : "border border-white/10 bg-white/[0.04] text-white/45",
        ].join(" ")}
      >
        <span>{analyzing ? "⏳" : "🤖"}</span>
        {analyzing ? "Analizando con IA..." : "Analizar con IA"}
      </button>
    </article>
  )
}

export function RecomendacionIACard({ analisis, metaLabel }) {
  return (
    <section className="phoenix-nutrition-card phoenix-nutrition-ai-card relative z-10 mb-3 overflow-hidden rounded-[1.25rem] border border-orange-500/20 bg-black/45 p-3 shadow-2xl shadow-black/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(249,115,22,0.16),transparent_38%)]" />
      <div className="relative z-10">
        <CardTitle
          title="Recomendación IA"
          subtitle={metaLabel || "Sin meta definida"}
          right={<span className="rounded-xl border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-[10px] font-black uppercase text-orange-300">IA</span>}
        />

        {!analisis ? (
          <EmptyCard text="Todavía no tienes análisis. Guarda tus datos y presiona Analizar con IA." />
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            <AnalysisBlock title="Resumen" text={analisis.resumen} />
            <AnalysisBlock title="Diagnóstico" text={analisis.diagnostico} />
            <AnalysisBlock title="Nutrición" text={analisis.nutricion} />
            <AnalysisBlock title="Entrenamiento" text={analisis.entrenamiento} />
            <AnalysisBlock title="Pre WOD" text={analisis.pre_wod} />
            <AnalysisBlock title="Post WOD" text={analisis.post_wod} />
            <AnalysisBlock title="Hidratación" text={analisis.hidratacion} />
            <AnalysisBlock title="Descanso" text={analisis.descanso} />

            <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.14em] text-orange-400">
                Alerta profesional
              </p>
              <p className="text-xs leading-5 text-white/55">
                {analisis.alerta || "Este análisis es orientativo y no reemplaza consulta profesional."}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function AnalysisBlock({ title, text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="mb-1 text-[10px] font-black uppercase tracking-[0.14em] text-orange-400">
        {title}
      </p>
      <p className="text-xs leading-5 text-white/60">
        {text || "Sin información registrada."}
      </p>
    </div>
  )
}

export function EvolucionNutricionCard({ historial }) {
  const rows = normalizeEvolutionRows(historial)
  const hasRows = rows.length > 0
  const chart = buildEvolutionChart(rows)
  const latestKey = rows[rows.length - 1]?.id || rows[rows.length - 1]?.fecha_analisis

  return (
    <article className="phoenix-nutrition-card relative z-10 mb-3 overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/45 p-3 shadow-2xl shadow-black/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_12%,rgba(249,115,22,0.10),transparent_42%)]" />

      <div className="relative z-10">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-orange-500/25 bg-orange-500/10 text-sm text-orange-400">
            📈
          </span>
          <p className="truncate text-[12px] font-black uppercase tracking-[0.12em] text-white/80">
            Evolución
          </p>
        </div>

        {!hasRows ? (
          <EmptyCard text="Cuando generes análisis mensuales, aparecerá tu evolución con peso e IMC." />
        ) : (
          <>
            <div className="mb-2 grid grid-cols-2 gap-x-4 gap-y-1 text-center sm:flex sm:items-center sm:justify-center sm:gap-4">
              <EvolutionLegend color="bg-orange-500" label="Peso" />
              <EvolutionLegend color="bg-lime-500" label="IMC" />
              <EvolutionLegend color="bg-orange-300" label="Límite peso" dashed />
              <EvolutionLegend color="bg-sky-400" label="Límite IMC" dashed />
            </div>

            <div className="overflow-hidden rounded-[1.05rem] border border-white/10 bg-black/25 px-2 py-2">
              <svg viewBox="0 0 320 190" className="h-[190px] w-full overflow-visible">
                <text x="5" y="22" className="fill-white/55 text-[10px] font-bold">
                  Peso (kg)
                </text>
                <text x="296" y="22" textAnchor="end" className="fill-white/55 text-[10px] font-bold">
                  IMC
                </text>

                {chart.weightTicks.map((tick) => {
                  const y = chart.yWeight(tick)

                  return (
                    <g key={`weight-tick-${tick}`}>
                      <line
                        x1="38"
                        x2="286"
                        y1={y}
                        y2={y}
                        stroke="rgba(255,255,255,0.10)"
                        strokeWidth="1"
                      />
                      <text x="13" y={y + 4} className="fill-white/55 text-[10px] font-bold">
                        {tick}
                      </text>
                    </g>
                  )
                })}

                {chart.imcTicks.map((tick) => {
                  const y = chart.yImc(tick)

                  return (
                    <text
                      key={`imc-tick-${tick}`}
                      x="296"
                      y={y + 4}
                      className="fill-white/55 text-[10px] font-bold"
                    >
                      {tick}
                    </text>
                  )
                })}

                <line x1="38" x2="286" y1="35" y2="35" stroke="rgba(255,255,255,0.08)" />
                <line x1="38" x2="286" y1="145" y2="145" stroke="rgba(255,255,255,0.08)" />
                <line x1="38" x2="38" y1="35" y2="145" stroke="rgba(255,255,255,0.08)" />
                <line x1="286" x2="286" y1="35" y2="145" stroke="rgba(255,255,255,0.08)" />

                {chart.weightLimitPoints.length > 1 ? (
                  <polyline
                    points={chart.weightLimitPoints.map((point) => `${point.x},${point.y}`).join(" ")}
                    fill="none"
                    stroke="#fdba74"
                    strokeWidth="2.5"
                    strokeDasharray="6 5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null}

                {chart.imcLimitPoints.length > 1 ? (
                  <polyline
                    points={chart.imcLimitPoints.map((point) => `${point.x},${point.y}`).join(" ")}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeDasharray="6 5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null}

                {chart.weightPoints.length > 1 ? (
                  <polyline
                    points={chart.weightPoints.map((point) => `${point.x},${point.y}`).join(" ")}
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null}

                {chart.imcPoints.length > 1 ? (
                  <polyline
                    points={chart.imcPoints.map((point) => `${point.x},${point.y}`).join(" ")}
                    fill="none"
                    stroke="#84cc16"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null}

                {chart.weightPoints.map((point) => (
                  <g key={`weight-${point.key}`}>
                    <circle cx={point.x} cy={point.y} r="5" fill="#f97316" />
                    <text
                      x={point.x}
                      y={point.y - 10}
                      textAnchor="middle"
                      className="fill-white text-[10px] font-black"
                    >
                      {point.label}
                    </text>
                  </g>
                ))}

                {chart.imcPoints.map((point) => (
                  <g key={`imc-${point.key}`}>
                    <circle cx={point.x} cy={point.y} r="5" fill="#84cc16" />
                    <text
                      x={point.x}
                      y={point.y + 18}
                      textAnchor="middle"
                      className="fill-white text-[10px] font-black"
                    >
                      {point.label}
                    </text>
                  </g>
                ))}

                {chart.limitLabels.map((label) => (
                  <text
                    key={label.key}
                    x="282"
                    y={label.y - 4}
                    textAnchor="end"
                    className={label.className}
                  >
                    {label.text}
                  </text>
                ))}

                {chart.xLabels.map((label) => (
                  <text
                    key={`month-${label.key}`}
                    x={label.x}
                    y="172"
                    textAnchor="middle"
                    className="fill-white/65 text-[10px] font-bold"
                  >
                    {label.text}
                  </text>
                ))}
              </svg>
            </div>

            <div className="mt-3 overflow-hidden rounded-[1.05rem] border border-white/10 bg-black/25">
              <div className="grid grid-cols-[minmax(0,1fr)_76px_58px] border-b border-white/10 px-2.5 py-2 text-[9px] font-black uppercase tracking-[0.10em] text-white/40">
                <span>Mes</span>
                <span className="text-center">Peso (kg)</span>
                <span className="text-right">IMC</span>
              </div>

              <div className="divide-y divide-white/10">
                {rows.map((item) => {
                  const key = item.id || item.fecha_analisis
                  const active = key === latestKey

                  return (
                    <div
                      key={key}
                      className={[
                        "grid grid-cols-[minmax(0,1fr)_76px_58px] items-center px-2.5 py-1.5 text-[11px] font-bold",
                        active ? "text-orange-400" : "text-white/60",
                      ].join(" ")}
                    >
                      <span className="truncate">{formatMonthFull(item.fecha_analisis)}</span>
                      <span className="text-center font-black">{numberText(item.peso_kg)}</span>
                      <span className="text-right font-black">{numberText(item.imc)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </article>
  )
}

function EvolutionLegend({ color, label, dashed = false }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      <span className={["h-1 w-7 rounded-full", color, dashed ? "opacity-80" : ""].join(" ")} />
      <span className="text-[10px] font-bold text-white/75">{label}</span>
    </div>
  )
}

function normalizeEvolutionRows(historial = []) {
  return [...(historial || [])]
    .filter((item) => item?.fecha_analisis)
    .slice(0, 5)
    .reverse()
    .map((item) => ({
      ...item,
      imc: getRowImc(item),
      peso_limite_superior: getRowPesoLimiteSuperior(item),
    }))
}

function getRowImc(item) {
  const savedImc = Number(item?.imc || 0)

  if (savedImc > 0) return savedImc

  const peso = Number(item?.peso_kg || 0)
  const estaturaM = Number(item?.estatura_cm || 0) / 100

  if (!peso || !estaturaM) return null

  return peso / (estaturaM * estaturaM)
}

function getRowPesoLimiteSuperior(item) {
  const savedLimit = Number(item?.peso_referencia_max || 0)

  if (savedLimit > 0) return savedLimit

  const estaturaM = Number(item?.estatura_cm || 0) / 100

  if (!estaturaM) return null

  return 24.9 * estaturaM * estaturaM
}

function buildEvolutionChart(rows = []) {
  const left = 38
  const right = 286
  const top = 35
  const bottom = 145
  const width = right - left
  const height = bottom - top
  const count = Math.max(rows.length - 1, 1)

  const weights = rows.map((item) => Number(item.peso_kg || 0)).filter((value) => value > 0)
  const weightLimits = rows
    .map((item) => Number(item.peso_limite_superior || 0))
    .filter((value) => value > 0)
  const imcs = rows.map((item) => Number(item.imc || 0)).filter((value) => value > 0)

  const weightValues = [...weights, ...weightLimits]
  const rawWeightMin = weightValues.length ? Math.min(...weightValues) : 50
  const rawWeightMax = weightValues.length ? Math.max(...weightValues) : 100
  const weightMin = Math.floor((rawWeightMin - 2) / 5) * 5
  const weightMax = Math.ceil((rawWeightMax + 2) / 5) * 5
  const safeWeightMax = weightMax <= weightMin ? weightMin + 10 : weightMax

  const imcValues = [...imcs, 24.9]
  const rawImcMin = imcValues.length ? Math.min(...imcValues) : 18.5
  const rawImcMax = imcValues.length ? Math.max(...imcValues) : 30
  const imcMin = Math.max(0, Math.floor((rawImcMin - 2) / 5) * 5)
  const imcMax = Math.ceil((rawImcMax + 2) / 5) * 5
  const safeImcMax = imcMax <= imcMin ? imcMin + 10 : imcMax

  const yWeight = (value) => {
    const n = Number(value || 0)
    return bottom - ((n - weightMin) / (safeWeightMax - weightMin)) * height
  }

  const yImc = (value) => {
    const n = Number(value || 0)
    return bottom - ((n - imcMin) / (safeImcMax - imcMin)) * height
  }

  const weightTicks = buildNumericTicks(weightMin, safeWeightMax, 4, 0)
  const imcTicks = buildNumericTicks(imcMin, safeImcMax, 4, 0)

  const weightPoints = rows.map((item, index) => {
    const x = left + (width / count) * index
    const value = Number(item.peso_kg || 0)

    return {
      key: item.id || `${item.fecha_analisis}-weight`,
      x,
      y: yWeight(value),
      label: numberText(value),
    }
  })

  const imcPoints = rows.map((item, index) => {
    const x = left + (width / count) * index
    const value = Number(item.imc || 0)

    return {
      key: item.id || `${item.fecha_analisis}-imc`,
      x,
      y: yImc(value),
      label: numberText(value),
    }
  })

  const weightLimitPoints = rows
    .map((item, index) => {
      const value = Number(item.peso_limite_superior || 0)

      if (!value) return null

      return {
        key: item.id || `${item.fecha_analisis}-weight-limit`,
        x: left + (width / count) * index,
        y: yWeight(value),
        label: numberText(value),
      }
    })
    .filter(Boolean)

  const imcLimitPoints = rows.map((item, index) => ({
    key: item.id || `${item.fecha_analisis}-imc-limit`,
    x: left + (width / count) * index,
    y: yImc(24.9),
    label: "24.9",
  }))

  const xLabels = rows.map((item, index) => ({
    key: item.id || `${item.fecha_analisis}-label`,
    x: left + (width / count) * index,
    text: formatMonthShort(item.fecha_analisis),
  }))

  const lastWeightLimit = weightLimitPoints[weightLimitPoints.length - 1]
  const lastImcLimit = imcLimitPoints[imcLimitPoints.length - 1]
  const limitLabels = []

  if (lastWeightLimit) {
    limitLabels.push({
      key: "weight-limit-label",
      y: lastWeightLimit.y,
      text: `Peso ref. ${lastWeightLimit.label}`,
      className: "fill-orange-200 text-[8px] font-black",
    })
  }

  if (lastImcLimit) {
    limitLabels.push({
      key: "imc-limit-label",
      y: lastImcLimit.y,
      text: "IMC 24.9",
      className: "fill-sky-300 text-[8px] font-black",
    })
  }

  return {
    weightTicks,
    imcTicks,
    weightPoints,
    imcPoints,
    weightLimitPoints,
    imcLimitPoints,
    limitLabels,
    xLabels,
    yWeight,
    yImc,
  }
}

function buildNumericTicks(min, max, steps = 4, decimals = 0) {
  const ticks = []
  const step = (max - min) / steps

  for (let index = steps; index >= 0; index--) {
    const value = min + step * index
    ticks.push(Number(value.toFixed(decimals)))
  }

  return ticks
}

function formatMonthShort(fecha) {
  if (!fecha) return "Mes"

  try {
    const date = new Date(`${fecha}T00:00:00`)
    const month = new Intl.DateTimeFormat("es-EC", { month: "short" })
      .format(date)
      .replace(".", "")

    return month.charAt(0).toUpperCase() + month.slice(1)
  } catch (_error) {
    return "Mes"
  }
}

function formatMonthFull(fecha) {
  if (!fecha) return "Sin fecha"

  try {
    const date = new Date(`${fecha}T00:00:00`)
    const month = new Intl.DateTimeFormat("es-EC", { month: "long" }).format(date)
    const year = date.getFullYear()
    const label = month.charAt(0).toUpperCase() + month.slice(1)

    return `${label} ${year}`
  } catch (_error) {
    return String(fecha)
  }
}


export function HistorialAnalisisCard({ historial, metasLabels }) {
  return (
    <article className="phoenix-nutrition-card relative z-10 mb-4 overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/45 p-3 shadow-2xl shadow-black/30">
      <CardTitle
        title="Historial"
        subtitle="Últimos análisis"
        right={<span className="rounded-xl border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-[10px] font-black uppercase text-orange-300">{historial?.length || 0}</span>}
      />

      {!historial?.length ? (
        <EmptyCard text="Aún no tienes análisis guardados." />
      ) : (
        <div className="phoenix-nutrition-table overflow-hidden rounded-[1.05rem] border border-white/10 bg-black/35">
          <div className="divide-y divide-white/10">
            {historial.slice(0, 5).map((item) => (
              <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_58px_16px] items-center gap-2 px-2.5 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-black uppercase leading-tight text-white">
                    {metasLabels?.[item.meta] || item.meta || "Análisis"}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] font-bold text-white/40">
                    {formatDate(item.fecha_analisis)} · {numberText(item.peso_kg)} kg
                  </p>
                </div>

                <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-1 text-center text-[9px] font-black uppercase text-orange-300">
                  {item.score_pho3nix || 0}/100
                </span>

                <span className="text-lg font-black text-white/35">›</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}
