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
  const [selectedUser, setSelectedUser] = useState(null)

  const displayRows = useMemo(() => {
    return (rows || [])
      .filter((user) => !deletedIds.includes(user.id))
      .map((user) => ({
        ...user,
        ...(localUserPatch[user.id] || {}),
      }))
  }, [rows, deletedIds, localUserPatch])

  const selectedUserForEdit = useMemo(() => {
    if (!selectedUser?.id) return null

    return (
      displayRows.find((user) => user.id === selectedUser.id) || {
        ...selectedUser,
        ...(localUserPatch[selectedUser.id] || {}),
      }
    )
  }, [selectedUser, displayRows, localUserPatch])

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

    setSelectedUser(null)
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
    <main className="block h-[100dvh] w-screen max-w-full overflow-x-hidden overflow-y-auto bg-[#050505] pb-28 text-white lg:hidden">
      <div className="relative min-h-full w-full max-w-full overflow-x-hidden px-3 pt-3">
        <BackgroundOrbs />

        <header className="relative z-10 mb-4 flex items-center justify-between gap-2 border-b border-white/10 pb-3">
          <button
            type="button"
            onClick={() => navigate?.("/admin/dashboard")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-orange-500/25 bg-orange-500/10 text-xl text-orange-300"
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
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-orange-500/35 bg-orange-500/10 text-xs font-black text-orange-300 shadow-[0_0_22px_rgba(249,115,22,0.25)]"
            aria-label="Cerrar sesión"
          >
            JS
          </button>
        </header>

        <section className="relative z-10 mb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-3xl font-black uppercase leading-none text-white">
                Alumnos
              </h1>

              <p className="mt-1 text-xs text-white/60">
                Gestiona los miembros del box
              </p>
            </div>

            <button
              type="button"
              onClick={onCreate}
              className="flex h-9 shrink-0 items-center justify-center gap-1 rounded-xl bg-orange-500 px-2.5 text-[10px] font-black uppercase text-black shadow-[0_0_24px_rgba(249,115,22,0.26)] sm:px-3 sm:text-[11px]"
            >
              <span className="text-sm leading-none">＋</span>
              Nuevo alumno
            </button>
          </div>

          <div className="mt-3">
            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder="Buscar por nombre, email o teléfono..."
              className="w-full rounded-xl border border-white/10 bg-black/45 px-4 py-2.5 text-xs text-white outline-none placeholder:text-white/35 focus:border-orange-500/60"
            />
          </div>
        </section>

        <section className="relative z-10 mb-4 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {MOBILE_FILTERS.map((item) => {
            const active = filter === item.key
            const count = getFilterCount(item.key, rows)

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onFilterChange?.(item.key)}
                className={[
                  "shrink-0 rounded-xl border px-3 py-2 transition",
                  active
                    ? "border-orange-500 bg-orange-500/10 text-orange-300"
                    : "border-white/10 bg-black/35 text-white/55",
                ].join(" ")}
              >
                <span className={getFilterIconClass(item.tone)}>{item.icon}</span>
                <span className="ml-1.5 text-[11px] font-black sm:text-xs">{item.label}</span>
                <span className="ml-1.5 text-[9px] text-white/35">{count}</span>
              </button>
            )
          })}
        </section>

        <section className="relative z-10 mb-4 grid grid-cols-4 gap-1.5">
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
          <div className="relative z-10 mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        ) : null}

        <section className="relative z-10 mb-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-base font-black uppercase tracking-[0.06em] text-white/75">
              Lista de alumnos
            </h2>

            <span className="text-xs text-white/50">
              {loading ? "..." : `${displayRows.length} resultado(s)`}
            </span>
          </div>

          <div className="grid gap-2">
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
                  onOpenEdit={() => setSelectedUser(user)}
                />
              ))
            )}
          </div>
        </section>

        <button
          type="button"
          onClick={handleLogout}
          className="relative z-10 mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-500/45 bg-red-500/10 text-xs font-black uppercase text-red-300 transition hover:bg-red-500/15"
        >
          <span className="text-lg">↪</span>
          Cerrar sesión
        </button>
      </div>

      {selectedUserForEdit ? (
        <MobileUserEditPopup
          user={selectedUserForEdit}
          onClose={() => setSelectedUser(null)}
          onDelete={handleDelete}
          onToggleStatus={onToggleStatus}
          disabledToggle={selectedUserForEdit.status?.forced === true}
          onLocalSaved={handleLocalSaved}
          onLocalDeleted={handleLocalDeleted}
        />
      ) : null}

      <AdminMobileNav />
    </main>
  )
}

