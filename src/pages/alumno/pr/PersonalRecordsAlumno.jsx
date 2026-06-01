import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../../supabase"
import { mensualidadStatusInfo } from "../../../utils/mensualidades"

import AlumnoSidebar from "../dashboard/components/AlumnoSidebar"
import AlumnoMobileNav from "../shared/AlumnoMobileNav"
import { getPrExerciseImage } from "./utils/prExerciseImages"

const DEFAULT_DATA = {
  profile: null,
  mensualidad: null,
  ejercicios: [],
  rms: [],
}

export default function PersonalRecordsAlumno() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [data, setData] = useState(DEFAULT_DATA)

  const [selectedExerciseId, setSelectedExerciseId] = useState("")
  const [form, setForm] = useState({
    ejercicio_id: "",
    peso_libras: "",
    fecha: getTodayISO(),
  })

  useEffect(() => {
    let alive = true

    async function loadData() {
      try {
        setLoading(true)
        setError("")
        setSuccess("")

        const { data: authData, error: authError } =
          await supabase.auth.getUser()

        if (authError) throw authError

        const user = authData?.user

        if (!user?.id) {
          throw new Error("No se encontró una sesión activa.")
        }

        const [profileResult, mensualidadResult, ejerciciosResult, rmResult] =
          await Promise.all([
            supabase
              .from("usuarios")
              .select("id,nombre,email,role,foto_url")
              .eq("id", user.id)
              .maybeSingle(),

            supabase
              .from("mensualidades")
              .select("id,usuario_id,fecha_inicio,fecha_fin,estado,created_at")
              .eq("usuario_id", user.id)
              .order("fecha_fin", { ascending: false })
              .order("created_at", { ascending: false })
              .limit(1),

            supabase
              .from("ejercicios")
              .select("id,nombre")
              .order("nombre", { ascending: true }),

            supabase
              .from("rm")
              .select("id,usuario,ejercicio_id,peso_libras,fecha,created_at")
              .eq("usuario", user.id)
              .order("fecha", { ascending: false })
              .order("created_at", { ascending: false }),
          ])

        if (profileResult.error) throw profileResult.error
        if (mensualidadResult.error) throw mensualidadResult.error
        if (ejerciciosResult.error) throw ejerciciosResult.error
        if (rmResult.error) throw rmResult.error

        if (!alive) return

        const ejercicios = ejerciciosResult.data || []

        setData({
          profile: profileResult.data || {
            id: user.id,
            nombre: user.email || "Alumno PHO3NIX",
            email: user.email,
            role: "alumno",
            foto_url: "",
          },
          mensualidad: mensualidadResult.data?.[0] || null,
          ejercicios,
          rms: rmResult.data || [],
        })

        if (ejercicios[0]?.id) {
          setSelectedExerciseId(ejercicios[0].id)
        }
      } catch (err) {
        console.error("Error cargando PR alumno:", err)

        if (alive) {
          setError(err.message || "No se pudo cargar Personal Records.")
        }
      } finally {
        if (alive) setLoading(false)
      }
    }

    loadData()

    return () => {
      alive = false
    }
  }, [])

  const exerciseMap = useMemo(() => {
    const map = new Map()

    data.ejercicios.forEach((item) => {
      map.set(item.id, item.nombre)
    })

    return map
  }, [data.ejercicios])

  const enrichedRms = useMemo(() => {
    return (data.rms || []).map((item) => ({
      ...item,
      ejercicio_nombre: exerciseMap.get(item.ejercicio_id) || "Ejercicio",
    }))
  }, [data.rms, exerciseMap])

  const stats = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const thisMonth = enrichedRms.filter((item) => {
      const date = parseDate(item.fecha)
      return (
        date &&
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      )
    })

    const latestPr = enrichedRms[0] || null

    const bestGeneral = enrichedRms.reduce((best, item) => {
      if (!best) return item

      return Number(item.peso_libras || 0) > Number(best.peso_libras || 0)
        ? item
        : best
    }, null)

    const bestByExerciseMap = new Map()

    enrichedRms.forEach((item) => {
      const current = bestByExerciseMap.get(item.ejercicio_id)

      if (
        !current ||
        Number(item.peso_libras || 0) > Number(current.peso_libras || 0)
      ) {
        bestByExerciseMap.set(item.ejercicio_id, item)
      }
    })

    const bestByExercise = Array.from(bestByExerciseMap.values()).sort(
      (a, b) => Number(b.peso_libras || 0) - Number(a.peso_libras || 0)
    )

    const strongestExercise = bestByExercise[0] || null

    return {
      total: enrichedRms.length,
      thisMonth: thisMonth.length,
      latestPr,
      bestGeneral,
      bestByExercise,
      strongestExercise,
      recent: enrichedRms.slice(0, 5),
    }
  }, [enrichedRms])

  const evolution = useMemo(() => {
    const targetExerciseId =
      selectedExerciseId || stats.latestPr?.ejercicio_id || data.ejercicios[0]?.id

    return enrichedRms
      .filter((item) => item.ejercicio_id === targetExerciseId)
      .slice()
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
      .slice(-6)
  }, [selectedExerciseId, stats.latestPr, data.ejercicios, enrichedRms])

  const membership = useMemo(() => {
    return getMembershipLabel(data.mensualidad)
  }, [data.mensualidad])

  const profileName = data.profile?.nombre || "Alumno PHO3NIX"
  const initials = getInitials(profileName)

  const handleSavePr = async (event) => {
    event.preventDefault()

    if (!data.profile?.id) return

    try {
      setSaving(true)
      setError("")
      setSuccess("")

      if (!form.ejercicio_id) {
        throw new Error("Selecciona un ejercicio.")
      }

      if (!form.peso_libras || Number(form.peso_libras) <= 0) {
        throw new Error("Ingresa un peso válido en libras.")
      }

      if (!form.fecha) {
        throw new Error("Selecciona la fecha del PR.")
      }

      const payload = {
        usuario: data.profile.id,
        ejercicio_id: form.ejercicio_id,
        peso_libras: Number(form.peso_libras),
        fecha: form.fecha,
      }

      const { data: inserted, error: insertError } = await supabase
        .from("rm")
        .insert(payload)
        .select("id,usuario,ejercicio_id,peso_libras,fecha,created_at")
        .single()

      if (insertError) throw insertError

      setData((current) => ({
        ...current,
        rms: [inserted, ...current.rms],
      }))

      setSelectedExerciseId(form.ejercicio_id)

      setForm({
        ejercicio_id: "",
        peso_libras: "",
        fecha: getTodayISO(),
      })

      setSuccess("PR registrado correctamente.")
    } catch (err) {
      console.error("Error registrando PR:", err)
      setError(err.message || "No se pudo registrar el PR.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden bg-[#050505] text-white">
      <div className="hidden h-full overflow-hidden lg:grid lg:grid-cols-[270px_minmax(0,1fr)]">
        <AlumnoSidebar navigate={navigate} membership={membership} />

        <main className="min-w-0 overflow-hidden bg-[#050505]">
          <section className="relative h-dvh overflow-hidden p-4">
            <BackgroundOrbs />

            <div className="relative mx-auto flex h-full max-w-[1680px] flex-col gap-4 overflow-hidden">
              <DesktopHeader
                name={profileName}
                email={data.profile?.email}
                initials={initials}
                fotoUrl={data.profile?.foto_url}
                membership={membership}
                loading={loading}
              />

              {error ? <Alert type="error" text={error} /> : null}
              {success ? <Alert type="success" text={success} /> : null}

              <section className="grid shrink-0 gap-4 xl:grid-cols-4">
                <DesktopStatCard
                  icon="🏆"
                  label="PR registrados"
                  value={loading ? "..." : stats.total}
                  footer="Total de marcas personales"
                />

                <DesktopStatCard
                  icon="🕒"
                  label="Último PR"
                  value={
                    loading
                      ? "..."
                      : stats.latestPr?.peso_libras
                      ? `${stats.latestPr.peso_libras} lb`
                      : "--"
                  }
                  footer={
                    stats.latestPr?.ejercicio_nombre
                      ? stats.latestPr.ejercicio_nombre
                      : "Sin registro"
                  }
                />

                <DesktopStatCard
                  icon="⭐"
                  label="Mejor PR general"
                  value={
                    loading
                      ? "..."
                      : stats.bestGeneral?.peso_libras
                      ? `${stats.bestGeneral.peso_libras} lb`
                      : "--"
                  }
                  footer={
                    stats.bestGeneral?.ejercicio_nombre
                      ? stats.bestGeneral.ejercicio_nombre
                      : "Tu mejor marca"
                  }
                />

                <DesktopStatCard
                  icon="💪"
                  label="Ejercicio más fuerte"
                  value={
                    loading
                      ? "..."
                      : stats.strongestExercise?.ejercicio_nombre
                      ? shortText(stats.strongestExercise.ejercicio_nombre, 16)
                      : "--"
                  }
                  footer={
                    stats.strongestExercise?.peso_libras
                      ? `${stats.strongestExercise.peso_libras} lb`
                      : "Mejor marca registrada"
                  }
                />
              </section>

              <section className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[1.45fr_1fr_0.95fr]">
                <div className="grid min-h-0 gap-4">
                  <EvolutionCard
                    ejercicios={data.ejercicios}
                    selectedExerciseId={selectedExerciseId}
                    onSelectExercise={setSelectedExerciseId}
                    evolution={evolution}
                    loading={loading}
                  />

                  <HistoryTable items={stats.recent} loading={loading} />
                </div>

                <BestMarksGrid items={stats.bestByExercise} loading={loading} />

                <div className="grid min-h-0 gap-4">
                  <RegisterPrPanel
                    ejercicios={data.ejercicios}
                    form={form}
                    setForm={setForm}
                    saving={saving}
                    onSubmit={handleSavePr}
                  />

                  <TipsCard />
                </div>
              </section>
            </div>
          </section>
        </main>
      </div>

      <div className="block h-full overflow-hidden lg:hidden">
        <PersonalRecordsMobile
          loading={loading}
          data={data}
          stats={stats}
          profileName={profileName}
          initials={initials}
          error={error}
          success={success}
          form={form}
          setForm={setForm}
          saving={saving}
          onSubmit={handleSavePr}
        />
      </div>
    </div>
  )
}

/* =======================================================
   MOBILE
======================================================= */

function PersonalRecordsMobile({
  loading,
  data,
  stats,
  profileName,
  initials,
  error,
  success,
  form,
  setForm,
  saving,
  onSubmit,
}) {
  const [showForm, setShowForm] = useState(false)

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Error cerrando sesión:", error)
    } finally {
      window.location.replace("/")
    }
  }

  return (
    <main className="h-[100dvh] w-screen max-w-full overflow-x-hidden overflow-y-auto bg-[#050505] pb-24 text-white">
      <div className="relative min-h-full w-full max-w-full overflow-x-hidden px-4 pt-4">
        <BackgroundOrbs />

        <header className="relative z-10 mb-5 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-orange-500/25 bg-orange-500/10 text-xl text-orange-300"
              aria-label="Cerrar sesión"
            >
              ↪
            </button>

            <div className="min-w-0">
              <p className="truncate text-2xl font-black tracking-[0.18em] text-white">
                PHO<span className="text-orange-500">3</span>NIX
              </p>

              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-500">
                Personal Records
              </p>
            </div>
          </div>

          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-orange-500 bg-orange-500/10 text-lg font-black text-orange-300">
            {data.profile?.foto_url ? (
              <img
                src={data.profile.foto_url}
                alt={profileName}
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
        </header>

        <section className="relative z-10 mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-4xl font-black uppercase leading-none text-white">
              Mis PR
            </h1>

            <p className="mt-2 text-sm text-white/55">
              Tus mejores marcas personales
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm((current) => !current)}
            className="shrink-0 rounded-2xl border border-orange-500/35 bg-orange-500/10 px-4 py-3 text-xs font-black uppercase text-orange-300"
          >
            + Nuevo PR
          </button>
        </section>

        {error ? <Alert type="error" text={error} /> : null}
        {success ? <Alert type="success" text={success} /> : null}

        {showForm ? (
          <MobileRegisterPanel
            ejercicios={data.ejercicios}
            form={form}
            setForm={setForm}
            saving={saving}
            onSubmit={onSubmit}
          />
        ) : null}

        <section className="relative z-10 mb-6 grid w-full max-w-full grid-cols-2 gap-3 overflow-hidden">
          <MobileMetricCard
            icon="🏆"
            value={loading ? "..." : stats.total}
            label="PR totales"
            footer="Todas tus marcas"
          />

          <MobileMetricCard
            icon="📈"
            value={loading ? "..." : stats.thisMonth}
            label="Este mes"
            footer="Nuevas marcas"
          />

          <MobileMetricCard
            icon="🔥"
            value={
              loading
                ? "..."
                : stats.bestGeneral?.peso_libras
                ? `${stats.bestGeneral.peso_libras} lb`
                : "--"
            }
            label="Mejor marca"
            footer={
              stats.bestGeneral?.ejercicio_nombre
                ? stats.bestGeneral.ejercicio_nombre
                : "Peso máximo"
            }
            className="col-span-2"
            featured
          />
        </section>

        <MobileSectionTitle title="Últimos PR" action="Ver todos" />

        <section className="relative z-10 grid gap-3">
          {loading ? (
            <MobileEmpty text="Cargando marcas..." />
          ) : stats.recent.length === 0 ? (
            <MobileEmpty text="Aún no tienes PR registrados." />
          ) : (
            stats.recent.slice(0, 4).map((item) => (
              <MobilePrRow key={item.id} item={item} highlight />
            ))
          )}
        </section>

<div className="relative z-10 mt-7">
  <h2 className="text-2xl font-black uppercase text-white">
    Mis mejores marcas
  </h2>

  <p className="mt-1 text-sm text-white/50">
    Tus mejores registros por ejercicio.
  </p>
</div>

        <section className="relative z-10 mt-4 grid gap-3">
          {loading ? (
            <MobileEmpty text="Cargando mejores marcas..." />
          ) : stats.bestByExercise.length === 0 ? (
            <MobileEmpty text="Aún no tienes mejores marcas." />
          ) : (
            stats.bestByExercise.slice(0, 6).map((item) => (
              <MobilePrRow key={`${item.ejercicio_id}-${item.id}`} item={item} />
            ))
          )}
        </section>
      </div>

      <AlumnoMobileNav />
    </main>
  )
}

