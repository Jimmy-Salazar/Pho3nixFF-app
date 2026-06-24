// src/pages/admin/Wods.jsx

import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../supabase"
import DashboardSidebar from "./dashboard/components/DashboardSidebar"
import CreateWodModal from "./wods/components/CreateWodModal"
import AdminMobileNav from "./dashboard/mobile/AdminMobileNav"
import pho3nixLogo from "../../assets/pho3nix-login-logo.png"

export default function Wods() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishingId, setPublishingId] = useState(null)
  const [error, setError] = useState("")
  const [wods, setWods] = useState([])
  const [selectedPreviewWod, setSelectedPreviewWod] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingWod, setEditingWod] = useState(null)

  const [publishModalOpen, setPublishModalOpen] = useState(false)
  const [selectedWod, setSelectedWod] = useState(null)
  const [publishFecha, setPublishFecha] = useState("")
  const [publishError, setPublishError] = useState("")

  useEffect(() => {
    loadWods()
  }, [])

  const wodStats = useMemo(() => {
    const total = wods.length
    const pendientes = wods.filter((w) => getWodStatus(w) === "pendiente").length
    const activos = wods.filter((w) => getWodStatus(w) === "activo").length
    const historicos = wods.filter((w) => getWodStatus(w) === "inactivo").length

    return { total, pendientes, activos, historicos }
  }, [wods])

  const weekWods = useMemo(() => {
    return (wods || [])
      .filter((wod) => {
        const status = getWodStatus(wod)

        if (status === "inactivo") return false
        if (status === "pendiente") return true

        return isDateInCurrentWeek(wod.fecha)
      })
      .sort(sortWodsByDateAsc)
  }, [wods])

  const archivedWods = useMemo(() => {
    return (wods || [])
      .filter((wod) => getWodStatus(wod) === "inactivo")
      .sort(sortWodsByDateDesc)
  }, [wods])

  async function loadWods() {
    try {
      setLoading(true)
      setError("")

      const { data, error } = await supabase
        .from("wod")
        .select(
          "id,nombre,fecha,descripcion,modo_ranking,modalidad,activo,publicado,fecha_publicacion,created_at,calorias_min,calorias_max,intensidad_estimada,duracion_estimada,calorias_nota"
        )
        .order("created_at", { ascending: false })

      if (error) throw error

      const rows = data || []

      setWods(rows)
      setSelectedPreviewWod((current) => {
        if (current && rows.some((row) => row.id === current.id)) return current
        return null
      })
    } catch (e) {
      setError(e?.message || "No se pudieron cargar los WODs")
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingWod(null)
    setCreateModalOpen(true)
  }

  function closeCreateModal() {
    if (saving) return
    setCreateModalOpen(false)
    setEditingWod(null)
  }

  function handleEditDraft(wod) {
    const status = getWodStatus(wod)

    if (status !== "pendiente") {
      alert("Solo los WODs en estado PENDIENTE se pueden editar.")
      return
    }

    setEditingWod(wod)
    setCreateModalOpen(true)
  }

  async function handleSaveDraft(payload) {
    try {
      setSaving(true)

      if (editingWod?.id) {
        const status = getWodStatus(editingWod)

        if (status !== "pendiente") {
          alert("Solo los WODs en estado PENDIENTE se pueden editar.")
          setSaving(false)
          return
        }

        const { error } = await supabase
          .from("wod")
          .update(payload)
          .eq("id", editingWod.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("wod").insert({
          ...payload,
          fecha: null,
          activo: false,
          publicado: false,
          fecha_publicacion: null,
        })

        if (error) throw error
      }

      await loadWods()
      closeCreateModal()
    } catch (e) {
      alert(e?.message || "No se pudo guardar el borrador.")
    } finally {
      setSaving(false)
    }
  }

  function openPublishModal(wod) {
    const status = getWodStatus(wod)

    if (status !== "pendiente") {
      alert("Solo los WODs en estado PENDIENTE se pueden programar o publicar.")
      return
    }

    setSelectedWod(wod)
    setPublishFecha(wod.fecha || "")
    setPublishError("")
    setPublishModalOpen(true)
  }

  function closePublishModal() {
    if (publishingId) return
    setPublishModalOpen(false)
    setSelectedWod(null)
    setPublishFecha("")
    setPublishError("")
  }

  function handleSelectWod(wod) {
    setSelectedPreviewWod(wod)
  }

  async function handleDeleteWod(wod) {
    if (!wod?.id) return

    const confirmMessage = [
      `¿Eliminar completamente el WOD "${wod.nombre || "WOD sin nombre"}"?`,
      "",
      "Se eliminarán también sus resultados y participantes registrados.",
      "Esta acción no se puede deshacer.",
    ].join("\n")

    if (!window.confirm(confirmMessage)) return

    try {
      setDeletingId(wod.id)

      const { data: resultRows, error: resultSelectError } = await supabase
        .from("wod_resultados")
        .select("id")
        .eq("wod_id", wod.id)

      if (resultSelectError) throw resultSelectError

      const resultIds = (resultRows || []).map((item) => item.id)

      if (resultIds.length > 0) {
        const { error: participantsError } = await supabase
          .from("wod_resultado_participantes")
          .delete()
          .in("wod_resultado_id", resultIds)

        if (participantsError) throw participantsError
      }

      const { error: resultsError } = await supabase
        .from("wod_resultados")
        .delete()
        .eq("wod_id", wod.id)

      if (resultsError) throw resultsError

      const { error: wodError } = await supabase
        .from("wod")
        .delete()
        .eq("id", wod.id)

      if (wodError) throw wodError

      setWods((current) => current.filter((item) => item.id !== wod.id))
      setSelectedPreviewWod((current) => {
        if (current?.id !== wod.id) return current
        return null
      })
    } catch (e) {
      console.error("Error eliminando WOD:", e)
      alert(e?.message || "No se pudo eliminar el WOD.")
    } finally {
      setDeletingId(null)
    }
  }

  async function handlePublish(e) {
    e.preventDefault()

    if (!selectedWod) return

    const status = getWodStatus(selectedWod)

    if (status !== "pendiente") {
      setPublishError("Solo los WODs en estado PENDIENTE se pueden publicar o reprogramar.")
      return
    }

    if (!publishFecha) {
      setPublishError("Debes seleccionar la fecha del WOD.")
      return
    }

    if (isPastDate(publishFecha)) {
      setPublishError("No puedes publicar un WOD en una fecha anterior a hoy.")
      return
    }

    try {
      setPublishingId(selectedWod.id)
      setPublishError("")

      const { data: existingPublished, error: existingError } = await supabase
        .from("wod")
        .select("id,nombre,fecha")
        .eq("fecha", publishFecha)
        .eq("publicado", true)

      if (existingError) throw existingError

      const conflict = (existingPublished || []).find((row) => row.id !== selectedWod.id)

      if (conflict) {
        setPublishError("Ya existe un WOD publicado para esa fecha.")
        setPublishingId(null)
        return
      }

      const fechaPublicacion = buildPreviousDay1900(publishFecha)

      const { error } = await supabase
        .from("wod")
        .update({
          fecha: publishFecha,
          publicado: true,
          activo: true,
          fecha_publicacion: fechaPublicacion,
        })
        .eq("id", selectedWod.id)

      if (error) throw error

      await loadWods()
      closePublishModal()
    } catch (e) {
      setPublishError(e?.message || "No se pudo publicar el WOD.")
    } finally {
      setPublishingId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] overflow-hidden bg-black text-white">
      {/* DESKTOP APROBADO: se mantiene intacto, solo se oculta en móvil */}
      <div className="hidden h-full overflow-hidden lg:grid lg:grid-cols-[270px_1fr]">
        <DashboardSidebar navigate={navigate} />

        <main className="phoenix-page min-w-0 overflow-hidden p-5">
          <div className="grid h-full grid-rows-[auto_auto_1fr] gap-4 overflow-hidden">
            <section className="relative overflow-hidden rounded-[2rem] border border-orange-500/20 bg-black/45 p-5 shadow-[0_0_35px_rgba(249,115,22,.14)] backdrop-blur-xl">
              <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />

              <div className="relative z-10 flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-white xl:text-4xl">
                    Gestión de <span className="text-orange-400">WODs</span>
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
                    Crea borradores, programa y publica entrenamientos con estimación de calorías.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openCreateModal}
                  className="phoenix-button-primary shrink-0 text-sm uppercase"
                >
                  + Nuevo WOD
                </button>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <WodMetricCard icon="🏋️" label="Total WODs" value={wodStats.total} />
              <WodMetricCard icon="📋" label="Pendientes" value={wodStats.pendientes} />
              <WodMetricCard icon="⚡" label="Activos" value={wodStats.activos} />
              <WodMetricCard icon="🗓️" label="Históricos" value={wodStats.historicos} />
            </section>

            <section className="grid min-h-0 gap-4 xl:grid-cols-2">
              <WodTable
                title="Tabla de la semana"
                subtitle="Borradores y WODs activos/programados de esta semana"
                loading={loading}
                error={error}
                rows={weekWods}
                emptyText="No hay WODs para esta semana."
                selectedWodId={selectedPreviewWod?.id}
                deletingId={deletingId}
                onCreate={openCreateModal}
                onSelect={handleSelectWod}
                onEdit={handleEditDraft}
                onPublish={openPublishModal}
                onDelete={handleDeleteWod}
              />

              <WodTable
                title="Archivados"
                subtitle="WODs históricos ya finalizados"
                loading={loading}
                error={error}
                rows={archivedWods}
                emptyText="No hay WODs archivados."
                selectedWodId={selectedPreviewWod?.id}
                deletingId={deletingId}
                onSelect={handleSelectWod}
                onEdit={handleEditDraft}
                onPublish={openPublishModal}
                onDelete={handleDeleteWod}
              />
            </section>
          </div>
        </main>
      </div>

      {/* MOBILE NUEVO: usa la misma lógica, sin tocar desktop */}
      <AdminWodsMobile
        loading={loading}
        error={error}
        wods={wods}
        weekWods={weekWods}
        archivedWods={archivedWods}
        selectedWod={selectedPreviewWod}
        deletingId={deletingId}
        stats={wodStats}
        onCreate={openCreateModal}
        onSelect={handleSelectWod}
        onEdit={handleEditDraft}
        onPublish={openPublishModal}
        onDelete={handleDeleteWod}
        navigate={navigate}
      />

      {createModalOpen ? (
        <CreateWodModal
          initialWod={editingWod}
          saving={saving}
          onClose={closeCreateModal}
          onSave={handleSaveDraft}
        />
      ) : null}

      {publishModalOpen && selectedWod ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={closePublishModal}
            aria-label="Cerrar"
          />

          <div className="phoenix-card relative z-[121] max-h-[92dvh] w-full max-w-lg overflow-y-auto">
            <div className="border-b border-orange-500/15 bg-orange-500/10 p-3 sm:p-5">
              <div className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">
                Publicar WOD
              </div>

              <h3 className="mt-1.5 text-lg font-black text-white sm:text-2xl">
                {selectedWod.nombre || "WOD sin nombre"}
              </h3>

              <p className="mt-1.5 text-xs leading-5 text-white/60">
                Al publicarlo se activará a las 19:00 del día anterior.
              </p>
            </div>

            <form onSubmit={handlePublish} className="p-3 sm:p-5">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-white/75">
                  Fecha del WOD
                </label>

                <input
                  type="date"
                  value={publishFecha}
                  onChange={(e) => setPublishFecha(e.target.value)}
                  className="phoenix-input"
                  required
                />
              </div>

              {publishFecha ? (
                <div className="mt-4 rounded-2xl border border-orange-500/15 bg-orange-500/10 px-3 py-2 text-xs leading-6 text-white/70">
                  Publicación automática:{" "}
                  <span className="font-bold text-orange-300">
                    {formatDateTime(buildPreviousDay1900(publishFecha))}
                  </span>
                </div>
              ) : null}

              {publishError ? (
                <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  {publishError}
                </div>
              ) : null}

              <div className="mt-6 grid gap-2 sm:flex sm:flex-wrap">
                <button
                  type="submit"
                  disabled={publishingId === selectedWod.id}
                  className="phoenix-button-primary w-full text-sm disabled:opacity-60 sm:w-auto"
                >
                  {publishingId === selectedWod.id ? "Publicando..." : "Guardar publicación"}
                </button>

                <button
                  type="button"
                  onClick={closePublishModal}
                  disabled={publishingId === selectedWod.id}
                  className="phoenix-button-ghost w-full text-sm disabled:opacity-60 sm:w-auto"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
      {selectedPreviewWod ? (
        <WodDetailModal
          wod={selectedPreviewWod}
          deleting={deletingId === selectedPreviewWod.id}
          onClose={() => setSelectedPreviewWod(null)}
          onEdit={() => handleEditDraft(selectedPreviewWod)}
          onPublish={() => openPublishModal(selectedPreviewWod)}
          onDelete={() => handleDeleteWod(selectedPreviewWod)}
        />
      ) : null}

    </div>
  )
}

function AdminWodsMobile({
  loading,
  error,
  wods,
  weekWods,
  archivedWods,
  selectedWod,
  deletingId,
  stats,
  onCreate,
  onSelect,
  onEdit,
  onPublish,
  onDelete,
  navigate,
}) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")

  const todayWod = useMemo(() => {
    const todayIso = getTodayISO()

    return (
      wods.find((wod) => {
        return String(wod.fecha || "") === todayIso && getWodStatus(wod) === "activo"
      }) || null
    )
  }, [wods])

  const filteredWeekWods = useMemo(() => {
    return filterMobileWods(weekWods || [], search, statusFilter)
  }, [weekWods, search, statusFilter])

  const filteredArchivedWods = useMemo(() => {
    return filterMobileWods(archivedWods || [], search, statusFilter)
  }, [archivedWods, search, statusFilter])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Error cerrando sesión:", error)
    } finally {
      window.location.replace("/")
    }
  }

  const setHistoryFilter = () => {
    setStatusFilter("historial")
  }

  return (
    <main className="block h-[100dvh] w-screen max-w-full overflow-x-hidden overflow-y-auto bg-[#050505] pb-24 text-white lg:hidden">
      <div className="relative min-h-full w-full max-w-full overflow-x-hidden px-2.5 pt-2.5">
        <BackgroundOrbs />

        <header className="relative z-10 mb-2 flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
          <button
            type="button"
            onClick={() => navigate("/admin/dashboard")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-orange-500/25 bg-orange-500/10 text-lg text-orange-300"
            aria-label="Volver al dashboard"
          >
            ☰
          </button>

          <div className="flex min-w-0 flex-col items-center">
            <img
              src={pho3nixLogo}
              alt="PHO3NIX"
              className="h-8 w-8 object-contain drop-shadow-[0_0_20px_rgba(249,115,22,0.35)]"
            />

            <p className="mt-0.5 text-lg font-black tracking-[0.14em] text-white">
              PHO<span className="text-orange-500">3</span>NIX
            </p>

            <p className="text-[8px] font-black uppercase tracking-[0.22em] text-orange-500">
              Functional Fitness
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-500/25 bg-red-500/10 text-lg text-red-300"
            aria-label="Cerrar sesión"
          >
            ↪
          </button>
        </header>

        <section className="relative z-10 mb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-3xl font-black uppercase leading-none text-white">
                WODs
              </h1>

              <p className="mt-1 text-xs text-white/55">
                Gestiona los entrenamientos del box
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setSearchOpen((current) => !current)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-base text-white/80"
                aria-label="Buscar"
              >
                🔍
              </button>

              <button
                type="button"
                onClick={onCreate}
                className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-3 text-[10px] font-black uppercase text-black shadow-[0_0_24px_rgba(249,115,22,0.26)]"
              >
                <span className="text-sm">＋</span>
                Nuevo WOD
              </button>
            </div>
          </div>

          {searchOpen ? (
            <div className="mt-2">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre, descripción o modalidad..."
                className="w-full rounded-2xl border border-orange-500/25 bg-black/55 px-3 py-2.5 text-xs text-white outline-none placeholder:text-white/35 focus:border-orange-500/60"
              />
            </div>
          ) : null}
        </section>

        <section className="relative z-10 mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { key: "todos", label: "Todos", icon: "▦", count: stats.total },
            { key: "hoy", label: "Hoy", icon: "▣", count: countToday(wods) },
            { key: "activos", label: "Activos", icon: "●", count: stats.activos },
            { key: "borradores", label: "Borradores", icon: "●", count: stats.pendientes },
            { key: "historial", label: "Historial", icon: "↺", count: stats.historicos },
          ].map((item) => {
            const active = statusFilter === item.key

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setStatusFilter(item.key)}
                className={[
                  "shrink-0 rounded-xl border px-2.5 py-2 transition",
                  active
                    ? "border-orange-500 bg-orange-500/10 text-orange-300"
                    : "border-white/10 bg-black/35 text-white/55",
                ].join(" ")}
              >
                <span
                  className={[
                    "mr-1.5 text-xs",
                    item.key === "activos"
                      ? "text-emerald-400"
                      : item.key === "borradores"
                      ? "text-white/35"
                      : "text-orange-400",
                  ].join(" ")}
                >
                  {item.icon}
                </span>

                <span className="text-xs font-black">{item.label}</span>

                <span className="ml-1.5 text-[10px] text-white/35">{item.count}</span>
              </button>
            )
          })}
        </section>

        <section className="relative z-10 mb-3 grid grid-cols-4 gap-3">
          <MobileMetricCard icon="🏋️" value={loading ? "..." : stats.total} label="Total WODs" tone="orange" />
          <MobileMetricCard icon="✅" value={loading ? "..." : stats.activos} label="Activos" tone="green" />
          <MobileMetricCard icon="✏️" value={loading ? "..." : stats.pendientes} label="Borradores" tone="amber" />
          <MobileMetricCard icon="🗃️" value={loading ? "..." : stats.historicos} label="Historial" tone="purple" />
        </section>

        <section className="relative z-10 mb-3">
          <TodayWodCard
            wod={todayWod}
            loading={loading}
            onView={() => setStatusFilter("hoy")}
            onHistory={setHistoryFilter}
          />
        </section>

        {error ? (
          <div className="relative z-10 mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        ) : null}

        <MobileWodSection
          title="Tabla de la semana"
          subtitle="Borradores y WODs vigentes"
          rows={filteredWeekWods}
          loading={loading}
          selectedWodId={selectedWod?.id}
          deletingId={deletingId}
          emptyText="No hay WODs para esta semana."
          onSelect={onSelect}
          onEdit={onEdit}
          onPublish={onPublish}
          onDelete={onDelete}
        />

        <MobileWodSection
          title="Archivados"
          subtitle="Historial de WODs finalizados"
          rows={filteredArchivedWods}
          loading={loading}
          selectedWodId={selectedWod?.id}
          deletingId={deletingId}
          emptyText="No hay WODs archivados."
          onSelect={onSelect}
          onEdit={onEdit}
          onPublish={onPublish}
          onDelete={onDelete}
        />

        <button
          type="button"
          onClick={handleLogout}
          className="relative z-10 mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-500/45 bg-red-500/10 text-xs font-black uppercase text-red-300 transition hover:bg-red-500/15"
        >
          <span className="text-base">↪</span>
          Cerrar sesión
        </button>
      </div>

      <AdminMobileNav />
    </main>
  )
}

