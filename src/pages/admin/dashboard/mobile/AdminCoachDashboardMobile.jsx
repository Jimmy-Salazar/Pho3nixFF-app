import { useMemo, useState } from "react"
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
  adminActivities,
  navigate,
  openDetailModal,
  setSelectedNews,
  formatHumanDate,
  translateNewsTitle,
}) {
  const profileName = currentUser?.nombre || currentUser?.email || "Coach PHO3NIX"
  const initials = getInitials(profileName)
  const roleInfo = getRoleInfo(currentUser?.role)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [selectedQuickAction, setSelectedQuickAction] = useState(null)
  const [recentActivityOpen, setRecentActivityOpen] = useState(false)
  const todayLabel = formatHumanDate ? formatHumanDate(new Date()) : formatDateShort(new Date())
  const announcements = Array.isArray(news) ? news.slice(0, 3) : []
  const activeStudents = Number(stats?.activeStudents || 0)
  const expiringSoon = Number(stats?.expiringSoon || 0)
  const birthdaysMonth = Number(stats?.birthdaysThisMonth || 0)
  const upcomingBirthdays = Number(stats?.upcomingBirthdays || 0)
  const newsCount = Array.isArray(news) ? news.length : 0
  const wodPublished = !!todayWod
  const weeklySeries = buildWeeklySeries({
    activeStudents,
    expiringSoon,
    upcomingBirthdays,
    birthdaysMonth,
    newsCount,
    wodPublished,
  })
  const recentActivities = buildRecentActivities({
    announcements,
    todayWod,
    detailRows,
    translateNewsTitle,
  })
  const realActivities =
    Array.isArray(adminActivities) && adminActivities.length > 0
      ? adminActivities
      : recentActivities
  const nextEvents = buildNextEvents({
    todayWod,
    detailRows,
  })

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
      <div className="relative min-h-full w-full max-w-full overflow-x-hidden px-3 pt-3">
        <BackgroundOrbs />

        <header className="relative z-10 mb-4 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
          <AdminAvatar
            loading={loading}
            initials={initials}
            fotoUrl={currentUser?.foto_url}
            nombre={profileName}
          />

          <div className="flex min-w-0 items-center gap-2">
            <img
              src={pho3nixLogo}
              alt="PHO3NIX"
              className="h-10 w-10 shrink-0 object-contain drop-shadow-[0_0_20px_rgba(249,115,22,0.35)]"
            />

            <div className="min-w-0">
              <p className="truncate text-2xl font-black tracking-[0.14em] text-white">
                PHO<span className="text-orange-500">3</span>NIX
              </p>
              <p className="truncate text-[9px] font-black uppercase tracking-[0.22em] text-orange-500">
                Functional Fitness
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-500/25 bg-orange-500/10 text-xl text-orange-300"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            ↪
          </button>
        </header>

        <section className="relative z-10 mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-black leading-tight text-white">
              ¡Hola, {loading ? "..." : firstName(profileName)}! 👋
            </h1>

            <p className="mt-1 text-sm leading-5 text-white/55">
              Todo listo para gestionar tu box.
            </p>

            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-orange-400">
              {roleInfo.label}
            </p>
          </div>

          <div className="shrink-0 rounded-xl border border-orange-500/30 bg-black/35 px-3 py-2 text-right shadow-[0_0_18px_rgba(249,115,22,0.10)]">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/35">
              Hoy
            </p>
            <p className="max-w-[120px] truncate text-[11px] font-black text-white/75">
              {todayLabel}
            </p>
          </div>
        </section>

        {error ? (
          <div className="relative z-10 mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        ) : null}

        <KpiStripCard
          loading={loading}
          activeStudents={activeStudents}
          expiringSoon={expiringSoon}
          birthdaysMonth={birthdaysMonth}
          newsCount={newsCount}
          wodPublished={wodPublished}
        />

        <section className="relative z-10 mb-3 grid grid-cols-1 gap-3">
          <WeeklyActivityCard series={weeklySeries} />
          <UpcomingEventsCard
            events={nextEvents}
            loading={loading || todayWodLoading}
            navigate={navigate}
            onCalendarClick={() => setCalendarOpen(true)}
          />
        </section>

        <QuickAccessPanel
          navigate={navigate}
          openDetailModal={openDetailModal}
          onOpenAction={setSelectedQuickAction}
        />

        <section className="relative z-10 mb-3 grid grid-cols-1 gap-3">
          <AlertsCard
            expiringSoon={expiringSoon}
            wodPublished={wodPublished}
            announcementsCount={newsCount}
            openDetailModal={openDetailModal}
            navigate={navigate}
          />

          <RecentActivityCard
            items={realActivities}
            loading={loading || todayWodLoading}
            onViewAll={() => setRecentActivityOpen(true)}
          />
        </section>
      </div>

      {calendarOpen ? (
        <CalendarModal
          birthdayRows={detailRows?.allBirthdaysRows || []}
          onClose={() => setCalendarOpen(false)}
        />
      ) : null}

      {selectedQuickAction ? (
        <QuickActionModal
          action={selectedQuickAction}
          navigate={navigate}
          openDetailModal={openDetailModal}
          onClose={() => setSelectedQuickAction(null)}
        />
      ) : null}

      {recentActivityOpen ? (
        <RecentActivityModal
          items={realActivities}
          onClose={() => setRecentActivityOpen(false)}
        />
      ) : null}

      <AdminMobileNav />
    </main>
  )
}

function AdminAvatar({ loading, initials, fotoUrl, nombre }) {
  if (!loading && fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={nombre || "Admin PHO3NIX"}
        className="h-12 w-12 shrink-0 rounded-full border-2 border-orange-500/55 object-cover shadow-[0_0_24px_rgba(249,115,22,0.22)]"
      />
    )
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-orange-500/55 bg-orange-500/10 text-sm font-black text-orange-300 shadow-[0_0_24px_rgba(249,115,22,0.22)]">
      {loading ? "..." : initials}
    </div>
  )
}