function MobileMetricCard({
  icon,
  value,
  label,
  footer,
  className = "",
  featured = false,
}) {
  return (
    <article
      className={[
        "relative min-w-0 overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/45 p-4 shadow-2xl shadow-black/30",
        featured ? "border-orange-500/25 bg-orange-500/10" : "",
        className,
      ].join(" ")}
    >
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-orange-500/15 blur-3xl" />

      <div
        className={[
          "relative z-10 flex min-w-0 items-center gap-4",
          featured ? "justify-between" : "flex-col text-center",
        ].join(" ")}
      >
        <div
          className={[
            "flex shrink-0 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10",
            featured ? "h-14 w-14 text-3xl" : "h-12 w-12 text-2xl",
          ].join(" ")}
        >
          {icon}
        </div>

        <div className={featured ? "min-w-0 flex-1" : "min-w-0"}>
          <p
            className={[
              "truncate font-black text-white",
              featured ? "text-4xl" : "text-3xl",
            ].join(" ")}
          >
            {value}
          </p>

          <p className="mt-1 truncate text-[11px] font-black uppercase tracking-[0.12em] text-orange-400">
            {label}
          </p>

          <p className="mt-1 truncate text-[11px] text-white/50">
            {footer}
          </p>
        </div>
      </div>
    </article>
  )
}