function TodayWodCard({ wod, loading, onView, onHistory }) {
  return (
    <article className="relative min-h-[165px] overflow-hidden rounded-[1.25rem] border border-orange-500/20 bg-black/55 shadow-2xl shadow-black/40">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_45%,rgba(249,115,22,0.22),transparent_34%)]" />
      <div className="absolute inset-y-0 right-0 w-1/2 bg-[url('/images/imagenchallenge.png')] bg-cover bg-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/25" />

      <div className="relative z-10 flex min-h-[165px] flex-col justify-between p-3.5">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.14em] text-orange-400">
            🔥 WOD del día
          </p>

          <h2 className="mt-2 text-xl font-black uppercase leading-none text-white">
            {loading ? "Cargando..." : wod?.nombre || "Sin WOD publicado"}
          </h2>

          <p className="mt-2 max-w-[92%] whitespace-pre-line text-xs leading-4 text-white/60">
            {loading
              ? "Buscando entrenamiento del día..."
              : wod?.descripcion ||
                "Cuando el coach publique el WOD del día, aparecerá aquí."}
          </p>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onView}
            className="rounded-xl bg-orange-500 px-3 py-2 text-[10px] font-black uppercase text-black"
          >
            Ver WOD del día
          </button>

          <button
            type="button"
            onClick={onHistory}
            className="rounded-xl border border-orange-500/35 px-3 py-2 text-[10px] font-black uppercase text-orange-300"
          >
            Ver historial
          </button>
        </div>
      </div>
    </article>
  )
}

