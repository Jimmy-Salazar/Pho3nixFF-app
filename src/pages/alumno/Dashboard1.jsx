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
import pho3nixLogo from "../../assets/pho3nix-login-logo.png"

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
  weekWodResultCount: 0,
  weekWodTarget: 6,
  weekWodRegisteredDays: [],
  weekCaloriesTotal: 0,
  weekCaloriesTarget: 6000,
  weekCaloriesPercent: 0,
  weekCaloriesSeries: [0, 0, 0, 0, 0, 0, 0],
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
          .select("id,nombre,email,role,fecha_nacimiento,foto_url")
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
          wodWeekResult,
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

          safeQuery(
            "wod_resultados_semana",
            async () => {
              const { data, error } = await supabase
                .from("wod_resultados")
                .select(
                  `
                  id,
                  wod_id,
                  usuario_id,
                  fecha,
                  created_at,
                  calorias_estimadas,
                  wod:wod_id (
                    id,
                    calorias_max
                  )
                `
                )
                .eq("usuario_id", authUser.id)
                .gte("fecha", startIso)
                .lte("fecha", endIso)
                .order("fecha", { ascending: true })

              if (error) throw error

              const uniqueByWod = new Map()

              ;(data || []).forEach((item) => {
                const key = item.wod_id || item.id

                if (!uniqueByWod.has(key)) {
                  uniqueByWod.set(key, item)
                }
              })

              const rows = Array.from(uniqueByWod.values())
              const registeredDays = Array.from(
                new Set(
                  rows
                    .map((item) => item.fecha)
                    .filter(Boolean)
                )
              )

              const caloriesTotal = rows.reduce((sum, item) => {
                const maxCalories = Number(item.wod?.calorias_max || 0)
                const savedCalories = Number(item.calorias_estimadas || 0)
                const value = maxCalories > 0 ? maxCalories : savedCalories

                return sum + Number(value || 0)
              }, 0)

              const caloriesByDay = [0, 0, 0, 0, 0, 0, 0]

              rows.forEach((item) => {
                if (!item.fecha) return

                const date = new Date(`${String(item.fecha).slice(0, 10)}T00:00:00`)
                if (Number.isNaN(date.getTime())) return

                const day = date.getDay()
                const index = day === 0 ? 6 : day - 1

                const maxCalories = Number(item.wod?.calorias_max || 0)
                const savedCalories = Number(item.calorias_estimadas || 0)
                const value = maxCalories > 0 ? maxCalories : savedCalories

                caloriesByDay[index] += Number(value || 0)
              })

              const cumulativeSeries = []
              let runningTotal = 0

              caloriesByDay.forEach((value) => {
                runningTotal += Number(value || 0)
                cumulativeSeries.push(runningTotal)
              })

              const caloriesTarget = 6000
              const caloriesPercent = caloriesTarget
                ? Math.min(Math.round((caloriesTotal / caloriesTarget) * 100), 100)
                : 0

              return {
                count: rows.length,
                registeredDays,
                caloriesTotal,
                caloriesTarget,
                caloriesPercent,
                caloriesSeries: cumulativeSeries,
              }
            },
            {
              count: 0,
              registeredDays: [],
              caloriesTotal: 0,
              caloriesTarget: 6000,
              caloriesPercent: 0,
              caloriesSeries: [0, 0, 0, 0, 0, 0, 0],
            }
          ),
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
          weekWodResultCount: wodWeekResult?.count || 0,
          weekWodTarget: 6,
          weekWodRegisteredDays: wodWeekResult?.registeredDays || [],
          weekCaloriesTotal: wodWeekResult?.caloriesTotal || 0,
          weekCaloriesTarget: wodWeekResult?.caloriesTarget || 6000,
          weekCaloriesPercent: wodWeekResult?.caloriesPercent || 0,
          weekCaloriesSeries: wodWeekResult?.caloriesSeries || [0, 0, 0, 0, 0, 0, 0],
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
      <div className="lg:hidden">
        <AlumnoDashboardMobilePro
          loading={loading}
          error={error}
          data={data}
          membership={membership}
          profileName={profileName}
          initials={initials}
          navigate={navigate}
        />
      </div>

      <div className="hidden h-full w-full max-w-full overflow-hidden lg:grid lg:grid-cols-[270px_minmax(0,1fr)]">
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