function MobileSectionTitle({ title, action }) {
  return (
    <div className="relative z-10 mb-3 mt-1 flex items-center justify-between gap-3">
      <h2 className="text-2xl font-black uppercase text-white">{title}</h2>

      {action ? (
        <button
          type="button"
          className="text-sm font-black uppercase text-orange-400"
        >
          {action}
        </button>
      ) : null}
    </div>
  )
}

function MobilePrRow({ item, highlight = false }) {
  return (
    <article className="grid min-w-0 grid-cols-[58px_minmax(0,1fr)_auto] items-center gap-3 rounded-[1.4rem] border border-white/10 bg-black/45 p-3 sm:grid-cols-[64px_minmax(0,1fr)_auto]">
      <ExerciseIcon name={item.ejercicio_nombre} />

      <div className="min-w-0">
        <p className="truncate text-base font-black text-white sm:text-lg">
          {item.ejercicio_nombre}
        </p>

        <p className="mt-0.5 truncate text-xs text-white/55 sm:text-sm">
          Fuerza · Peso máximo
        </p>

        {highlight ? (
          <span className="mt-2 inline-flex rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-black uppercase text-emerald-300 sm:text-xs">
            ↑ Nuevo PR
          </span>
        ) : null}
      </div>

      <div className="shrink-0 text-right">
        <p className="whitespace-nowrap text-xl font-black text-white sm:text-2xl">
          {item.peso_libras} lb
        </p>

        <p className="mt-1 whitespace-nowrap text-xs text-white/50 sm:text-sm">
          {formatDateShort(item.fecha)}
        </p>

        <p className="mt-1 text-xl text-white/70">›</p>
      </div>
    </article>
  )
}