function MobileMetricCard({ icon, value, label, tone = "orange" }) {
  const toneClass =
    tone === "green"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
      : tone === "amber"
      ? "border-amber-500/25 bg-amber-500/10 text-amber-300"
      : tone === "purple"
      ? "border-purple-500/25 bg-purple-500/10 text-purple-300"
      : "border-orange-500/25 bg-orange-500/10 text-orange-300"

  return (
    <article
      className={[
        "relative min-h-[82px] overflow-hidden rounded-[1rem] border p-2 text-center shadow-2xl shadow-black/30",
        toneClass,
      ].join(" ")}
    >
      <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-current opacity-10 blur-3xl" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center">
        <div className="text-base">{icon}</div>

        <p className="mt-1 text-xl font-black text-white">{value}</p>

        <p className="mt-0.5 text-[8px] font-black leading-tight text-white/85">
          {label}
        </p>
      </div>
    </article>
  )
}

function MobileWodCard({
  wod,
  status,
  selected = false,
  deleting = false,
  onSelect,
  onEdit,
  onPublish,
  onDelete,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const statusConfig = getMobileStatusConfig(status)

  return (
    <article
      onClick={onSelect}
      className={[
        "relative overflow-hidden rounded-[1.05rem] border bg-black/45 p-2.5 shadow-2xl shadow-black/30 transition",
        selected ? "border-orange-500/45 bg-orange-500/[0.08]" : "border-white/10",
      ].join(" ")}
    >
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative z-10 grid grid-cols-[76px_minmax(0,1fr)_auto] gap-2">
        <WodThumb wod={wod} />

        <div className="min-w-0 py-0.5">
          <h2 className="line-clamp-2 text-xs font-black uppercase leading-tight text-white">
            {wod.nombre || "WOD PHO3NIX"}
          </h2>

          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[8px] font-black uppercase text-orange-300">
              {formatModoRankingShort(wod.modo_ranking)}
            </span>

            <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[8px] font-black uppercase text-white/70">
              {formatModalidad(wod.modalidad)}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-white/45">
            <span>📅 {formatDateOnly(wod.fecha)}</span>
            <span className={statusConfig.dotClass}>●</span>
            <span>{statusConfig.label}</span>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              setMenuOpen((current) => !current)
            }}
            className="flex h-8 w-7 items-center justify-center rounded-lg text-lg text-white/60"
            aria-label="Opciones"
          >
            ⋮
          </button>

          {menuOpen ? (
            <div className="absolute right-0 top-8 z-30 w-40 overflow-hidden rounded-xl border border-white/10 bg-[#080808] shadow-2xl">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  setMenuOpen(false)
                  onSelect?.()
                }}
                className="block w-full px-3 py-2 text-left text-xs font-bold text-white/80 hover:bg-white/[0.05]"
              >
                Ver WOD
              </button>

              {status === "pendiente" ? (
                <>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      setMenuOpen(false)
                      onEdit?.()
                    }}
                    className="block w-full px-3 py-2 text-left text-xs font-bold text-white/80 hover:bg-white/[0.05]"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      setMenuOpen(false)
                      onPublish?.()
                    }}
                    className="block w-full px-3 py-2 text-left text-xs font-bold text-orange-300 hover:bg-orange-500/10"
                  >
                    Programar
                  </button>
                </>
              ) : null}

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  setMenuOpen(false)
                  onDelete?.()
                }}
                disabled={deleting}
                className="block w-full px-3 py-2 text-left text-xs font-bold text-red-300 hover:bg-red-500/10 disabled:opacity-50"
              >
                {deleting ? "Eliminando..." : "Eliminar completo"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}


