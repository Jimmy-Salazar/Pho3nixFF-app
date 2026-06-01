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

      setWods(data || [])
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

      const fechaPublicacion = buildPreviousDay2359(publishFecha)

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

            <section className="phoenix-card min-h-0 overflow-hidden p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-white">Programación semanal</h2>
                  <p className="text-xs text-white/45">
                    {wods.length} registro(s) creados
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openCreateModal}
                  className="rounded-xl border border-orange-500/25 bg-orange-500/15 px-4 py-2 text-xs font-black text-orange-300 transition hover:bg-orange-500/20"
                >
                  Crear WOD
                </button>
              </div>

              {loading ? (
                <div className="rounded-2xl border border-white/10 bg-black/25 p-5 text-sm text-white/60">
                  Cargando WODs...
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">
                  {error}
                </div>
              ) : wods.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/25 p-5 text-sm text-white/60">
                  Aún no hay WODs creados.
                </div>
              ) : (
                <div className="h-full max-h-full space-y-2 overflow-y-auto pr-1">
                  {wods.map((wod) => {
                    const status = getWodStatus(wod)

                    return (
                      <WodScheduleRow
                        key={wod.id}
                        wod={wod}
                        status={status}
                        onEdit={() => handleEditDraft(wod)}
                        onPublish={() => openPublishModal(wod)}
                      />
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      {/* MOBILE NUEVO: usa la misma lógica, sin tocar desktop */}
      <AdminWodsMobile
        loading={loading}
        error={error}
        wods={wods}
        stats={wodStats}
        onCreate={openCreateModal}
        onEdit={handleEditDraft}
        onPublish={openPublishModal}
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
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={closePublishModal}
            aria-label="Cerrar"
          />

          <div className="phoenix-card relative z-[121] max-h-[92dvh] w-full max-w-lg overflow-y-auto">
            <div className="border-b border-orange-500/15 bg-orange-500/10 p-4 sm:p-6">
              <div className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">
                Publicar WOD
              </div>

              <h3 className="mt-2 text-xl font-black text-white sm:text-2xl">
                {selectedWod.nombre || "WOD sin nombre"}
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/60">
                Al publicarlo se activará a las 23:59 del día anterior.
              </p>
            </div>

            <form onSubmit={handlePublish} className="p-4 sm:p-6">
              <div>
                <label className="mb-2 block text-sm font-bold text-white/75">
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
                <div className="mt-4 rounded-2xl border border-orange-500/15 bg-orange-500/10 px-4 py-3 text-sm leading-6 text-white/70">
                  Publicación automática:{" "}
                  <span className="font-bold text-orange-300">
                    {formatDateTime(buildPreviousDay2359(publishFecha))}
                  </span>
                </div>
              ) : null}

              {publishError ? (
                <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {publishError}
                </div>
              ) : null}

              <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
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
    </div>
  )
}

function AdminWodsMobile({
  loading,
  error,
  wods,
  stats,
  onCreate,
  onEdit,
  onPublish,
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

  const filteredWods = useMemo(() => {
    const term = search.trim().toLowerCase()
    const todayIso = getTodayISO()

    return wods.filter((wod) => {
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
  }, [wods, search, statusFilter])

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
    <main className="block h-[100dvh] w-screen max-w-full overflow-x-hidden overflow-y-auto bg-[#050505] pb-36 text-white lg:hidden">
      <div className="relative min-h-full w-full max-w-full overflow-x-hidden px-4 pt-4">
        <BackgroundOrbs />

        <header className="relative z-10 mb-6 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <button
            type="button"
            onClick={() => navigate("/admin/dashboard")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-orange-500/25 bg-orange-500/10 text-2xl text-orange-300"
            aria-label="Volver al dashboard"
          >
            ☰
          </button>

          <div className="flex min-w-0 flex-col items-center">
            <img
              src={pho3nixLogo}
              alt="PHO3NIX"
              className="h-10 w-10 object-contain drop-shadow-[0_0_20px_rgba(249,115,22,0.35)]"
            />

            <p className="mt-1 text-xl font-black tracking-[0.14em] text-white">
              PHO<span className="text-orange-500">3</span>NIX
            </p>

            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-orange-500">
              Functional Fitness
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/10 text-xl text-red-300"
            aria-label="Cerrar sesión"
          >
            ↪
          </button>
        </header>

        <section className="relative z-10 mb-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-4xl font-black uppercase leading-none text-white">
                WODs
              </h1>

              <p className="mt-2 text-sm text-white/60">
                Gestiona los entrenamientos del box
              </p>
            </div>

            <div className="flex shrink-0 gap-3">
              <button
                type="button"
                onClick={() => setSearchOpen((current) => !current)}
                className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-2xl text-white/80"
                aria-label="Buscar"
              >
                🔍
              </button>

              <button
                type="button"
                onClick={onCreate}
                className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 text-sm font-black uppercase text-black shadow-[0_0_24px_rgba(249,115,22,0.26)]"
              >
                <span className="text-xl">＋</span>
                Nuevo WOD
              </button>
            </div>
          </div>

          {searchOpen ? (
            <div className="mt-4">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre, descripción o modalidad..."
                className="w-full rounded-2xl border border-orange-500/25 bg-black/55 px-4 py-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-orange-500/60"
              />
            </div>
          ) : null}
        </section>

        <section className="relative z-10 mb-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                  "shrink-0 rounded-2xl border px-4 py-3 transition",
                  active
                    ? "border-orange-500 bg-orange-500/10 text-orange-300"
                    : "border-white/10 bg-black/35 text-white/55",
                ].join(" ")}
              >
                <span
                  className={[
                    "mr-2 text-sm",
                    item.key === "activos"
                      ? "text-emerald-400"
                      : item.key === "borradores"
                      ? "text-white/35"
                      : "text-orange-400",
                  ].join(" ")}
                >
                  {item.icon}
                </span>

                <span className="text-sm font-black">{item.label}</span>

                <span className="ml-2 text-xs text-white/35">{item.count}</span>
              </button>
            )
          })}
        </section>

        <section className="relative z-10 mb-5 grid grid-cols-4 gap-3">
          <MobileMetricCard icon="🏋️" value={loading ? "..." : stats.total} label="Total WODs" tone="orange" />
          <MobileMetricCard icon="✅" value={loading ? "..." : stats.activos} label="Activos" tone="green" />
          <MobileMetricCard icon="✏️" value={loading ? "..." : stats.pendientes} label="Borradores" tone="amber" />
          <MobileMetricCard icon="🗃️" value={loading ? "..." : stats.historicos} label="Historial" tone="purple" />
        </section>

        <section className="relative z-10 mb-5">
          <TodayWodCard
            wod={todayWod}
            loading={loading}
            onView={() => setStatusFilter("hoy")}
            onHistory={setHistoryFilter}
          />
        </section>

        {error ? (
          <div className="relative z-10 mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <section className="relative z-10 mb-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black uppercase tracking-[0.06em] text-white/75">
              Lista de WODs
            </h2>

            <span className="text-xs text-white/35">
              {filteredWods.length} resultado(s)
            </span>
          </div>

          <div className="grid gap-3">
            {loading ? (
              <MobileEmpty text="Cargando WODs..." />
            ) : filteredWods.length === 0 ? (
              <MobileEmpty text="No hay WODs para mostrar." />
            ) : (
              filteredWods.map((wod) => {
                const status = getWodStatus(wod)

                return (
                  <MobileWodCard
                    key={wod.id}
                    wod={wod}
                    status={status}
                    onEdit={() => onEdit(wod)}
                    onPublish={() => onPublish(wod)}
                  />
                )
              })
            )}
          </div>
        </section>

        <button
          type="button"
          onClick={handleLogout}
          className="relative z-10 mt-5 flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-red-500/45 bg-red-500/10 text-sm font-black uppercase text-red-300 transition hover:bg-red-500/15"
        >
          <span className="text-2xl">↪</span>
          Cerrar sesión
        </button>
      </div>

      <AdminMobileNav />
    </main>
  )
}

