import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../../supabase"
import { mensualidadStatusInfo } from "../../../utils/mensualidades"

import AlumnoSidebar from "../dashboard/components/AlumnoSidebar"
import AlumnoMobileNav from "../shared/AlumnoMobileNav"
import pho3nixLogo from "../../../assets/pho3nix-login-logo.png"
import { getPrExerciseImage } from "./utils/prExerciseImages"

const DEFAULT_DATA = {
  profile: null,
  mensualidad: null,
  ejercicios: [],
  rms: [],
  globalRms: [],
  users: [],
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
  const [editingPr, setEditingPr] = useState(null)
  const [editForm, setEditForm] = useState({
    ejercicio_id: "",
    peso_libras: "",
    fecha: getTodayISO(),
  })
  const [deletingPrId, setDeletingPrId] = useState(null)

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

        const [
          profileResult,
          mensualidadResult,
          ejerciciosResult,
          rmResult,
          globalRmResult,
          usersResult,
        ] = await Promise.all([
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

            supabase
              .from("rm")
              .select("id,usuario,ejercicio_id,peso_libras,fecha,created_at")
              .order("peso_libras", { ascending: false })
              .order("fecha", { ascending: false })
              .limit(500),

            supabase
              .from("usuarios")
              .select("id,nombre,foto_url"),
          ])

        if (profileResult.error) throw profileResult.error
        if (mensualidadResult.error) throw mensualidadResult.error
        if (ejerciciosResult.error) throw ejerciciosResult.error
        if (rmResult.error) throw rmResult.error
        if (globalRmResult.error) throw globalRmResult.error
        if (usersResult.error) throw usersResult.error

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
          globalRms: globalRmResult.data || [],
          users: usersResult.data || [],
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

  const userMap = useMemo(() => {
    const map = new Map()

    ;(data.users || []).forEach((item) => {
      map.set(item.id, item)
    })

    return map
  }, [data.users])

  const globalEnrichedRms = useMemo(() => {
    return (data.globalRms || []).map((item) => {
      const user = userMap.get(item.usuario)

      return {
        ...item,
        ejercicio_nombre: exerciseMap.get(item.ejercicio_id) || "Ejercicio",
        usuario_nombre: user?.nombre || "Alumno PHO3NIX",
        usuario_foto_url: user?.foto_url || "",
      }
    })
  }, [data.globalRms, exerciseMap, userMap])

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

    const bestByExercise = Array.from(bestByExerciseMap.values())
      .map((item) => attachGlobalRank(item, globalEnrichedRms))
      .sort((a, b) => Number(b.peso_libras || 0) - Number(a.peso_libras || 0))

    const strongestExercise = bestByExercise[0] || null

    const allRecords = enrichedRms.map((item) =>
      attachGlobalRank(item, globalEnrichedRms)
    )

    return {
      total: enrichedRms.length,
      thisMonth: thisMonth.length,
      latestPr,
      bestGeneral,
      bestByExercise,
      strongestExercise,
      allRecords,
      recent: enrichedRms.slice(0, 5),
    }
  }, [enrichedRms, globalEnrichedRms])

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

      const duplicatedSameDay = hasPrForExerciseAndDate(
        data.rms,
        form.ejercicio_id,
        form.fecha
      )

      if (duplicatedSameDay) {
        throw new Error(
          "Ya tienes un PR registrado para este ejercicio en esa fecha. Puedes editarlo si necesitas corregirlo."
        )
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

  function openEditPr(item) {
    if (!item?.id) return

    setError("")
    setSuccess("")
    setEditingPr(item)
    setEditForm({
      ejercicio_id: item.ejercicio_id || "",
      peso_libras: item.peso_libras || "",
      fecha: item.fecha || getTodayISO(),
    })
  }

  const handleUpdatePr = async (event) => {
    event.preventDefault()

    if (!data.profile?.id || !editingPr?.id) return

    try {
      setSaving(true)
      setError("")
      setSuccess("")

      if (!editForm.ejercicio_id) {
        throw new Error("Selecciona un ejercicio.")
      }

      if (!editForm.peso_libras || Number(editForm.peso_libras) <= 0) {
        throw new Error("Ingresa un peso válido en libras.")
      }

      if (!editForm.fecha) {
        throw new Error("Selecciona la fecha del PR.")
      }

      const duplicatedSameDay = hasPrForExerciseAndDate(
        data.rms,
        editForm.ejercicio_id,
        editForm.fecha,
        editingPr.id
      )

      if (duplicatedSameDay) {
        throw new Error(
          "Ya tienes otro PR registrado para este ejercicio en esa fecha. Puedes editar o eliminar el registro duplicado."
        )
      }

      const payload = {
        ejercicio_id: editForm.ejercicio_id,
        peso_libras: Number(editForm.peso_libras),
        fecha: editForm.fecha,
      }

      const { data: updated, error: updateError } = await supabase
        .from("rm")
        .update(payload)
        .eq("id", editingPr.id)
        .eq("usuario", data.profile.id)
        .select("id,usuario,ejercicio_id,peso_libras,fecha,created_at")
        .single()

      if (updateError) throw updateError

      setData((current) => ({
        ...current,
        rms: replacePrRow(current.rms, updated),
        globalRms: replacePrRow(current.globalRms, updated),
      }))

      setSelectedExerciseId(editForm.ejercicio_id)
      setEditingPr(null)
      setSuccess("PR actualizado correctamente.")
    } catch (err) {
      console.error("Error actualizando PR:", err)
      setError(err.message || "No se pudo actualizar el PR.")
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePr = async (item) => {
    if (!data.profile?.id || !item?.id || deletingPrId) return

    const confirmed = window.confirm(
      `¿Eliminar el PR de ${item.ejercicio_nombre || "este ejercicio"} (${item.peso_libras} lb)?`
    )

    if (!confirmed) return

    try {
      setDeletingPrId(item.id)
      setError("")
      setSuccess("")

      const { error: deleteError } = await supabase
        .from("rm")
        .delete()
        .eq("id", item.id)
        .eq("usuario", data.profile.id)

      if (deleteError) throw deleteError

      setData((current) => ({
        ...current,
        rms: (current.rms || []).filter((row) => String(row.id) !== String(item.id)),
        globalRms: (current.globalRms || []).filter((row) => String(row.id) !== String(item.id)),
      }))

      if (String(selectedExerciseId) === String(item.ejercicio_id)) {
        const remainingForExercise = (data.rms || []).filter((row) => {
          return (
            String(row.id) !== String(item.id) &&
            String(row.ejercicio_id) === String(item.ejercicio_id)
          )
        })

        if (remainingForExercise.length === 0 && data.ejercicios[0]?.id) {
          setSelectedExerciseId(data.ejercicios[0].id)
        }
      }

      setSuccess("PR eliminado correctamente.")
    } catch (err) {
      console.error("Error eliminando PR:", err)
      setError(err.message || "No se pudo eliminar el PR.")
    } finally {
      setDeletingPrId(null)
    }
  }

  return (
    <div className="phoenix-pr-root fixed inset-0 z-[70] overflow-hidden bg-[#050505] text-white">
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

                  <HistoryTable
                    items={stats.allRecords}
                    loading={loading}
                    deletingId={deletingPrId}
                    onEdit={openEditPr}
                    onDelete={handleDeletePr}
                  />
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
          onEditPr={openEditPr}
          onDeletePr={handleDeletePr}
          deletingPrId={deletingPrId}
          onBack={() => navigate("/alumno/dashboard")}
        />
      </div>

      {editingPr ? (
        <EditPrModal
          ejercicios={data.ejercicios}
          form={editForm}
          setForm={setEditForm}
          saving={saving}
          onSubmit={handleUpdatePr}
          onClose={() => !saving && setEditingPr(null)}
        />
      ) : null}
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
  onEditPr,
  onDeletePr,
  deletingPrId,
  onBack,
}) {
  const [showForm, setShowForm] = useState(false)
  const [selectedGlobalPr, setSelectedGlobalPr] = useState(null)
  const [selectedEvolutionPr, setSelectedEvolutionPr] = useState(null)

  const destacado = stats.bestGeneral || stats.latestPr || null
  const bestMarks = stats.bestByExercise || []
  const allRecords = stats.allRecords || []
  const evolutionTarget = selectedEvolutionPr || destacado

  const evolutionRows = useMemo(() => {
    if (!evolutionTarget?.ejercicio_id) return []

    return (data.rms || [])
      .filter((item) => item.ejercicio_id === evolutionTarget.ejercicio_id)
      .slice()
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
      .slice(-6)
  }, [data.rms, evolutionTarget?.ejercicio_id])

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
    <main className="phoenix-pr-screen h-[100dvh] w-screen max-w-full overflow-x-hidden overflow-y-auto bg-[#050505] pb-28 text-white">
      <div className="relative min-h-full w-full max-w-full overflow-x-hidden px-3 pt-3">
        <BackgroundOrbs />

        <header className="relative z-10 mb-3 flex items-center justify-between gap-3 border-b border-white/10 pb-2.5">
          <Avatar
            loading={loading}
            initials={initials}
            fotoUrl={data.profile?.foto_url}
            nombre={profileName}
          />

          <div className="flex min-w-0 items-center gap-2">
            <img
              src={pho3nixLogo}
              alt="PHO3NIX"
              className="phoenix-pr-logo h-8 w-8 shrink-0 object-contain drop-shadow-[0_0_16px_rgba(249,115,22,0.35)]"
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
            Records Personales
          </h1>
        </section>

        {error ? <Alert type="error" text={error} /> : null}
        {success ? <Alert type="success" text={success} /> : null}

        <section className="phoenix-pr-hero relative z-10 mb-3 overflow-hidden rounded-[1.35rem] border border-orange-500/25 bg-black/55 shadow-2xl shadow-black/40">
          <div className="phoenix-pr-hero-bg absolute inset-0 bg-[url('/images/backWODCardAlumno.png')] bg-cover bg-center opacity-100" />
          <div className="phoenix-pr-hero-overlay absolute inset-0 bg-[radial-gradient(circle_at_82%_35%,rgba(249,115,22,0.24),transparent_80%),linear-gradient(90deg,#050505_0%,rgba(5,5,5,0.92)_52%,rgba(5,5,5,0.62)_100%)]" />
          <div className="phoenix-pr-hero-glow absolute -right-20 top-14 h-64 w-64 rounded-full bg-orange-500/14 blur-3xl" />

          <div className="relative z-10 p-3.5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
              ☆ Record destacado
            </p>

            <h2 className="mt-3 text-3xl font-black uppercase leading-none tracking-tight text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.12)]">
              {loading ? "Cargando..." : destacado?.ejercicio_nombre || "Sin PR registrado"}
            </h2>

            <div className="mt-2 flex items-end gap-2">
              <p className="text-[4rem] font-black leading-none text-orange-500">
                {loading ? "..." : destacado?.peso_libras || "--"}
              </p>
              <p className="pb-2 text-2xl font-black uppercase text-orange-400">
                LB
              </p>
            </div>

            <p className="text-sm font-bold text-white/55">
              Mejor marca registrada
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-3">
              <HeroInfo icon="▣" label="Fecha" value={formatDateShort(destacado?.fecha)} />
              <HeroInfo icon="🏋️" label="Categoría" value={getPrCategory(destacado?.ejercicio_nombre)} />
              <HeroInfo
                icon="↗"
                label="Estado"
                value={stats.thisMonth > 0 ? "Nuevo PR" : "Activo"}
                accent
              />
            </div>

            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-orange-500/35 bg-orange-500/10 px-3 text-xs font-black uppercase text-orange-300"
            >
              + Registrar nuevo PR
            </button>
          </div>
        </section>

        <section className="relative z-10 mb-3 grid grid-cols-2 gap-2.5">
          <MobileMetricCard
            title="Total PR"
            value={loading ? "..." : stats.total || 0}
            footer="Mejores marcas totales"
            icon="🏅"
          />

          <MobileMetricCard
            title="Este mes"
            value={loading ? "..." : `${stats.thisMonth || 0} nuevos`}
            footer="Nuevos PR este mes"
            icon="↗"
          />
        </section>

        <MobileAllPrTable
          items={allRecords}
          loading={loading}
          deletingId={deletingPrId}
          onSelect={(item) => setSelectedEvolutionPr(item)}
          onOpenGlobal={(item) => setSelectedGlobalPr(item)}
          onEdit={onEditPr}
          onDelete={onDeletePr}
        />

        <MobileEvolutionCard
          rows={evolutionRows}
          destacado={evolutionTarget}
          hasSelection={!!selectedEvolutionPr}
        />

        <section className="phoenix-pr-callout relative z-10 mb-4 overflow-hidden rounded-[1.25rem] border border-orange-500/20 bg-black/45 p-3 shadow-2xl shadow-black/30">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-orange-500/25 bg-orange-500/10 text-2xl">
              🐦
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-white">
                ¡Cada PR te hace más fuerte!
              </p>
              <p className="mt-1 truncate text-xs text-white/45">
                Sigue superando tus límites.
              </p>
            </div>
          </div>
        </section>
      </div>

      {showForm ? (
        <MobileModal title="Registrar nuevo PR" onClose={() => setShowForm(false)}>
          <MobileRegisterPanel
            ejercicios={data.ejercicios}
            form={form}
            setForm={setForm}
            saving={saving}
            onSubmit={onSubmit}
          />
        </MobileModal>
      ) : null}

      {selectedGlobalPr ? (
        <MobileModal
          title="Top global del ejercicio"
          onClose={() => setSelectedGlobalPr(null)}
        >
          <GlobalRankingModal item={selectedGlobalPr} />
        </MobileModal>
      ) : null}

      <AlumnoMobileNav />
    </main>
  )
}

function Avatar({ loading, initials, fotoUrl, nombre }) {
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

function HeroInfo({ icon, label, value, accent = false }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/35">
        {icon} {label}
      </p>
      <p
        className={[
          "mt-1 truncate text-xs font-black uppercase",
          accent ? "text-orange-400" : "text-white/75",
        ].join(" ")}
      >
        {value || "--"}
      </p>
    </div>
  )
}

function MobileMetricCard({ title, value, footer, icon }) {
  return (
    <article className="phoenix-pr-metric-card relative min-h-[122px] overflow-hidden rounded-[1.2rem] border border-white/10 bg-black/45 p-3 shadow-2xl shadow-black/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(249,115,22,0.15),transparent_36%)]" />

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-black uppercase tracking-[0.1em] text-white/45">
            {title}
          </p>
          <span className="text-lg text-orange-400">{icon}</span>
        </div>

        <p className="mt-4 truncate text-3xl font-black uppercase leading-none text-orange-400">
          {value}
        </p>

        <p className="mt-2 truncate text-[10px] text-white/45">
          {footer}
        </p>
      </div>
    </article>
  )
}

function MobileAllPrTable({
  items = [],
  loading = false,
  deletingId = null,
  onSelect,
  onOpenGlobal,
  onEdit,
  onDelete,
}) {
  const pageSize = 6
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages))
  }, [totalPages])

  const startIndex = (page - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, items.length)
  const pageItems = items.slice(startIndex, endIndex)

  return (
    <section className="phoenix-pr-panel relative z-10 mb-3 overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/45 p-3 shadow-2xl shadow-black/30">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-black uppercase tracking-[0.1em] text-white/70">
            Todos mis PR
          </p>
          <p className="mt-0.5 text-[10px] font-bold text-white/35">
            {loading
              ? "Cargando registros..."
              : items.length > 0
              ? `Mostrando ${startIndex + 1}-${endIndex} de ${items.length}`
              : "Historial completo de marcas"}
          </p>
        </div>

        <span className="shrink-0 rounded-xl border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-[10px] font-black uppercase text-orange-300">
          {items.length} PR
        </span>
      </div>

      {loading ? (
        <MobileEmpty text="Cargando tus PR..." />
      ) : items.length === 0 ? (
        <MobileEmpty text="Aún no tienes marcas registradas." />
      ) : (
        <>
          <div className="phoenix-pr-table overflow-hidden rounded-[1.05rem] border border-white/10 bg-black/35">
            <div className="grid grid-cols-[minmax(0,1fr)_62px_58px_70px] items-center border-b border-white/10 bg-white/[0.04] px-2.5 py-2 text-[9px] font-black uppercase tracking-[0.12em] text-white/40">
              <span>Ejercicio</span>
              <span className="text-center">Marca</span>
              <span className="text-center">Global</span>
              <span className="text-center">Acción</span>
            </div>

            <div className="divide-y divide-white/10">
              {pageItems.map((item) => (
                <MobileBestMarkRow
                  key={item.id}
                  item={item}
                  deleting={String(deletingId || "") === String(item.id)}
                  onSelect={() => onSelect?.(item)}
                  onOpenGlobal={() => onOpenGlobal?.(item)}
                  onEdit={() => onEdit?.(item)}
                  onDelete={() => onDelete?.(item)}
                />
              ))}
            </div>
          </div>

          {totalPages > 1 ? (
            <MobilePaginationControls
              page={page}
              totalPages={totalPages}
              onPrev={() => setPage((current) => Math.max(1, current - 1))}
              onNext={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
            />
          ) : null}
        </>
      )}
    </section>
  )
}

