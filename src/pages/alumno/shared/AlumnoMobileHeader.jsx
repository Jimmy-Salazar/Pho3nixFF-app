import { supabase } from "../../../supabase"

export default function AlumnoMobileHeader({
  name,
  initials,
  email,
  membership,
  loading,
}) {
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Error cerrando sesión:", error)
    } finally {
      window.location.replace("/")
    }
  }

  return (
    <header className="w-full max-w-full overflow-hidden lg:hidden">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-500/30 bg-orange-500/10 text-xl">
            🦅
          </div>

          <div className="min-w-0">
            <p className="truncate text-xl font-black tracking-[0.2em] text-white">
              PHO<span className="text-orange-500">3</span>NIX
            </p>

            <p className="truncate text-[10px] font-black uppercase tracking-[0.28em] text-orange-500">
              Alumno
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex h-11 shrink-0 items-center gap-2 rounded-2xl border border-orange-500/25 bg-orange-500/10 px-3 text-xs font-black uppercase text-orange-300 transition hover:bg-orange-500/15"
        >
          <span className="text-base">↪</span>
          <span>Salir</span>
        </button>
      </div>

      <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-black leading-tight text-white">
            ¡Hola, {loading ? "..." : firstName(name)}! 👋
          </h1>

          <p className="mt-1 truncate text-sm text-white/55">
            Listo para dar lo mejor hoy.
          </p>
        </div>

        <div className="shrink-0">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-orange-500 bg-orange-500/10 text-xl font-black text-orange-300 shadow-[0_0_25px_rgba(249,115,22,0.25)]">
            {initials}
          </div>
        </div>
      </div>

      <div className="mb-4 grid w-full max-w-full grid-cols-2 gap-3 overflow-hidden">
        <div className="min-w-0 rounded-2xl border border-white/10 bg-black/45 p-3">
          <p className="truncate text-sm font-black text-white">
            {loading ? "Cargando..." : name}
          </p>

          <p className="mt-1 truncate text-xs font-bold text-orange-400">
            Nivel Phoenix
          </p>

          <p className="mt-1 truncate text-[11px] text-white/40">
            {email || "Alumno PHO3NIX"}
          </p>
        </div>

        <div className="min-w-0 rounded-2xl border border-white/10 bg-black/45 p-3">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={[
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm",
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
                  "truncate text-xs font-black uppercase",
                  membership.status === "activa"
                    ? "text-emerald-300"
                    : membership.status === "por_vencer"
                    ? "text-amber-300"
                    : "text-red-300",
                ].join(" ")}
              >
                {membership.title}
              </p>

              <p className="mt-1 truncate text-[11px] text-white/45">
                {membership.subtitle}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function firstName(name) {
  return String(name || "Alumno").trim().split(" ")[0] || "Alumno"
}