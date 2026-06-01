import { formatDateLong, getAge } from "../utils/profileUtils"

export default function ProfileInfoCard({ profile, loading, onEdit }) {
  const rows = [
    { label: "Nombre", value: profile.nombre || "Sin nombre" },
    { label: "Correo", value: profile.email || "Sin correo" },
    { label: "Teléfono", value: profile.telefono || "Sin teléfono" },
    { label: "Cédula", value: profile.cedula || "Sin cédula" },
    {
      label: "Nacimiento",
      value: profile.fecha_nacimiento
        ? `${formatDateLong(profile.fecha_nacimiento)} · ${getAge(profile.fecha_nacimiento)} años`
        : "Sin fecha",
    },
    { label: "Rol", value: profile.role || "Alumno" },
  ]

  return (
    <article className="relative min-h-0 overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 p-5 shadow-2xl shadow-black/30">
      <div className="pointer-events-none absolute -right-16 top-16 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
              Información personal
            </p>
            <h2 className="mt-1 text-2xl font-black uppercase text-white">
              Datos del atleta
            </h2>
          </div>

          <button
            type="button"
            onClick={onEdit}
            className="rounded-xl border border-orange-500/30 px-3 py-2 text-xs font-black uppercase text-orange-300 transition hover:bg-orange-500/10"
          >
            Editar
          </button>
        </div>

        {loading ? (
          <Empty text="Cargando información..." />
        ) : (
          <div className="grid min-h-0 flex-1 gap-3 overflow-hidden sm:grid-cols-2">
            {rows.map((row) => (
              <div
                key={row.label}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
                  {row.label}
                </p>
                <p className="mt-2 truncate text-sm font-black text-white">
                  {row.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

function Empty({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-black/25 p-4 text-sm text-white/40">
      {text}
    </div>
  )
}
