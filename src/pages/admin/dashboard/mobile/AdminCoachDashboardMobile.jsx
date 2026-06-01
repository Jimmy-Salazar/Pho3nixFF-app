import { useMemo } from "react"
import { supabase } from "../../../../supabase"
import pho3nixLogo from "../../../../assets/pho3nix-login-logo.png"
import AdminMobileNav from "./AdminMobileNav"

export default function AdminCoachDashboardMobile({
  loading,
  error,
  currentUser,
  stats,
  detailRows,
  todayWod,
  todayWodLoading,
  news,
  navigate,
  openDetailModal,
  setSelectedNews,
  formatHumanDate,
  translateNewsTitle,
}) {
  const profileName = currentUser?.nombre || currentUser?.email || "Coach PHO3NIX"
  const initials = getInitials(profileName)
  const roleInfo = getRoleInfo(currentUser?.role)

  const birthdays = useMemo(() => {
    return (detailRows?.allBirthdaysRows || [])
      .filter((item) => Number(item.daysUntil) >= 0)
      .slice()
      .sort((a, b) => Number(a.daysUntil) - Number(b.daysUntil))
      .slice(0, 3)
  }, [detailRows])

  const announcements = Array.isArray(news) ? news.slice(0, 2) : []

  async function handleLogout() {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Error cerrando sesión:", error)
    } finally {
      window.location.replace("/")
    }
  }

  return (
    <main className="h-[100dvh] w-screen max-w-full overflow-x-hidden overflow-y-auto bg-[#050505] pb-32 text-white lg:hidden">
      <div className="relative min-h-full w-full max-w-full overflow-x-hidden px-4 pt-4">
        <BackgroundOrbs />

        <header className="relative z-10 mb-5 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-orange-500/25 bg-orange-500/10 text-2xl text-orange-300"
            aria-label="Dashboard"
          >
            ☰
          </button>

          <div className="flex min-w-0 flex-col items-center">
            <img
              src={pho3nixLogo}
              alt="PHO3NIX"
              className="h-11 w-11 object-contain drop-shadow-[0_0_20px_rgba(249,115,22,0.35)]"
            />

            <p className="mt-1 text-xl font-black tracking-[0.14em] text-white">
              PHO<span className="text-orange-500">3</span>NIX
            </p>

            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-orange-500">
              Functional Fitness
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-orange-500/35 bg-orange-500/10 text-sm font-black text-orange-300 shadow-[0_0_22px_rgba(249,115,22,0.25)]">
            {currentUser?.foto_url ? (
              <img
                src={currentUser.foto_url}
                alt={profileName}
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
        </header>

        <section className="relative z-10 mb-5 grid gap-4">
          <div>
            <h1 className="text-4xl font-black leading-none text-white">
              Hola, {loading ? "..." : firstName(profileName)}{" "}
              <span className="text-orange-500">⚡</span>
            </h1>

            <p className="mt-2 text-sm text-white/60">
              Cada entrenamiento te acerca a tu{" "}
              <span className="font-bold text-orange-400">mejor versión.</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <article className="min-w-0 rounded-[1.5rem] border border-orange-500/25 bg-orange-500/10 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-orange-500/25 bg-black/35 text-xs font-black text-orange-300">
                  {initials}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-white">
                    {profileName}
                  </p>

                  <p className="truncate text-xs font-bold text-orange-400">
                    {roleInfo.label}
                  </p>

                  <p className="truncate text-[11px] text-white/40">
                    {currentUser?.email || "PHO3NIX"}
                  </p>
                </div>
              </div>
            </article>

            <article className="min-w-0 rounded-[1.5rem] border border-emerald-500/25 bg-emerald-500/10 p-4">
              <p className="truncate text-xs font-black uppercase text-emerald-300">
                {roleInfo.title}
              </p>

              <p className="mt-2 text-[11px] leading-4 text-white/55">
                {roleInfo.subtitle}
              </p>
            </article>
          </div>
        </section>

        {error ? (
          <div className="relative z-10 mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <section className="relative z-10 mb-4">
          <WodCard
            wod={todayWod}
            loading={todayWodLoading}
            onView={() =>
              navigate("/admin/wods", {
                state: { openTodayWodModal: true },
              })
            }
          />
        </section>

        <section className="relative z-10 mb-4 grid grid-cols-2 gap-3">
          <MobileStatCard
            icon="👥"
            value={loading ? "..." : stats.activeStudents}
            label="Alumnos activos"
            footer={loading ? "Cargando..." : stats.rolesSummary}
            tone="orange"
            onClick={() => openDetailModal("activos")}
          />

          <MobileStatCard
            icon="💳"
            value={loading ? "..." : stats.expiringSoon}
            label="Por vencer"
            footer={loading ? "Cargando..." : stats.nextExpiringLabel}
            tone="amber"
            onClick={() => openDetailModal("vencimientos")}
          />

          <MobileStatCard
            icon="🎂"
            value={loading ? "..." : stats.upcomingBirthdays}
            label="Cumpleaños"
            footer={loading ? "Cargando..." : stats.nextBirthdayLabel}
            tone="purple"
            onClick={() => openDetailModal("cumpleanos")}
          />

          <MobileStatCard
            icon="📣"
            value={loading ? "..." : announcements.length}
            label="Anuncios activos"
            footer="Contenido visible"
            tone="blue"
            onClick={() => navigate("/admin/anuncios")}
          />
        </section>

        <section className="relative z-10 mb-4 grid gap-4 md:grid-cols-2">
          <AnnouncementsCard
            announcements={announcements}
            loading={loading}
            navigate={navigate}
            setSelectedNews={setSelectedNews}
            translateNewsTitle={translateNewsTitle}
            formatHumanDate={formatHumanDate}
          />

          <BirthdayCard
            birthdays={birthdays}
            loading={loading}
          />
        </section>

        <section className="relative z-10 mb-5">
          <h2 className="mb-3 text-2xl font-black uppercase text-white">
            Acciones rápidas
          </h2>

          <div className="grid grid-cols-4 gap-3">
            <QuickAction icon="📣" label="Anuncio" onClick={() => navigate("/admin/anuncios")} />
            <QuickAction icon="🏋️" label="WOD" onClick={() => navigate("/admin/wods")} />
            <QuickAction icon="👥" label="Alumnos" onClick={() => navigate("/admin/users")} />
            <QuickAction icon="💳" label="Vencer" onClick={() => openDetailModal("vencimientos")} />
            <QuickAction icon="🎄" label="PDA" onClick={() => navigate("/admin/pda")} />
            <QuickAction icon="🏆" label="Comp." onClick={() => navigate("/admin/competencias")} />
            <QuickAction icon="⚔️" label="Challenge" onClick={() => navigate("/challenger")} />
            <QuickAction icon="⚙️" label="Panel" onClick={() => navigate("/dashboard")} />
          </div>
        </section>

        <button
          type="button"
          onClick={handleLogout}
          className="relative z-10 mb-5 flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-red-500/45 bg-red-500/10 text-sm font-black uppercase text-red-300 transition hover:bg-red-500/15"
        >
          <span className="text-2xl">↪</span>
          Cerrar sesión
        </button>
      </div>

      <AdminMobileNav />
    </main>
  )
}

function WodCard({ wod, loading, onView }) {
  return (
    <article className="relative min-h-[260px] overflow-hidden rounded-[2rem] border border-orange-500/20 bg-black/55 shadow-2xl shadow-black/40">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_45%,rgba(249,115,22,0.22),transparent_34%)]" />
      <div className="absolute inset-y-0 right-0 w-1/2 bg-[url('/images/imagenchallenge.png')] bg-cover bg-center opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/25" />

      <div className="relative z-10 flex min-h-[260px] flex-col justify-between p-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
            🔥 WOD del día
          </p>

          <h2 className="mt-4 text-3xl font-black uppercase leading-none text-white">
            {loading ? "Cargando..." : wod?.nombre || "Sin WOD publicado"}
          </h2>

          <p className="mt-4 max-w-[90%] whitespace-pre-line text-sm leading-6 text-white/65">
            {loading
              ? "Buscando entrenamiento del día..."
              : wod?.descripcion ||
                "Cuando el coach publique el WOD del día, aparecerá aquí."}
          </p>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onView}
            className="rounded-2xl bg-orange-500 px-5 py-3 text-xs font-black uppercase text-black"
          >
            Ver WOD
          </button>

          <button
            type="button"
            onClick={onView}
            className="rounded-2xl border border-orange-500/35 px-5 py-3 text-xs font-black uppercase text-orange-300"
          >
            Ver historial
          </button>
        </div>
      </div>
    </article>
  )
}

