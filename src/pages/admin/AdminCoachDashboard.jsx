import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../supabase"
import StatCard from "./components/StatCard"
import HeroCard from "./components/HeroCard"
import { mensualidadStatusInfo } from "../../utils/mensualidades"
import DashboardSidebar from "./dashboard/components/DashboardSidebar"
import DashboardContent from "./dashboard/components/DashboardContent"

export default function Dashboard() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [news, setNews] = useState([])
  const [selectedNews, setSelectedNews] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState(null)

  const [todayWod, setTodayWod] = useState(null)
  const [todayWodLoading, setTodayWodLoading] = useState(true)

  const [currentUser, setCurrentUser] = useState(null)
  const [eventosBox, setEventosBox] = useState([])
  const [publicidades, setPublicidades] = useState([])

  const [stats, setStats] = useState({
    totalPeople: 0,
    activeStudents: 0,
    expiringSoon: 0,
    upcomingBirthdays: 0,
    birthdaysThisMonth: 0,
    todaysBirthdays: 0,
    nextBirthdayLabel: "Sin próximos cumpleaños",
    nextExpiringLabel: "Sin vencimientos próximos",
    alumnoExpiringLabel: "Tu mensualidad está activa",
    rolesSummary: "Sin datos",
  })

  const [detailRows, setDetailRows] = useState({
    activeStudentsRows: [],
    expiringSoonRows: [],
    upcomingBirthdaysRows: [],
    birthdaysThisMonthRows: [],
    todaysBirthdaysRows: [],
    alumnoExpiringRows: [],
  })

  const carouselRef = useRef(null)
  const publicidadRef = useRef(null)

  const currentRole = normalizeRole(currentUser?.role)
  const isAlumno = currentRole === "alumno"

  useEffect(() => {
    let alive = true

    const loadDashboard = async () => {
      try {
        setLoading(true)
        setError("")

        const { data: authData } = await supabase.auth.getUser()
        const authUser = authData?.user || null

        const { data: users, error: usersError } = await supabase
          .from("usuarios")
          .select("id,nombre,email,role,fecha_nacimiento")

        if (usersError) throw usersError
        const safeUsers = users ?? []

        const loggedProfile = safeUsers.find((u) => u.id === authUser?.id) || null

        const { data: mensualidades, error: mensualidadesError } = await supabase
          .from("mensualidades")
          .select("id,usuario_id,fecha_inicio,fecha_fin,estado,created_at")
          .order("fecha_fin", { ascending: false })
          .order("created_at", { ascending: false })

        if (mensualidadesError) throw mensualidadesError
        const safeMens = mensualidades ?? []

        const nowIso = new Date().toISOString()

        const { data: anunciosRows, error: anunciosError } = await supabase
          .from("anuncios")
          .select("id,titulo,contenido,fecha_publicacion,activo,created_at,media_url,media_tipo")
          .eq("activo", true)
          .lte("fecha_publicacion", nowIso)
          .order("fecha_publicacion", { ascending: false })
          .limit(12)

        if (anunciosError) throw anunciosError

        const noticias = (anunciosRows || []).map((a) => ({
          id: a.id,
          titulo: a.titulo,
          resumen: a.contenido,
          contenido: a.contenido,
          fuente: "PHO3NIX",
          url: null,
          imagen_url: a.media_tipo === "video" ? null : a.media_url,
          media_url: a.media_url,
          media_tipo: a.media_tipo,
          fecha_publicacion: a.fecha_publicacion,
          categoria: "anuncio",
        }))

        const latestMensMap = new Map()
        for (const m of safeMens) {
          if (!latestMensMap.has(m.usuario_id)) {
            latestMensMap.set(m.usuario_id, m)
          }
        }

        const now = new Date()

        const students = safeUsers.filter((u) => normalizeRole(u.role) === "alumno")
        const admins = safeUsers.filter((u) => normalizeRole(u.role) === "admin")
        const coaches = safeUsers.filter((u) => normalizeRole(u.role) === "coach")

        let activeStudents = 0
        let activeStudentsRows = []
        let expiringSoonRows = []
        let alumnoExpiringRows = []
        let alumnoExpiringLabel = "Tu mensualidad está activa"

        for (const u of students) {
          const m = latestMensMap.get(u.id)
          if (!m) continue

          const info = mensualidadStatusInfo(m, now)
          if (!info.active) continue

          activeStudents += 1

          activeStudentsRows.push({
            id: u.id,
            nombre: u.nombre,
          })

          if (info.daysLeft !== null && info.daysLeft >= 0 && info.daysLeft <= 7) {
            const row = {
              id: u.id,
              nombre: u.nombre,
              fechaFin: m.fecha_fin,
              diffDays: info.daysLeft,
            }

            expiringSoonRows.push(row)

            if (u.id === authUser?.id) {
              alumnoExpiringRows.push(row)
              alumnoExpiringLabel =
                info.daysLeft === 0
                  ? "Tu mensualidad vence hoy"
                  : `Tu mensualidad vence en ${info.daysLeft} día(s)`
            }
          }
        }

        activeStudentsRows.sort((a, b) => a.nombre.localeCompare(b.nombre))
        expiringSoonRows.sort((a, b) => a.diffDays - b.diffDays)

        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const currentMonth = today.getMonth()

        const birthdayBaseRows = safeUsers
          .filter((u) => !!u.fecha_nacimiento)
          .map((u) => {
            const nextBirthday = getNextBirthday(u.fecha_nacimiento, today)
            const [, month, day] = String(u.fecha_nacimiento).split("-").map(Number)

            return {
              id: u.id,
              nombre: u.nombre,
              nextBirthday,
              fechaNacimiento: u.fecha_nacimiento,
              birthMonth: month - 1,
              birthDay: day,
              daysUntil: daysBetween(today, nextBirthday),
            }
          })

        const upcomingBirthdaysRows = birthdayBaseRows
          .filter((x) => x.daysUntil >= 0 && x.daysUntil <= 30)
          .sort((a, b) => a.daysUntil - b.daysUntil)

        const birthdaysThisMonthRows = birthdayBaseRows
          .filter((x) => x.birthMonth === currentMonth)
          .sort((a, b) => a.birthDay - b.birthDay)

        const todaysBirthdaysRows = birthdayBaseRows
          .filter((x) => x.daysUntil === 0)
          .sort((a, b) => a.nombre.localeCompare(b.nombre))

        const nextBirthdayLabel =
          upcomingBirthdaysRows.length > 0
            ? `${upcomingBirthdaysRows[0].nombre} • ${formatHumanDate(upcomingBirthdaysRows[0].nextBirthday)}`
            : "Sin próximos cumpleaños"

        const nextExpiringLabel =
          expiringSoonRows.length > 0
            ? `${expiringSoonRows[0].nombre} • ${
                expiringSoonRows[0].diffDays === 0
                  ? "Vence hoy"
                  : `Vence en ${expiringSoonRows[0].diffDays} día(s)`
              }`
            : "Sin vencimientos próximos"

        const rolesSummary = [
          `${students.length} alumnos`,
          `${admins.length} admin`,
          coaches.length ? `${coaches.length} coach` : null,
        ]
          .filter(Boolean)
          .join(" • ")

        if (!alive) return

        setCurrentUser(loggedProfile)

        setStats({
          totalPeople: safeUsers.length,
          activeStudents,
          expiringSoon: expiringSoonRows.length,
          upcomingBirthdays: upcomingBirthdaysRows.length,
          birthdaysThisMonth: birthdaysThisMonthRows.length,
          todaysBirthdays: todaysBirthdaysRows.length,
          nextBirthdayLabel,
          nextExpiringLabel,
          alumnoExpiringLabel,
          rolesSummary,
        })

        setDetailRows({
          activeStudentsRows,
          expiringSoonRows,
          upcomingBirthdaysRows,
          birthdaysThisMonthRows,
          todaysBirthdaysRows,
          alumnoExpiringRows,
        })

        setNews(noticias ?? [])
      } catch (e) {
        if (!alive) return
        setError(e?.message ?? "No se pudo cargar el dashboard")
      } finally {
        if (alive) setLoading(false)
      }
    }

    const loadTodayWod = async () => {
      try {
        setTodayWodLoading(true)

        const now = new Date()
        const todayIso = formatDateISO(now)

        const { data, error } = await supabase
          .from("wod")
          .select("id,nombre,descripcion,modo_ranking,modalidad,fecha,activo,publicado,fecha_publicacion")
          .eq("fecha", todayIso)
          .eq("activo", true)
          .limit(5)

        if (error) throw error

        const safeRows = (data || []).filter((item) => {
          if (item.publicado === true && item.fecha_publicacion) {
            return new Date(item.fecha_publicacion) <= now
          }
          return true
        })

        setTodayWod(safeRows[0] || null)
      } catch (e) {
        console.error("Error cargando WOD del día:", e)
        setTodayWod(null)
      } finally {
        if (alive) setTodayWodLoading(false)
      }
    }

    const loadLocalContent = async () => {
      try {
        const todayIso = formatDateISO(new Date())

        const { data: eventos } = await supabase
          .from("dashboard_eventos")
          .select("id,titulo,descripcion,fecha,imagen_url,activo")
          .eq("activo", true)
          .gte("fecha", todayIso)
          .order("fecha", { ascending: true })
          .limit(5)

        if (alive) setEventosBox(eventos ?? [])
      } catch {
        if (alive) setEventosBox([])
      }

      try {
        const { data: ads } = await supabase
          .from("dashboard_publicidad")
          .select("id,titulo,descripcion,imagen_url,url,activo,orden")
          .eq("activo", true)
          .order("orden", { ascending: true })
          .limit(10)

        if (alive) setPublicidades(ads ?? [])
      } catch {
        if (alive) setPublicidades([])
      }
    }

    loadDashboard()
    loadTodayWod()
    loadLocalContent()

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!carouselRef.current || news.length <= 1) return

    const container = carouselRef.current
    let paused = false

    const interval = setInterval(() => {
      if (paused) return
      moveCarousel(container)
    }, 3500)

    const onEnter = () => {
      paused = true
    }

    const onLeave = () => {
      paused = false
    }

    container.addEventListener("mouseenter", onEnter)
    container.addEventListener("mouseleave", onLeave)
    container.addEventListener("touchstart", onEnter, { passive: true })
    container.addEventListener("touchend", onLeave)

    return () => {
      clearInterval(interval)
      container.removeEventListener("mouseenter", onEnter)
      container.removeEventListener("mouseleave", onLeave)
      container.removeEventListener("touchstart", onEnter)
      container.removeEventListener("touchend", onLeave)
    }
  }, [news])

  useEffect(() => {
    if (!publicidadRef.current) return

    const itemsCount = eventosBox.length + publicidades.length
    if (itemsCount <= 1) return

    const container = publicidadRef.current
    let paused = false

    const interval = setInterval(() => {
      if (paused) return
      moveCarousel(container)
    }, 4200)

    const onEnter = () => {
      paused = true
    }

    const onLeave = () => {
      paused = false
    }

    container.addEventListener("mouseenter", onEnter)
    container.addEventListener("mouseleave", onLeave)
    container.addEventListener("touchstart", onEnter, { passive: true })
    container.addEventListener("touchend", onLeave)

    return () => {
      clearInterval(interval)
      container.removeEventListener("mouseenter", onEnter)
      container.removeEventListener("mouseleave", onLeave)
      container.removeEventListener("touchstart", onEnter)
      container.removeEventListener("touchend", onLeave)
    }
  }, [eventosBox, publicidades])

  const adminCoachCards = useMemo(
    () => [
      {
        key: "activos",
        icon: "👥",
        title: "Alumnos Activos",
        value: loading ? "..." : String(stats.activeStudents),
        subtitle: loading ? "Cargando..." : stats.rolesSummary,
        tone: "blue",
      },
      {
        key: "vencimientos",
        icon: "💳",
        title: "Mensualidad por Vencer",
        value: loading ? "..." : String(stats.expiringSoon),
        subtitle: loading ? "Cargando..." : stats.nextExpiringLabel,
        tone: "amber",
      },
      {
        key: "cumpleanos",
        icon: "🎂",
        title: "Cumpleaños Próximos",
        value: loading ? "..." : String(stats.upcomingBirthdays),
        subtitle: loading ? "Cargando..." : stats.nextBirthdayLabel,
        tone: "purple",
      },
    ],
    [loading, stats]
  )

  function openDetailModal(type) {
    setModalType(type)
    setModalOpen(true)
  }

  function closeDetailModal() {
    setModalOpen(false)
    setModalType(null)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-6 md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-orange-500/20 bg-white/5 p-5 shadow-2xl backdrop-blur-xl md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">
              {isAlumno ? "Alumno Module" : "Admin Module"}
            </div>

            <h1 className="text-2xl font-black tracking-tight md:text-4xl">
              Dashboard
            </h1>

            <p className="mt-2 text-sm text-slate-300 md:text-base">
              {isAlumno
                ? "Tu espacio PHO3NIX: WOD del día, novedades, eventos y comunidad."
                : "Resumen general del box, alertas, WOD del día y noticias recientes."}
            </p>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {isAlumno ? (
          <AlumnoDashboardExperience
            loading={loading}
            todayWod={todayWod}
            todayWodLoading={todayWodLoading}
            birthdaysThisMonth={detailRows.birthdaysThisMonthRows}
            todaysBirthdays={detailRows.todaysBirthdaysRows}
            eventosBox={eventosBox}
            publicidades={publicidades}
            publicidadRef={publicidadRef}
            navigate={navigate}
            alumnoExpiringRows={detailRows.alumnoExpiringRows}
            alumnoExpiringLabel={stats.alumnoExpiringLabel}
          />
        ) : (
          <AdminCoachFullscreenDashboard
            loading={loading}
            stats={stats}
            detailRows={detailRows}
            todayWod={todayWod}
            todayWodLoading={todayWodLoading}
            news={news}
            navigate={navigate}
            openDetailModal={openDetailModal}
            setSelectedNews={setSelectedNews}
          />
        )}

        {selectedNews ? (
          <NewsModal news={selectedNews} onClose={() => setSelectedNews(null)} />
        ) : null}

        {modalOpen ? (
          <DashboardDetailModal
            type={modalType}
            rows={detailRows}
            onClose={closeDetailModal}
          />
        ) : null}
      </div>
    </div>
  )
}