function WodThumb({ wod }) {
  const label = getWodThumbLabel(wod)

  return (
    <div className="relative flex h-[76px] items-center justify-center overflow-hidden rounded-[0.9rem] border border-orange-500/20 bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(249,115,22,0.30),transparent_50%)]" />
      <div className="absolute inset-0 bg-[url('/images/imagenchallenge.png')] bg-cover bg-center opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />

      <div className="relative z-10 text-center">
        <p className="text-[8px] font-black uppercase tracking-[0.14em] text-orange-400">
          {label.top}
        </p>

        <p className="mt-0.5 max-w-[62px] text-[11px] font-black uppercase leading-none text-white">
          {label.main}
        </p>
      </div>
    </div>
  )
}

function countToday(wods) {
  const todayIso = getTodayISO()

  return wods.filter((wod) => String(wod.fecha || "") === todayIso).length
}

function getTodayISO() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function getMobileStatusConfig(status) {
  if (status === "activo") {
    return {
      label: "Publicado",
      dotClass: "text-emerald-400",
    }
  }

  if (status === "inactivo") {
    return {
      label: "Histórico",
      dotClass: "text-purple-300",
    }
  }

  return {
    label: "Borrador",
    dotClass: "text-white/35",
  }
}

function getWodThumbLabel(wod) {
  const name = String(wod?.nombre || "").trim()

  if (name) {
    const parts = name.split(" ")

    return {
      top: formatModoRankingShort(wod?.modo_ranking),
      main: parts.slice(0, 3).join(" "),
    }
  }

  return {
    top: "WOD",
    main: "PHO3NIX",
  }
}