function AlumnoDashboardMobilePro({
  loading,
  error,
  data,
  membership,
  profileName,
  initials,
  navigate,
}) {
  const firstName = String(profileName || "Alumno").trim().split(" ")[0] || "Alumno"
  const weekWodPercent = data.weekWodTarget
    ? Math.min(Math.round((Number(data.weekWodResultCount || 0) / data.weekWodTarget) * 100), 100)
    : 0

  const weekCaloriesTotal = Number(data.weekCaloriesTotal || 0)
  const weekCaloriesTarget = Number(data.weekCaloriesTarget || 6000)
  const weekCaloriesPercent = data.weekCaloriesPercent ?? (
    weekCaloriesTarget
      ? Math.min(Math.round((weekCaloriesTotal / weekCaloriesTarget) * 100), 100)
      : 0
  )

  const latestPrText = data.latestPr?.peso_libras
    ? `${data.latestPr.peso_libras} lb`
    : "--"

  const handleMobileLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Error cerrando sesión:", error)
    } finally {
      window.location.replace("/")
    }
  }

  return (
    <main className="h-[100dvh] w-screen max-w-full overflow-x-hidden overflow-y-auto bg-[#050505] pb-28 text-white">
      <div className="relative min-h-full w-full max-w-full overflow-x-hidden px-3 pt-3">
        <MobileDashboardOrbs />

        <header className="relative z-10 mb-3 flex items-center justify-between gap-3 border-b border-white/10 pb-2.5">
          <MobileDashboardAvatar
            loading={loading}
            initials={initials}
            fotoUrl={data.profile?.foto_url}
            nombre={profileName}
          />

          <div className="flex min-w-0 items-center gap-2">
            <img
              src={pho3nixLogo}
              alt="PHO3NIX"
              className="h-8 w-8 shrink-0 object-contain drop-shadow-[0_0_16px_rgba(249,115,22,0.35)]"
            />

            <div className="min-w-0">
              <p className="truncate text-xl font-black tracking-[0.14em] text-white">
                PHO<span className="text-orange-500">3</span>NIX
              </p>
              <p className="truncate text-[8px] font-black uppercase tracking-[0.2em] text-orange-500">
                Functional Fitness
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleMobileLogout}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-orange-500/25 bg-orange-500/10 text-lg text-orange-300"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            ☰
          </button>
        </header>

        <section className="relative z-10 mb-2 flex items-center justify-center">
          <h1 className="text-xl font-black uppercase tracking-[0.12em] text-white/85">
            Dashboard
          </h1>
        </section>

        {data.userBirthdayToday ? (
          <BirthdayGreetingCard name={profileName} />
        ) : null}

        {error ? (
          <div className="relative z-10 mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        ) : null}

        <section className="relative z-10 mb-3 overflow-hidden rounded-[1.35rem] border border-orange-500/25 bg-black/55 shadow-2xl shadow-black/40">
          <div className="absolute inset-0 bg-[url('/images/backWODCardAlumno.png')] bg-cover bg-center opacity-100" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_35%,rgba(249,115,22,0.24),transparent_80%),linear-gradient(90deg,#050505_0%,rgba(5,5,5,0.92)_52%,rgba(5,5,5,0.62)_100%)]" />
          <div className="absolute -right-20 top-14 h-64 w-64 rounded-full bg-orange-500/14 blur-3xl" />

          <div className="relative z-10 p-3.5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
              Bienvenido 👋
            </p>

            <h2 className="mt-2 text-4xl font-black uppercase leading-none tracking-tight text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.12)]">
              {loading ? "Cargando..." : firstName}
            </h2>

            <p className="mt-3 max-w-[260px] text-sm leading-5 text-white/65">
              Cada día es una nueva oportunidad para ser tu{" "}
              <span className="font-black text-orange-400">
                mejor versión.
              </span>
            </p>

            <div className="mt-2 rounded-2x1 border border-emerald-500/30 bg-emerald-500/10 p-2">
              <div className="flex items-center justify-between gap-3">
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
                    Membresía {membership.title}
                  </p>

                  <p className="mt-1 truncate text-xs text-white/60">
                    {membership.subtitle}
                  </p>
                </div>

                <span className="text-xl">›</span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-[0.8fr_1.2fr] gap-2.5">
              <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/40">
                  🔥 Esta semana
                </p>
                <p className="mt-1 text-2xl font-black text-orange-400">
                  {loading ? "..." : data.weekWodResultCount}
                  <span className="ml-1 text-xs text-white/40">
                    / {data.weekWodTarget}
                  </span>
                </p>
              </div>

              <WeekDots
                completed={data.weekWodResultCount}
                registeredDays={data.weekWodRegisteredDays}
              />
            </div>
          </div>
        </section>

        <section className="relative z-10 mb-3 overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/45 p-3 shadow-2xl shadow-black/30">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.1em] text-white/70">
            Resumen rápido
          </p>

          <div className="grid grid-cols-4 items-stretch justify-center gap-1.5">
            <MobileDashboardMetric
              icon="🔥"
              title="Cal semana"
              value={loading ? "..." : formatCompactNumber(weekCaloriesTotal)}
              footer="Calorías acumuladas"
            />

            <MobileDashboardMetric
              icon="📅"
              title="Semana"
              value={loading ? "..." : `${weekWodPercent}%`}
              footer={`${data.weekWodResultCount}/${data.weekWodTarget} días`}
            />

            <MobileDashboardMetric
              icon="🎯"
              title="Cal meta"
              value={loading ? "..." : `${weekCaloriesPercent}%`}
              footer={`${formatCompactNumber(weekCaloriesTotal)} / ${formatCompactNumber(weekCaloriesTarget)} cal`}
            />

            <MobileDashboardMetric
              icon="⚡"
              title="Último PR"
              value={latestPrText}
              footer={data.latestPr?.fecha ? formatShortDate(data.latestPr.fecha) : "Registra uno"}
            />
          </div>
        </section>

        <section className="relative z-10 mb-3 overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/45 p-3 shadow-2xl shadow-black/30">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-black uppercase tracking-[0.1em] text-white/70">
                WOD del día
              </p>
              <p className="mt-0.5 text-[10px] font-bold text-white/35">
                Entrenamiento publicado para hoy
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/alumno/wods")}
              className="shrink-0 text-[10px] font-black uppercase text-orange-400"
            >
              Ver WOD ›
            </button>
          </div>

          <MobileDashboardWodCard
            wod={data.todayWod}
            loading={loading}
            onClick={() => navigate("/alumno/wods")}
          />
        </section>

        <MobileDashboardWeekProgress
          totalCalories={data.weekCaloriesTotal}
          targetCalories={data.weekCaloriesTarget}
          percent={data.weekCaloriesPercent}
          series={data.weekCaloriesSeries}
        />

        <MobileAnnouncementsPanel />

        <MobileBirthdayCommunity
          birthdays={data.birthdaysThisMonth}
          loading={loading}
        />

        <section className="relative z-10 mb-4 overflow-hidden rounded-[1.25rem] border border-orange-500/20 bg-black/45 p-3 shadow-2xl shadow-black/30">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-orange-500/25 bg-orange-500/10 text-2xl">
              🐦
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-black text-white">
                ¡Eres más fuerte de lo que crees!
              </p>
              <p className="mt-1 truncate text-xs text-white/45">
                Disciplina hoy, libertad mañana.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function MobileDashboardAvatar({ loading, initials, fotoUrl, nombre }) {
  if (!loading && fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={nombre || "Alumno"}
        className="h-9 w-9 shrink-0 rounded-full border border-orange-500/35 object-cover shadow-[0_0_20px_rgba(249,115,22,0.18)]"
      />
    )
  }

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-orange-500/35 bg-orange-500/10 text-[11px] font-black text-orange-300 shadow-[0_0_20px_rgba(249,115,22,0.18)]">
      {loading ? "..." : initials}
    </div>
  )
}

