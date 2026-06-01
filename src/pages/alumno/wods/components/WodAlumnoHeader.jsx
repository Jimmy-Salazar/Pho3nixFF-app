export default function WodAlumnoHeader({
  loading,
  profile,
  initials,
  membership,
}) {
  return (
    <header className="grid min-w-0 w-full max-w-full shrink-0 gap-3 overflow-hidden xl:grid-cols-[minmax(0,1fr)_auto_auto]">
      <div className="min-w-0">
        <h1 className="truncate text-4xl font-black tracking-tight text-white md:text-5xl">
          WODs <span className="text-orange-500">🔥</span>
        </h1>

        <p className="mt-2 max-w-full text-sm text-white/60 md:text-base">
          Entérate de los entrenamientos del día, registra tu resultado y sigue tu progreso.
        </p>
      </div>

      <div className="min-w-0 rounded-[1.7rem] border border-white/10 bg-black/45 p-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-orange-500/25 bg-orange-500/10 text-lg font-black text-orange-300">
            {loading ? "..." : initials}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-black text-white">
              {loading ? "Cargando..." : profile?.nombre || "Alumno PHO3NIX"}
            </p>

            <p className="mt-1 truncate text-sm font-bold text-orange-400">
              Nivel Phoenix
            </p>

            <p className="mt-1 truncate text-xs text-white/45">
              {profile?.email || "Alumno PHO3NIX"}
            </p>
          </div>
        </div>
      </div>

      <div className="min-w-0 rounded-[1.7rem] border border-white/10 bg-black/45 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={[
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              membership.status === "activa"
                ? "bg-emerald-500/15 text-emerald-300"
                : membership.status === "por_vencer"
                ? "bg-amber-500/15 text-amber-300"
                : "bg-red-500/15 text-red-300",
            ].join(" ")}
          >
            ✓
          </span>

          <div className="min-w-0">
            <p
              className={[
                "truncate text-sm font-black uppercase",
                membership.status === "activa"
                  ? "text-emerald-300"
                  : membership.status === "por_vencer"
                  ? "text-amber-300"
                  : "text-red-300",
              ].join(" ")}
            >
              {membership.title}
            </p>

            <p className="mt-1 truncate text-xs text-white/55">
              {membership.subtitle}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