function formatModoRankingShort(modo) {
  const value = String(modo || "").trim().toLowerCase()

  if (value === "menor_es_mejor") return "For Time"
  if (value === "mayor_es_mejor") return "AMRAP"
  if (value === "sin_ranking") return "Sin ranking"

  return modo || "WOD"
}

function formatDateOnly(value) {
  if (!value) return "Sin fecha"

  try {
    return new Intl.DateTimeFormat("es-EC", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
      .format(new Date(`${value}T00:00:00`))
      .replace(".", "")
  } catch {
    return "Sin fecha"
  }
}

function MobileEmpty({ text }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-black/35 p-3 text-xs text-white/45">
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

function WodTable({
  title,
  subtitle,
  loading,
  error,
  rows = [],
  emptyText,
  selectedWodId,
  deletingId,
  onCreate,
  onSelect,
  onEdit,
  onPublish,
  onDelete,
}) {
  return (
    <section className="phoenix-card grid min-h-0 grid-rows-[auto_1fr] overflow-hidden p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white">{title}</h2>
          <p className="text-xs text-white/45">
            {loading ? "Cargando..." : `${rows.length} registro(s)`}
          </p>
          {subtitle ? (
            <p className="mt-0.5 text-[11px] text-white/35">{subtitle}</p>
          ) : null}
        </div>

        {onCreate ? (
          <button
            type="button"
            onClick={onCreate}
            className="rounded-xl border border-orange-500/25 bg-orange-500/15 px-4 py-2 text-xs font-black text-orange-300 transition hover:bg-orange-500/20"
          >
            Crear WOD
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-black/25 p-5 text-sm text-white/60">
          Cargando WODs...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">
          {error}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-black/25 p-5 text-sm text-white/60">
          {emptyText}
        </div>
      ) : (
        <div className="min-h-0 space-y-2 overflow-y-auto pr-1">
          {rows.map((wod) => {
            const status = getWodStatus(wod)

            return (
              <WodScheduleRow
                key={wod.id}
                wod={wod}
                status={status}
                selected={String(wod.id) === String(selectedWodId)}
                deleting={String(deletingId || "") === String(wod.id)}
                onSelect={() => onSelect?.(wod)}
                onEdit={() => onEdit?.(wod)}
                onPublish={() => onPublish?.(wod)}
                onDelete={() => onDelete?.(wod)}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}

function WodDetailModal({ wod, deleting, onClose, onEdit, onPublish, onDelete }) {
  if (!wod) return null

  const status = getWodStatus(wod)
  const canEdit = status === "pendiente"

  return (
    <div className="fixed inset-0 z-[135] flex items-center justify-center p-2 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar detalle WOD"
      />

      <section className="phoenix-card relative z-[136] grid max-h-[92dvh] w-full max-w-2xl grid-rows-[auto_1fr_auto] overflow-hidden p-0 shadow-[0_0_55px_rgba(249,115,22,0.18)]">
        <div className="border-b border-orange-500/15 bg-orange-500/10 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-400">
                WOD seleccionado
              </p>

              <h2 className="mt-2 text-2xl font-black uppercase leading-tight text-white sm:text-3xl">
                {wod.nombre || "WOD sin nombre"}
              </h2>

              <p className="mt-1 text-xs text-white/50">
                {formatDateOnly(wod.fecha)} · {formatModalidad(wod.modalidad)}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/45 text-xl text-white/70 transition hover:bg-white/[0.06]"
              aria-label="Cerrar"
              title="Cerrar"
            >
              ×
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <StatusBadge status={status} />
            <WodTag>{formatModoRanking(wod.modo_ranking)}</WodTag>
            <WodTag>{formatModalidad(wod.modalidad)}</WodTag>

            {wod.duracion_estimada ? (
              <WodTag>⏱️ {wod.duracion_estimada}</WodTag>
            ) : null}

            {wod.calorias_min && wod.calorias_max ? (
              <WodTag>🔥 {wod.calorias_min} - {wod.calorias_max} kcal</WodTag>
            ) : null}
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto p-4 sm:p-5 [scrollbar-width:thin] [scrollbar-color:#f97316_#09090b]">
          <p className="whitespace-pre-line text-sm leading-6 text-white/75">
            {wod.descripcion || "Sin descripción disponible."}
          </p>

          {wod.calorias_nota ? (
            <div className="mt-4 rounded-2xl border border-orange-500/15 bg-orange-500/10 p-3 text-xs leading-5 text-orange-100/70">
              {wod.calorias_nota}
            </div>
          ) : null}

          {wod.fecha_publicacion ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-3 text-xs leading-5 text-white/50">
              Publicación automática:{" "}
              <span className="font-bold text-orange-300">
                {formatDateTime(wod.fecha_publicacion)}
              </span>
            </div>
          ) : null}
        </div>

        <div className="grid gap-2 border-t border-white/10 bg-black/35 p-4 sm:grid-cols-3 sm:p-5">
          {canEdit ? (
            <>
              <button
                type="button"
                onClick={onEdit}
                className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs font-black uppercase text-white/75 transition hover:border-orange-400/40 hover:text-orange-300"
              >
                ✎ Editar
              </button>

              <button
                type="button"
                onClick={onPublish}
                className="rounded-xl border border-orange-500/25 bg-orange-500/10 px-3 py-2 text-xs font-black uppercase text-orange-300 transition hover:bg-orange-500/15"
              >
                🗓️ Programar
              </button>
            </>
          ) : (
            <div className="hidden sm:block" />
          )}

          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-black uppercase text-red-300 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? "Eliminando..." : "Eliminar completo"}
          </button>
        </div>
      </section>
    </div>
  )
}


function MobileWodSection({
  title,
  subtitle,
  rows = [],
  loading,
  selectedWodId,
  deletingId,
  emptyText,
  onSelect,
  onEdit,
  onPublish,
  onDelete,
}) {
  return (
    <section className="relative z-10 mb-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-xs font-black uppercase tracking-[0.06em] text-white/75">
            {title}
          </h2>

          <p className="mt-0.5 text-[10px] text-white/35">{subtitle}</p>
        </div>

        <span className="shrink-0 text-[10px] text-white/35">
          {rows.length} resultado(s)
        </span>
      </div>

      <div className="grid gap-2">
        {loading ? (
          <MobileEmpty text="Cargando WODs..." />
        ) : rows.length === 0 ? (
          <MobileEmpty text={emptyText} />
        ) : (
          rows.map((wod) => {
            const status = getWodStatus(wod)

            return (
              <MobileWodCard
                key={wod.id}
                wod={wod}
                status={status}
                selected={String(wod.id) === String(selectedWodId)}
                deleting={String(deletingId || "") === String(wod.id)}
                onSelect={() => onSelect?.(wod)}
                onEdit={() => onEdit?.(wod)}
                onPublish={() => onPublish?.(wod)}
                onDelete={() => onDelete?.(wod)}
              />
            )
          })
        )}
      </div>
    </section>
  )
}

function WodMetricCard({ icon, label, value }) {
  return (
    <article className="phoenix-card relative overflow-hidden p-4">
      <div className="absolute bottom-0 right-0 h-16 w-24 rounded-full bg-orange-500/10 blur-2xl" />

      <div className="relative z-10 flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 text-lg text-orange-300">
          {icon}
        </div>

        <div>
          <div className="text-sm font-bold text-white/80">{label}</div>
          <div className="mt-1 text-3xl font-black text-white">{value}</div>
        </div>
      </div>
    </article>
  )
}

function WodScheduleRow({
  wod,
  status,
  selected = false,
  deleting = false,
  onSelect,
  onEdit,
  onPublish,
  onDelete,
}) {
  const dateParts = getDateParts(wod.fecha)

  return (
    <article
      onClick={onSelect}
      className={[
        "group grid cursor-pointer gap-2 rounded-2xl border bg-black/25 p-3 transition hover:border-orange-500/30 hover:bg-orange-500/[0.04] md:grid-cols-[110px_1fr_auto]",
        selected ? "border-orange-500/45 bg-orange-500/[0.08]" : "border-orange-500/10",
      ].join(" ")}
    >
      <div className="rounded-xl border border-orange-500/15 bg-black/35 p-3 text-center">
        <div className="text-[11px] font-black uppercase tracking-[0.16em] text-white/45">
          {dateParts.weekday}
        </div>
        <div className="mt-1 text-3xl font-black text-white">{dateParts.day}</div>
        <div className="text-xs font-black uppercase text-orange-300">{dateParts.month}</div>
      </div>

      <div className="min-w-0">
        <h3 className="truncate text-lg font-black text-white">
          {wod.nombre || "WOD sin nombre"}
        </h3>

        <p className="mt-1 line-clamp-2 whitespace-pre-line text-sm leading-5 text-white/60">
          {wod.descripcion || "Sin descripción disponible."}
        </p>

        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <WodTag>{formatModoRanking(wod.modo_ranking)}</WodTag>
          <WodTag>{formatModalidad(wod.modalidad)}</WodTag>

          {wod.calorias_min && wod.calorias_max ? (
            <WodTag>🔥 {wod.calorias_min} - {wod.calorias_max} kcal</WodTag>
          ) : null}

          {wod.fecha_publicacion ? (
            <WodTag>Publica: {formatDateTime(wod.fecha_publicacion)}</WodTag>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
        <StatusBadge status={status} />

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onSelect?.()
          }}
          className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs font-bold text-white/70 transition hover:text-orange-300"
        >
          👁️ {selected ? "Viendo" : "Ver"}
        </button>

        {status === "pendiente" ? (
          <>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onEdit?.()
              }}
              className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs font-bold text-white/75 transition hover:border-orange-400/40 hover:text-orange-300"
            >
              ✎ Editar
            </button>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onPublish?.()
              }}
              className="rounded-xl border border-orange-500/25 bg-orange-500/10 px-3 py-2 text-xs font-bold text-orange-300 transition hover:bg-orange-500/15"
            >
              🗓️ {wod.publicado ? "Reprogramar" : "Programar"}
            </button>
          </>
        ) : null}

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onDelete?.()
          }}
          disabled={deleting}
          className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleting ? "Eliminando..." : "Eliminar"}
        </button>
      </div>
    </article>
  )
}


function WodTag({ children }) {
  return (
    <span className="rounded-full border border-orange-500/10 bg-orange-500/10 px-2.5 py-1 text-[11px] font-bold text-orange-200">
      {children}
    </span>
  )
}

function StatusBadge({ status }) {
  const map = {
    pendiente: "border-yellow-400/25 bg-yellow-500/10 text-yellow-200",
    activo: "border-green-400/25 bg-green-500/10 text-green-200",
    inactivo: "border-purple-400/25 bg-purple-500/10 text-purple-200",
  }

  const label = {
    pendiente: "PENDIENTE",
    activo: "ACTIVO",
    inactivo: "HISTÓRICO",
  }

  return (
    <div
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${
        map[status] || map.pendiente
      }`}
    >
      {label[status] || "PENDIENTE"}
    </div>
  )
}

function filterMobileWods(rows = [], search = "", statusFilter = "todos") {
  const term = String(search || "").trim().toLowerCase()
  const todayIso = getTodayISO()

  return (rows || []).filter((wod) => {
    const status = getWodStatus(wod)
    const isToday = String(wod.fecha || "") === todayIso

    const matchesFilter =
      statusFilter === "todos" ||
      (statusFilter === "hoy" && isToday) ||
      (statusFilter === "activos" && status === "activo") ||
      (statusFilter === "borradores" && status === "pendiente") ||
      (statusFilter === "historial" && status === "inactivo")

    const matchesSearch =
      !term ||
      String(wod.nombre || "").toLowerCase().includes(term) ||
      String(wod.descripcion || "").toLowerCase().includes(term) ||
      String(wod.modo_ranking || "").toLowerCase().includes(term) ||
      String(wod.modalidad || "").toLowerCase().includes(term)

    return matchesFilter && matchesSearch
  })
}

function isDateInCurrentWeek(value) {
  if (!value) return false

  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return false

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const day = today.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return date >= monday && date <= sunday
}

function sortWodsByDateAsc(a, b) {
  const dateA = getWodSortDate(a)
  const dateB = getWodSortDate(b)

  return dateA - dateB
}

function sortWodsByDateDesc(a, b) {
  const dateA = getWodSortDate(a)
  const dateB = getWodSortDate(b)

  return dateB - dateA
}

function getWodSortDate(wod) {
  if (wod?.fecha) {
    const date = new Date(`${wod.fecha}T00:00:00`).getTime()
    if (!Number.isNaN(date)) return date
  }

  if (wod?.created_at) {
    const date = new Date(wod.created_at).getTime()
    if (!Number.isNaN(date)) return date
  }

  return 0
}

function getWodStatus(wod) {
  const now = new Date()

  if (!wod?.publicado || !wod?.fecha_publicacion || !wod?.fecha) {
    return "pendiente"
  }

  const publishAt = new Date(wod.fecha_publicacion)
  const endOfWodDay = new Date(`${wod.fecha}T23:59:59`)

  if (now < publishAt) return "pendiente"
  if (now > endOfWodDay) return "inactivo"
  return "activo"
}

function getDateParts(value) {
  if (!value) {
    return { weekday: "Borrador", day: "—", month: "Sin fecha" }
  }

  try {
    const date = new Date(`${value}T00:00:00`)
    return {
      weekday: new Intl.DateTimeFormat("es-EC", { weekday: "long" }).format(date),
      day: new Intl.DateTimeFormat("es-EC", { day: "2-digit" }).format(date),
      month: new Intl.DateTimeFormat("es-EC", { month: "short" }).format(date),
    }
  } catch {
    return { weekday: "Fecha", day: "—", month: "Inválida" }
  }
}

function formatDateTime(value) {
  if (!value) return "-"
  try {
    const date = new Date(value)
    return new Intl.DateTimeFormat("es-EC", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date)
  } catch {
    return String(value)
  }
}

function formatModoRanking(modo) {
  const m = String(modo || "").trim().toLowerCase()
  if (m === "sin_ranking") return "Sin ranking"
  if (m === "mayor_es_mejor") return "Más repeticiones"
  if (m === "menor_es_mejor") return "Menor tiempo"
  return modo || "Sin definir"
}

function formatModalidad(modalidad) {
  const m = String(modalidad || "").trim().toLowerCase()
  if (m === "single") return "Single"
  if (m === "duo") return "Duo"
  if (m === "trio") return "Trio"
  return "Single"
}

function isPastDate(dateStr) {
  const today = new Date()
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const target = new Date(`${dateStr}T00:00:00`)
  return target < current
}

function buildPreviousDay1900(dateStr) {
  const target = new Date(`${dateStr}T00:00:00`)
  target.setDate(target.getDate() - 1)
  target.setHours(19, 0, 0, 0)
  return target.toISOString()
}
