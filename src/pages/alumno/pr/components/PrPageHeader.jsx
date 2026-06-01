import { getInitials, firstName } from "../utils/prAlumnoUtils"

export default function PrPageHeader({ profile, membership, loading }) {
  const name = profile?.nombre || "Alumno PHO3NIX"
  const initials = getInitials(name)

  return (
    <header className="grid shrink-0 gap-3 xl:grid-cols-[1fr_auto_auto]">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
          Mis Personal Records <span className="text-orange-500">⚡</span>
        </h1>

        <p className="mt-2 text-base text-white/65">
          Supera tu <span className="font-bold text-orange-400">mejor versión</span>,{" "}
          {firstName(name)}. Un PR a la vez.
        </p>
      </div>

      <div className="rounded-[1.6rem] border border-white/10 bg-black/45 p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/10 text-lg font-black text-orange-300">
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
              {profile?.email || "Alumno PHO3NIX"}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[1.6rem] border border-white/10 bg-black/45 p-4">
        <div className="flex items-center gap-3">
          <span
            className={[
              "flex h-10 w-10 items-center justify-center rounded-full",
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