function MobileBestMarkRow({
  item,
  deleting = false,
  onSelect,
  onOpenGlobal,
  onEdit,
  onDelete,
}) {
  return (
    <article className="grid w-full grid-cols-[minmax(0,1fr)_62px_58px_70px] items-center gap-2 px-2.5 py-2.5 text-left transition hover:bg-white/[0.03] active:bg-orange-500/10">
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 items-center gap-2.5 text-left"
      >
        <ExerciseIcon name={item.ejercicio_nombre} />

        <div className="min-w-0">
          <p className="truncate text-[11px] font-black uppercase leading-tight text-white">
            {item.ejercicio_nombre}
          </p>

          <p className="mt-0.5 truncate text-[10px] font-bold text-white/40">
            {formatDateShort(item.fecha)}
          </p>
        </div>
      </button>

      <div className="shrink-0 text-center">
        <p className="text-xs font-black text-orange-400">
          {item.peso_libras}
        </p>
        <p className="mt-0.5 text-[9px] font-bold uppercase text-white/35">
          LB
        </p>
      </div>

      <button
        type="button"
        onClick={onOpenGlobal}
        className="flex h-8 w-8 shrink-0 items-center justify-center justify-self-center rounded-lg border border-orange-500/25 bg-orange-500/10 text-sm text-orange-300 transition active:scale-95"
        aria-label="Ver ranking global"
      >
        👁
      </button>

      <div className="flex shrink-0 items-center justify-end gap-1">
        <button
          type="button"
          onClick={onEdit}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-orange-500/25 bg-orange-500/10 text-xs text-orange-300 transition active:scale-95"
          aria-label="Editar PR"
          title="Editar PR"
        >
          ✎
        </button>

        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/25 bg-red-500/10 text-xs text-red-300 transition active:scale-95 disabled:opacity-40"
          aria-label="Eliminar PR"
          title="Eliminar PR"
        >
          {deleting ? "…" : "🗑"}
        </button>
      </div>
    </article>
  )
}