function WeekDots({ completed = 0, registeredDays = [] }) {
  const labels = ["L", "M", "X", "J", "V", "S", "D"]
  const registeredIndexes = buildRegisteredWeekdaySet(registeredDays)

  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-2.5">
      <div className="grid grid-cols-7 gap-1">
        {labels.map((label, index) => {
          const done =
            registeredIndexes.size > 0
              ? registeredIndexes.has(index)
              : index < Number(completed || 0)

          return (
            <div key={label} className="text-center">
              <p className="text-[8px] font-black text-white/45">
                {label}
              </p>
              <div
                className={[
                  "mx-auto mt-1 flex h-5 w-5 items-center justify-center rounded-full border text-[9px] font-black",
                  done
                    ? "border-orange-500 bg-orange-500 text-white"
                    : "border-white/25 bg-black/20 text-white/35",
                ].join(" ")}
              >
                {done ? "✓" : ""}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function buildRegisteredWeekdaySet(days = []) {
  const indexes = new Set()

  ;(days || []).forEach((value) => {
    if (!value) return

    const date = new Date(`${String(value).slice(0, 10)}T00:00:00`)

    if (Number.isNaN(date.getTime())) return

    const day = date.getDay()
    const index = day === 0 ? 6 : day - 1

    indexes.add(index)
  })

  return indexes
}


function MobileDashboardMetric({ icon, title, value, footer }) {
  return (
    <article className="relative flex min-h-[96px] min-w-0 items-center justify-center overflow-hidden rounded-[1rem] border border-white/10 bg-black/45 px-1.5 py-2 text-center shadow-2xl shadow-black/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(249,115,22,0.15),transparent_36%)]" />

      <div className="relative z-10 min-w-0">
        <span className="block text-base leading-none text-orange-400">
          {icon}
        </span>

        <p className="mt-1 truncate text-[8px] font-black uppercase tracking-[0.06em] text-white/45">
          {title}
        </p>

        <p className="mt-2 truncate text-lg font-black uppercase leading-none text-orange-400">
          {value}
        </p>

        <p className="mt-1 truncate text-[8px] leading-tight text-white/40">
          {footer}
        </p>
      </div>
    </article>
  )
}

function MobileDashboardWodCard({ wod, loading, onClick }) {
  const lines = getWodLines(wod?.descripcion)
  const dateLabel = wod?.fecha ? formatShortDate(wod.fecha) : "Hoy"

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full overflow-hidden rounded-[1.1rem] border border-white/10 bg-black/35 p-3 text-left transition active:scale-[0.99] active:border-orange-500/35"
    >
      <div className="absolute inset-0 bg-[url('/images/backWODCardAlumno.png')] bg-cover bg-center opacity-16" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/45" />

      <div className="relative z-10 grid grid-cols-[62px_minmax(0,1fr)_20px] items-center gap-3">
        <div className="rounded-xl border border-orange-500/25 bg-orange-500/10 p-2 text-center">
          <p className="text-[10px] font-black uppercase text-white/40">
            {dateLabel.split(" ")[1] || ""}
          </p>
          <p className="text-2xl font-black text-white">
            {dateLabel.split(" ")[0] || "—"}
          </p>
        </div>

        <div className="min-w-0">
          <p className="truncate text-base font-black uppercase text-white">
            {loading ? "Cargando..." : wod?.nombre || "Sin WOD publicado"}
          </p>

          <p className="mt-0.5 truncate text-xs font-black uppercase text-orange-400">
            {wod?.modo_ranking || wod?.modalidad || "Pendiente"}
          </p>

          <p className="mt-1 truncate text-xs text-white/50">
            {lines[0] || "Cuando el coach publique el WOD aparecerá aquí."}
          </p>
        </div>

        <span className="text-xl font-black text-white/40">›</span>
      </div>
    </button>
  )
}

function MobileDashboardWeekProgress({
  totalCalories = 0,
  targetCalories = 6000,
  percent = 0,
  series = [0, 0, 0, 0, 0, 0, 0],
}) {
  const labels = ["L", "M", "X", "J", "V", "S", "D"]
  const maxValue = Math.max(...series, targetCalories, 1)
  const points = series.map((value, index) => {
    const x = 24 + index * 32
    const y = 72 - (Number(value || 0) / maxValue) * 56
    return { x, y, value: Number(value || 0), label: labels[index] }
  })
  const polylinePoints = points.map((point) => `${point.x},${point.y}`).join(" ")
  const lastPoint = points[points.length - 1] || { x: 24, y: 72, value: 0 }
  const circumference = 2 * Math.PI * 28
  const progress = Math.min(Math.max(Number(percent || 0), 0), 100)
  const offset = circumference - (progress / 100) * circumference

  return (
    <section className="relative z-10 mb-3 overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/45 p-3 shadow-2xl shadow-black/30">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.1em] text-white/70">
            Progreso de esta semana
          </p>
          <p className="mt-0.5 text-[10px] font-bold text-white/35">
            Calorías acumuladas
          </p>
        </div>

        <button
          type="button"
          className="text-[10px] font-black uppercase tracking-[0.08em] text-orange-400"
        >
          Ver más ›
        </button>
      </div>

      <div className="grid grid-cols-[80px_minmax(0,1fr)_82px] items-center gap-2.5">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.08em] text-white/40">
            Calorías
          </p>
          <p className="mt-1 text-[2rem] font-black leading-none text-orange-400">
            {formatCompactNumber(totalCalories)}
          </p>
          <p className="mt-1 text-[10px] font-bold text-white/45">
            / {formatCompactNumber(targetCalories)} CAL
          </p>
        </div>

        <div className="min-w-0">
          <svg viewBox="0 0 240 92" className="h-[92px] w-full">
            <g>
              {[0, 1, 2, 3].map((line) => {
                const y = 16 + line * 18
                const value = Math.round((maxValue / 4) * (4 - line))

                return (
                  <g key={line}>
                    <line
                      x1="22"
                      y1={y}
                      x2="214"
                      y2={y}
                      stroke="rgba(255,255,255,0.08)"
                      strokeDasharray="3 4"
                    />
                    <text
                      x="0"
                      y={y + 3}
                      fill="rgba(255,255,255,0.28)"
                      fontSize="8"
                      fontWeight="700"
                    >
                      {formatCompactNumber(value)}
                    </text>
                  </g>
                )
              })}
            </g>

            <polyline
              points={polylinePoints}
              fill="none"
              stroke="#f97316"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {points.map((point) => (
              <g key={point.label}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="3.8"
                  fill="#f97316"
                  stroke="rgba(255,255,255,0.85)"
                  strokeWidth="1"
                />
                <text
                  x={point.x}
                  y="88"
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.42)"
                  fontSize="9"
                  fontWeight="800"
                >
                  {point.label}
                </text>
              </g>
            ))}

            <g>
              <rect
                x={Math.max(lastPoint.x - 18, 170)}
                y={Math.max(lastPoint.y - 24, 4)}
                width="34"
                height="16"
                rx="5"
                fill="#f97316"
              />
              <text
                x={Math.max(lastPoint.x - 1, 187)}
                y={Math.max(lastPoint.y - 13, 15)}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="8"
                fontWeight="900"
              >
                {formatCompactNumber(lastPoint.value)}
              </text>
            </g>
          </svg>
        </div>

        <div className="flex justify-center">
          <div className="relative h-[78px] w-[78px]">
            <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="28"
                fill="none"
                stroke="rgba(255,255,255,0.10)"
                strokeWidth="8"
              />
              <circle
                cx="40"
                cy="40"
                r="28"
                fill="none"
                stroke="#f97316"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-2xl font-black leading-none text-orange-400">
                {progress}%
              </p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.08em] text-white/45">
                Objetivo
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function MobileAnnouncementsPanel() {
  const [loading, setLoading] = useState(true)
  const [announcements, setAnnouncements] = useState([])
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null)

  useEffect(() => {
    let alive = true

    async function loadAnnouncements() {
      try {
        setLoading(true)

        const nowIso = new Date().toISOString()

        const { data, error } = await supabase
          .from("anuncios")
          .select(
            "id,titulo,contenido,fecha_publicacion,activo,media_url,media_tipo,created_at"
          )
          .eq("activo", true)
          .lte("fecha_publicacion", nowIso)
          .order("fecha_publicacion", { ascending: false })
          .limit(5)

        if (error) throw error

        if (alive) {
          setAnnouncements(data || [])
        }
      } catch (error) {
        console.warn("No se pudieron cargar anuncios del alumno:", error)
        if (alive) setAnnouncements([])
      } finally {
        if (alive) setLoading(false)
      }
    }

    loadAnnouncements()

    return () => {
      alive = false
    }
  }, [])

  return (
    <>
      <section className="relative z-10 mb-3 overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/45 p-3 shadow-2xl shadow-black/30">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-black uppercase tracking-[0.1em] text-white/70">
              Anuncios
            </p>
            <p className="mt-0.5 text-[10px] font-bold text-white/35">
              Novedades del box
            </p>
          </div>

          <span className="shrink-0 rounded-xl border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-[10px] font-black uppercase text-orange-300">
            {announcements.length}
          </span>
        </div>

        {loading ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-black/25 p-3 text-xs text-white/40">
            Cargando anuncios...
          </div>
        ) : announcements.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-black/25 p-3 text-xs text-white/40">
            No hay anuncios publicados.
          </div>
        ) : (
          <div className="grid gap-2">
            {announcements.slice(0, 3).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedAnnouncement(item)}
                className="grid w-full grid-cols-[44px_minmax(0,1fr)_18px] items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-2 text-left transition active:scale-[0.99] active:border-orange-500/35 active:bg-orange-500/10"
              >
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-orange-500/20 bg-orange-500/10">
                  {item.media_url && item.media_tipo !== "video" ? (
                    <img
                      src={item.media_url}
                      alt={item.titulo || "Anuncio"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(249,115,22,0.35),transparent_62%)]" />
                      <span className="relative z-10 text-xl">📣</span>
                    </>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-xs font-black uppercase text-white">
                    {item.titulo || "Anuncio PHO3NIX"}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-[10px] text-white/45">
                    {item.contenido || "Toca para ver el detalle del anuncio."}
                  </p>
                </div>

                <span className="text-lg font-black text-white/35">›</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedAnnouncement ? (
        <AnnouncementDetailModal
          announcement={selectedAnnouncement}
          onClose={() => setSelectedAnnouncement(null)}
        />
      ) : null}
    </>
  )
}

function AnnouncementDetailModal({ announcement, onClose }) {
  const mediaUrl = announcement?.media_url || ""
  const isVideo = announcement?.media_tipo === "video"
  const date = announcement?.fecha_publicacion || announcement?.created_at

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/88 p-4 backdrop-blur-2xl">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Cerrar"
      />

      <section className="relative z-10 flex max-h-[84dvh] w-full max-w-md flex-col overflow-hidden rounded-[1.6rem] border border-orange-500/25 bg-[#060606] shadow-[0_0_60px_rgba(249,115,22,0.20)]">
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-orange-400">
            Anuncio
          </p>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-black/55 text-lg text-white/70"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <article className="relative overflow-hidden rounded-[1.35rem] border border-orange-500/25 bg-black/55">
            {mediaUrl ? (
              <div className="h-48 overflow-hidden border-b border-white/10 bg-black/40">
                {isVideo ? (
                  <video
                    src={mediaUrl}
                    controls
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt={announcement?.titulo || "Anuncio"}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            ) : null}

            <div className="relative overflow-hidden p-4">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(249,115,22,0.22),transparent_36%)]" />

              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
                  Novedad PHO3NIX
                </p>

                <h3 className="mt-2 text-2xl font-black uppercase leading-tight text-white">
                  {announcement?.titulo || "Anuncio PHO3NIX"}
                </h3>

                {date ? (
                  <p className="mt-2 text-xs font-bold uppercase text-white/35">
                    {formatShortDate(String(date).slice(0, 10))}
                  </p>
                ) : null}

                <p className="mt-4 whitespace-pre-line text-sm leading-6 text-white/70">
                  {announcement?.contenido || "Sin contenido registrado."}
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}


function MobileBirthdayCommunity({ birthdays = [], loading = false }) {
  const visibleBirthdays = birthdays.slice(0, 5)

  return (
    <section className="relative z-10 mb-3 overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/45 p-3 shadow-2xl shadow-black/30">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-black uppercase tracking-[0.1em] text-white/70">
            Comunidad PHO3NIX
          </p>
          <p className="mt-0.5 text-[10px] font-bold text-white/35">
            Próximos cumpleaños
          </p>
        </div>

        <button
          type="button"
          className="shrink-0 text-[10px] font-black uppercase tracking-[0.08em] text-orange-400"
        >
          Ver todos ›
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-black/25 p-3 text-xs text-white/40">
          Cargando cumpleaños...
        </div>
      ) : visibleBirthdays.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-black/25 p-3 text-xs text-white/40">
          No hay próximos cumpleaños registrados.
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-1.5">
          {visibleBirthdays.map((item) => (
            <article
              key={item.id}
              className={[
                "relative min-h-[118px] overflow-hidden rounded-xl border bg-black/35 px-1.5 py-2 text-center",
                item.daysUntil === 0
                  ? "border-orange-500/45 bg-orange-500/10 shadow-[0_0_22px_rgba(249,115,22,0.18)]"
                  : "border-white/10",
              ].join(" ")}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(249,115,22,0.22),transparent_48%)]" />

              <div className="relative z-10 flex h-full flex-col items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-orange-500/35 bg-orange-500/10 text-sm font-black text-orange-300 shadow-[0_0_16px_rgba(249,115,22,0.16)]">
                  {getInitials(item.nombre)}
                </div>

                <div className="min-w-0">
                  <p className="mt-1 line-clamp-2 text-[9px] font-black uppercase leading-tight text-white">
                    {item.daysUntil === 0 ? "Hoy · " : ""}
                    {firstTwoNames(item.nombre)}
                  </p>

                  <p className="mt-1 text-[8px] font-bold leading-tight text-white/45">
                    {item.day} {item.monthLabel}
                  </p>

                  <p className="mt-1 truncate text-[8px] font-black uppercase text-orange-400">
                    {item.daysUntil === 0
                      ? "Cumple hoy"
                      : `${item.daysUntil} día(s)`}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function firstTwoNames(value) {
  return String(value || "Alumno")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .join(" ")
}


function MobileDashboardOrbs() {
  return (
    <>
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-orange-600/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-red-600/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />
    </>
  )
}

function formatCompactNumber(value) {
  const number = Number(value || 0)

  if (!number) return "0"

  if (number >= 1000) {
    return new Intl.NumberFormat("es-EC", {
      maximumFractionDigits: 1,
    }).format(number)
  }

  return String(Math.round(number))
}

function getWodLines(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
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