function TodayWodCard({ wod, loading, onView, onHistory }) {
  return (
    <article className="relative min-h-[250px] overflow-hidden rounded-[2rem] border border-orange-500/20 bg-black/55 shadow-2xl shadow-black/40">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_45%,rgba(249,115,22,0.22),transparent_34%)]" />
      <div className="absolute inset-y-0 right-0 w-1/2 bg-[url('/images/imagenchallenge.png')] bg-cover bg-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/25" />

      <div className="relative z-10 flex min-h-[250px] flex-col justify-between p-5">
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
            Ver WOD del día
          </button>

          <button
            type="button"
            onClick={onHistory}
            className="rounded-2xl border border-orange-500/35 px-5 py-3 text-xs font-black uppercase text-orange-300"
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
        "relative min-h-[125px] overflow-hidden rounded-[1.4rem] border p-3 text-center shadow-2xl shadow-black/30",
        toneClass,
      ].join(" ")}
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-current opacity-10 blur-3xl" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center">
        <div className="text-2xl">{icon}</div>

        <p className="mt-2 text-3xl font-black text-white">{value}</p>

        <p className="mt-1 text-[10px] font-black leading-tight text-white">
          {label}
        </p>
      </div>
    </article>
  )
}

function MobileWodCard({ wod, status, onEdit, onPublish }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const statusConfig = getMobileStatusConfig(status)

  return (
    <article className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-black/45 p-3 shadow-2xl shadow-black/30">
      <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative z-10 grid grid-cols-[112px_minmax(0,1fr)_auto] gap-3 sm:grid-cols-[120px_minmax(0,1fr)_auto]">
        <WodThumb wod={wod} />

        <div className="min-w-0 py-1">
          <h2 className="line-clamp-2 text-base font-black uppercase leading-tight text-white sm:text-lg">
            {wod.nombre || "WOD PHO3NIX"}
          </h2>

          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-orange-500/15 px-3 py-1 text-[10px] font-black uppercase text-orange-300">
              {formatModoRankingShort(wod.modo_ranking)}
            </span>

            <span className="rounded-full bg-white/[0.08] px-3 py-1 text-[10px] font-black uppercase text-white/70">
              {formatModalidad(wod.modalidad)}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/45">
            <span>📅 {formatDateOnly(wod.fecha)}</span>
            <span className={statusConfig.dotClass}>●</span>
            <span>{statusConfig.label}</span>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            className="flex h-10 w-8 items-center justify-center rounded-xl text-2xl text-white/60"
            aria-label="Opciones"
          >
            ⋮
          </button>

          {menuOpen ? (
            <div className="absolute right-0 top-10 z-30 w-40 overflow-hidden rounded-2xl border border-white/10 bg-[#080808] shadow-2xl">
              {status === "pendiente" ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      onEdit()
                    }}
                    className="block w-full px-4 py-3 text-left text-sm font-bold text-white/80 hover:bg-white/[0.05]"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      onPublish()
                    }}
                    className="block w-full px-4 py-3 text-left text-sm font-bold text-orange-300 hover:bg-orange-500/10"
                  >
                    Programar
                  </button>
                </>
              ) : (
                <div className="px-4 py-3 text-sm font-bold text-white/45">
                  Solo lectura
                </div>
              )}
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
    <div className="relative flex h-[112px] items-center justify-center overflow-hidden rounded-[1.4rem] border border-orange-500/20 bg-black sm:h-[118px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(249,115,22,0.30),transparent_50%)]" />
      <div className="absolute inset-0 bg-[url('/images/imagenchallenge.png')] bg-cover bg-center opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />

      <div className="relative z-10 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
          {label.top}
        </p>

        <p className="mt-1 max-w-[88px] text-lg font-black uppercase leading-none text-white sm:text-xl">
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
    <div className="rounded-[1.6rem] border border-dashed border-white/10 bg-black/35 p-5 text-sm text-white/45">
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