function ExerciseIcon({ name }) {
  const [failed, setFailed] = useState(false)
  const src = getPrExerciseImage(name)

  return (
    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-orange-500/20 bg-orange-500/10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(249,115,22,0.35),transparent_62%)]" />

      {!failed && src ? (
        <img
          src={src}
          alt={name || "Ejercicio"}
          className="relative z-10 h-full w-full object-contain p-1.5"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="relative z-10 text-xl">🏋️</span>
      )}
    </div>
  )
}

function MobileEvolutionCard({ rows = [], destacado, hasSelection = false }) {
  const chart = buildMobileEvolutionChart(rows)

  return (
    <section className="phoenix-pr-panel relative z-10 mb-3 overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/45 p-3 shadow-2xl shadow-black/30">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.1em] text-white/70">
            Evolución
          </p>
          <p className="mt-0.5 truncate text-[10px] font-bold text-white/35">
            {destacado?.ejercicio_nombre
              ? destacado.ejercicio_nombre
              : "Selecciona una marca de la tabla"}
          </p>
        </div>

        <span className="shrink-0 rounded-xl border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-[10px] font-black uppercase text-orange-300">
          Línea
        </span>
      </div>

      {!hasSelection ? (
        <MobileEmpty text="Selecciona un ejercicio en MIS MEJORES MARCAS para ver su evolución." />
      ) : rows.length === 0 ? (
        <MobileEmpty text="Este ejercicio todavía no tiene registros para mostrar." />
      ) : (
        <div className="phoenix-pr-chart-card overflow-hidden rounded-xl border border-white/10 bg-black/25 p-3">
          <svg
            viewBox={`0 0 ${chart.width} ${chart.height}`}
            className="h-[180px] w-full overflow-visible"
            role="img"
            aria-label="Evolución de PR por fecha y peso"
          >
            <defs>
              <linearGradient id="prMobileLine" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#fb923c" />
              </linearGradient>

              <linearGradient id="prMobileArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {chart.grid.map((line) => (
              <g key={line.y}>
                <line
                  x1={chart.paddingX}
                  x2={chart.width - chart.paddingX}
                  y1={line.y}
                  y2={line.y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="1"
                />
                <text
                  x={chart.paddingX - 10}
                  y={line.y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="rgba(255,255,255,0.38)"
                >
                  {line.value}
                </text>
              </g>
            ))}

            <polygon points={chart.areaPoints} fill="url(#prMobileArea)" />

            <polyline
              points={chart.linePoints}
              fill="none"
              stroke="url(#prMobileLine)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="drop-shadow(0 0 8px rgba(249,115,22,0.45))"
            />

            {chart.points.map((point) => (
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
                  y={point.y - 13}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="900"
                  fill="white"
                >
                  {point.value}
                </text>

                <text
                  x={point.x}
                  y={chart.baseY + 20}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="800"
                  fill="rgba(255,255,255,0.42)"
                >
                  {formatMonthLabel(point.fecha)}
                </text>
              </g>
            ))}
          </svg>
        </div>
      )}
    </section>
  )
}