function ExerciseIcon({ name }) {
  const [failed, setFailed] = useState(false)
  const src = getPrExerciseImage(name)

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-orange-500/20 bg-orange-500/10 sm:h-16 sm:w-16">
      {!failed && src ? (
        <img
          src={src}
          alt={name || "Ejercicio"}
          className="h-full w-full object-contain p-2"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-2xl sm:text-3xl">🏋️</span>
      )}
    </div>
  )
}

function MobileRegisterPanel({ ejercicios, form, setForm, saving, onSubmit }) {
  return (
    <form
      onSubmit={onSubmit}
      className="relative z-10 mb-5 rounded-[1.6rem] border border-orange-500/25 bg-black/55 p-4"
    >
      <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-orange-400">
        Registrar nueva marca
      </p>

      <div className="grid gap-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-white/60">
            Ejercicio
          </span>

          <select
            value={form.ejercicio_id}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                ejercicio_id: event.target.value,
              }))
            }
            className="h-12 w-full rounded-2xl border border-white/10 bg-black/55 px-4 text-sm text-white outline-none focus:border-orange-500/60"
          >
            <option value="">Selecciona un ejercicio</option>
            {ejercicios.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-white/60">
            Peso en libras
          </span>

          <input
            type="number"
            min="1"
            value={form.peso_libras}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                peso_libras: event.target.value,
              }))
            }
            placeholder="Ej: 185"
            className="h-12 w-full rounded-2xl border border-white/10 bg-black/55 px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-500/60"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-white/60">
            Fecha
          </span>

          <input
            type="date"
            value={form.fecha}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                fecha: event.target.value,
              }))
            }
            className="h-12 w-full rounded-2xl border border-white/10 bg-black/55 px-4 text-sm text-white outline-none focus:border-orange-500/60"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="mt-2 h-12 rounded-2xl bg-orange-500 text-sm font-black uppercase text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar PR"}
        </button>
      </div>
    </form>
  )
}

