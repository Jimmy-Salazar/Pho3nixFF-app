export default function AlertCard({
  icon,
  title,
  subtitle,
  badgeText,
  buttonText,
  onButton,
}) {
  return (
    <div className="relative overflow-hidden px-card px-card-hover p-5">
      <div className="px-shine" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 border border-white/10">
            <span className="text-xl">{icon}</span>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="text-xs text-slate-300">{subtitle}</p>
          </div>
        </div>

        {badgeText ? (
          <span className="rounded-full bg-emerald-500/15 border border-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
            {badgeText}
          </span>
        ) : null}
      </div>

      {buttonText ? (
        <div className="mt-4 flex items-center justify-end">
          <button
            type="button"
            onClick={onButton}
            className="rounded-xl bg-gradient-to-r from-rose-500/85 to-orange-500/70
                       px-4 py-2 text-sm font-semibold text-white
                       border border-white/10
                       shadow-[0_0_24px_rgba(255,90,80,0.25)]
                       hover:shadow-[0_0_32px_rgba(255,90,80,0.35)]
                       hover:brightness-110 transition"
          >
            {buttonText}
          </button>
        </div>
      ) : null}
    </div>
  )
}