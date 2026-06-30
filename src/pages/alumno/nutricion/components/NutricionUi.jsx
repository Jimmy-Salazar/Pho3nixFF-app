export const METAS = [
  {
    id: "perder_grasa",
    titulo: "Perder grasa",
    texto: "Reducir grasa sin perder rendimiento.",
    icon: "🔥",
  },
  {
    id: "recomposicion",
    titulo: "Recomposición",
    texto: "Mantener peso y mejorar composición.",
    icon: "⚖️",
  },
  {
    id: "ganar_masa_muscular",
    titulo: "Ganar músculo",
    texto: "Subir masa cuidando recuperación.",
    icon: "💪",
  },
  {
    id: "mejorar_rendimiento",
    titulo: "Rendimiento",
    texto: "Mejorar WODs, fuerza y resistencia.",
    icon: "⚡",
  },
]

export function BackgroundOrbs() {
  return (
    <div className="phoenix-nutrition-orbs pointer-events-none absolute inset-0">
      <div className="phoenix-nutrition-orb phoenix-nutrition-orb-a absolute -left-32 top-0 h-96 w-96 rounded-full bg-orange-600/20 blur-3xl" />
      <div className="phoenix-nutrition-orb phoenix-nutrition-orb-b absolute right-0 top-0 h-96 w-96 rounded-full bg-red-600/10 blur-3xl" />
      <div className="phoenix-nutrition-orb phoenix-nutrition-orb-c absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />
    </div>
  )
}

export function Avatar({ loading, initials, fotoUrl, nombre }) {
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

export function Alert({ type = "error", text }) {
  if (!text) return null

  const isError = type === "error"

  return (
    <div
      className={[
        "relative z-10 mb-3 shrink-0 rounded-2xl border px-3 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm",
        isError
          ? "border-red-500/30 bg-red-500/10 text-red-200"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
      ].join(" ")}
    >
      {text}
    </div>
  )
}

export function FieldInput({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.08em] text-white/45">
        {label}
      </span>

      <input
        type={type}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-2xl border border-white/10 bg-black/50 px-3 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-orange-500/60"
      />
    </label>
  )
}

export function CardTitle({ title, subtitle, right }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-[11px] font-black uppercase tracking-[0.14em] text-white/70">
          {title}
        </p>
        {subtitle ? (
          <p className="mt-0.5 truncate text-[10px] font-bold text-white/35">
            {subtitle}
          </p>
        ) : null}
      </div>

      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  )
}

export function EmptyCard({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-black/25 p-3 text-xs text-white/40">
      {text}
    </div>
  )
}

export function HeroInfo({ icon, label, value, accent = false }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/35">
        {icon} {label}
      </p>
      <p
        className={[
          "mt-1 truncate text-xs font-black uppercase",
          accent ? "text-orange-400" : "text-white/75",
        ].join(" ")}
      >
        {value || "--"}
      </p>
    </div>
  )
}

export function MetricCard({ title, value, footer, icon }) {
  return (
    <article className="phoenix-nutrition-metric-card relative min-h-[112px] overflow-hidden rounded-[1.2rem] border border-white/10 bg-black/45 p-3 shadow-2xl shadow-black/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(249,115,22,0.15),transparent_36%)]" />

      <div className="relative z-10">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[9px] font-black uppercase tracking-[0.1em] text-white/45">
            {title}
          </p>
          <span className="text-lg text-orange-400">{icon}</span>
        </div>

        <p className="mt-4 truncate text-2xl font-black uppercase leading-none text-orange-400">
          {value}
        </p>

        <p className="mt-2 truncate text-[10px] text-white/45">{footer}</p>
      </div>
    </article>
  )
}

export function GoalSelector({
  meta,
  onChange,
  locked = false,
  diasParaAnalizar = 0,
  proximoAnalisis = null,
}) {
  const selectedMeta = METAS.find((item) => item.id === meta) || METAS[0]
  const visibleMetas = locked ? [selectedMeta] : METAS

  return (
    <section className="phoenix-nutrition-card phoenix-nutrition-goals relative z-10 mb-3 overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/45 p-3 shadow-2xl shadow-black/30">
      <CardTitle
        title="Meta principal"
        subtitle={
          locked
            ? "Meta bloqueada hasta el próximo análisis"
            : "Escoge el enfoque del mes"
        }
        right={
          locked ? (
            <span className="rounded-full border border-orange-500/25 bg-orange-500/10 px-2.5 py-1 text-[9px] font-black uppercase text-orange-300">
              Mes activo
            </span>
          ) : null
        }
      />

      <div
        className={[
          "grid gap-2",
          locked ? "grid-cols-1" : "grid-cols-2 md:grid-cols-4",
        ].join(" ")}
      >
        {visibleMetas.map((item) => {
          const active = item.id === meta

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (!locked) onChange(item.id)
              }}
              disabled={locked}
              className={[
                "rounded-2xl border p-3 text-left transition active:scale-[0.99]",
                locked ? "min-h-[86px] cursor-default" : "min-h-[92px]",
                active
                  ? "border-orange-500/45 bg-orange-500/15 shadow-[0_0_18px_rgba(249,115,22,0.16)]"
                  : "border-white/10 bg-white/[0.03] hover:border-orange-500/25 hover:bg-orange-500/10",
              ].join(" ")}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-lg">{item.icon}</span>
                {active ? (
                  <span className="rounded-full border border-orange-500/25 bg-orange-500/10 px-2 py-0.5 text-[9px] font-black uppercase text-orange-300">
                    Elegida
                  </span>
                ) : null}
              </div>

              <p className="text-[11px] font-black uppercase leading-tight text-white">
                {item.titulo}
              </p>
              <p className="mt-1 text-[10px] leading-4 text-white/45">
                {item.texto}
              </p>
            </button>
          )
        })}
      </div>

      {locked ? (
        <div className="mt-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] font-bold leading-4 text-white/45">
          Esta meta queda fija durante el ciclo actual. Podrás cambiarla cuando
          se active el próximo análisis
          {diasParaAnalizar > 0 ? ` en ${diasParaAnalizar} día(s)` : ""}
          {proximoAnalisis ? ` (${formatDate(proximoAnalisis)})` : ""}.
        </div>
      ) : null}
    </section>
  )
}

export function formatDate(fecha) {
  if (!fecha) return "Sin fecha"

  try {
    return new Intl.DateTimeFormat("es-EC", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(`${fecha}T00:00:00`))
  } catch (_error) {
    return String(fecha)
  }
}

export function numberText(value, decimals = 1) {
  if (value === null || value === undefined || value === "") return "--"
  const n = Number(value)
  if (Number.isNaN(n)) return "--"
  return n.toFixed(decimals)
}

export function getInitials(name) {
  const parts = String(name || "PH")
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) return "PH"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()

  return `${parts[0][0] || "P"}${parts[1][0] || "H"}`.toUpperCase()
}
