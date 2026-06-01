export default function AlumnoTopBar({
  name,
  initials,
  email,
  membership,
  loading,
}) {
  return (
    <header className="grid gap-4 xl:grid-cols-[1fr_auto_auto]">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
          Hola, {loading ? "..." : firstName(name)}{" "}
          <span className="text-orange-500">⚡</span>
        </h1>

        <p className="mt-2 text-base text-white/65">
          Cada entrenamiento te acerca a tu{" "}
          <span className="font-bold text-orange-400">mejor versión</span>.
        </p>
      </div>

      <div className="rounded-[1.7rem] border border-white/10 bg-black/45 p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-orange-500/25 bg-orange-500/10 text-lg font-black text-orange-300">
            {initials}
          </div>

          <div className="min-w-0">
            <p className="truncate text-base font-black text-white">
              {loading ? "Cargando..." : name}
            </p>

            <p className="mt-1 truncate text-sm font-bold text-orange-400">
              Nivel Phoenix
            </p>

            <p className="mt-1 truncate text-xs text-white/45">
              {email || "Alumno PHO3NIX"}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[1.7rem] border border-white/10 bg-black/45 p-4">
        <div className="flex items-center gap-3">
          <span
            className={[
              "flex h-9 w-9 items-center justify-center rounded-full",
              membership.status === "activa"
                ? "bg-emerald-500/15 text-emerald-300"
                : membership.status === "por_vencer"
                ? "bg-amber-500/15 text-amber-300"
                : "bg-red-500/15 text-red-300",
            ].join(" ")}
          >
            ✓
          </span>

          <div>
            <p
              className={[
                "text-sm font-black uppercase",
                membership.status === "activa"
                  ? "text-emerald-300"
                  : membership.status === "por_vencer"
                  ? "text-amber-300"
                  : "text-red-300",
              ].join(" ")}
            >
              {membership.title}
            </p>

            <p className="mt-1 text-xs text-white/55">
              {membership.subtitle}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}

function firstName(name) {
  return String(name || "Alumno").trim().split(" ")[0] || "Alumno"
}