function WodMetricCard({ icon, label, value }) {
  return (
    <article className="phoenix-card relative overflow-hidden p-4">
      <div className="absolute bottom-0 right-0 h-16 w-24 rounded-full bg-orange-500/10 blur-2xl" />

      <div className="relative z-10 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-2xl text-orange-300">
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

function WodScheduleRow({ wod, status, onEdit, onPublish }) {
  const dateParts = getDateParts(wod.fecha)

  return (
    <article className="group grid gap-3 rounded-2xl border border-orange-500/10 bg-black/25 p-3 transition hover:border-orange-500/30 hover:bg-orange-500/[0.04] md:grid-cols-[110px_1fr_auto]">
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

        <div className="mt-2 flex flex-wrap gap-2">
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

        {status === "pendiente" ? (
          <>
            <button
              type="button"
              onClick={onEdit}
              className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs font-bold text-white/75 transition hover:border-orange-400/40 hover:text-orange-300"
            >
              ✎ Editar
            </button>

            <button
              type="button"
              onClick={onPublish}
              className="rounded-xl border border-orange-500/25 bg-orange-500/10 px-3 py-2 text-xs font-bold text-orange-300 transition hover:bg-orange-500/15"
            >
              🗓️ {wod.publicado ? "Reprogramar" : "Programar"}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs font-bold text-white/60"
          >
            👁️ Ver detalles
          </button>
        )}
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

function buildPreviousDay2359(dateStr) {
  const target = new Date(`${dateStr}T00:00:00`)
  target.setDate(target.getDate() - 1)
  target.setHours(23, 59, 0, 0)
  return target.toISOString()
}