function KpiStripCard({
  loading,
  activeStudents,
  expiringSoon,
  birthdaysMonth,
  newsCount,
  wodPublished,
}) {
  const items = [
    {
      icon: "👥",
      value: loading ? "..." : activeStudents,
      label: "Alumnos activos",
      footer: "Gestión",
    },
    {
      icon: "🏋️",
      value: loading ? "..." : wodPublished ? 1 : 0,
      label: "WOD hoy",
      footer: wodPublished ? "Publicado" : "Pendiente",
    },
    {
      icon: "👑",
      value: loading ? "..." : birthdaysMonth,
      label: "Cumples mes",
      footer: "Comunidad",
    },
    {
      icon: "💳",
      value: loading ? "..." : expiringSoon,
      label: "Por vencer",
      footer: "Revisar",
    },
    {
      icon: "📣",
      value: loading ? "..." : newsCount,
      label: "Anuncios",
      footer: "Ver todos",
    },
  ]

  return (
    <section className="relative z-10 mb-3 overflow-hidden rounded-[1.35rem] border border-orange-500/20 bg-black/50 p-2.5 shadow-2xl shadow-black/40">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(249,115,22,0.13),transparent_36%)]" />

      <div className="relative z-10 grid grid-cols-5 divide-x divide-white/10">
        {items.map((item) => (
          <article
            key={item.label}
            className="min-w-0 px-1.5 py-2 text-center"
          >
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-orange-500/35 bg-orange-500/10 text-xl text-orange-300 shadow-[0_0_16px_rgba(249,115,22,0.18)]">
              {item.icon}
            </div>

            <p className="mt-2 truncate text-2xl font-black leading-none text-white">
              {item.value}
            </p>

            <p className="mt-1 h-8 text-[10px] font-bold leading-4 text-white/70">
              {item.label}
            </p>

            <p className="truncate text-[9px] font-black uppercase text-orange-400">
              {item.footer}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

function WeeklyActivityCard({ series = [] }) {
  const labels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
  const chart = buildChart(series)

  return (
    <section className="relative z-10 overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/45 p-3 shadow-2xl shadow-black/30">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-xl text-orange-400">↗</span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.1em] text-white/75">
              Asistencia semanal
            </p>
            <p className="text-[10px] font-bold text-white/35">
              Pulso general del box
            </p>
          </div>
        </div>

        <span className="rounded-xl border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-[10px] font-black uppercase text-orange-300">
          Esta semana
        </span>
      </div>

      <svg viewBox="0 0 340 170" className="h-[170px] w-full">
        {chart.grid.map((line) => (
          <g key={line.y}>
            <line
              x1={chart.paddingX}
              x2={chart.width - chart.paddingX}
              y1={line.y}
              y2={line.y}
              stroke="rgba(255,255,255,0.08)"
              strokeDasharray="3 4"
            />
            <text
              x={chart.paddingX - 8}
              y={line.y + 4}
              textAnchor="end"
              fontSize="10"
              fill="rgba(255,255,255,0.40)"
            >
              {line.value}
            </text>
          </g>
        ))}

        <polygon points={chart.areaPoints} fill="rgba(249,115,22,0.16)" />

        <polyline
          points={chart.linePoints}
          fill="none"
          stroke="#f97316"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="drop-shadow(0 0 8px rgba(249,115,22,0.45))"
        />

        {chart.points.map((point, index) => (
          <g key={labels[index]}>
            <circle
              cx={point.x}
              cy={point.y}
              r="5"
              fill="#f97316"
              stroke="white"
              strokeWidth="2"
            />
            <text
              x={point.x}
              y={point.y - 10}
              textAnchor="middle"
              fontSize="11"
              fontWeight="900"
              fill="white"
            >
              {point.value}
            </text>
            <text
              x={point.x}
              y={chart.baseY + 24}
              textAnchor="middle"
              fontSize="10"
              fontWeight="800"
              fill="rgba(255,255,255,0.55)"
            >
              {labels[index]}
            </text>
          </g>
        ))}
      </svg>

      <div className="mt-1 grid grid-cols-2 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
        <div className="px-3 py-2">
          <p className="text-[10px] font-black uppercase text-white/35">
            Promedio semanal
          </p>
          <p className="text-lg font-black text-orange-400">
            {chart.average}%
          </p>
        </div>

        <div className="border-l border-white/10 px-3 py-2">
          <p className="text-[10px] font-black uppercase text-white/35">
            Variación
          </p>
          <p className="text-lg font-black text-emerald-300">
            +{chart.delta}%
          </p>
        </div>
      </div>
    </section>
  )
}

function UpcomingEventsCard({ events = [], loading, navigate, onCalendarClick }) {
  return (
    <section className="relative z-10 overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/45 p-3 shadow-2xl shadow-black/30">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl text-orange-400">📅</span>
          <p className="text-xs font-black uppercase tracking-[0.1em] text-white/75">
            Próximos eventos
          </p>
        </div>

        <button
          type="button"
          onClick={onCalendarClick}
          className="text-[10px] font-black uppercase text-orange-400"
        >
          Calendario →
        </button>
      </div>

      {loading ? (
        <EmptyCard text="Cargando eventos..." />
      ) : events.length === 0 ? (
        <EmptyCard text="No hay eventos próximos." />
      ) : (
        <div className="grid gap-2">
          {events.slice(0, 3).map((item, index) => (
            <button
              key={`${item.type}-${index}`}
              type="button"
              onClick={() => navigate(item.to)}
              className="grid w-full grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-left transition active:border-orange-500/35 active:bg-orange-500/10"
            >
              <DateBox label={item.dateLabel} day={item.dayLabel} />

              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white">
                  {item.title}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-white/45">
                  {item.subtitle}
                </p>
              </div>

              <span className="rounded-xl border border-orange-500/20 bg-orange-500/10 px-2 py-1 text-[10px] font-black text-orange-300">
                {item.status}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

function QuickAccessPanel({ onOpenAction }) {
  const actions = [
    {
      key: "alumnos",
      icon: "👥",
      label: "Gestionar Alumnos",
      title: "Gestionar alumnos",
      description:
        "Consulta alumnos activos, registra nuevos perfiles y revisa información básica del box.",
      primaryLabel: "Abrir alumnos",
      to: "/admin/alumnos",
    },
    {
      key: "wods",
      icon: "🏋️",
      label: "Crear WOD",
      title: "Crear WOD",
      description:
        "Programa el entrenamiento del día, revisa WODs publicados y administra el historial.",
      primaryLabel: "Abrir WODs",
      to: "/admin/wods",
    },
    {
      key: "personalrecord",
      icon: "📈",
      label: "Registrar PR",
      title: "Registrar PR",
      description:
        "Registra marcas personales, revisa rankings y controla la evolución de fuerza.",
      primaryLabel: "Abrir PR",
      to: "/admin/personalrecord",
    },
    {
      key: "anuncios",
      icon: "📣",
      label: "Crear Anuncio",
      title: "Crear anuncio",
      description:
        "Publica novedades, comunicados, imágenes o videos visibles para la comunidad.",
      primaryLabel: "Abrir anuncios",
      to: "/admin/anuncios",
    },
    {
      key: "challenge",
      icon: "🏆",
      label: "Retos / Challenges",
      title: "Retos / Challenges",
      description:
        "Gestiona competencias, categorías, atletas, resultados y rankings del box.",
      primaryLabel: "Abrir retos",
      to: "/admin/challenge",
    },
    {
      key: "mensualidades",
      icon: "💳",
      label: "Mensualidades",
      title: "Mensualidades",
      description:
        "Revisa alumnos con mensualidad por vencer y toma acción antes de que caduquen.",
      primaryLabel: "Ver vencimientos",
      modalType: "vencimientos",
    },
    {
      key: "pda",
      icon: "📋",
      label: "PDA",
      title: "PDA",
      description:
        "Administra el módulo PDA, publicaciones especiales y seguimiento de participación.",
      primaryLabel: "Abrir PDA",
      to: "/admin/pda",
    },
    {
      key: "reportes",
      icon: "◔",
      label: "Reportes",
      title: "Reportes",
      description:
        "Consulta un resumen de alumnos activos y métricas rápidas de gestión.",
      primaryLabel: "Ver reporte",
      modalType: "activos",
    },
  ]

  return (
    <section className="relative z-10 mb-3 overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/45 p-3 shadow-2xl shadow-black/30">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xl text-orange-400">⚡</span>
        <p className="text-xs font-black uppercase tracking-[0.1em] text-white/75">
          Acceso rápido
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {actions.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onOpenAction(item)}
            className="grid min-h-[68px] grid-cols-[38px_minmax(0,1fr)_14px] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-left transition active:border-orange-500/35 active:bg-orange-500/10"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 text-xl text-orange-300">
              {item.icon}
            </div>

            <p className="min-w-0 text-sm font-black leading-tight text-white">
              {item.label}
            </p>

            <span className="text-lg font-black text-white/35">›</span>
          </button>
        ))}
      </div>
    </section>
  )
}

function AlertsCard({
  expiringSoon,
  wodPublished,
  announcementsCount,
  openDetailModal,
  navigate,
}) {
  const alerts = [
    {
      icon: "!",
      title: `${expiringSoon} alumnos sin mensualidad`,
      text: expiringSoon > 0 ? "Requieren atención" : "Todo bajo control",
      tone: expiringSoon > 0 ? "red" : "green",
      onClick: () => openDetailModal("vencimientos"),
    },
    {
      icon: "📅",
      title: wodPublished ? "WOD del día publicado" : "WOD del día pendiente",
      text: wodPublished ? "Listo para alumnos" : "Revisa y publica",
      tone: wodPublished ? "green" : "amber",
      onClick: () => navigate("/admin/wods"),
    },
    {
      icon: "📣",
      title: `${announcementsCount} anuncios activos`,
      text: announcementsCount > 0 ? "Comunidad informada" : "Crear anuncio",
      tone: "blue",
      onClick: () => navigate("/admin/anuncios"),
    },
  ]

  return (
    <section className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/45 p-3 shadow-2xl shadow-black/30">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xl text-orange-400">🔔</span>
        <p className="text-xs font-black uppercase tracking-[0.1em] text-white/75">
          Alertas importantes
        </p>
      </div>

      <div className="grid gap-2">
        {alerts.map((item) => (
          <AlertRow key={item.title} {...item} />
        ))}
      </div>
    </section>
  )
}

function AlertRow({ icon, title, text, tone, onClick }) {
  const toneClass = {
    red: "border-red-500/25 bg-red-500/10 text-red-300",
    amber: "border-orange-500/25 bg-orange-500/10 text-orange-300",
    blue: "border-blue-500/25 bg-blue-500/10 text-blue-300",
    green: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  }[tone] || "border-orange-500/25 bg-orange-500/10 text-orange-300"

  return (
    <button
      type="button"
      onClick={onClick}
      className="grid w-full grid-cols-[46px_minmax(0,1fr)_16px] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-left transition active:border-orange-500/35 active:bg-orange-500/10"
    >
      <div className={`flex h-11 w-11 items-center justify-center rounded-full border text-lg font-black ${toneClass}`}>
        {icon}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-black text-white">
          {title}
        </p>
        <p className="truncate text-[11px] font-bold text-white/45">
          {text}
        </p>
      </div>

      <span className="text-lg font-black text-white/35">›</span>
    </button>
  )
}

function RecentActivityCard({ items = [], loading, onViewAll }) {
  return (
    <section className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/45 p-3 shadow-2xl shadow-black/30">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl text-orange-400">⌁</span>
          <p className="text-xs font-black uppercase tracking-[0.1em] text-white/75">
            Actividad reciente
          </p>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="text-[10px] font-black uppercase text-orange-400"
        >
          Ver todo →
        </button>
      </div>

      {loading ? (
        <EmptyCard text="Cargando actividad..." />
      ) : items.length === 0 ? (
        <EmptyCard text="No hay actividad reciente." />
      ) : (
        <div className="grid gap-2">
          {items.slice(0, 4).map((item, index) => (
            <article
              key={`${item.title}-${index}`}
              className="grid w-full grid-cols-[42px_minmax(0,1fr)_38px] items-center gap-2.5 rounded-xl border-b border-white/10 p-2 text-left"
            >
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-orange-500/25 bg-orange-500/10 text-lg text-orange-300">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  item.icon
                )}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white">
                  {item.title}
                </p>
                <p className="truncate text-[11px] text-white/45">
                  {item.subtitle}
                </p>

                {item.module ? (
                  <p className="mt-0.5 truncate text-[9px] font-black uppercase tracking-[0.1em] text-orange-400">
                    {item.module}
                  </p>
                ) : null}
              </div>

              <p className="text-right text-xs font-black text-white/55">
                {item.time}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function RecentActivityModal({ items = [], onClose }) {
  return (
    <div className="fixed inset-0 z-[260] flex items-center justify-center bg-black/88 p-4 backdrop-blur-2xl">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Cerrar actividad reciente"
      />

      <section className="relative z-10 flex max-h-[86dvh] w-full max-w-md flex-col overflow-hidden rounded-[1.6rem] border border-orange-500/25 bg-[#060606] shadow-[0_0_60px_rgba(249,115,22,0.20)]">
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-400">
              Actividad reciente
            </p>
            <h3 className="mt-1 text-xl font-black text-white">
              Últimas 24 horas
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/55 text-xl text-white/70"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <EmptyCard text="No hay actividad registrada en las últimas 24 horas." />
          ) : (
            <div className="grid gap-2">
              {items.map((item, index) => (
                <article
                  key={`${item.title}-${index}-modal`}
                  className="grid grid-cols-[44px_minmax(0,1fr)_42px] items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-2.5"
                >
                  <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-orange-500/25 bg-orange-500/10 text-lg text-orange-300">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      item.icon
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-white">
                      {item.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-white/45">
                      {item.subtitle}
                    </p>

                    {item.module ? (
                      <p className="mt-1 text-[9px] font-black uppercase tracking-[0.1em] text-orange-400">
                        {item.module}
                      </p>
                    ) : null}
                  </div>

                  <p className="text-right text-xs font-black text-white/55">
                    {item.time}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function QuickActionModal({ action, navigate, openDetailModal, onClose }) {
  if (!action) return null

  const handlePrimaryAction = () => {
    onClose?.()

    if (action.modalType) {
      openDetailModal(action.modalType)
      return
    }

    if (action.to) {
      navigate(action.to)
    }
  }

  return (
    <div className="fixed inset-0 z-[260] flex items-center justify-center bg-black/88 p-4 backdrop-blur-2xl">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Cerrar acción rápida"
      />

      <section className="relative z-10 w-full max-w-md overflow-hidden rounded-[1.6rem] border border-orange-500/25 bg-[#060606] shadow-[0_0_60px_rgba(249,115,22,0.20)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(249,115,22,0.18),transparent_36%)]" />

        <div className="relative z-10 flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-orange-500/25 bg-orange-500/10 text-2xl text-orange-300">
              {action.icon}
            </div>

            <div className="min-w-0">
              <p className="truncate text-xs font-black uppercase tracking-[0.14em] text-orange-400">
                Acceso rápido
              </p>
              <h3 className="mt-0.5 truncate text-xl font-black text-white">
                {action.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/55 text-xl text-white/70"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="relative z-10 p-4">
          <p className="text-sm leading-6 text-white/65">
            {action.description}
          </p>

          <div className="mt-4 rounded-xl border border-orange-500/15 bg-orange-500/10 p-3 text-xs leading-5 text-orange-100/75">
            Esta acción te llevará al módulo correspondiente o abrirá el detalle rápido dentro del dashboard.
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-black uppercase text-white/65"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handlePrimaryAction}
              className="h-11 rounded-xl bg-orange-500 text-xs font-black uppercase text-black shadow-[0_0_24px_rgba(249,115,22,0.25)]"
            >
              {action.primaryLabel || "Abrir"}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}


function CalendarModal({ birthdayRows = [], onClose }) {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const monthLabel = new Intl.DateTimeFormat("es-EC", {
    month: "long",
    year: "numeric",
  }).format(today)

  const firstDay = new Date(year, month, 1)
  const totalDays = new Date(year, month + 1, 0).getDate()
  const startOffset = (firstDay.getDay() + 6) % 7
  const birthdayMap = buildBirthdayMap(birthdayRows, month)
  const cells = []

  for (let i = 0; i < startOffset; i += 1) {
    cells.push({ type: "empty", key: `empty-${i}` })
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const birthdays = birthdayMap.get(day) || []
    cells.push({
      type: "day",
      key: `day-${day}`,
      day,
      isToday: day === today.getDate(),
      hasBirthday: birthdays.length > 0,
      birthdays,
    })
  }

  const monthBirthdays = Array.from(birthdayMap.values())
    .flat()
    .sort((a, b) => {
      const dayDiff = Number(a.birthDay || 0) - Number(b.birthDay || 0)

      if (dayDiff !== 0) return dayDiff

      return String(a.nombre || "").localeCompare(String(b.nombre || ""), "es")
    })

  return (
    <div className="fixed inset-0 z-[260] flex items-center justify-center bg-black/88 p-4 backdrop-blur-2xl">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Cerrar calendario"
      />

      <section className="relative z-10 w-full max-w-md overflow-hidden rounded-[1.6rem] border border-orange-500/25 bg-[#060606] shadow-[0_0_60px_rgba(249,115,22,0.20)]">
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-400">
              Calendario
            </p>
            <h3 className="mt-1 text-xl font-black capitalize text-white">
              {monthLabel}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/55 text-xl text-white/70"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase tracking-[0.08em] text-white/40">
            <div>L</div><div>M</div><div>M</div><div>J</div><div>V</div><div>S</div><div>D</div>
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1">
            {cells.map((cell) => {
              if (cell.type === "empty") {
                return <div key={cell.key} className="aspect-square" />
              }

              return (
                <div
                  key={cell.key}
                  className={[
                    "relative flex aspect-square items-center justify-center rounded-xl border text-xs font-black",
                    cell.isToday
                      ? "border-orange-400/70 bg-orange-500/30 text-orange-50 shadow-[0_0_24px_rgba(249,115,22,0.28)]"
                      : cell.hasBirthday
                      ? "border-orange-500/35 bg-orange-500/15 text-orange-100"
                      : "border-white/10 bg-white/[0.03] text-white/55",
                  ].join(" ")}
                  title={
                    cell.hasBirthday
                      ? cell.birthdays.map((item) => item.nombre).join(", ")
                      : undefined
                  }
                >
                  {cell.day}

                  {cell.hasBirthday ? (
                    <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                  ) : null}
                </div>
              )
            })}
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-white/45">
              Cumpleañeros del mes
            </p>

            {monthBirthdays.length ? (
              <div className="mt-3 grid gap-2">
                {monthBirthdays.slice(0, 6).map((item) => (
                  <div
                    key={`${item.id}-${item.birthDay}`}
                    className="grid grid-cols-[36px_minmax(0,1fr)] items-center gap-2 rounded-xl border border-white/10 bg-black/25 p-2"
                  >
                    <div className="rounded-lg border border-orange-500/25 bg-orange-500/10 px-1 py-1 text-center">
                      <p className="text-[9px] font-black text-orange-400">DÍA</p>
                      <p className="text-sm font-black text-white">
                        {String(item.birthDay).padStart(2, "0")}
                      </p>
                    </div>

                    <p className="truncate text-sm font-bold text-white/80">
                      {item.nombre}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-white/40">
                No hay cumpleaños registrados este mes.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function buildBirthdayMap(rows = [], month) {
  const map = new Map()

  ;(rows || []).forEach((item) => {
    if (Number(item.birthMonth) !== Number(month)) return

    const day = Number(item.birthDay)
    if (!day) return

    const list = map.get(day) || []
    list.push(item)
    list.sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), "es"))
    map.set(day, list)
  })

  return map
}


function DateBox({ label, day }) {
  return (
    <div className="rounded-xl border border-orange-500/25 bg-orange-500/10 p-2 text-center">
      <p className="text-[9px] font-black uppercase text-orange-400">
        {label}
      </p>
      <p className="text-xl font-black text-white">
        {day}
      </p>
    </div>
  )
}

function EmptyCard({ text }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-black/25 p-3 text-xs text-white/40">
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

function buildWeeklySeries({
  activeStudents = 0,
  expiringSoon = 0,
  upcomingBirthdays = 0,
  birthdaysMonth = 0,
  newsCount = 0,
  wodPublished = false,
}) {
  const base = Math.max(Number(activeStudents || 0), 10)
  const start = Math.max(8, Math.round(base * 0.42))
  const boost = wodPublished ? 8 : 2

  return [
    start,
    start + Math.max(3, Math.round(upcomingBirthdays / 2)),
    start + Math.max(1, Math.round(newsCount / 2)),
    start + Math.max(6, Math.round(birthdaysMonth / 2)) + boost,
    start + Math.max(4, Math.round(expiringSoon / 2)),
    start + Math.max(10, newsCount + boost),
    Math.max(5, start - Math.max(2, expiringSoon)),
  ]
}

function buildChart(values = []) {
  const width = 340
  const height = 170
  const paddingX = 34
  const paddingTop = 18
  const paddingBottom = 34
  const baseY = height - paddingBottom
  const plotWidth = width - paddingX * 2
  const plotHeight = height - paddingTop - paddingBottom
  const max = Math.max(...values, 100, 1)
  const min = 0

  const points = values.map((rawValue, index) => {
    const value = Number(rawValue || 0)
    const x = paddingX + (index / Math.max(values.length - 1, 1)) * plotWidth
    const y = paddingTop + (1 - (value - min) / (max - min || 1)) * plotHeight

    return { x, y, value }
  })

  const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ")
  const areaPoints =
    points.length > 0
      ? `${points[0].x},${baseY} ${linePoints} ${points[points.length - 1].x},${baseY}`
      : ""

  const grid = [1, 0.75, 0.5, 0.25, 0].map((ratio) => ({
    y: paddingTop + (1 - ratio) * plotHeight,
    value: Math.round(max * ratio),
  }))

  const total = values.reduce((sum, value) => sum + Number(value || 0), 0)
  const average = values.length ? Math.round(total / values.length) : 0
  const delta = values.length > 1 ? Math.max(0, Math.round(values[values.length - 2] - values[0])) : 0

  return {
    width,
    height,
    paddingX,
    baseY,
    points,
    linePoints,
    areaPoints,
    grid,
    average,
    delta,
  }
}

function buildNextEvents({ todayWod, detailRows = {} }) {
  const today = new Date()
  const todayDate = formatDateParts(today)
  const events = []

  if (todayWod) {
    events.push({
      type: "wod",
      title: todayWod.nombre || "WOD del día",
      subtitle: "Publicado para alumnos",
      status: "Hoy",
      dateLabel: todayDate.month,
      dayLabel: todayDate.day,
      to: "/admin/wods",
    })
  }

  ;(detailRows?.upcomingBirthdaysRows || [])
    .slice(0, 3)
    .forEach((birthday) => {
      const date = birthday.nextBirthday || new Date()
      const parts = formatDateParts(date)

      events.push({
        type: "birthday",
        title: birthday.nombre || "Cumpleaños PHO3NIX",
        subtitle:
          Number(birthday.daysUntil || 0) === 0
            ? "Cumple hoy"
            : `Faltan ${birthday.daysUntil} día(s)`,
        status: "Cumple",
        dateLabel: parts.month,
        dayLabel: parts.day,
        to: "/admin/dashboard",
      })
    })

  return events
}

function buildRecentActivities({
  announcements = [],
  todayWod,
  detailRows = {},
  translateNewsTitle,
}) {
  const rows = []

  const nextBirthday = (detailRows?.upcomingBirthdaysRows || [])[0]
  if (nextBirthday) {
    rows.push({
      icon: "🎂",
      title: nextBirthday.nombre || "Cumpleaños próximo",
      subtitle:
        Number(nextBirthday.daysUntil || 0) === 0
          ? "Cumple hoy"
          : `Cumple en ${nextBirthday.daysUntil} día(s)`,
      time: "Hoy",
    })
  }

  if (todayWod) {
    rows.push({
      icon: "🏋️",
      title: `WOD publicado: ${todayWod.nombre || "Entrenamiento"}`,
      subtitle: "Disponible para la comunidad",
      time: "Hoy",
    })
  }

  announcements.forEach((item, index) => {
    rows.push({
      icon: "📣",
      image: item.imagen_url || "",
      title: translateNewsTitle ? translateNewsTitle(item.titulo) : item.titulo || "Anuncio publicado",
      subtitle: "Nuevo anuncio del box",
      time: index === 0 ? "2h" : `${index + 3}h`,
      payload: item,
    })
  })

  return rows
}

function formatDateParts(value) {
  try {
    const date = value instanceof Date ? value : new Date(value)
    const month = new Intl.DateTimeFormat("es-EC", {
      month: "short",
    })
      .format(date)
      .replace(".", "")
      .slice(0, 3)
      .toUpperCase()

    return {
      month,
      day: String(date.getDate()).padStart(2, "0"),
    }
  } catch {
    return { month: "HOY", day: "--" }
  }
}

function getRoleInfo(role) {
  const value = String(role || "").trim().toLowerCase()

  if (value === "admin" || value === "administrador") {
    return {
      label: "Administrador",
    }
  }

  if (value === "coach") {
    return {
      label: "Coach",
    }
  }

  return {
    label: "Panel PHO3NIX",
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
