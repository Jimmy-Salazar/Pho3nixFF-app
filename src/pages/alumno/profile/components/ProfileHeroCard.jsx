import { formatDateLong, getInitials, normalizeRole } from "../utils/profileUtils"

export default function ProfileHeroCard({ profile, memberSince, loading, onEdit }) {
  const role = normalizeRole(profile?.role)
  const initials = getInitials(profile?.nombre)

  return (
    <article className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 p-5 shadow-2xl shadow-black/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_40%,rgba(249,115,22,0.16),transparent_32%)]" />

      <div className="relative z-10 grid gap-5 md:grid-cols-[250px_1fr] md:items-center">
        <div className="flex justify-center md:justify-start">
          <div className="relative">
            {profile?.foto_url ? (
              <img
                src={profile.foto_url}
                alt={profile?.nombre || "Perfil PHO3NIX"}
                className="h-56 w-56 rounded-full border border-orange-500/35 object-cover shadow-[0_0_40px_rgba(249,115,22,0.16)]"
              />
            ) : (
              <div className="flex h-56 w-56 items-center justify-center rounded-full border border-orange-500/35 bg-orange-500/10 text-5xl font-black text-orange-300 shadow-[0_0_40px_rgba(249,115,22,0.16)]">
                {initials}
              </div>
            )}

            <button
              type="button"
              onClick={onEdit}
              className="absolute bottom-4 right-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/40 bg-black text-xl text-orange-300 transition hover:bg-orange-500/10"
              title="Editar información"
            >
              📷
            </button>
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="truncate text-4xl font-black text-white">
              {loading ? "Cargando..." : profile?.nombre || "Alumno PHO3NIX"}
            </h2>

            <span className="rounded-full border border-orange-500/35 bg-orange-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-orange-300">
              {role || "alumno"}
            </span>
          </div>

          <p className="mt-2 text-lg font-bold text-white/75">
            Nivel PHO3NIX
          </p>

          <div className="mt-5 grid gap-3 text-sm text-white/75 md:grid-cols-2">
            <InfoLine icon="✉️" label="Correo" value={profile?.email || "Sin correo"} />
            <InfoLine icon="📞" label="Teléfono" value={profile?.telefono || "Sin teléfono"} />
            <InfoLine icon="🪪" label="Cédula" value={profile?.cedula || "Sin cédula"} />
            <InfoLine
              icon="🎂"
              label="Fecha de nacimiento"
              value={profile?.fecha_nacimiento ? formatDateLong(profile.fecha_nacimiento) : "Sin fecha"}
            />
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/55">
            Miembro desde:{" "}
            <span className="font-bold text-white/80">
              {memberSince ? formatDateLong(memberSince) : "Sin fecha registrada"}
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}

function InfoLine({ icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-300">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
          {label}
        </p>
        <p className="truncate text-sm font-semibold text-white/80">
          {value}
        </p>
      </div>
    </div>
  )
}