function MobileStatCard({ icon, value, label, footer, tone, onClick }) {
  const toneClass = {
    orange: "border-orange-500/25 bg-orange-500/10 text-orange-300",
    amber: "border-yellow-500/25 bg-yellow-500/10 text-yellow-300",
    purple: "border-purple-500/25 bg-purple-500/10 text-purple-300",
    blue: "border-blue-500/25 bg-blue-500/10 text-blue-300",
  }[tone] || "border-orange-500/25 bg-orange-500/10 text-orange-300"

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative min-h-[150px] min-w-0 overflow-hidden rounded-[1.5rem] border p-3 text-center shadow-2xl shadow-black/30",
        toneClass,
      ].join(" ")}
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-current opacity-10 blur-3xl" />

      <div className="relative z-10 flex h-full min-w-0 flex-col items-center justify-center">
        <div className="text-2xl">{icon}</div>

        <p className="mt-2 max-w-full truncate text-4xl font-black text-white">
          {value}
        </p>

        <p className="mt-2 max-w-full truncate text-[11px] font-black uppercase leading-tight text-white">
          {label}
        </p>

        <p className="mt-2 max-w-full truncate text-[10px] font-black text-current">
          {footer}
        </p>
      </div>
    </button>
  )
}

function AnnouncementsCard({
  announcements,
  loading,
  navigate,
  setSelectedNews,
  translateNewsTitle,
  formatHumanDate,
}) {
  return (
    <article className="relative min-h-[300px] overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 p-4 shadow-2xl shadow-black/30">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
            📣 Novedades del box
          </p>

          <h3 className="mt-1 text-2xl font-black uppercase text-white">
            Comunicados
          </h3>
        </div>

        <button
          type="button"
          onClick={() => navigate("/admin/anuncios")}
          className="rounded-full border border-orange-500/30 px-3 py-1 text-xs font-black text-orange-300"
        >
          {announcements?.length || 0}
        </button>
      </div>

      {loading ? (
        <EmptyCard text="Cargando comunicados..." />
      ) : announcements.length === 0 ? (
        <EmptyCard text="No hay comunicados activos." />
      ) : (
        <div className="grid gap-3">
          {announcements.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedNews(item)}
              className="grid w-full grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-2xl">
                📣
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-black uppercase text-white">
                  {translateNewsTitle(item.titulo)}
                </p>

                <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/50">
                  {item.resumen || item.contenido || "Sin contenido disponible."}
                </p>

                <p className="mt-2 text-[10px] font-black uppercase text-white/35">
                  {formatHumanDate(item.fecha_publicacion)}
                </p>
              </div>

              <span className="text-xl text-white/50">›</span>
            </button>
          ))}
        </div>
      )}
    </article>
  )
}

