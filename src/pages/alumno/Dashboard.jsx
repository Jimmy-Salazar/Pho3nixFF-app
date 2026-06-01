import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../supabase"
import { mensualidadStatusInfo } from "../../utils/mensualidades"

import AlumnoSidebar from "./dashboard/components/AlumnoSidebar"
import AlumnoTopBar from "./dashboard/components/AlumnoTopBar"
import WodTodayCard from "./dashboard/components/WodTodayCard"
import AlumnoStatCard from "./dashboard/components/AlumnoStatCard"
import ChallengeAlumnoCard from "./dashboard/components/ChallengeAlumnoCard"
import AnnouncementsPanel from "./dashboard/components/AnnouncementsPanel"
import WeekProgressCard from "./dashboard/components/WeekProgressCard"
import BirthdayGreetingCard from "./dashboard/components/BirthdayGreetingCard"

import AlumnoMobileHeader from "./shared/AlumnoMobileHeader"
import AlumnoMobileNav from "./shared/AlumnoMobileNav"

import {
  formatDateISO,
  formatShortDate,
  getCurrentWeekRange,
  getInitials,
  getMembershipLabel,
  getUpcomingBirthdays,
  normalizeRole,
} from "./dashboard/utils/alumnoDashboardUtils"

const defaultDashboard = {
  profile: null,
  mensualidad: null,
  mensualidadInfo: null,
  todayWod: null,
  birthdaysThisMonth: [],
  activeChallenge: null,
  prCount: 0,
  latestPr: null,
  userBirthdayToday: false,
  weekAttendanceCount: 0,
  weekTarget: 5,
  activeChallengesCount: 0,
}