function MobileEmpty({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-black/35 p-4 text-sm text-white/45">
      {text}
    </div>
  )
}

/* =======================================================
   DESKTOP COMPONENTS
======================================================= */

function DesktopHeader({
  name,
  email,
  initials,
  fotoUrl,
  membership,
  loading,
}) {
  return (
    <header className="grid shrink-0 gap-4 xl:grid-cols-[1fr_auto_auto] xl:items-center">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
          Mis Personal Records <span className="text-orange-500">⚡</span>
        </h1>

        <p className="mt-2 text-sm text-white/60">
          Supera tu{" "}
          <span className="font-bold text-orange-400">mejor versión</span>, un
          PR a la vez.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-[1.8rem] border border-white/10 bg-black/45 px-4 py-3">
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-orange-500/30 bg-orange-500/10 text-sm font-black text-orange-300">
          {fotoUrl ? (
            <img src={fotoUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </div>

        <div>
          <p className="text-sm font-black text-white">
            {loading ? "Cargando..." : name}
          </p>
          <p className="text-xs font-bold text-orange-400">Nivel Phoenix</p>
          <p className="text-xs text-white/45">
            {email || "Alumno PHO3NIX"}
          </p>
        </div>
      </div>

      <div className="rounded-[1.8rem] border border-white/10 bg-black/45 px-5 py-4">
        <p
          className={[
            "text-sm font-black uppercase",
            membership.status === "activa"
              ? "text-emerald-300"
              : membership.status === "por_vencer"
              ? "text-amber-300"
              : "text-red-300",
          ].join(" ")}
        >
          {membership.title}
        </p>

        <p className="mt-1 text-xs text-white/45">{membership.subtitle}</p>
      </div>
    </header>
  )
}

function DesktopStatCard({ icon, label, value, footer }) {
  return (
    <article className="relative min-h-[150px] overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 p-5 shadow-2xl shadow-black/30">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-orange-500/15 blur-3xl" />

      <div className="relative z-10 flex h-full items-center gap-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-3xl">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-white/55">
            {label}
          </p>

          <p className="mt-2 truncate text-4xl font-black text-white">
            {value}
          </p>

          <p className="mt-2 truncate text-sm text-orange-400">{footer}</p>
        </div>
      </div>
    </article>
  )
}

function EvolutionCard({
  ejercicios,
  selectedExerciseId,
  onSelectExercise,
  evolution,
  loading,
}) {
  const selectedName =
    ejercicios.find((item) => item.id === selectedExerciseId)?.nombre ||
    "Evolución"

  return (
    <article className="min-h-0 overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 p-5 shadow-2xl shadow-black/30">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
            Evolución de tus PR
          </p>

          <h3 className="mt-1 text-xl font-black uppercase text-white">
            {selectedName}
          </h3>
        </div>

        <select
          value={selectedExerciseId}
          onChange={(event) => onSelectExercise(event.target.value)}
          className="rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-orange-500/50"
        >
          {ejercicios.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nombre}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <EmptyCard text="Cargando evolución..." />
      ) : evolution.length === 0 ? (
        <EmptyCard text="Aún no tienes registros para este ejercicio." />
      ) : (
        <SimpleLineChart items={evolution} />
      )}
    </article>
  )
}

function SimpleLineChart({ items }) {
  const values = items.map((item) => Number(item.peso_libras || 0))
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1

  const width = 760
  const height = 260
  const paddingX = 48
  const paddingTop = 34
  const paddingBottom = 44
  const plotWidth = width - paddingX * 2
  const plotHeight = height - paddingTop - paddingBottom
  const baseY = height - paddingBottom

  const points = items.map((item, index) => {
    const value = Number(item.peso_libras || 0)

    const x =
      items.length === 1
        ? width / 2
        : paddingX + (index / (items.length - 1)) * plotWidth

    const y = paddingTop + (1 - (value - min) / range) * plotHeight

    return {
      ...item,
      value,
      x,
      y,
    }
  })

  const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ")

  const areaPoints =
    points.length > 0
      ? `${points[0].x},${baseY} ${linePoints} ${
          points[points.length - 1].x
        },${baseY}`
      : ""

  const gridLines = [0, 25, 50, 75, 100].map((percent) => {
    const y = paddingTop + (percent / 100) * plotHeight
    const value = Math.round(max - (percent / 100) * range)

    return {
      y,
      value,
    }
  })

  return (
    <div className="relative h-[260px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full overflow-visible"
        role="img"
        aria-label="Evolución de PR"
      >
        <defs>
          <linearGradient id="prLineGradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>

          <linearGradient id="prAreaGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {gridLines.map((line) => (
          <g key={line.y}>
            <line
              x1={paddingX}
              y1={line.y}
              x2={width - paddingX}
              y2={line.y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />

            <text
              x={paddingX - 12}
              y={line.y + 4}
              textAnchor="end"
              fontSize="11"
              fill="rgba(255,255,255,0.35)"
            >
              {line.value} lb
            </text>
          </g>
        ))}

        {points.length > 0 ? (
          <>
            <polygon points={areaPoints} fill="url(#prAreaGradient)" />

            <polyline
              points={linePoints}
              fill="none"
              stroke="url(#prLineGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="drop-shadow(0 0 10px rgba(249,115,22,0.55))"
            />

            {points.map((point) => (
              <g key={point.id}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="7"
                  fill="#050505"
                  stroke="#f97316"
                  strokeWidth="4"
                />

                <circle cx={point.x} cy={point.y} r="3" fill="#fb923c" />

                <text
                  x={point.x}
                  y={point.y - 14}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="800"
                  fill="white"
                >
                  {point.peso_libras} lb
                </text>

                <text
                  x={point.x}
                  y={baseY + 24}
                  textAnchor="middle"
                  fontSize="11"
                  fill="rgba(255,255,255,0.42)"
                >
                  {formatDateShort(point.fecha)}
                </text>
              </g>
            ))}
          </>
        ) : null}
      </svg>
    </div>
  )
}