function MobileUserCard({ user, onToggleStatus, onOpenEdit }) {
  const st = user.status || {}
  const forcedAdmin = st.forced === true
  const statusConfig = getStatusConfig(user)

  return (
    <article className="relative overflow-hidden rounded-[1.15rem] border border-white/10 bg-black/45 px-2.5 py-2 shadow-2xl shadow-black/30">
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative z-10 grid grid-cols-[44px_minmax(0,1fr)_auto_34px] items-center gap-2">
        <Avatar fotoUrl={user.foto_url} nombre={user.nombre} />

        <div className="min-w-0">
          <p className="truncate text-sm font-black leading-tight text-white">
            {user.nombre || "Alumno PHO3NIX"}
          </p>
        </div>

        <button
          type="button"
          disabled={forcedAdmin}
          onClick={() => onToggleStatus?.(user)}
          className={[
            "shrink-0 rounded-full border px-2 py-1 text-[9px] font-black uppercase transition disabled:cursor-not-allowed disabled:opacity-60",
            statusConfig.className,
          ].join(" ")}
        >
          <span className="mr-1">●</span>
          {statusConfig.label}
        </button>

        <button
          type="button"
          onClick={onOpenEdit}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-black/45 text-lg text-white/70 transition hover:border-orange-500/35 hover:text-orange-300"
          aria-label="Editar alumno"
        >
          ⋮
        </button>
      </div>
    </article>
  )
}

function MobileUserEditPopup({
  user,
  onClose,
  onDelete,
  onToggleStatus,
  disabledToggle,
  onLocalSaved,
  onLocalDeleted,
}) {
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

      onClose?.()
    } catch (error) {
      console.error("Error guardando alumno desde móvil:", error)
      setError(error?.message || "No se pudo guardar el alumno.")
    } finally {
      setSaving(false)
    }
  }

  const handleMembership = () => {
    onClose?.()
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
      onClose?.()
    } catch (error) {
      console.error("Error eliminando alumno desde móvil:", error)

      if (onDelete) {
        onClose?.()
        onDelete(user)
        return
      }

      setError(error?.message || "No se pudo eliminar el alumno.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
        onClick={() => {
          if (!saving && !deleting) onClose?.()
        }}
        aria-label="Cerrar edición"
      />

      <form
        onSubmit={handleSave}
        className="relative z-10 flex max-h-[90dvh] w-full max-w-sm flex-col overflow-hidden rounded-[1.45rem] border border-orange-500/35 bg-[#070707] shadow-[0_0_65px_rgba(249,115,22,0.28)]"
      >
        <div className="shrink-0 border-b border-white/10 bg-white/[0.03] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Avatar fotoUrl={user?.foto_url} nombre={user?.nombre} />

            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-black text-white">
                {user?.nombre || "Alumno PHO3NIX"}
              </p>

              <span
                className={[
                  "mt-1.5 inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase",
                  statusConfig.className,
                ].join(" ")}
              >
                <span className="mr-1">●</span>
                {statusConfig.label}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving || deleting}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/55 text-lg text-white/70 disabled:opacity-50"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="grid gap-3">
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
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-white/55">
                Sexo
              </span>

              <select
                value={form.sexo}
                onChange={(event) => setField("sexo", event.target.value)}
                className="h-10 w-full rounded-xl border border-white/10 bg-black/55 px-3 text-xs text-white outline-none focus:border-orange-500/60"
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
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-white/55">
                Rol
              </span>

              <select
                value={form.role}
                onChange={(event) => setField("role", event.target.value)}
                className="h-10 w-full rounded-xl border border-white/10 bg-black/55 px-3 text-xs text-white outline-none focus:border-orange-500/60"
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
            className="mt-4 flex h-10 w-full items-center justify-between rounded-xl border border-orange-500/25 bg-orange-500/10 px-3 text-xs font-black uppercase text-orange-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {active ? "Desactivar membresía" : "Activar membresía"}
            <span>{active ? "⏸" : "✅"}</span>
          </button>

          {error ? (
            <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-white/10 bg-black/60 p-3">
          <div className="grid gap-3">
            <button
              type="submit"
              disabled={saving || deleting}
              className="h-10 rounded-xl bg-orange-500 text-xs font-black uppercase text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>

            <button
              type="button"
              disabled={saving || deleting}
              onClick={handleDelete}
              className="h-10 rounded-xl border border-red-500/35 bg-red-500/10 text-xs font-black uppercase text-red-300 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleting ? "Eliminando..." : "Eliminar alumno"}
            </button>
          </div>
        </div>
      </form>
    </div>
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
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-white/55">
        {label}
      </span>

      <input
        type={type}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-white/10 bg-black/55 px-3 text-xs text-white outline-none placeholder:text-white/30 focus:border-orange-500/60"
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
        <div className="text-lg">{icon}</div>

        <p className="mt-1 text-xl font-black text-white sm:text-2xl">
          {value}
        </p>

        <p className="mt-0.5 text-[8px] font-black leading-tight text-white sm:text-[9px]">
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
        className="h-10 w-10 rounded-full border border-white/10 object-cover sm:h-12 sm:w-12"
      />
    )
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-500/25 bg-orange-500/10 text-xs font-black text-orange-300 sm:h-12 sm:w-12">
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
    <div className="rounded-[1.25rem] border border-dashed border-white/10 bg-black/35 p-4 text-xs text-white/45">
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
