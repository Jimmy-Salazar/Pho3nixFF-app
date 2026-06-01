import { firstName } from "../utils/profileUtils"

export default function ProfileHero({ profile, initials, loading, membership, onEdit }) {
  return (
    <header className="relative overflow-hidden rounded-[2rem] border border-orange-500/20 bg-black/55 p-5 shadow-2xl shadow-black/35">
      <div className="pointer-events-none absolute -right-24 top-0 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />
      <div className="pointer-events-none absolute left-1/3 bottom-0 h-48 w-48 rounded-full bg-red-500/10 blur-3xl" />

      <div className="relative z-10 grid gap-4 md:grid-cols-[auto_1fr_auto] md:items-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-[1.7rem] border border-orange-500/30 bg-orange-500/10 text-2xl font-black text-orange-300 shadow-[0_0_30px_rgba(249,115,22,0.20)]">
          {profile.foto_url ? (
            <img
              src={profile.foto_url}
              alt={profile.nombre}
              className="h-full w-full rounded-[1.7rem] object-cover"
            />
          ) : (
            initials
          )}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-400">
            Perfil PHO3NIX
          </p>

          <h1 className="mt-2 truncate text-3xl font-black uppercase leading-none text-white md:text-5xl">
            {loading ? "Cargando..." : firstName(profile.nombre)}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
            Gestiona tu información, revisa tu membresía y mantén actualizado tu perfil de atleta.
          </p>
        </div>

        <div className="flex flex-col gap-2 md:items-end">
          <span
            className={[
              "rounded-2xl border px-4 py-2 text-xs font-black uppercase tracking-[0.14em]",
              membership.status === "activa"
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                : membership.status === "por_vencer"
                ? "border-amber-500/25 bg-amber-500/10 text-amber-300"
                : "border-red-500/25 bg-red-500/10 text-red-300",
            ].join(" ")}
          >
            {membership.title}
          </span>

          <button
            type="button"
            onClick={onEdit}
            className="rounded-2xl border border-orange-500/35 px-5 py-3 text-sm font-black uppercase text-orange-300 transition hover:bg-orange-500/10"
          >
            Editar perfil
          </button>
        </div>
      </div>
    </header>
  )
}