function buildMobileEvolutionChart(rows = []) {
  const width = 360
  const height = 200
  const paddingX = 34
  const paddingTop = 24
  const paddingBottom = 38
  const baseY = height - paddingBottom
  const plotWidth = width - paddingX * 2
  const plotHeight = height - paddingTop - paddingBottom

  const values = rows.map((item) => Number(item.peso_libras || 0))
  const max = Math.max(...values, 1)
  const min = Math.min(...values, max)
  const range = max - min || 1

  const points = rows.map((item, index) => {
    const value = Number(item.peso_libras || 0)
    const x =
      rows.length === 1
        ? width / 2
        : paddingX + (index / (rows.length - 1)) * plotWidth
    const y = paddingTop + (1 - (value - min) / range) * plotHeight

    return {
      id: item.id,
      value,
      fecha: item.fecha,
      x,
      y,
    }
  })

  const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ")
  const areaPoints =
    points.length > 0
      ? `${points[0].x},${baseY} ${linePoints} ${points[points.length - 1].x},${baseY}`
      : ""

  const grid = [0, 0.5, 1].map((ratio) => ({
    y: paddingTop + ratio * plotHeight,
    value: Math.round(max - ratio * range),
  }))

  return {
    width,
    height,
    paddingX,
    baseY,
    points,
    linePoints,
    areaPoints,
    grid,
  }
}