function AdminCoachFullscreenDashboard({
  loading,
  stats,
  detailRows,
  todayWod,
  todayWodLoading,
  news,
  navigate,
  openDetailModal,
  setSelectedNews,
}) {
  const statItems = [
    {
      key: "activos",
      icon: "👥",
      title: "Alumnos activos",
      value: loading ? "..." : stats.activeStudents,
      subtitle: loading ? "Cargando..." : stats.rolesSummary,
      tone: "orange",
      action: "Ver alumnos",
      onClick: () => openDetailModal("activos"),
    },
    {
      key: "vencimientos",
      icon: "💳",
      title: "Mensualidades por vencer",
      value: loading ? "..." : stats.expiringSoon,
      subtitle: loading ? "Cargando..." : stats.nextExpiringLabel,
      tone: "amber",
      action: "Ver pendientes",
      onClick: () => openDetailModal("vencimientos"),
    },
    {
      key: "cumpleanos",
      icon: "🎂",
      title: "Cumpleaños este mes",
      value: loading ? "..." : stats.upcomingBirthdays,
      subtitle: loading ? "Cargando..." : stats.nextBirthdayLabel,
      tone: "purple",
      action: "Ver cumpleaños",
      onClick: () => openDetailModal("cumpleanos"),
    },
    {
      key: "anuncios",
      icon: "📣",
      title: "Anuncios activos",
      value: loading ? "..." : news.length,
      subtitle: "Contenido visible para la comunidad",
      tone: "blue",
      action: "Ver anuncios",
      onClick: () => navigate("/admin/anuncios"),
    },
  ]

  const quickActions = [
    {
      icon: "📣",
      title: "Registrar anuncio",
      text: "Publica una novedad con imagen o video.",
      onClick: () => navigate("/admin/anuncios"),
    },
    {
      icon: "🏋️",
      title: "Crear WOD",
      text: "Programa el entrenamiento del día.",
      onClick: () => navigate("/admin/wods"),
    },
    {
      icon: "👤",
      title: "Registrar alumno",
      text: "Gestiona personas y membresías.",
      onClick: () => navigate("/admin/users"),
    },
    {
      icon: "💳",
      title: "Ver mensualidades",
      text: "Revisa vencimientos próximos.",
      onClick: () => openDetailModal("vencimientos"),
    },
  ]

  return (
    <div className="fixed inset-0 z-[80] overflow-hidden bg-[#05070d] text-white">
      <div className="grid h-full grid-cols-[270px_1fr] overflow-hidden">
        <DashboardSidebar navigate={navigate} />

        <DashboardContent
          loading={loading}
          stats={stats}
          statItems={statItems}
          quickActions={quickActions}
          recentNews={(news || []).slice(0, 3)}
          expiringRows={(detailRows.expiringSoonRows || []).slice(0, 3)}
          birthdayRows={(detailRows.upcomingBirthdaysRows || []).slice(0, 3)}
          todayWod={todayWod}
          todayWodLoading={todayWodLoading}
          navigate={navigate}
          openDetailModal={openDetailModal}
          setSelectedNews={setSelectedNews}
          formatHumanDate={formatHumanDate}
          translateNewsTitle={translateNewsTitle}
        />
      </div>
    </div>
  )
}

