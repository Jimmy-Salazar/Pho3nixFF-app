import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../supabase"
import StatCard from "./components/StatCard"
import HeroCard from "./components/HeroCard"
import { mensualidadStatusInfo } from "../../utils/mensualidades"

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

  const [stats, setStats] = useState({
    totalPeople: 0,
    activeStudents: 0,
    expiringSoon: 0,
    upcomingBirthdays: 0,
    nextBirthdayLabel: "Sin próximos cumpleaños",
    nextExpiringLabel: "Sin vencimientos próximos",
    rolesSummary: "Sin datos",
  })

  const [detailRows, setDetailRows] = useState({
    activeStudentsRows: [],
    expiringSoonRows: [],
    upcomingBirthdaysRows: [],
  })

  const carouselRef = useRef(null)

  useEffect(() => {
    let alive = true

    const loadDashboard = async () => {
      try {
        setLoading(true)
        setError("")

        const { data: users, error: usersError } = await supabase
          .from("usuarios")
          .select("id,nombre,email,role,fecha_nacimiento")

        if (usersError) throw usersError
        const safeUsers = users ?? []

        const { data: mensualidades, error: mensualidadesError } = await supabase
          .from("mensualidades")
          .select("id,usuario_id,fecha_inicio,fecha_fin,estado,created_at")
          .order("fecha_fin", { ascending: false })
          .order("created_at", { ascending: false })

        if (mensualidadesError) throw mensualidadesError
        const safeMens = mensualidades ?? []

        const cutoffIso = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()

        const { data: noticias, error: noticiasError } = await supabase
          .from("noticias")
          .select("id,titulo,resumen,contenido,fuente,url,imagen_url,fecha_publicacion,categoria")
          .eq("activo", true)
          .gte("fecha_publicacion", cutoffIso)
          .order("fecha_publicacion", { ascending: false })
          .limit(12)

        if (noticiasError) throw noticiasError

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
            expiringSoonRows.push({
              id: u.id,
              nombre: u.nombre,
              fechaFin: m.fecha_fin,
              diffDays: info.daysLeft,
            })
          }
        }

        activeStudentsRows.sort((a, b) => a.nombre.localeCompare(b.nombre))
        expiringSoonRows.sort((a, b) => a.diffDays - b.diffDays)

        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        const upcomingBirthdaysRows = safeUsers
          .filter((u) => !!u.fecha_nacimiento)
          .map((u) => {
            const nextBirthday = getNextBirthday(u.fecha_nacimiento, today)
            return {
              id: u.id,
              nombre: u.nombre,
              nextBirthday,
              fechaNacimiento: u.fecha_nacimiento,
              daysUntil: daysBetween(today, nextBirthday),
            }
          })
          .filter((x) => x.daysUntil >= 0 && x.daysUntil <= 30)
          .sort((a, b) => a.daysUntil - b.daysUntil)

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

        setStats({
          totalPeople: safeUsers.length,
          activeStudents,
          expiringSoon: expiringSoonRows.length,
          upcomingBirthdays: upcomingBirthdaysRows.length,
          nextBirthdayLabel,
          nextExpiringLabel,
          rolesSummary,
        })

        setDetailRows({
          activeStudentsRows,
          expiringSoonRows,
          upcomingBirthdaysRows,
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

    loadDashboard()
    loadTodayWod()

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
      const card = container.querySelector("[data-news-card]")
      if (!card) return

      const cardWidth = card.getBoundingClientRect().width + 16
      const maxScroll = container.scrollWidth - container.clientWidth

      if (container.scrollLeft + cardWidth >= maxScroll) {
        container.scrollTo({ left: 0, behavior: "smooth" })
      } else {
        container.scrollBy({ left: cardWidth, behavior: "smooth" })
      }
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

  const cards = useMemo(
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
              Admin Module
            </div>

            <h1 className="text-2xl font-black tracking-tight md:text-4xl">
              Dashboard
            </h1>

            <p className="mt-2 text-sm text-slate-300 md:text-base">
              Resumen general del box, alertas, WOD del día y noticias recientes.
            </p>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <StatCard
              key={card.key}
              icon={card.icon}
              title={card.title}
              value={card.value}
              subtitle={card.subtitle}
              tone={card.tone}
              onClick={() => openDetailModal(card.key)}
            />
          ))}
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-white/85 text-lg font-semibold">WOD del día</h2>
            <span className="text-xs text-white/45">{formatHumanDate(new Date())}</span>
          </div>

          <div className="mt-4">
            {todayWodLoading ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
                Cargando WOD del día...
              </div>
            ) : todayWod ? (
              <button
                type="button"
                onClick={() =>
                  navigate("/wods", {
                    state: { openTodayWodModal: true },
                  })
                }
                className="w-full rounded-3xl border border-orange-500/20 bg-white/5 p-5 text-left shadow-2xl backdrop-blur-xl transition hover:bg-white/[0.07]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">
                    WOD Publicado
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/75">
                      {formatModoRanking(todayWod.modo_ranking)}
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/75">
                      {formatModalidad(todayWod.modalidad)}
                    </div>
                  </div>
                </div>

                <h3 className="mt-4 text-xl font-black text-white">
                  {todayWod.nombre || "WOD del día"}
                </h3>

                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-white/70">
                  {todayWod.descripcion || "Sin descripción disponible."}
                </p>

                <div className="mt-5 text-sm font-medium text-orange-300">
                  Tocar para registrar ranking →
                </div>
              </button>
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-5 text-sm text-white/60">
                No hay WOD publicado para hoy.
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-white/85 text-lg font-semibold">Alertas</h2>

          <div className="mt-4 grid grid-cols-1 gap-4">
            <HeroCard
              title="Resumen del Box"
              dateText={formatHumanDate(new Date())}
              description={
                loading
                  ? "Cargando información..."
                  : `Hoy tienes ${stats.activeStudents} alumno(s) activos, ${stats.expiringSoon} mensualidad(es) próximas a vencer y ${stats.upcomingBirthdays} cumpleaños próximos.`
              }
              ctaText="Actualizar"
              onCta={() => window.location.reload()}
            />
          </div>
        </div>

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
                        <div className="text-[11px] text-white/75">
                          {item.fuente} • {formatHumanDate(item.fecha_publicacion)}
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

  if (type === "vencimientos") {
    const items = (rows.expiringSoonRows || []).map((item) => ({
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
              <div className="text-xs text-white/75">
                {news.fuente} • {formatHumanDate(news.fecha_publicacion)}
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