function GlobalRankingModal({ item }) {
  const rows = item?.global_top || []

  return (
    <section className="grid gap-3">
      <article className="relative overflow-hidden rounded-[1.35rem] border border-orange-500/25 bg-black/55 p-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(249,115,22,0.22),transparent_36%)]" />

        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
            Ranking global
          </p>

          <h3 className="mt-2 text-2xl font-black uppercase leading-none text-white">
            {item?.ejercicio_nombre || "Ejercicio"}
          </h3>

          <p className="mt-2 text-sm text-white/55">
            Tu puesto actual:{" "}
            <span className="font-black text-orange-400">
              {formatOrdinal(item?.global_rank)}
            </span>
          </p>
        </div>
      </article>

      <article className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/45">
        <div className="grid grid-cols-[42px_minmax(0,1fr)_70px] border-b border-white/10 bg-white/[0.04] px-3 py-2 text-[9px] font-black uppercase tracking-[0.12em] text-white/40">
          <span>#</span>
          <span>Alumno</span>
          <span className="text-right">Marca</span>
        </div>

        <div className="divide-y divide-white/10">
          {rows.length === 0 ? (
            <div className="p-3 text-xs text-white/40">
              No hay registros globales para este ejercicio.
            </div>
          ) : (
            rows.map((row, index) => {
              const isMine = row.usuario === item.usuario

              return (
                <div
                  key={`${row.usuario}-${row.id || index}`}
                  className={[
                    "grid grid-cols-[42px_minmax(0,1fr)_70px] items-center px-3 py-2.5 text-sm",
                    isMine ? "bg-orange-500/10" : "",
                  ].join(" ")}
                >
                  <div className="font-black text-orange-400">
                    {formatOrdinal(index + 1)}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-black text-white">
                      {row.usuario_nombre || "Alumno PHO3NIX"}
                      {isMine ? " (Tú)" : ""}
                    </p>
                    <p className="mt-0.5 text-[10px] text-white/35">
                      {formatDateShort(row.fecha)}
                    </p>
                  </div>

                  <div className="text-right font-black text-white">
                    {row.peso_libras} lb
                  </div>
                </div>
              )
            })
          )}
        </div>
      </article>
    </section>
  )
}

