import { formatDateLong } from "../utils/profileUtils"

export default function ProfileMembershipCard({ membership, membershipInfo, membershipLabel, loading }) {
  const statusClass =
    membershipLabel.status === "activa"
      ? "text-emerald-300"
      : membershipLabel.status === "por_vencer"
      ? "text-amber-300"
      : "text-red-300"

  const barClass =
    membershipLabel.status === "activa"
      ? "bg-emerald-400"
      : membershipLabel.status === "por_vencer"
      ? "bg-orange-500"
      : "bg-red-500"

  return (
    <article className="relative h-full overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 p-5 shadow-2xl shadow-black/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_20%,rgba(249,115,22,0.18),transparent_34%)]" />
      <div className="absolute bottom-0 right-0 hidden text-[10rem] opacity-10 xl:block">🪽</div>

      <div className="relative z-10 flex h-full flex-col">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
          👑 Mi Membresía
        </p>

        <div className="mt-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-500/10 text-3xl text-emerald-300">
            ✓
          </div>

          <div>
            <h3 className={["text-3xl font-black uppercase", statusClass].join(" ")}>
              {loading ? "..." : membershipLabel.title}
            </h3>

            <p className="mt-1 text-sm text-white/60">
              {membershipLabel.subtitle}
            </p>
          </div>
        </div>

        <div className="my-6 h-px bg-white/10" />

        <div className="grid gap-4 sm:grid-cols-2">
          <DateBox label="Inicio" value={membership?.fecha_inicio} />
          <DateBox label="Fin" value={membership?.fecha_fin} />
        </div>

        <div className="mt-auto pt-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-white/65">
              {membershipInfo?.daysLeft !== null && membershipInfo?.daysLeft !== undefined
                ? membershipInfo.daysLeft === 0
                  ? "Vence hoy"
                  : `Vence en ${membershipInfo.daysLeft} día(s)`
                : "Estado de membresía"}
            </span>
            <span className={statusClass}>{membershipLabel.progress}%</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={["h-full rounded-full", barClass].join(" ")}
              style={{ width: `${membershipLabel.progress}%` }}
            />
          </div>
        </div>
      </div>
    </article>
  )
}

function DateBox({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">
        {label}
      </p>
      <p className="mt-2 text-sm font-bold text-white">
        {value ? formatDateLong(value) : "Sin fecha"}
      </p>
    </div>
  )
}