function BestMarksGrid({ items = [], loading = false }) {
  return (
    <article className="min-h-0 overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 p-5 shadow-2xl shadow-black/30">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
        Mis mejores marcas por ejercicio
      </p>

      {loading ? (
        <div className="mt-4">
          <EmptyCard text="Cargando mejores marcas..." />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-4">
          <EmptyCard text="Aún no tienes marcas registradas." />
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {items.slice(0, 8).map((item) => (
            <article
              key={`${item.ejercicio_id}-${item.id}`}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <p className="truncate text-sm font-black text-white">
                {item.ejercicio_nombre}
              </p>

              <p className="mt-2 text-2xl font-black text-orange-400">
                {item.peso_libras} lb
              </p>

              <p className="mt-1 text-xs text-white/45">
                {formatDateShort(item.fecha)}
              </p>
            </article>
          ))}
        </div>
      )}
    </article>
  )
}

function RegisterPrPanel({ ejercicios, form, setForm, saving, onSubmit }) {
  return (
    <article className="overflow-hidden rounded-[2rem] border border-orange-500/25 bg-black/45 p-5 shadow-2xl shadow-black/30">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
        Registrar nueva marca personal
      </p>

      <form onSubmit={onSubmit} className="mt-4 grid gap-4">
        <FieldSelect
          label="Ejercicio"
          value={form.ejercicio_id}
          onChange={(value) =>
            setForm((current) => ({ ...current, ejercicio_id: value }))
          }
          options={ejercicios}
        />

        <FieldInput
          label="Peso en libras"
          type="number"
          value={form.peso_libras}
          onChange={(value) =>
            setForm((current) => ({ ...current, peso_libras: value }))
          }
          placeholder="Ej: 185"
        />

        <FieldInput
          label="Fecha"
          type="date"
          value={form.fecha}
          onChange={(value) =>
            setForm((current) => ({ ...current, fecha: value }))
          }
        />

        <button
          type="submit"
          disabled={saving}
          className="h-12 rounded-2xl bg-orange-500 text-sm font-black uppercase text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar PR"}
        </button>
      </form>
    </article>
  )
}