function PrDetailCard({ item }) {
  return (
    <section className="grid gap-3">
      <article className="relative overflow-hidden rounded-[1.35rem] border border-orange-500/25 bg-black/55 p-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(249,115,22,0.22),transparent_36%)]" />

        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
            Record personal
          </p>

          <h3 className="mt-2 text-2xl font-black uppercase leading-none text-white">
            {item.ejercicio_nombre || "Ejercicio"}
          </h3>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <DetailTile label="Marca" value={`${item.peso_libras} LB`} />
            <DetailTile label="Tipo" value={getPrCategory(item.ejercicio_nombre)} />
            <DetailTile label="Fecha" value={formatDateShort(item.fecha)} />
            <DetailTile label="Estado" value="Mejor marca" />
          </div>
        </div>
      </article>
    </section>
  )
}

function DetailTile({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/35">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black uppercase text-white">
        {value || "—"}
      </p>
    </div>
  )
}

function EditPrModal({ ejercicios, form, setForm, saving, onSubmit, onClose }) {
  return (
    <MobileModal title="Editar PR" onClose={onClose}>
      <MobileRegisterPanel
        ejercicios={ejercicios}
        form={form}
        setForm={setForm}
        saving={saving}
        onSubmit={onSubmit}
        submitLabel="Actualizar PR"
      />
    </MobileModal>
  )
}

function MobileModal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/88 p-4 backdrop-blur-2xl">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Cerrar"
      />

      <section className="phoenix-pr-modal relative z-10 flex max-h-[84dvh] w-full max-w-md flex-col overflow-hidden rounded-[1.6rem] border border-orange-500/25 bg-[#060606] shadow-[0_0_60px_rgba(249,115,22,0.20)]">
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-orange-400">
            {title}
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
          {children}
        </div>
      </section>
    </div>
  )
}

