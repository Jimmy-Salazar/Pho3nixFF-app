const toneClasses = {
  orange:
    "from-orange-500/20 to-orange-950/10 text-orange-400 border-orange-500/25",
  amber:
    "from-amber-500/20 to-orange-950/10 text-amber-300 border-amber-500/25",
  red: "from-red-500/20 to-red-950/10 text-red-300 border-red-500/25",
  gold:
    "from-yellow-500/20 to-orange-950/10 text-yellow-300 border-yellow-500/25",
}

export default function AlumnoStatCard({
  icon,
  label,
  value,
  footer,
  tone = "orange",
}) {
  const classes = toneClasses[tone] || toneClasses.orange

  return (
    <article
      className={[
        "relative min-h-[128px] min-w-0 w-full max-w-full overflow-hidden rounded-[1.35rem] border bg-gradient-to-b p-2.5 shadow-2xl shadow-black/30 sm:min-h-[170px] sm:rounded-[1.5rem] sm:p-4 xl:min-h-[255px] xl:rounded-[2rem] xl:p-5",
        classes,
      ].join(" ")}
    >
      <div className="absolute inset-x-4 bottom-0 h-px bg-current shadow-[0_0_22px_currentColor]" />

      <div className="flex h-full min-w-0 flex-col items-center justify-center text-center">
        <div className="text-2xl sm:text-3xl xl:text-4xl">{icon}</div>

        <div className="mt-2 max-w-full truncate text-3xl font-black text-white sm:mt-3 sm:text-4xl xl:mt-5 xl:text-5xl">
          {value}
        </div>

        <p className="mt-1 max-w-full text-[10px] font-black leading-tight text-white sm:mt-2 sm:text-xs xl:mt-3 xl:text-sm">
          {label}
        </p>

        <p className="mt-2 max-w-full truncate text-[10px] font-bold leading-tight text-current sm:mt-3 sm:text-[11px] xl:mt-4 xl:text-xs">
          {footer}
        </p>
      </div>
    </article>
  )
}