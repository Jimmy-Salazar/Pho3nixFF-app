import { useMemo, useState } from "react"
import pho3nixLogo from "../../../../assets/pho3nix-login-logo.png"
import RegisterResultPanel from "../components/RegisterResultPanel"
import {
  extractWorkoutLines,
  formatDateLong,
  formatDateShort,
  formatKcal,
  formatModoRanking,
  formatResultValue,
} from "../utils/wodAlumnoUtils"

const DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"]

export default function WodAlumnoMobilePro({
  data,
  loading = false,
  saving = false,
  error = "",
  initials = "PH",
  onBack,
  onSaveResult,
}) {
  const [registerOpen, setRegisterOpen] = useState(false)
  const [selectedResult, setSelectedResult] = useState(null)

  const wod = data?.todayWod || null
  const workoutLines = extractWorkoutLines(wod?.descripcion)
  const currentUserId = data?.profile?.id
  const hasRegisteredToday = hasCurrentUserResultToday(
    data?.dayHistory || [],
    currentUserId
  )

  const calories = getCreatedWodCalories(wod, data?.estimatedCalories)

  const weekly = useMemo(() => {
    return normalizeWeek(data?.weeklyCalories, {
      currentUserId,
      dayHistory: data?.dayHistory || [],
      wod,
      calories,
    })
  }, [data?.weeklyCalories, data?.dayHistory, currentUserId, wod, calories])

  const recentResults = (data?.recentResults || []).filter((item) => {
    return item?.id && (item?.wod_id || item?.wod?.id) && hasRegisteredResultValue(item)
  })
  const wodType = formatModoRanking(wod?.modo_ranking)
  const wodDate = formatDateLong(wod?.fecha)

  return (
    <main className="h-[100dvh] w-screen max-w-full overflow-x-hidden overflow-y-auto bg-[#050505] pb-28 text-white lg:hidden">
      <div className="relative min-h-full w-full max-w-full overflow-x-hidden px-3 pt-3">
        <BackgroundOrbs />

        <header className="relative z-10 mb-3 flex items-center justify-between gap-3 border-b border-white/10 pb-2.5">
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-orange-500/25 bg-orange-500/10 text-lg text-orange-300"
            aria-label="Volver al dashboard"
          >
            ☰
          </button>

          <div className="flex min-w-0 items-center gap-2">
            <img
              src={pho3nixLogo}
              alt="PHO3NIX"
              className="h-8 w-8 shrink-0 object-contain drop-shadow-[0_0_16px_rgba(249,115,22,0.35)]"
            />

            <div className="min-w-0">
              <p className="truncate text-xl font-black tracking-[0.14em] text-white">
                PHO<span className="text-orange-500">3</span>NIX
              </p>
              <p className="truncate text-[8px] font-black uppercase tracking-[0.2em] text-orange-500">
                Functional Fitness
              </p>
            </div>
          </div>

          <Avatar
            loading={loading}
            initials={initials}
            fotoUrl={data?.profile?.foto_url}
            nombre={data?.profile?.nombre}
          />
        </header>

        <section className="relative z-10 mb-2 flex items-center justify-center">
          <h1 className="text-xl font-black uppercase tracking-[0.12em] text-white/85">
            WODs
          </h1>
        </section>

        {error ? (
          <div className="relative z-10 mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        ) : null}

        <section className="relative z-10 mb-3 overflow-hidden rounded-[1.35rem] border border-orange-500/25 bg-black/55 shadow-2xl shadow-black/50">
          <div className="absolute inset-0 bg-[url('/images/backWODCardAlumno.png')] bg-cover bg-center opacity-100" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_35%,rgba(249,115,22,0.24),transparent_70%),linear-gradient(90deg,#050505_0%,rgba(5,5,5,0.92)_52%,rgba(5,5,5,0.62)_100%)]" />
          <div className="absolute -right-20 top-14 h-64 w-64 rounded-full bg-orange-500/14 blur-3xl" />

          <div className="relative z-10 p-3.5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
              🗓️ WOD del día
            </p>

            <p className="mt-2 text-xs font-bold uppercase tracking-[0.08em] text-white/45">
              {loading ? "Cargando fecha..." : wodDate}
            </p>

            <h2 className="mt-1.5 text-3xl font-black uppercase leading-none tracking-tight text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.12)]">
              {loading ? "Cargando..." : wod?.nombre || "Sin WOD publicado"}
            </h2>

            <p className="mt-2 text-base font-black uppercase text-orange-500">
              {wod ? wodType : "Pendiente"}
            </p>

            <div className="mt-2.5 space-y-1 text-sm leading-5 text-white/75">
              {loading ? (
                <p>Cargando entrenamiento...</p>
              ) : wod ? (
                workoutLines.length ? (
                  workoutLines.slice(0, 7).map((line, index) => (
                    <p key={`${line}-${index}`} className="break-words">
                      {line}
                    </p>
                  ))
                ) : (
                  <p className="whitespace-pre-line break-words">
                    {wod.descripcion || "El coach aún no agregó descripción."}
                  </p>
                )
              ) : (
                <p>Cuando el coach publique el WOD del día, aparecerá aquí.</p>
              )}
            </div>

            <p className="mt-3 text-xs font-bold text-white/45">
              🔥 Escala según tu nivel
            </p>

            <button
              type="button"
              onClick={() => {
                if (!hasRegisteredToday) setRegisterOpen(true)
              }}
              disabled={hasRegisteredToday || !wod?.id || loading}
              className={[
                "mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl px-3 text-xs font-black uppercase shadow-[0_0_24px_rgba(249,115,22,0.25)] disabled:cursor-not-allowed",
                hasRegisteredToday
                  ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "bg-orange-500 text-black disabled:opacity-50",
              ].join(" ")}
            >
              <span className="text-base">{hasRegisteredToday ? "✓" : "✎"}</span>
              {hasRegisteredToday ? "Ya registraste resultado" : "Registrar resultado"}
            </button>
          </div>
        </section>

        <section className="relative z-10 mb-3 grid grid-cols-2 gap-2.5">
          <article className="relative min-h-[122px] overflow-hidden rounded-[1.2rem] border border-white/10 bg-black/45 p-3 shadow-2xl shadow-black/30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.20),transparent_50%)]" />

            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-black uppercase tracking-[0.1em] text-white/45">
                  Calorías del WOD
                </p>
                <span className="text-lg text-orange-400">🔥</span>
              </div>

              <div className="mt-5 text-center">
                <p className="text-4xl font-black leading-none text-orange-400">
                  {loading ? "..." : formatKcal(calories)}
                </p>
                <p className="mt-0.5 text-sm font-black uppercase tracking-[0.14em] text-white/60">
                  Cal
                </p>
              </div>
            </div>
          </article>

          <article className="relative min-h-[122px] overflow-hidden rounded-[1.2rem] border border-white/10 bg-black/45 p-3 shadow-2xl shadow-black/30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(249,115,22,0.15),transparent_36%)]" />

            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-black uppercase tracking-[0.1em] text-white/45">
                  Tu semana
                </p>
                <span className="text-lg text-white/45">▣</span>
              </div>

              <div className="mt-2.5 flex items-end gap-1.5">
                <p className="text-3xl font-black leading-none text-orange-400">
                  {loading ? "..." : formatKcal(weekly.total)}
                </p>
                <p className="pb-0.5 text-xs font-black uppercase text-white/45">
                  Cal
                </p>
              </div>

              <p className="mt-1 truncate text-[10px] text-white/45">
                Meta: {formatKcal(weekly.target)} CAL
              </p>

              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-orange-500"
                    style={{ width: `${weekly.percent}%` }}
                  />
                </div>
                <span className="text-[10px] font-black text-orange-400">
                  {weekly.percent}%
                </span>
              </div>

              <div className="mt-2.5 grid grid-cols-7 gap-0.5">
                {weekly.days.map((item, index) => {
                  const done = Number(item.calories || 0) > 0

                  return (
                    <div key={`${item.label}-${index}`} className="text-center">
                      <p className="text-[8px] font-black text-white/45">
                        {DAY_LABELS[index] || item.label}
                      </p>
                      <div
                        className={[
                          "mx-auto mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border text-[9px] font-black",
                          done
                            ? "border-orange-500 bg-orange-500 text-white"
                            : "border-white/25 bg-black/20 text-white/35",
                        ].join(" ")}
                      >
                        {done ? "✓" : ""}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </article>
        </section>

        <section className="relative z-10 mb-4 overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/45 p-3 shadow-2xl shadow-black/30">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-black uppercase tracking-[0.1em] text-white/70">
                Tus últimos resultados
              </p>
              <p className="mt-0.5 text-[10px] font-bold text-white/35">
                Solo WODs registrados
              </p>
            </div>

            <span className="shrink-0 rounded-xl border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-[10px] font-black uppercase text-orange-300">
              {recentResults.length}
            </span>
          </div>

          {loading ? (
            <Empty text="Cargando tus resultados..." />
          ) : recentResults.length === 0 ? (
            <Empty text="Cuando registres resultados, aparecerán aquí." />
          ) : (
            <div className="overflow-hidden rounded-[1.05rem] border border-white/10 bg-black/35">
              <div className="grid grid-cols-[minmax(0,1fr)_72px_58px_16px] items-center border-b border-white/10 bg-white/[0.04] px-2.5 py-2 text-[9px] font-black uppercase tracking-[0.12em] text-white/40">
                <span>WOD</span>
                <span className="text-center">Resultado</span>
                <span className="text-center">Cal</span>
                <span />
              </div>

              <div className="divide-y divide-white/10">
                {recentResults.slice(0, 4).map((item) => (
                  <RecentResultRow
                    key={item.id}
                    item={item}
                    onClick={() => setSelectedResult(item)}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {registerOpen && !hasRegisteredToday ? (
        <MobileModal
          title="Registrar resultado"
          onClose={() => {
            if (!saving) setRegisterOpen(false)
          }}
        >
          <RegisterResultPanel
            wod={wod}
            saving={saving}
            loading={loading}
            onSave={async (payload) => {
              await onSaveResult?.(payload)
              setRegisterOpen(false)
            }}
          />
        </MobileModal>
      ) : null}

      {selectedResult ? (
        <MobileModal
          title="Detalle del resultado"
          onClose={() => setSelectedResult(null)}
        >
          <ResultDetail result={selectedResult} />
        </MobileModal>
      ) : null}
    </main>
  )
}

function Avatar({ loading, initials, fotoUrl, nombre }) {
  if (!loading && fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={nombre || "Alumno"}
        className="h-9 w-9 shrink-0 rounded-full border border-orange-500/35 object-cover shadow-[0_0_20px_rgba(249,115,22,0.18)]"
      />
    )
  }

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-orange-500/35 bg-orange-500/10 text-[11px] font-black text-orange-300 shadow-[0_0_20px_rgba(249,115,22,0.18)]">
      {loading ? "..." : initials}
    </div>
  )
}

function RecentResultRow({ item, onClick }) {
  const date = formatDateShort(item.fecha || item.created_at)
  const result = formatResultValue(item)
  const kcal = Number(item.calorias || item.calorias_estimadas || item.calorias_wod || 0)
  const type = getResultType(item)

  return (
    <button
      type="button"
      onClick={onClick}
      className="grid w-full grid-cols-[minmax(0,1fr)_72px_58px_16px] items-center gap-2 px-2.5 py-2.5 text-left transition hover:bg-white/[0.03] active:bg-orange-500/10"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <WodResultIcon type={type} />

        <div className="min-w-0">
          <p className="truncate text-[11px] font-black uppercase leading-tight text-white">
            {item.wod_nombre || item.wod?.nombre || item.wod?.titulo || "WOD"}
          </p>

          <p className="mt-0.5 truncate text-[10px] font-bold text-white/40">
            {date.day || "--"} {date.month || ""} · {type.label}
          </p>
        </div>
      </div>

      <div className="shrink-0 text-center">
        <p className="text-xs font-black text-white">
          {result}
        </p>
        <p className="mt-0.5 text-[9px] font-bold text-white/35">
          {type.resultLabel}
        </p>
      </div>

      <div className="shrink-0 text-center">
        <p className="text-xs font-black text-orange-400">
          {kcal > 0 ? formatKcal(kcal) : "—"}
        </p>
        <p className="mt-0.5 text-[9px] font-bold text-white/35">
          Cal
        </p>
      </div>

      <span className="text-lg font-black text-white/35">›</span>
    </button>
  )
}

function WodResultIcon({ type }) {
  return (
    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-orange-500/20 bg-orange-500/10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(249,115,22,0.35),transparent_62%)]" />
      <span className="relative z-10 text-xl">
        {type.icon}
      </span>
    </div>
  )
}

function getResultType(item) {
  const raw =
    `${item?.wod_nombre || ""} ${item?.wod?.nombre || ""} ${item?.wod?.modo_ranking || ""} ${item?.modalidad || ""}`.toLowerCase()

  const hasTime =
    Number(item?.tiempo_segundos || 0) > 0 ||
    String(item?.tiempo_texto || "").trim().length > 0

  if (raw.includes("run") || raw.includes("endurance") || raw.includes("cardio")) {
    return {
      label: "Endurance",
      resultLabel: hasTime ? "Tiempo" : "Reps",
      icon: "👟",
    }
  }

  if (raw.includes("strength") || raw.includes("fuerza") || raw.includes("power")) {
    return {
      label: "Strength",
      resultLabel: hasTime ? "Tiempo" : "Reps",
      icon: "🏋️",
    }
  }

  if (raw.includes("amrap") || raw.includes("metcon")) {
    return {
      label: "AMRAP",
      resultLabel: hasTime ? "Tiempo" : "Reps",
      icon: "🔥",
    }
  }

  if (hasTime) {
    return {
      label: "For Time",
      resultLabel: "Tiempo",
      icon: "⏱️",
    }
  }

  return {
    label: "WOD",
    resultLabel: "Reps",
    icon: "🔥",
  }
}


function ResultDetail({ result }) {
  const wod = result?.wod || {}
  const workoutLines = extractWorkoutLines(wod?.descripcion)
  const date = formatDateLong(result?.fecha || wod?.fecha || result?.created_at)
  const resultValue = formatResultValue(result)
  const kcal = Number(result?.calorias || result?.calorias_estimadas || result?.calorias_wod || 0)

  return (
    <section className="grid gap-3">
      <article className="relative overflow-hidden rounded-[1.35rem] border border-orange-500/25 bg-black/55 p-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(249,115,22,0.22),transparent_36%)]" />

        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
            WOD registrado
          </p>

          <h3 className="mt-2 text-2xl font-black uppercase leading-none text-white">
            {result?.wod_nombre || wod?.nombre || "WOD PHO3NIX"}
          </h3>

          <p className="mt-2 text-xs font-bold uppercase text-white/45">
            {date}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <DetailTile label="Resultado" value={resultValue} />
            <DetailTile label="Modalidad" value={result?.modalidad || "RX"} />
            <DetailTile label="Calorías" value={kcal > 0 ? `${formatKcal(kcal)} CAL` : "—"} />
            <DetailTile label="Ranking" value={formatModoRanking(wod?.modo_ranking)} />
          </div>
        </div>
      </article>

      <article className="rounded-[1.25rem] border border-white/10 bg-black/45 p-4">
        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
          Workout
        </p>

        {workoutLines.length ? (
          <div className="space-y-1 text-sm leading-5 text-white/70">
            {workoutLines.map((line, index) => (
              <p key={`${line}-${index}`} className="break-words">
                {line}
              </p>
            ))}
          </div>
        ) : (
          <p className="whitespace-pre-line text-sm leading-5 text-white/55">
            {wod?.descripcion || "No hay descripción del WOD registrada."}
          </p>
        )}
      </article>

      {result?.notas || result?.observacion ? (
        <article className="rounded-[1.25rem] border border-white/10 bg-black/45 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
            Observación
          </p>
          <p className="mt-2 text-sm leading-5 text-white/65">
            {result.notas || result.observacion}
          </p>
        </article>
      ) : null}
    </section>
  )
}

function DetailTile({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/35">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black uppercase text-white">
        {value || "—"}
      </p>
    </div>
  )
}

function MobileModal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/88 p-4 backdrop-blur-2xl">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Cerrar"
      />

      <section className="relative z-10 flex max-h-[84dvh] w-full max-w-md flex-col overflow-hidden rounded-[1.6rem] border border-orange-500/25 bg-[#060606] shadow-[0_0_60px_rgba(249,115,22,0.20)]">
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-orange-400">
            {title}
          </p>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-black/55 text-lg text-white/70"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {children}
        </div>
      </section>
    </div>
  )
}

function Empty({ text }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-black/25 p-3 text-xs text-white/40">
      {text}
    </div>
  )
}

function hasRegisteredResultValue(item) {
  const hasTime =
    Number(item?.tiempo_segundos || 0) > 0 ||
    String(item?.tiempo_texto || "").trim().length > 0

  const hasReps = Number(item?.repeticiones || 0) > 0
  const hasOldResult =
    item?.resultado !== null &&
    item?.resultado !== undefined &&
    String(item?.resultado).trim() !== ""

  return hasTime || hasReps || hasOldResult
}

function BackgroundOrbs() {
  return (
    <>
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-orange-600/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-red-600/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />
    </>
  )
}

function getCreatedWodCalories(wod, estimatedCalories) {
  const maxCalories = Number(wod?.calorias_max || 0)

  if (maxCalories > 0) {
    return maxCalories
  }

  const directValue =
    wod?.calorias_wod ??
    wod?.calorias ??
    wod?.calorias_estimadas ??
    wod?.calorias_estimada ??
    wod?.kcal ??
    null

  if (directValue !== null && directValue !== undefined && Number(directValue) > 0) {
    return Number(directValue)
  }

  return Number(estimatedCalories?.value || 0)
}

function normalizeWeek(weeklyCalories, context = {}) {
  const target = Number(weeklyCalories?.target || 6000)
  const sourceDays = weeklyCalories?.days || []

  const days = DAY_LABELS.map((label, index) => ({
    label,
    calories: Number(sourceDays[index]?.calories || 0),
  }))

  const todayIndex = getTodayWeekIndex()
  const hasUserResultToday = hasCurrentUserResultToday(
    context.dayHistory || [],
    context.currentUserId
  )
  const wodCalories = Number(context.calories || 0)

  if (hasUserResultToday && wodCalories > 0 && Number(days[todayIndex]?.calories || 0) <= 0) {
    days[todayIndex] = {
      ...days[todayIndex],
      calories: wodCalories,
    }
  }

  const sumDays = days.reduce((sum, item) => sum + Number(item.calories || 0), 0)
  const total = sumDays
  const percent = target > 0 ? Math.min(Math.round((total / target) * 100), 100) : 0

  return {
    total,
    target,
    percent,
    days,
  }
}

function hasCurrentUserResultToday(rows = [], currentUserId) {
  if (!currentUserId) return false

  return rows.some((item) => {
    return (
      item.usuario_id === currentUserId ||
      item.usuario === currentUserId ||
      item.user_id === currentUserId
    )
  })
}

function getTodayWeekIndex() {
  const day = new Date().getDay()
  return day === 0 ? 6 : day - 1
}