function MobileRegisterPanel({
  ejercicios,
  form,
  setForm,
  saving,
  onSubmit,
  submitLabel = "Guardar PR",
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="phoenix-pr-register-form rounded-[1.35rem] border border-orange-500/25 bg-black/55 p-4"
    >
      <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-orange-400">
        {submitLabel === "Guardar PR" ? "Registrar nueva marca" : "Editar marca personal"}
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
            className="h-11 w-full rounded-xl border border-white/10 bg-black/55 px-3 text-sm text-white outline-none focus:border-orange-500/60"
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
            className="h-11 w-full rounded-xl border border-white/10 bg-black/55 px-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-500/60"
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
            className="h-11 w-full rounded-xl border border-white/10 bg-black/55 px-3 text-sm text-white outline-none focus:border-orange-500/60"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="mt-2 h-11 rounded-xl bg-orange-500 text-xs font-black uppercase text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Guardando..." : submitLabel}
        </button>
      </div>
    </form>
  )
}

function MobileEmpty({ text }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-black/25 p-3 text-xs text-white/40">
      {text}
    </div>
  )
}

function attachGlobalRank(item, globalRows = []) {
  const ranking = buildGlobalRankingForExercise(globalRows, item.ejercicio_id)
  const myIndex = ranking.findIndex((row) => row.usuario === item.usuario)

  return {
    ...item,
    global_rank: myIndex >= 0 ? myIndex + 1 : null,
    global_total: ranking.length,
    global_top: ranking.slice(0, 10),
  }
}

function buildGlobalRankingForExercise(globalRows = [], exerciseId) {
  const bestByUser = new Map()

  globalRows
    .filter((row) => row.ejercicio_id === exerciseId)
    .forEach((row) => {
      const current = bestByUser.get(row.usuario)
      const rowWeight = Number(row.peso_libras || 0)
      const currentWeight = Number(current?.peso_libras || 0)

      if (
        !current ||
        rowWeight > currentWeight ||
        (rowWeight === currentWeight &&
          new Date(row.fecha || row.created_at || 0) >
            new Date(current.fecha || current.created_at || 0))
      ) {
        bestByUser.set(row.usuario, row)
      }
    })

  return Array.from(bestByUser.values()).sort((a, b) => {
    const weightDiff = Number(b.peso_libras || 0) - Number(a.peso_libras || 0)
    if (weightDiff !== 0) return weightDiff

    return new Date(a.fecha || a.created_at || 0) - new Date(b.fecha || b.created_at || 0)
  })
}

function formatOrdinal(value) {
  const number = Number(value || 0)

  if (!number) return "--"

  if (number === 1) return "1°"
  if (number === 2) return "2°"
  if (number === 3) return "3°"

  return `${number}°`
}

function getPrCategory(name) {
  const value = String(name || "").toLowerCase()

  if (
    value.includes("pull") ||
    value.includes("muscle") ||
    value.includes("toes") ||
    value.includes("handstand") ||
    value.includes("ring")
  ) {
    return "Gimnástico"
  }

  if (
    value.includes("run") ||
    value.includes("bike") ||
    value.includes("row") ||
    value.includes("burpee")
  ) {
    return "Condición"
  }

  if (
    value.includes("clean") ||
    value.includes("snatch") ||
    value.includes("jerk")
  ) {
    return "Potencia"
  }

  return "Fuerza"
}

function formatMonthLabel(value) {
  if (!value) return "--"

  try {
    return new Intl.DateTimeFormat("es-EC", {
      month: "short",
    })
      .format(new Date(`${value}T00:00:00`))
      .replace(".", "")
  } catch {
    return "--"
  }
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

function RegisterPrPanel({
  ejercicios,
  form,
  setForm,
  saving,
  onSubmit,
  submitLabel = "Guardar PR",
}) {
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
          {saving ? "Guardando..." : submitLabel}
        </button>
      </form>
    </article>
  )
}