function AlumnoDashboardExperience({
  loading,
  todayWod,
  todayWodLoading,
  birthdaysThisMonth,
  todaysBirthdays,
  eventosBox,
  publicidades,
  publicidadRef,
  navigate,
  alumnoExpiringRows,
  alumnoExpiringLabel,
}) {
  const heroBirthday = todaysBirthdays?.[0]
  const nextEvent = eventosBox?.[0]
  const visualItems = [
    ...(eventosBox || []).map((item) => ({ ...item, tipoVisual: "Evento" })),
    ...(publicidades || []).map((item) => ({ ...item, tipoVisual: "Publicidad" })),
  ]

  return (
    <>
      <section className="relative mt-6 overflow-hidden rounded-[2rem] border border-orange-500/20 bg-gradient-to-br from-orange-500/15 via-white/[0.06] to-black p-6 shadow-2xl md:p-8">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-red-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(249,115,22,0.18),transparent_32%),radial-gradient(circle_at_20%_100%,rgba(239,68,68,0.13),transparent_28%)]" />

        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-orange-300">
            Hoy en PHO3NIX
          </div>

          <h2 className="mt-5 text-3xl font-black tracking-tight text-white md:text-5xl">
            Renace más fuerte hoy.
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65 md:text-base">
            Revisa tu WOD, novedades del box, eventos activos y movimiento de la comunidad.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-white/80">
              🔥 {todayWod ? "WOD disponible" : "WOD pendiente"}
            </span>

            <span className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-white/80">
              🎂 {heroBirthday ? `${heroBirthday.nombre} cumple hoy` : "Sin cumpleañero hoy"}
            </span>

            <span className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-white/80">
              📢 {nextEvent ? nextEvent.titulo : "Sin evento activo"}
            </span>

            {alumnoExpiringRows.length > 0 ? (
              <span className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-amber-200">
                💳 {alumnoExpiringLabel}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-3xl border border-purple-400/20 bg-purple-500/10 px-4 py-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <span className="shrink-0 text-sm font-bold text-purple-200">
            🎂 Cumpleaños del mes:
          </span>

          {loading ? (
            <span className="text-sm text-white/60">Cargando...</span>
          ) : birthdaysThisMonth.length === 0 ? (
            <span className="text-sm text-white/60">
              No hay cumpleañeros registrados este mes.
            </span>
          ) : (
            <div className="flex flex-wrap gap-2">
              {birthdaysThisMonth.map((item) => (
                <span
                  key={item.id}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/75"
                >
                  {item.nombre} · {String(item.birthDay).padStart(2, "0")}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white/85">WOD del día</h2>
          <span className="text-xs text-white/40">{formatHumanDate(new Date())}</span>
        </div>

        {todayWodLoading ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-sm text-white/60">
            Cargando WOD...
          </div>
        ) : todayWod ? (
          <button
            type="button"
            onClick={() =>
              navigate("/wods", {
                state: { openTodayWodModal: true },
              })
            }
            className="group relative w-full overflow-hidden rounded-[2rem] border border-orange-500/20 bg-black p-6 text-left shadow-2xl transition hover:border-orange-400/40 md:p-8"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-white/[0.04] to-transparent" />
            <div className="absolute -right-16 top-10 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl transition group-hover:bg-orange-500/30" />

            <div className="relative z-10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-orange-300">
                  WOD publicado
                </span>

                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/70">
                  {formatModoRanking(todayWod.modo_ranking)}
                </span>

                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/70">
                  {formatModalidad(todayWod.modalidad)}
                </span>
              </div>

              <h3 className="mt-5 text-3xl font-black text-white md:text-5xl">
                {todayWod.nombre || "WOD del día"}
              </h3>

              <p className="mt-5 max-w-3xl whitespace-pre-line text-sm leading-7 text-white/70 md:text-base">
                {todayWod.descripcion || "Sin descripción disponible."}
              </p>

              <div className="mt-6 inline-flex rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold text-black">
                Registrar resultado →
              </div>
            </div>
          </button>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/5 p-6 text-sm text-white/60">
            No hay WOD publicado para hoy.
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white/85">Promos y eventos</h2>
          <span className="text-xs text-white/40">PHO3NIX</span>
        </div>

        <div
          ref={publicidadRef}
          className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {visualItems.length === 0 ? (
            <div className="w-full rounded-[2rem] border border-dashed border-white/10 bg-white/5 p-6 text-sm text-white/60">
              Aquí aparecerán eventos, promociones y publicidad agregada por Coach/Admin.
            </div>
          ) : (
            visualItems.map((item, index) => {
              const Wrapper = item.url ? "a" : "div"
              const wrapperProps = item.url
                ? {
                    href: item.url,
                    target: "_blank",
                    rel: "noreferrer",
                  }
                : {}

              return (
                <Wrapper
                  key={`${item.tipoVisual}-${item.id || index}`}
                  {...wrapperProps}
                  data-news-card
                  className="relative h-[260px] w-[310px] shrink-0 snap-start overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 md:w-[460px]"
                >
                  <img
                    src={item.imagen_url || "/images/news-default.jpg"}
                    alt={item.titulo || "PHO3NIX"}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/images/news-default.jpg"
                    }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <span className="rounded-full border border-orange-400/20 bg-orange-500/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-orange-300">
                      {item.tipoVisual}
                    </span>

                    <h3 className="mt-3 text-xl font-black text-white">
                      {item.titulo || "Anuncio PHO3NIX"}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-sm text-white/65">
                      {item.descripcion || "Sin descripción disponible."}
                    </p>
                  </div>
                </Wrapper>
              )
            })
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white/85">Timeline del box</h2>

        <div className="mt-4 space-y-4 border-l border-orange-500/25 pl-5">
          {todaysBirthdays.length > 0 ? (
            todaysBirthdays.map((item) => (
              <TimelineItem
                key={`birthday-${item.id}`}
                icon="🎂"
                title={`${item.nombre} está de cumpleaños`}
                text="Hoy la comunidad PHO3NIX celebra un cumpleaños."
              />
            ))
          ) : (
            <TimelineItem
              icon="🎂"
              title="Sin cumpleañeros hoy"
              text="Los cumpleaños del mes aparecen en la barra superior."
            />
          )}

          {eventosBox.length > 0 ? (
            eventosBox.map((item) => (
              <TimelineItem
                key={`event-${item.id}`}
                icon="📢"
                title={item.titulo || "Evento PHO3NIX"}
                text={item.descripcion || "Evento agregado por el equipo del box."}
              />
            ))
          ) : (
            <TimelineItem
              icon="📢"
              title="Sin eventos activos"
              text="Cuando el coach o admin agregue eventos, aparecerán aquí."
            />
          )}

          {alumnoExpiringRows.length > 0 ? (
            <TimelineItem
              icon="💳"
              title="Mensualidad por vencer"
              text={alumnoExpiringLabel}
            />
          ) : null}
        </div>
      </section>

      <QuickAccessSection navigate={navigate} />
    </>
  )
}

function TimelineItem({ icon, title, text }) {
  return (
    <div className="relative">
      <div className="absolute -left-[31px] top-1 flex h-7 w-7 items-center justify-center rounded-full border border-orange-400/30 bg-slate-950 text-sm">
        {icon}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <h3 className="font-bold text-white">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-white/60">{text}</p>
      </div>
    </div>
  )
}

function NoticiasCrossfitSection({ loading, news, carouselRef, setSelectedNews }) {
  return (
    <div className="mt-10">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-white/85 text-lg font-semibold">Noticias CrossFit</h2>
        <span className="text-xs text-white/45">Últimos 15 días</span>
      </div>

      {loading ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/60">
          Cargando noticias...
        </div>
      ) : news.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/60">
          Aún no hay noticias cargadas.
        </div>
      ) : (
        <div className="mt-4">
          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {news.map((item) => (
              <button
                key={item.id}
                data-news-card
                type="button"
                onClick={() => setSelectedNews(item)}
                className="snap-start shrink-0 w-[290px] sm:w-[340px] text-left rounded-3xl border border-white/10 bg-white/5 overflow-hidden hover:bg-white/[0.07] transition"
              >
                <div className="relative h-36 w-full overflow-hidden">
                  <img
                    src={item.imagen_url || "/images/news-default.jpg"}
                    alt={item.titulo || "Noticia CrossFit"}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/images/news-default.jpg"
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="rounded-md border border-orange-400/20 bg-orange-500/20 px-2 py-1 text-orange-300">
                        {item.fuente || "CrossFit"}
                      </span>
                      <span className="text-white/75">
                        {formatHumanDate(item.fecha_publicacion)}
                      </span>
                    </div>

                    <div className="mt-2 text-base font-semibold text-white line-clamp-2">
                      {translateNewsTitle(item.titulo)}
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <p className="text-sm text-white/65 line-clamp-4 min-h-[84px]">
                    {translateNewsSummary(item.resumen || item.contenido)}
                  </p>

                  <div className="mt-4 inline-flex rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-medium text-white">
                    Ver más
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function QuickAccessSection({ navigate }) {
  return (
    <div className="mt-10">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-white/85 text-lg font-semibold">Acceso rápido</h2>
        <span className="text-xs text-white/45">Módulos principales</span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => navigate("/registrar-rm")}
          className="group rounded-3xl border border-white/10 bg-white/5 p-5 text-left transition hover:bg-white/[0.07]"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">
            Strength Tracking
          </div>

          <h3 className="mt-4 text-xl font-bold text-white">RM</h3>

          <p className="mt-2 text-sm text-white/65">
            Registra marcas personales, revisa evolución y consulta el ranking por ejercicio.
          </p>

          <div className="mt-5 text-sm font-medium text-orange-300 group-hover:text-orange-200">
            Ir a RM →
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            navigate("/wods", {
              state: { openTodayWodModal: true },
            })
          }
          className="group rounded-3xl border border-white/10 bg-white/5 p-5 text-left transition hover:bg-white/[0.07]"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">
            Weekly Training
          </div>

          <h3 className="mt-4 text-xl font-bold text-white">WOD</h3>

          <p className="mt-2 text-sm text-white/65">
            Consulta los WODs semanales, rankings por entrenamiento y registra resultados del día.
          </p>

          <div className="mt-5 text-sm font-medium text-orange-300 group-hover:text-orange-200">
            Ir a WOD →
          </div>
        </button>
      </div>
    </div>
  )
}

function DashboardDetailModal({ type, rows, onClose }) {
  const config = getModalConfig(type, rows)

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute left-1/2 top-1/2 w-[94vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-white/10 bg-[#0b0f14] shadow-2xl">
        <div className="border-b border-white/10 bg-gradient-to-br from-orange-500/10 via-white/5 to-blue-500/10 p-5 sm:p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-orange-300">
            Dashboard Detail
          </div>

          <h3 className="mt-2 text-xl font-semibold text-white sm:text-2xl">
            {config.title}
          </h3>

          <p className="mt-2 text-sm text-white/60">
            {config.count} registro(s)
          </p>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-5 sm:p-6">
          {config.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-sm text-white/60">
              No hay registros para mostrar.
            </div>
          ) : (
            <div className="space-y-3">
              {config.items.map((item, index) => (
                <div
                  key={item.id ?? `${item.nombre}-${index}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-white">{item.nombre}</p>
                    {item.secondary ? (
                      <p className="mt-1 text-sm text-white/60">{item.secondary}</p>
                    ) : null}
                  </div>

                  {item.badge ? (
                    <div className="shrink-0 rounded-xl border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80">
                      {item.badge}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-white/10 p-5 sm:p-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

function getModalConfig(type, rows) {
  if (type === "activos") {
    const items = (rows.activeStudentsRows || []).map((item) => ({
      id: item.id,
      nombre: item.nombre,
    }))

    return {
      title: "Alumnos Activos",
      count: items.length,
      items,
    }
  }

  if (type === "vencimientos" || type === "vencimientos-alumno") {
    const sourceRows =
      type === "vencimientos-alumno"
        ? rows.alumnoExpiringRows || []
        : rows.expiringSoonRows || []

    const items = sourceRows.map((item) => ({
      id: item.id,
      nombre: item.nombre,
      secondary: `Vence: ${formatDateDMY(item.fechaFin)}`,
      badge: item.diffDays === 0 ? "Hoy" : `${item.diffDays} día(s)`,
    }))

    return {
      title: "Mensualidad por Vencer",
      count: items.length,
      items,
    }
  }

  if (type === "cumpleanos") {
    const items = (rows.upcomingBirthdaysRows || []).map((item) => ({
      id: item.id,
      nombre: item.nombre,
      secondary: `Cumpleaños: ${formatHumanDate(item.nextBirthday)}`,
      badge: item.daysUntil === 0 ? "Hoy" : `${item.daysUntil} día(s)`,
    }))

    return {
      title: "Cumpleaños Próximos",
      count: items.length,
      items,
    }
  }

  return {
    title: "Detalle",
    count: 0,
    items: [],
  }
}

function NewsModal({ news, onClose }) {
  const translatedTitle = translateNewsTitle(news.titulo)
  const translatedSummary = translateNewsSummary(news.resumen)
  const translatedContent = translateNewsContent(news.contenido || news.resumen)

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[94vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-white/10 bg-[#0b0f14] shadow-2xl">
        <div className="relative h-52 w-full overflow-hidden">
          <img
            src={news.imagen_url || "/images/news-default.jpg"}
            alt={news.titulo || "Noticia CrossFit"}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "/images/news-default.jpg"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex items-end">
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2 text-xs text-white/75">
                <span className="rounded-md border border-orange-400/20 bg-orange-500/20 px-2 py-1 text-orange-300">
                  {news.fuente || "CrossFit"}
                </span>
                <span>{formatHumanDate(news.fecha_publicacion)}</span>
              </div>
              <h3 className="mt-2 text-xl sm:text-2xl font-semibold text-white">
                {translatedTitle}
              </h3>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="text-sm leading-6 text-white/75 whitespace-pre-line">
            {translatedContent || translatedSummary || "Sin detalles disponibles."}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {news.url ? (
              <a
                href={news.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
              >
                Abrir noticia original
              </a>
            ) : null}

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function moveCarousel(container) {
  const card = container.querySelector("[data-news-card]")
  if (!card) return

  const cardWidth = card.getBoundingClientRect().width + 16
  const maxScroll = container.scrollWidth - container.clientWidth

  if (container.scrollLeft + cardWidth >= maxScroll) {
    container.scrollTo({ left: 0, behavior: "smooth" })
  } else {
    container.scrollBy({ left: cardWidth, behavior: "smooth" })
  }
}

function normalizeRole(role) {
  const r = String(role || "").trim().toLowerCase()
  if (r === "admin" || r === "administrador") return "admin"
  if (r === "coach") return "coach"
  if (r === "alumno" || r === "student") return "alumno"
  return r
}

function daysBetween(fromDate, toDate) {
  const start = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())
  const end = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate())
  const ms = end.getTime() - start.getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

function getNextBirthday(fechaNacimiento, today) {
  const [, month, day] = String(fechaNacimiento).split("-").map(Number)
  let next = new Date(today.getFullYear(), month - 1, day)

  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  if (next < todayOnly) {
    next = new Date(today.getFullYear() + 1, month - 1, day)
  }

  return next
}

function formatHumanDate(dateInput) {
  try {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
    return new Intl.DateTimeFormat("es-EC", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date)
  } catch {
    return String(dateInput)
  }
}

function formatDateDMY(value) {
  if (!value) return "-"
  try {
    const [y, m, d] = String(value).split("-")
    if (!y || !m || !d) return String(value)
    return `${d}/${m}/${y}`
  } catch {
    return String(value)
  }
}

function formatDateISO(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatModoRanking(modo) {
  const m = String(modo || "").trim().toLowerCase()

  if (m === "sin_ranking") return "Sin ranking"
  if (m === "menor_es_mejor") return "Menor tiempo"
  if (m === "mayor_es_mejor") return "Más repeticiones"

  return "Ranking"
}

function formatModalidad(modalidad) {
  const m = String(modalidad || "").trim().toLowerCase()

  if (m === "single") return "Single"
  if (m === "duo") return "Duo"
  if (m === "trio") return "Trio"

  return "Single"
}

function translateNewsTitle(text) {
  if (!text) return "Sin título"

  let t = String(text)

  const replacements = [
    ["Behind the Scenes of", "Detrás de cámaras de"],
    ["CrossFit Open", "Open de CrossFit"],
    ["Open Workout", "WOD del Open"],
    ["Workout", "Entrenamiento"],
    ["Announcement", "Anuncio"],
    ["Live Announcement", "Anuncio en vivo"],
    ["Released", "Publicado"],
    ["Update", "Actualización"],
    ["Recap", "Resumen"],
    ["Tickets", "Entradas"],
    ["Season", "Temporada"],
    ["Week 1", "Semana 1"],
    ["Week 2", "Semana 2"],
    ["Week 3", "Semana 3"],
    ["Quarterfinals", "Cuartos de final"],
    ["Semifinals", "Semifinales"],
  ]

  replacements.forEach(([from, to]) => {
    t = t.replaceAll(from, to)
  })

  return t
}

function translateNewsSummary(text) {
  if (!text) return "Sin resumen disponible."

  let t = String(text)

  const replacements = [
    ["Step inside", "Adéntrate en"],
    ["go behind the scenes", "mira detrás de cámaras"],
    ["comes to life", "cobra vida"],
    ["This week", "Esta semana"],
    ["watch", "mira"],
    ["announcement", "anuncio"],
    ["ticket", "entrada"],
    ["tickets", "entradas"],
    ["season", "temporada"],
    ["week", "semana"],
    ["athletes", "atletas"],
    ["athlete", "atleta"],
    ["event", "evento"],
    ["events", "eventos"],
    ["competition", "competencia"],
    ["competitions", "competencias"],
    ["presented by", "presentado por"],
    ["take a look at", "mira"],
    ["learn more", "conoce más"],
  ]

  replacements.forEach(([from, to]) => {
    t = t.replaceAll(from, to)
    t = t.replaceAll(from.toLowerCase(), to.toLowerCase())
  })

  return t
}

function translateNewsContent(text) {
  if (!text) return null

  return String(text)
    .split("\n\n")
    .map((part) => translateNewsSummary(part))
    .join("\n\n")
}
