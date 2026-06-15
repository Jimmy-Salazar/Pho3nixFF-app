import { adminNutricionUtils } from "../utils/adminNutricionService"

export function BackgroundOrbs() {
  return (
    <>
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-orange-600/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-red-600/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />
    </>
  )
}

export function SectionCard({ children, className = "" }) {
  return (
    <section
      className={[
        "relative overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/45 shadow-2xl shadow-black/30",
        className,
      ].join(" ")}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(249,115,22,0.09),transparent_36%)]" />
      <div className="relative z-10">{children}</div>
    </section>
  )
}

export function CardTitle({ icon = "▣", title, subtitle, right }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-orange-500/25 bg-orange-500/10 text-base text-orange-400">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-black uppercase tracking-[0.08em] text-white/85">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-0.5 truncate text-[11px] font-semibold text-white/35">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>

      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  )
}

export function StatCard({ icon, label, value, footer, accent = false }) {
  return (
    <SectionCard className="p-2.5 sm:p-4">
      <div className="flex items-start gap-2.5 sm:gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-orange-500/15 bg-orange-500/10 text-lg text-orange-400 sm:h-12 sm:w-12 sm:rounded-2xl sm:text-2xl">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[8.5px] font-black uppercase tracking-[0.1em] text-white/50 sm:text-[10px]">
            {label}
          </p>
          <p className="mt-1 text-xl font-black leading-none text-white sm:text-3xl">
            {value}
          </p>
          {footer ? (
            <p
              className={[
                "mt-1 truncate text-[10px] font-bold sm:text-xs",
                accent ? "text-lime-300" : "text-white/45",
              ].join(" ")}
            >
              {footer}
            </p>
          ) : null}
        </div>
      </div>
    </SectionCard>
  )
}

export function ScoreRing({ score = 0, size = 42 }) {
  const value = Math.max(0, Math.min(100, Number(score || 0)))
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <svg width={size} height={size} viewBox="0 0 44 44" className="shrink-0">
      <circle
        cx="22"
        cy="22"
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="5"
      />
      <circle
        cx="22"
        cy="22"
        r={radius}
        fill="none"
        stroke="rgb(249,115,22)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 22 22)"
      />
    </svg>
  )
}

export function Avatar({ item, size = "md" }) {
  const classes =
    size === "lg"
      ? "h-16 w-16 text-base"
      : size === "sm"
      ? "h-9 w-9 text-[11px]"
      : "h-11 w-11 text-xs"

  if (item?.foto_url) {
    return (
      <img
        src={item.foto_url}
        alt={item.nombre || "Atleta"}
        className={`${classes} shrink-0 rounded-full border border-orange-500/30 object-cover shadow-[0_0_18px_rgba(249,115,22,0.16)]`}
      />
    )
  }

  return (
    <div
      className={`${classes} flex shrink-0 items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/10 font-black text-orange-300 shadow-[0_0_18px_rgba(249,115,22,0.16)]`}
    >
      {adminNutricionUtils.getInitials(item?.nombre)}
    </div>
  )
}

export function MetaBadge({ meta, children, compact = false }) {
  const colors = adminNutricionUtils.getMetaColor(meta)

  return (
    <span
      className={[
        "inline-flex max-w-full items-center rounded-lg border font-black uppercase leading-none",
        compact ? "px-1.5 py-1 text-[8px]" : "px-2 py-1 text-[10px]",
        colors.label,
      ].join(" ")}
    >
      <span className="truncate">{children || adminNutricionUtils.getMetaLabel(meta)}</span>
    </span>
  )
}

export function SelectControl({ value, onChange, children, className = "" }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      className={[
        "h-10 rounded-xl border border-white/10 bg-black/55 px-3 text-xs font-bold text-white/75 outline-none transition focus:border-orange-500/45",
        className,
      ].join(" ")}
    >
      {children}
    </select>
  )
}

export function SearchInput({ value, onChange, placeholder = "Buscar atleta..." }) {
  return (
    <div className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-black/55 px-3">
      <span className="text-white/35">⌕</span>
      <input
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-xs font-bold text-white/80 outline-none placeholder:text-white/30"
      />
    </div>
  )
}

export function Alert({ type = "error", text }) {
  if (!text) return null

  const isError = type === "error"

  return (
    <div
      className={[
        "rounded-2xl border px-4 py-3 text-sm font-semibold",
        isError
          ? "border-red-500/30 bg-red-500/10 text-red-200"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
      ].join(" ")}
    >
      {text}
    </div>
  )
}

export function LoadingState({ text = "Cargando nutrición..." }) {
  return (
    <div className="flex min-h-[340px] flex-col items-center justify-center gap-3 text-white/55">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-orange-500" />
      <p className="text-sm font-bold">{text}</p>
    </div>
  )
}

export function EmptyState({ text = "Sin datos para mostrar." }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center text-sm font-semibold text-white/35">
      {text}
    </div>
  )
}

export function MobileModal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Cerrar modal"
      />

      <div className="relative z-10 max-h-[88dvh] w-full max-w-md overflow-hidden rounded-[1.45rem] border border-white/10 bg-[#080808] p-3 shadow-2xl shadow-black/60 sm:max-w-lg sm:rounded-[1.75rem] sm:p-4">
        <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2.5 sm:mb-4 sm:pb-3">
          <h3 className="text-sm font-black text-white sm:text-base">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-lg text-white/70 sm:h-9 sm:w-9 sm:text-xl"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