function HistoryTable({ items = [], loading = false }) {
  return (
    <article className="min-h-0 overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 p-5 shadow-2xl shadow-black/30">
      <div className="mb-4">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
          Historial de mis PR
        </p>
      </div>

      {loading ? (
        <EmptyCard text="Cargando historial..." />
      ) : items.length === 0 ? (
        <EmptyCard text="Aún no tienes historial." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-xs uppercase text-white/45">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Ejercicio</th>
                <th className="px-4 py-3">Peso</th>
                <th className="px-4 py-3">Registrado</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-white/10">
                  <td className="px-4 py-3 text-white/70">
                    {formatDateShort(item.fecha)}
                  </td>
                  <td className="px-4 py-3 font-black text-white">
                    {item.ejercicio_nombre}
                  </td>
                  <td className="px-4 py-3 font-black text-orange-400">
                    {item.peso_libras} lb
                  </td>
                  <td className="px-4 py-3 text-white/45">
                    {relativeDate(item.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  )
}

function TipsCard() {
  return (
    <article className="relative overflow-hidden rounded-[2rem] border border-orange-500/20 bg-orange-500/10 p-5 shadow-2xl shadow-black/30">
      <div className="absolute -right-16 bottom-0 text-[9rem] opacity-10">🦅</div>

      <div className="relative z-10">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
          Tips PHO3NIX
        </p>

        <div className="mt-4 space-y-3 text-sm text-white/70">
          <p>✅ Duerme bien y recupera tu cuerpo.</p>
          <p>✅ Técnica primero, peso después.</p>
          <p>✅ Progresión constante, no ego.</p>
          <p>✅ Registra tus PR y celebra cada avance.</p>
        </div>

        <p className="mt-5 text-sm font-black text-orange-400">
          Sé Fénix. Renace más fuerte cada día.
        </p>
      </div>
    </article>
  )
}

/* =======================================================
   SMALL UI
======================================================= */

function FieldSelect({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase text-white/45">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-white/10 bg-black/50 px-4 text-sm text-white outline-none focus:border-orange-500/60"
      >
        <option value="">Selecciona un ejercicio</option>
        {options.map((item) => (
          <option key={item.id} value={item.id}>
            {item.nombre}
          </option>
        ))}
      </select>
    </label>
  )
}

function FieldInput({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase text-white/45">
        {label}
      </span>

      <input
        type={type}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-white/10 bg-black/50 px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-500/60"
      />
    </label>
  )
}

function Alert({ type, text }) {
  const isError = type === "error"

  return (
    <div
      className={[
        "relative z-10 shrink-0 rounded-2xl border px-4 py-3 text-sm",
        isError
          ? "border-red-500/30 bg-red-500/10 text-red-200"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
      ].join(" ")}
    >
      {text}
    </div>
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

/* =======================================================
   HELPERS
======================================================= */

function getMembershipLabel(mensualidad) {
  if (!mensualidad) {
    return {
      status: "vencida",
      title: "Sin membresía",
      subtitle: "Consulta con administración",
      progress: 15,
    }
  }

  const info = mensualidadStatusInfo(mensualidad, new Date())

  if (!info.active) {
    return {
      status: "vencida",
      title: "Vencida",
      subtitle: "Renueva tu mensualidad",
      progress: 15,
    }
  }

  if (info.daysLeft !== null && info.daysLeft <= 7) {
    return {
      status: "por_vencer",
      title: "Por vencer",
      subtitle:
        info.daysLeft === 0
          ? "Vence hoy"
          : `Vence en ${info.daysLeft} día(s)`,
      progress: 72,
    }
  }

  return {
    status: "activa",
    title: "Activa",
    subtitle:
      info.daysLeft !== null
        ? `Vence en ${info.daysLeft} día(s)`
        : "Mensualidad activa",
    progress: 92,
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

function shortText(value, max = 14) {
  const text = String(value || "")

  if (text.length <= max) return text

  return `${text.slice(0, max)}...`
}

function getTodayISO() {
  return new Date().toISOString().slice(0, 10)
}

function parseDate(value) {
  if (!value) return null

  try {
    return new Date(`${value}T00:00:00`)
  } catch {
    return null
  }
}

function formatDateShort(value) {
  if (!value) return "-"

  try {
    const date = new Date(`${value}T00:00:00`)

    return new Intl.DateTimeFormat("es-EC", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
      .format(date)
      .replace(".", "")
  } catch {
    return String(value)
  }
}

function relativeDate(value) {
  if (!value) return "-"

  try {
    const date = new Date(value)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) return "Hoy"
    if (diffDays === 1) return "Ayer"

    return `Hace ${diffDays} días`
  } catch {
    return "-"
  }
}