export default function AlumnoDashboard() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [data, setData] = useState(defaultDashboard)

  useEffect(() => {
    let alive = true

    async function loadAlumnoDashboard() {
      try {
        setLoading(true)
        setError("")

        const { data: authData, error: authError } =
          await supabase.auth.getUser()

        if (authError) throw authError

        const authUser = authData?.user

        if (!authUser?.id) {
          throw new Error("No se encontró una sesión activa.")
        }

        const now = new Date()
        const todayIso = formatDateISO(now)
        const { startIso, endIso } = getCurrentWeekRange(now)

        const { data: profileData, error: profileError } = await supabase
          .from("usuarios")
          .select("id,nombre,email,role,fecha_nacimiento")
          .eq("id", authUser.id)
          .maybeSingle()

        if (profileError) throw profileError

        const profile = profileData || {
          id: authUser.id,
          nombre: authUser.email || "Alumno PHO3NIX",
          email: authUser.email,
          role: "alumno",
          fecha_nacimiento: null,
        }

        const role = normalizeRole(profile.role)

        if (role !== "alumno") {
          console.warn(
            "Esta vista está pensada para alumnos. Rol detectado:",
            role
          )
        }

        const userBirthdayToday = isBirthdayToday(profile.fecha_nacimiento, now)

        const [
          mensualidadResult,
          wodResult,
          birthdaysResult,
          challengeResult,
          prCountResult,
          asistenciaResult,
        ] = await Promise.all([
          safeQuery("mensualidad", async () => {
            const { data, error } = await supabase
              .from("mensualidades")
              .select("id,usuario_id,fecha_inicio,fecha_fin,estado,created_at")
              .eq("usuario_id", authUser.id)
              .order("fecha_fin", { ascending: false })
              .order("created_at", { ascending: false })
              .limit(1)

            if (error) throw error
            return data?.[0] || null
          }),

          safeQuery("wod", async () => {
            const { data, error } = await supabase
              .from("wod")
              .select(
                "id,nombre,descripcion,modo_ranking,modalidad,fecha,activo,publicado,fecha_publicacion"
              )
              .eq("fecha", todayIso)
              .eq("activo", true)
              .limit(5)

            if (error) throw error

            const rows = data || []

            const visibles = rows.filter((item) => {
              if (item.publicado === true && item.fecha_publicacion) {
                return new Date(item.fecha_publicacion) <= now
              }

              return true
            })

            return visibles[0] || null
          }),

          safeQuery("cumpleaños", async () => {
            const { data, error } = await supabase
              .from("usuarios")
              .select("id,nombre,fecha_nacimiento")
              .not("fecha_nacimiento", "is", null)

            if (error) throw error
            return getUpcomingBirthdays(data || [], now, 12)
          }, []),

          safeQuery("challenge", async () => {
            const { data, error } = await supabase
              .from("competencias")
              .select(
                "id,titulo,descripcion,fecha_inicio_competencia,fecha_inicio,fecha_fin,estado,activo"
              )
              .eq("activo", true)
              .in("estado", ["publicado", "activa"])
              .order("created_at", { ascending: false })
              .limit(3)

            if (error) throw error

            return {
              activeChallenge: data?.[0] || null,
              activeChallengesCount: data?.length || 0,
            }
          }),

          safeQuery(
            "rm",
            async () => {
              const { data, error } = await supabase
                .from("rm")
                .select("id,usuario,ejercicio_id,peso_libras,fecha,created_at")
                .eq("usuario", authUser.id)
                .order("fecha", { ascending: false })
                .order("created_at", { ascending: false })

              if (error) throw error

              const rows = data || []

              return {
                count: rows.length,
                latest: rows[0] || null,
              }
            },
            { count: 0, latest: null }
          ),

          safeQuery("asistencia", async () => {
            const { data, error } = await supabase
              .from("asistencia")
              .select("id,fecha,usuario_id")
              .eq("usuario_id", authUser.id)
              .gte("fecha", startIso)
              .lte("fecha", endIso)

            if (error) throw error
            return data?.length || 0
          }, 0),
        ])

        const mensualidad = mensualidadResult || null

        const mensualidadInfo = mensualidad
          ? mensualidadStatusInfo(mensualidad, now)
          : null

        if (!alive) return

        setData({
          profile,
          mensualidad,
          mensualidadInfo,
          todayWod: wodResult || null,
          birthdaysThisMonth: birthdaysResult || [],
          activeChallenge: challengeResult?.activeChallenge || null,
          activeChallengesCount: challengeResult?.activeChallengesCount || 0,
          prCount: prCountResult?.count || 0,
          latestPr: prCountResult?.latest || null,
          userBirthdayToday,
          weekAttendanceCount: asistenciaResult || 0,
          weekTarget: 5,
        })
      } catch (err) {
        console.error("ERROR ALUMNO DASHBOARD:", err)

        if (alive) {
          setError(err.message || "No se pudo cargar el dashboard del alumno.")
        }
      } finally {
        if (alive) setLoading(false)
      }
    }

    loadAlumnoDashboard()

    return () => {
      alive = false
    }
  }, [])

  const membership = useMemo(() => {
    return getMembershipLabel(data.mensualidad, data.mensualidadInfo)
  }, [data.mensualidad, data.mensualidadInfo])

  const profileName = data.profile?.nombre || "Alumno PHO3NIX"
  const initials = getInitials(profileName)

  return (
    <div className="fixed inset-0 z-[70] w-screen max-w-full overflow-hidden bg-[#050505] text-white">
      <div className="grid h-full w-full max-w-full grid-cols-1 overflow-hidden lg:grid-cols-[270px_minmax(0,1fr)]">
        <AlumnoSidebar navigate={navigate} membership={membership} />

        <main className="min-w-0 w-full max-w-full overflow-x-hidden overflow-y-auto bg-[#050505] lg:overflow-hidden">
          <section className="relative min-h-dvh w-full max-w-full overflow-x-hidden p-3 pb-28 sm:p-4 sm:pb-28 lg:h-dvh lg:overflow-hidden lg:p-4">
            <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-orange-600/20 blur-3xl" />
            <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-red-600/10 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />

            <div className="relative mx-auto flex min-h-dvh w-full max-w-[1680px] flex-col gap-3 overflow-x-hidden lg:h-full lg:min-h-0 lg:overflow-hidden">
              <AlumnoMobileHeader
                name={profileName}
                initials={initials}
                email={data.profile?.email}
                membership={membership}
                loading={loading}
              />

              <div className="hidden min-w-0 w-full max-w-full lg:block">
                <AlumnoTopBar
                  name={profileName}
                  initials={initials}
                  email={data.profile?.email}
                  membership={membership}
                  loading={loading}
                />
              </div>

              {data.userBirthdayToday ? (
                <div className="min-w-0 w-full max-w-full">
                  <BirthdayGreetingCard name={profileName} />
                </div>
              ) : null}

              {error ? (
                <div className="shrink-0 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <section className="grid min-w-0 w-full max-w-full shrink-0 gap-3 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                <div className="min-w-0 w-full max-w-full">
                  <WodTodayCard
                    wod={data.todayWod}
                    loading={loading}
                    onView={() =>
                      navigate("/alumno/wods", {
                        state: { openTodayWodModal: true },
                      })
                    }
                  />
                </div>

                <div className="grid min-w-0 w-full max-w-full grid-cols-3 gap-2 sm:gap-3">
                  <AlumnoStatCard
                    icon="🏋️"
                    label="Mis PR registrados"
                    value={loading ? "..." : data.prCount}
                    footer={
                      data.latestPr?.peso_libras
                        ? `Último: ${data.latestPr.peso_libras} lb · ${formatShortDate(
                            data.latestPr.fecha
                          )}`
                        : "Sin marcas"
                    }
                    tone="orange"
                  />

                  <AlumnoStatCard
                    icon="📅"
                    label="Esta semana"
                    value={loading ? "..." : data.weekAttendanceCount}
                    footer={`de ${data.weekTarget} programados`}
                    tone="amber"
                  />

                  <AlumnoStatCard
                    icon="🎯"
                    label="Retos activos"
                    value={loading ? "..." : data.activeChallengesCount}
                    footer={
                      data.activeChallengesCount > 0
                        ? "Sigue avanzando"
                        : "Sin retos"
                    }
                    tone="red"
                  />
                </div>
              </section>

              <section className="grid min-h-0 min-w-0 w-full max-w-full flex-1 gap-3 overflow-x-hidden md:grid-cols-2 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,0.85fr)_minmax(0,1fr)_minmax(0,0.95fr)]">
                <div className="min-w-0 w-full max-w-full">
                  <ChallengeAlumnoCard
                    challenge={data.activeChallenge}
                    loading={loading}
                    onView={() => navigate("/competencias")}
                  />
                </div>

                <div className="min-w-0 w-full max-w-full">
                  <WeekProgressCard
                    completed={data.weekAttendanceCount}
                    target={data.weekTarget}
                  />
                </div>

                <div className="min-w-0 w-full max-w-full">
                  <AnnouncementsPanel />
                </div>

                <div className="min-w-0 w-full max-w-full">
                  <CommunityCard
                    birthdays={data.birthdaysThisMonth}
                    loading={loading}
                  />
                </div>
              </section>
            </div>
          </section>
        </main>
      </div>

      <AlumnoMobileNav />
    </div>
  )
}

function CommunityCard({ birthdays = [], loading = false }) {
  const [birthdayPage, setBirthdayPage] = useState(0)

  const groups = useMemo(() => {
    const chunks = []

    for (let i = 0; i < birthdays.length; i += 3) {
      chunks.push(birthdays.slice(i, i + 3))
    }

    return chunks
  }, [birthdays])

  useEffect(() => {
    if (birthdayPage > 0 && birthdayPage >= groups.length) {
      setBirthdayPage(0)
    }
  }, [birthdayPage, groups.length])

  const currentGroup = groups[birthdayPage] || []

  const nextGroup = () => {
    if (groups.length <= 1) return
    setBirthdayPage((current) => (current + 1) % groups.length)
  }

  const prevGroup = () => {
    if (groups.length <= 1) return
    setBirthdayPage((current) =>
      current === 0 ? groups.length - 1 : current - 1
    )
  }

  return (
    <article className="relative h-full min-h-[320px] min-w-0 w-full max-w-full overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 p-4 shadow-2xl shadow-black/30 lg:min-h-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_35%,rgba(249,115,22,0.18),transparent_34%)]" />

      <div className="relative z-10 flex h-full min-w-0 flex-col">
        <div className="mb-3 flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-black uppercase tracking-[0.22em] text-orange-400">
              Comunidad PHO3NIX
            </p>

            <h3 className="mt-1 truncate text-xl font-black uppercase text-white">
              Próximos cumpleaños
            </h3>
          </div>

          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={prevGroup}
              disabled={groups.length <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-500/25 text-orange-300 transition hover:bg-orange-500/10 disabled:opacity-30"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={nextGroup}
              disabled={groups.length <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-500/25 text-orange-300 transition hover:bg-orange-500/10 disabled:opacity-30"
            >
              ›
            </button>
          </div>
        </div>

        {loading ? (
          <EmptyCard text="Cargando cumpleaños..." />
        ) : currentGroup.length === 0 ? (
          <EmptyCard text="No hay próximos cumpleaños registrados." />
        ) : (
          <div className="grid min-h-0 min-w-0 flex-1 gap-3">
            {currentGroup.map((item) => (
              <article
                key={item.id}
                className={[
                  "grid min-w-0 grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border p-3 sm:grid-cols-[46px_minmax(0,1fr)_auto]",
                  item.daysUntil === 0
                    ? "border-orange-500/35 bg-orange-500/10"
                    : "border-white/10 bg-white/[0.03]",
                ].join(" ")}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-orange-500/25 bg-orange-500/10 text-xs font-black text-orange-300 sm:h-11 sm:w-11 sm:text-sm">
                  {getInitials(item.nombre)}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-black uppercase text-white">
                    {item.daysUntil === 0 ? "Hoy · " : ""}
                    {item.nombre}
                  </p>

                  <p className="mt-1 truncate text-xs text-white/45">
                    {item.day} de {item.monthLabel}
                    {item.daysUntil === 0
                      ? " · Hoy"
                      : ` · en ${item.daysUntil} día(s)`}
                  </p>
                </div>

                <div className="shrink-0 text-xl">🎂</div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-3 flex min-w-0 items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
          <span className="min-w-0 truncate">
            {birthdays.length} próximos cumpleaños
          </span>

          <span className="shrink-0 text-orange-400">
            {groups.length > 0 ? birthdayPage + 1 : 0}/{groups.length || 0}
          </span>
        </div>
      </div>
    </article>
  )
}

function EmptyCard({ text }) {
  return (
    <div className="min-w-0 rounded-2xl border border-dashed border-white/10 bg-black/25 p-4 text-sm text-white/40">
      {text}
    </div>
  )
}

function isBirthdayToday(fechaNacimiento, date = new Date()) {
  if (!fechaNacimiento) return false

  const parts = String(fechaNacimiento).split("-").map(Number)
  const month = parts[1]
  const day = parts[2]

  if (!month || !day) return false

  return month === date.getMonth() + 1 && day === date.getDate()
}

async function safeQuery(label, callback, fallback = null) {
  try {
    return await callback()
  } catch (err) {
    console.warn(`Consulta opcional falló: ${label}`, err)
    return fallback
  }
}