function HistoryTable({
  items = [],
  loading = false,
  deletingId = null,
  onEdit,
  onDelete,
}) {
  const pageSize = 7
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages))
  }, [totalPages])

  const startIndex = (page - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, items.length)
  const pageItems = items.slice(startIndex, endIndex)

  return (
    <article className="min-h-0 overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 p-5 shadow-2xl shadow-black/30">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
            Historial completo de mis PR
          </p>
          <p className="mt-1 text-xs text-white/40">
            {loading
              ? "Cargando registros..."
              : items.length > 0
              ? `Mostrando ${startIndex + 1}-${endIndex} de ${items.length} PR`
              : "Sin registros para mostrar"}
          </p>
        </div>

        <span className="shrink-0 rounded-2xl border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-xs font-black uppercase text-orange-300">
          {items.length} PR
        </span>
      </div>

      {loading ? (
        <EmptyCard text="Cargando historial..." />
      ) : items.length === 0 ? (
        <EmptyCard text="Aún no tienes historial." />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.04] text-xs uppercase text-white/45">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Ejercicio</th>
                  <th className="px-4 py-3">Peso</th>
                  <th className="px-4 py-3">Global</th>
                  <th className="px-4 py-3">Registrado</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>

              <tbody>
                {pageItems.map((item) => (
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
                    <td className="px-4 py-3 text-white/60">
                      {formatOrdinal(item.global_rank)}
                    </td>
                    <td className="px-4 py-3 text-white/45">
                      {relativeDate(item.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit?.(item)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-orange-500/25 bg-orange-500/10 text-xs text-orange-300 transition hover:bg-orange-500/15"
                          aria-label="Editar PR"
                          title="Editar PR"
                        >
                          ✎
                        </button>

                        <button
                          type="button"
                          onClick={() => onDelete?.(item)}
                          disabled={String(deletingId || "") === String(item.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/25 bg-red-500/10 text-xs text-red-300 transition hover:bg-red-500/15 disabled:opacity-40"
                          aria-label="Eliminar PR"
                          title="Eliminar PR"
                        >
                          {String(deletingId || "") === String(item.id) ? "…" : "🗑"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 ? (
            <PaginationControls
              page={page}
              totalPages={totalPages}
              onPrev={() => setPage((current) => Math.max(1, current - 1))}
              onNext={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
            />
          ) : null}
        </>
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

function PaginationControls({ page, totalPages, onPrev, onNext }) {
  return (
    <div className="mt-4 flex items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <button
        type="button"
        onClick={onPrev}
        disabled={page <= 1}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/35 text-xl font-black text-white/65 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-35"
        aria-label="Página anterior"
        title="Página anterior"
      >
        ‹
      </button>

      <p className="min-w-[96px] text-center text-xs font-black uppercase tracking-[0.12em] text-white/45">
        <span className="text-orange-400">{page}</span> / {totalPages}
      </p>

      <button
        type="button"
        onClick={onNext}
        disabled={page >= totalPages}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-500/25 bg-orange-500/10 text-xl font-black text-orange-300 transition hover:bg-orange-500/15 disabled:cursor-not-allowed disabled:opacity-35"
        aria-label="Página siguiente"
        title="Página siguiente"
      >
        ›
      </button>
    </div>
  )
}

function MobilePaginationControls({ page, totalPages, onPrev, onNext }) {
  return (
    <div className="mt-3 flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2">
      <button
        type="button"
        onClick={onPrev}
        disabled={page <= 1}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/35 text-lg font-black text-white/60 disabled:cursor-not-allowed disabled:opacity-35"
        aria-label="Página anterior"
        title="Página anterior"
      >
        ‹
      </button>

      <p className="min-w-[58px] text-center text-[10px] font-black uppercase text-white/45">
        <span className="text-orange-400">{page}</span>/{totalPages}
      </p>

      <button
        type="button"
        onClick={onNext}
        disabled={page >= totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-orange-500/25 bg-orange-500/10 text-lg font-black text-orange-300 disabled:cursor-not-allowed disabled:opacity-35"
        aria-label="Página siguiente"
        title="Página siguiente"
      >
        ›
      </button>
    </div>
  )
}

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
    <div className="phoenix-pr-orbs pointer-events-none absolute inset-0">
      <div className="phoenix-pr-orb phoenix-pr-orb-a absolute -left-32 top-0 h-96 w-96 rounded-full bg-orange-600/20 blur-3xl" />
      <div className="phoenix-pr-orb phoenix-pr-orb-b absolute right-0 top-0 h-96 w-96 rounded-full bg-red-600/10 blur-3xl" />
      <div className="phoenix-pr-orb phoenix-pr-orb-c absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />
    </div>
  )
}

/* =======================================================
   HELPERS
======================================================= */

function hasPrForExerciseAndDate(rows = [], ejercicioId, fecha, excludeId = null) {
  return (rows || []).some((row) => {
    if (excludeId && String(row.id) === String(excludeId)) return false

    return (
      String(row.ejercicio_id) === String(ejercicioId) &&
      String(row.fecha || "") === String(fecha || "")
    )
  })
}

function replacePrRow(rows = [], updated) {
  if (!updated?.id) return rows || []

  return (rows || []).map((row) => {
    if (String(row.id) !== String(updated.id)) return row
    return { ...row, ...updated }
  })
}

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