function BirthdayCard({ birthdays, loading }) {
  return (
    <article className="relative min-h-[300px] overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 p-4 shadow-2xl shadow-black/30">
      <div className="mb-4 min-w-0">
        <p className="truncate text-xs font-black uppercase tracking-[0.22em] text-orange-400">
          🎂 Comunidad PHO3NIX
        </p>

        <h3 className="mt-1 text-2xl font-black uppercase text-white">
          Próximos cumpleaños
        </h3>
      </div>

      {loading ? (
        <EmptyCard text="Cargando cumpleaños..." />
      ) : birthdays.length === 0 ? (
        <EmptyCard text="No hay próximos cumpleaños." />
      ) : (
        <div className="grid gap-3">
          {birthdays.map((item) => (
            <article
              key={item.id}
              className="grid grid-cols-[46px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-orange-500/25 bg-orange-500/10 text-sm font-black text-orange-300">
                {getInitials(item.nombre)}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-black uppercase text-white">
                  {item.nombre}
                </p>

                <p className="mt-1 truncate text-xs text-white/45">
                  {item.nextBirthday
                    ? formatDateShort(item.nextBirthday)
                    : "Próximo cumpleaños"} · en {item.daysUntil} día(s)
                </p>
              </div>

              <div className="text-xl">🎂</div>
            </article>
          ))}
        </div>
      )}
    </article>
  )
}

function QuickAction({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-[92px] rounded-[1.35rem] border border-white/10 bg-black/45 p-3 text-center shadow-2xl shadow-black/25"
    >
      <div className="text-2xl text-orange-400">{icon}</div>
      <p className="mt-2 truncate text-xs font-black text-white">{label}</p>
    </button>
  )
}

function EmptyCard({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-black/25 p-4 text-sm text-white/40">
      {text}
    </div>
  )
}

function BackgroundOrbs() {
  return (
    <>
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-orange-600/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-red-600/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />
    </>
  )
}

function getRoleInfo(role) {
  const value = String(role || "").trim().toLowerCase()

  if (value === "admin" || value === "administrador") {
    return {
      label: "Administrador",
      title: "Acceso total",
      subtitle: "Panel administrativo activo",
    }
  }

  if (value === "coach") {
    return {
      label: "Coach",
      title: "Acceso coach",
      subtitle: "Gestión deportiva activa",
    }
  }

  return {
    label: "Nivel Phoenix",
    title: "Acceso activo",
    subtitle: "Panel PHO3NIX",
  }
}

function getInitials(name) {
  const parts = String(name || "PH")
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) return "PH"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function firstName(name) {
  return String(name || "Coach").trim().split(" ")[0] || "Coach"
}

function formatDateShort(value) {
  if (!value) return "-"

  try {
    const date = value instanceof Date ? value : new Date(value)

    return new Intl.DateTimeFormat("es-EC", {
      day: "2-digit",
      month: "short",
    })
      .format(date)
      .replace(".", "")
  } catch {
    return String(value)
  }
}
