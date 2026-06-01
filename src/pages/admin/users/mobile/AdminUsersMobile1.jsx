// src/pages/admin/users/mobile/AdminUsersMobile.jsx

import { useMemo, useState } from "react"
import { supabase } from "../../../../supabase"
import { updateUserBasic } from "../../../../services/users"
import pho3nixLogo from "../../../../assets/pho3nix-login-logo.png"
import AdminMobileNav from "../../dashboard/mobile/AdminMobileNav"

const MOBILE_FILTERS = [
  { key: "all", label: "Todos", icon: "▦", tone: "orange" },
  { key: "active", label: "Activos", icon: "●", tone: "green" },
  { key: "inactive", label: "Inactivos", icon: "●", tone: "gray" },
  { key: "expiring", label: "Por vencer", icon: "●", tone: "red" },
]

const ROLE_PICKER_OPTIONS = ["Alumno", "Coach", "Admin"]
const SEX_OPTIONS = ["Masculino", "Femenino"]

export default function AdminUsersMobile({
  loading = false,
  error = "",
  rows = [],
  stats = {},
  search = "",
  filter = "all",
  onSearchChange,
  onFilterChange,
  onCreate,
  onToggleStatus,
  handleEdit,
  handleDelete,
  navigate,
}) {
  const [deletedIds, setDeletedIds] = useState([])
  const [localUserPatch, setLocalUserPatch] = useState({})

  const displayRows = useMemo(() => {
    return (rows || [])
      .filter((user) => !deletedIds.includes(user.id))
      .map((user) => ({
        ...user,
        ...(localUserPatch[user.id] || {}),
      }))
  }, [rows, deletedIds, localUserPatch])

  const handleLocalSaved = (updatedUser) => {
    if (!updatedUser?.id) return

    setLocalUserPatch((current) => ({
      ...current,
      [updatedUser.id]: {
        ...(current[updatedUser.id] || {}),
        ...updatedUser,
      },
    }))
  }

  const handleLocalDeleted = (userId) => {
    if (!userId) return

    setDeletedIds((current) => {
      if (current.includes(userId)) return current
      return [...current, userId]
    })
  }

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
    <main className="block h-[100dvh] w-screen max-w-full overflow-x-hidden overflow-y-auto bg-[#050505] pb-36 text-white lg:hidden">
      <div className="relative min-h-full w-full max-w-full overflow-x-hidden px-4 pt-4">
        <BackgroundOrbs />

        <header className="relative z-10 mb-6 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <button
            type="button"
            onClick={() => navigate?.("/admin/dashboard")}
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
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-orange-500/35 bg-orange-500/10 text-sm font-black text-orange-300 shadow-[0_0_22px_rgba(249,115,22,0.25)]"
            aria-label="Cerrar sesión"
          >
            JS
          </button>
        </header>

        <section className="relative z-10 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-4xl font-black uppercase leading-none text-white">
                Alumnos
              </h1>

              <p className="mt-2 text-sm text-white/60">
                Gestiona los miembros del box
              </p>
            </div>

            <button
              type="button"
              onClick={onCreate}
              className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-orange-500 px-3 text-[11px] font-black uppercase text-black shadow-[0_0_24px_rgba(249,115,22,0.26)] sm:px-4 sm:text-xs"
            >
              <span className="text-base leading-none">＋</span>
              Nuevo alumno
            </button>
          </div>

          <div className="mt-4">
            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder="Buscar por nombre, email o teléfono..."
              className="w-full rounded-2xl border border-white/10 bg-black/45 px-5 py-3.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-orange-500/60"
            />
          </div>
        </section>

        <section className="relative z-10 mb-5 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {MOBILE_FILTERS.map((item) => {
            const active = filter === item.key
            const count = getFilterCount(item.key, rows)

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onFilterChange?.(item.key)}
                className={[
                  "shrink-0 rounded-2xl border px-3.5 py-2.5 transition",
                  active
                    ? "border-orange-500 bg-orange-500/10 text-orange-300"
                    : "border-white/10 bg-black/35 text-white/55",
                ].join(" ")}
              >
                <span className={getFilterIconClass(item.tone)}>{item.icon}</span>
                <span className="ml-2 text-xs font-black sm:text-sm">{item.label}</span>
                <span className="ml-2 text-[10px] text-white/35">{count}</span>
              </button>
            )
          })}
        </section>

        <section className="relative z-10 mb-6 grid grid-cols-4 gap-2">
          <MobileMetricCard
            icon="👥"
            value={loading ? "..." : stats.total || 0}
            label="Total"
            tone="orange"
          />

          <MobileMetricCard
            icon="🟢"
            value={loading ? "..." : stats.active || 0}
            label="Activos"
            tone="green"
          />

          <MobileMetricCard
            icon="⏸"
            value={loading ? "..." : stats.inactive || 0}
            label="Inactivos"
            tone="gray"
          />

          <MobileMetricCard
            icon="🔴"
            value={loading ? "..." : stats.expiring || 0}
            label="Por vencer"
            tone="red"
          />
        </section>

        {error ? (
          <div className="relative z-10 mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <section className="relative z-10 mb-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-black uppercase tracking-[0.06em] text-white/75">
              Lista de alumnos
            </h2>

            <span className="text-sm text-white/50">
              {loading ? "..." : `${displayRows.length} resultado(s)`}
            </span>
          </div>

          <div className="grid gap-2.5">
            {loading ? (
              <MobileEmpty text="Cargando alumnos..." />
            ) : displayRows.length === 0 ? (
              <MobileEmpty text="No hay alumnos para mostrar." />
            ) : (
              displayRows.map((user) => (
                <MobileUserCard
                  key={user.id}
                  user={user}
                  onToggleStatus={onToggleStatus}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                  onLocalSaved={handleLocalSaved}
                  onLocalDeleted={handleLocalDeleted}
                />
              ))
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

function MobileUserCard({
  user,
  onToggleStatus,
  handleEdit,
  handleDelete,
  onLocalSaved,
  onLocalDeleted,
}) {
  const st = user.status || {}
  const forcedAdmin = st.forced === true
  const statusConfig = getStatusConfig(user)

  return (
    <article className="relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-black/45 px-3 py-2.5 shadow-2xl shadow-black/30">
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative z-10 grid grid-cols-[52px_minmax(0,1fr)_auto_38px] items-center gap-2.5">
        <Avatar fotoUrl={user.foto_url} nombre={user.nombre} />

        <div className="min-w-0">
          <p className="truncate text-base font-black leading-tight text-white">
            {user.nombre || "Alumno PHO3NIX"}
          </p>
        </div>

        <button
          type="button"
          disabled={forcedAdmin}
          onClick={() => onToggleStatus?.(user)}
          className={[
            "shrink-0 rounded-full border px-2.5 py-1.5 text-[10px] font-black uppercase transition disabled:cursor-not-allowed disabled:opacity-60",
            statusConfig.className,
          ].join(" ")}
        >
          <span className="mr-1">●</span>
          {statusConfig.label}
        </button>

        <UserActionsMenu
          user={user}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleStatus={onToggleStatus}
          disabledToggle={forcedAdmin}
          onLocalSaved={onLocalSaved}
          onLocalDeleted={onLocalDeleted}
        />
      </div>
    </article>
  )
}

function UserActionsMenu({
  user,
  onEdit,
  onDelete,
  onToggleStatus,
  disabledToggle,
  onLocalSaved,
  onLocalDeleted,
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")
  const active = user?.status?.active
  const statusConfig = getStatusConfig(user)

  const [form, setForm] = useState({
    telefono: user?.telefono || "",
    role: user?.role || "Alumno",
    fecha_nacimiento: user?.fecha_nacimiento || "",
    sexo: user?.sexo || "",
  })

  const setField = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const handleSave = async (event) => {
    event.preventDefault()

    if (!user?.id) return

    try {
      setSaving(true)
      setError("")

      await updateUserBasic(user.id, {
        telefono: form.telefono.trim() || null,
        role: form.role,
        fecha_nacimiento: form.fecha_nacimiento || null,
        sexo: form.sexo || null,
      })

      onLocalSaved?.({
        ...user,
        telefono: form.telefono.trim() || null,
        role: form.role,
        fecha_nacimiento: form.fecha_nacimiento || null,
        sexo: form.sexo || null,
      })

      setOpen(false)
    } catch (error) {
      console.error("Error guardando alumno desde móvil:", error)
      setError(error?.message || "No se pudo guardar el alumno.")
    } finally {
      setSaving(false)
    }
  }

  const handleMembership = () => {
    setOpen(false)
    onToggleStatus?.(user)
  }

  const handleDelete = async () => {
    const ok = window.confirm(
      `¿Eliminar a ${user?.nombre || "este alumno"}? Esta acción quitará el usuario de la tabla.`
    )

    if (!ok || !user?.id) return

    try {
      setDeleting(true)
      setError("")

      const { error: mensualidadError } = await supabase
        .from("mensualidades")
        .delete()
        .eq("usuario_id", user.id)

      if (mensualidadError) throw mensualidadError

      const { error: userError } = await supabase
        .from("usuarios")
        .delete()
        .eq("id", user.id)

      if (userError) throw userError

      onLocalDeleted?.(user.id)
      setOpen(false)
    } catch (error) {
      console.error("Error eliminando alumno desde móvil:", error)

      if (onDelete) {
        setOpen(false)
        onDelete(user)
        return
      }

      setError(error?.message || "No se pudo eliminar el alumno.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-black/45 text-xl text-white/70 transition hover:border-orange-500/35 hover:text-orange-300"
        aria-label="Editar alumno"
      >
        ⋮
      </button>

      {open ? (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
            onClick={() => {
              if (!saving && !deleting) setOpen(false)
            }}
            aria-label="Cerrar edición"
          />

          <form
            onSubmit={handleSave}
            className="relative z-10 flex max-h-[88dvh] w-full max-w-md flex-col overflow-hidden rounded-[1.8rem] border border-orange-500/35 bg-[#070707] shadow-[0_0_65px_rgba(249,115,22,0.28)]"
          >
            <div className="shrink-0 border-b border-white/10 bg-white/[0.03] px-5 py-4">
              <div className="flex items-center gap-3">
                <Avatar fotoUrl={user?.foto_url} nombre={user?.nombre} />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-black text-white">
                    {user?.nombre || "Alumno PHO3NIX"}
                  </p>

                  <span
                    className={[
                      "mt-2 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase",
                      statusConfig.className,
                    ].join(" ")}
                  >
                    <span className="mr-1">●</span>
                    {statusConfig.label}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={saving || deleting}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/55 text-xl text-white/70 disabled:opacity-50"
                  aria-label="Cerrar"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="grid gap-4">
                <MobileEditField
                  label="Teléfono"
                  value={form.telefono}
                  onChange={(value) => setField("telefono", value)}
                  placeholder="Ej: 0990000000"
                />

                <MobileEditField
                  label="Fecha de nacimiento"
                  type="date"
                  value={form.fecha_nacimiento}
                  onChange={(value) => setField("fecha_nacimiento", value)}
                />

                <label className="block">
                  <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-white/55">
                    Sexo
                  </span>

                  <select
                    value={form.sexo}
                    onChange={(event) => setField("sexo", event.target.value)}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-black/55 px-4 text-sm text-white outline-none focus:border-orange-500/60"
                  >
                    <option value="" className="bg-black text-white">
                      No definido
                    </option>

                    {SEX_OPTIONS.map((option) => (
                      <option key={option} value={option} className="bg-black text-white">
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-white/55">
                    Rol
                  </span>

                  <select
                    value={form.role}
                    onChange={(event) => setField("role", event.target.value)}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-black/55 px-4 text-sm text-white outline-none focus:border-orange-500/60"
                  >
                    {ROLE_PICKER_OPTIONS.map((option) => (
                      <option key={option} value={option} className="bg-black text-white">
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <button
                type="button"
                disabled={disabledToggle || saving || deleting}
                onClick={handleMembership}
                className="mt-5 flex h-12 w-full items-center justify-between rounded-2xl border border-orange-500/25 bg-orange-500/10 px-4 text-sm font-black uppercase text-orange-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {active ? "Desactivar membresía" : "Activar membresía"}
                <span>{active ? "⏸" : "✅"}</span>
              </button>

              {error ? (
                <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}
            </div>

            <div className="shrink-0 border-t border-white/10 bg-black/60 p-4">
              <div className="grid gap-3">
                <button
                  type="submit"
                  disabled={saving || deleting}
                  className="h-12 rounded-2xl bg-orange-500 text-sm font-black uppercase text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>

                <button
                  type="button"
                  disabled={saving || deleting}
                  onClick={handleDelete}
                  className="h-12 rounded-2xl border border-red-500/35 bg-red-500/10 text-sm font-black uppercase text-red-300 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting ? "Eliminando..." : "Eliminar alumno"}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : null}
    </>
  )
}

function MobileEditField({
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-white/55">
        {label}
      </span>

      <input
        type={type}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-white/10 bg-black/55 px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-orange-500/60"
      />
    </label>
  )
}

function MobileMetricCard({ icon, value, label, tone = "orange" }) {
  const toneClass =
    tone === "green"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
      : tone === "gray"
      ? "border-white/10 bg-white/[0.04] text-white/55"
      : tone === "red"
      ? "border-red-500/25 bg-red-500/10 text-red-300"
      : "border-orange-500/25 bg-orange-500/10 text-orange-300"

  return (
    <article
      className={[
        "relative min-h-[104px] overflow-hidden rounded-[1.25rem] border p-2.5 text-center shadow-2xl shadow-black/30",
        toneClass,
      ].join(" ")}
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-current opacity-10 blur-3xl" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center">
        <div className="text-xl">{icon}</div>

        <p className="mt-1.5 text-2xl font-black text-white sm:text-3xl">
          {value}
        </p>

        <p className="mt-1 text-[9px] font-black leading-tight text-white sm:text-[10px]">
          {label}
        </p>
      </div>
    </article>
  )
}

function Avatar({ fotoUrl, nombre }) {
  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={nombre || "Alumno"}
        className="h-12 w-12 rounded-full border border-white/10 object-cover sm:h-14 sm:w-14"
      />
    )
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-orange-500/25 bg-orange-500/10 text-sm font-black text-orange-300 sm:h-14 sm:w-14">
      {getInitials(nombre)}
    </div>
  )
}

function getStatusConfig(user) {
  const st = user?.status || {}

  if (st.expiring) {
    return {
      label: "Por vencer",
      className: "border-amber-500/35 bg-amber-500/10 text-amber-300",
    }
  }

  if (st.active) {
    return {
      label: "Activo",
      className: "border-emerald-500/35 bg-emerald-500/10 text-emerald-300",
    }
  }

  return {
    label: "Inactivo",
    className: "border-orange-500/35 bg-orange-500/10 text-orange-300",
  }
}

function getFilterCount(key, rows = []) {
  if (key === "active") return rows.filter((u) => u.status?.active && !u.status?.expiring).length
  if (key === "expiring") return rows.filter((u) => u.status?.expiring).length
  if (key === "inactive") return rows.filter((u) => !u.status?.active).length
  return rows.length
}

function getFilterIconClass(tone) {
  if (tone === "green") return "text-emerald-400"
  if (tone === "gray") return "text-white/35"
  if (tone === "red") return "text-red-400"
  return "text-orange-400"
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

function getInitials(name) {
  const parts = String(name || "PH")
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) return "PH"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}
