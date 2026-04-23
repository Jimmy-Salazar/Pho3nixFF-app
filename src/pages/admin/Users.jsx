// src/pages/admin/Users.jsx
//UND3W9PPUG4M1XJS6QL53CHP
import { useEffect, useMemo, useRef, useState } from "react"
import {
  createStudent,
  fetchUsers,
  fetchLatestMensualidadesByUserIds,
  activateMensualidad,
  deactivateLatestMensualidad,
  updateUserBasic,
} from "../../services/users"
import { mensualidadStatusInfo } from "../../utils/mensualidades"

const ROLE_OPTIONS = ["all", "Alumno", "Admin", "Coach"]
const ROLE_PICKER_OPTIONS = ["Alumno", "Coach", "Admin"]
const SEX_OPTIONS = ["Masculino", "Femenino"]

export default function Users() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState([])
  const [error, setError] = useState("")

  const [search, setSearch] = useState("")
  const [role, setRole] = useState("all")

  const [openCreate, setOpenCreate] = useState(false)
  const [creating, setCreating] = useState(false)

  const [mensMap, setMensMap] = useState(new Map())

  const [payModalOpen, setPayModalOpen] = useState(false)
  const [payUser, setPayUser] = useState(null)
  const [payMens, setPayMens] = useState(null)

  const [editOpen, setEditOpen] = useState(false)
  const [editUser, setEditUser] = useState(null)

  const totalLabel = useMemo(() => `${rows.length} personas`, [rows])

  const load = async () => {
    try {
      setError("")
      setLoading(true)

      const users = await fetchUsers({ search, role, limit: 200 })
      setRows(users)

      const ids = users.map((u) => u.id)
      const map = await fetchLatestMensualidadesByUserIds(ids)
      setMensMap(map)
    } catch (e) {
      setError(e?.message ?? "Error cargando personas/mensualidades")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  useEffect(() => {
    const t = setTimeout(() => load(), 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const computeStatus = (u) => {
    const roleNorm = String(u.role || "").trim().toLowerCase()

    if (roleNorm === "admin" || roleNorm === "administrador") {
      return {
        active: true,
        mensualidad: null,
        forced: true,
      }
    }

    const m = mensMap.get(u.id)
    if (!m) return { active: false, mensualidad: null, forced: false }

    const info = mensualidadStatusInfo(m)

    return {
      active: info.active,
      mensualidad: m,
      forced: false,
    }
  }

  const openPayment = (u, mensualidad) => {
    setPayUser(u)
    setPayMens(mensualidad || null)
    setPayModalOpen(true)
  }

  const closePayment = () => {
    setPayModalOpen(false)
    setPayUser(null)
    setPayMens(null)
  }

  const onToggleStatus = async (u) => {
    const roleNorm = String(u.role || "").trim().toLowerCase()

    // Admin no usa mensualidades
    if (roleNorm === "admin" || roleNorm === "administrador") return

    const s = computeStatus(u)

    if (s.active) {
      if (!s.mensualidad?.id) return
      const ok = window.confirm(`¿Desactivar membresía de ${u.nombre}?`)
      if (!ok) return

      try {
        await deactivateLatestMensualidad({ mensualidad_id: s.mensualidad.id })
        await load()
      } catch (e) {
        alert(e?.message ?? "No se pudo desactivar (revisa permisos/RLS).")
      }
      return
    }

    openPayment(u, s.mensualidad)
  }

  const handleEdit = (u) => {
    setEditUser(u)
    setEditOpen(true)
  }

  const handleDelete = (u) => {
    const ok = window.confirm(
      `¿Borrar a ${u.nombre}? Recomendado: NO borrar, mejor desactivar membresía.`
    )
    if (!ok) return
    alert("Borrado aún no implementado. (Recomendado: desactivar membresía)")
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
              Personas
            </h1>

            <p className="mt-2 text-sm text-slate-300 md:text-base">
              Gestión de alumnos, roles, estado y mensualidades.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpenCreate(true)}
              className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 px-5 py-3 font-bold text-slate-950 shadow-lg shadow-orange-500/20 transition hover:scale-[1.02]"
            >
              + Nuevo Alumno
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-white/60">{totalLabel}</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, cédula o email…"
                className="w-full sm:w-80 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/25"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/25"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r === "all" ? "Todos" : r}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm hidden md:table">
              <thead className="text-white/70">
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 font-medium">Usuario</th>
                  <th className="text-left px-4 py-3 font-medium">Rol</th>
                  <th className="text-left px-4 py-3 font-medium">Cédula</th>
                  <th className="text-left px-4 py-3 font-medium">Cumpleaños</th>
                  <th className="text-left px-4 py-3 font-medium">Estado</th>
                  <th className="text-right px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-4 py-4 text-white/60" colSpan={6}>
                      Cargando…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-white/60" colSpan={6}>
                      No hay resultados.
                    </td>
                  </tr>
                ) : (
                  rows.map((u) => {
                    const st = computeStatus(u)
                    const isForcedAdmin = st.forced === true

                    return (
                      <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar fotoUrl={u.foto_url} nombre={u.nombre} />
                            <div className="min-w-0">
                              <div className="font-medium truncate">{u.nombre}</div>
                              <div className="text-white/60 truncate">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <RolePill role={u.role} />
                        </td>

                        <td className="px-4 py-3 text-white/80">{u.cedula ?? "-"}</td>
                        <td className="px-4 py-3 text-white/80">{formatDateDMY(u.fecha_nacimiento)}</td>

                        <td className="px-4 py-3">
                          <StatusToggle
                            active={st.active}
                            endDate={st.mensualidad?.fecha_fin}
                            disabled={isForcedAdmin}
                            labelOverride={isForcedAdmin ? "Activo" : undefined}
                            titleOverride={isForcedAdmin ? "Administrador siempre activo" : undefined}
                            onToggle={() => onToggleStatus(u)}
                          />
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <IconButton title="Editar" onClick={() => handleEdit(u)} icon="✏️" />
                            <IconButton title="Borrar" danger onClick={() => handleDelete(u)} icon="🗑️" />
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>

            <table className="min-w-full text-[12px] md:hidden">
              <thead className="text-white/70">
                <tr className="border-b border-white/10">
                  <th className="text-left px-3 py-2.5 font-medium">Usuario</th>
                  <th className="text-right px-3 py-2.5 font-medium">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-3 py-3 text-white/60" colSpan={2}>
                      Cargando…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3 text-white/60" colSpan={2}>
                      No hay resultados.
                    </td>
                  </tr>
                ) : (
                  rows.map((u) => {
                    const st = computeStatus(u)
                    const roleLabel = normalizeRoleLabel(u.role)

                    return (
                      <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <StatusDot active={st.active} />
                            <div className="min-w-0">
                              <div className="font-medium truncate">{u.nombre}</div>
                              <div className="text-[11px] text-white/55 truncate">{roleLabel}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-2.5">
                          <div className="flex justify-end gap-1.5">
                            <IconButtonSm title="Editar" onClick={() => handleEdit(u)} icon="✏️" />
                            <IconButtonSm title="Borrar" danger onClick={() => handleDelete(u)} icon="🗑️" />
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {openCreate ? (
          <CreateStudentModal
            loading={creating}
            onClose={() => setOpenCreate(false)}
            onSubmit={async (payload) => {
              try {
                setCreating(true)
                await createStudent(payload)
                setOpenCreate(false)
                await load()
              } catch (e) {
                alert(e?.message ?? "Error creando alumno")
              } finally {
                setCreating(false)
              }
            }}
          />
        ) : null}

        {payModalOpen && payUser ? (
          <PaymentModal
            user={payUser}
            lastMensualidad={payMens}
            onClose={closePayment}
            onSave={async ({ startDate, endDate }) => {
              try {
                await activateMensualidad({
                  usuario_id: payUser.id,
                  fecha_inicio: startDate,
                  fecha_fin: endDate,
                })
                closePayment()
                await load()
              } catch (e) {
                alert(e?.message ?? "No se pudo activar (revisa permisos/RLS).")
              }
            }}
          />
        ) : null}

        {editOpen && editUser ? (
          <EditUserModal
            user={editUser}
            onClose={() => {
              setEditOpen(false)
              setEditUser(null)
            }}
            onSaved={async () => {
              setEditOpen(false)
              setEditUser(null)
              await load()
            }}
          />
        ) : null}
      </div>
    </div>
  )
}

/* ---------------- Helpers / UI ---------------- */

function normalizeRoleLabel(role) {
  const r = String(role || "").trim().toLowerCase()
  if (r === "admin" || r === "administrador") return "Administrador"
  if (r === "coach") return "Coach"
  if (r === "alumno" || r === "student") return "Alumno"
  return role || "—"
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

function StatusToggle({
  active,
  endDate,
  onToggle,
  disabled = false,
  labelOverride,
  titleOverride,
}) {
  const title =
    titleOverride ||
    (endDate ? `Hasta: ${formatDateDMY(endDate)}` : active ? "Activo" : "Inactivo")

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        if (!disabled) onToggle?.()
      }}
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition",
        "bg-white/5 border-white/10",
        disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-white/8",
      ].join(" ")}
      title={title}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${active ? "bg-green-400" : "bg-white/30"}`} />
      <span className="text-white/80">{labelOverride || (active ? "Activo" : "Inactivo")}</span>
    </button>
  )
}

function StatusDot({ active }) {
  return (
    <span
      className={[
        "inline-block h-2.5 w-2.5 rounded-full border",
        active ? "bg-green-400 border-green-400/30" : "bg-white/30 border-white/10",
      ].join(" ")}
      title={active ? "Activo" : "Inactivo"}
    />
  )
}

function IconButton({ title, icon, onClick, danger = false }) {
  return (
    <button
      type="button"
      title={title}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
      className={[
        "h-9 w-9 rounded-xl border flex items-center justify-center transition",
        "bg-white/5 hover:bg-white/10 border-white/10",
        danger ? "hover:border-red-500/30" : "hover:border-white/20",
      ].join(" ")}
    >
      <span className="text-base leading-none">{icon}</span>
    </button>
  )
}

function IconButtonSm({ title, icon, onClick, danger = false }) {
  return (
    <button
      type="button"
      title={title}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
      className={[
        "h-8 w-8 rounded-lg border flex items-center justify-center transition",
        "bg-white/5 hover:bg-white/10 border-white/10",
        danger ? "hover:border-red-500/30" : "hover:border-white/20",
      ].join(" ")}
    >
      <span className="text-[14px] leading-none">{icon}</span>
    </button>
  )
}

function Avatar({ fotoUrl, nombre }) {
  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={nombre}
        className="h-10 w-10 rounded-xl object-cover border border-white/10"
      />
    )
  }
  return (
    <div className="h-10 w-10 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center">
      <span className="text-lg">🐦‍🔥</span>
    </div>
  )
}

function RolePill({ role }) {
  const map = {
    Alumno: "bg-blue-500/15 text-blue-200 border-blue-500/20",
    Admin: "bg-amber-500/15 text-amber-200 border-amber-500/20",
    Coach: "bg-purple-500/15 text-purple-200 border-purple-500/20",
  }
  const cls = map[role] ?? "bg-white/10 text-white/70 border-white/10"
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs border ${cls}`}>
      {role ?? "—"}
    </span>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-white/60 text-xs mb-1">{label}</div>
      {children}
    </label>
  )
}

function RolePicker({ value, onChange, options = ROLE_PICKER_OPTIONS }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onDocClick = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-xl bg-white/5 text-white border border-white/10 px-3 py-2 outline-none focus:border-white/25 flex items-center justify-between"
      >
        <span>{normalizeRoleLabel(value)}</span>
        <span className="text-white/60">▾</span>
      </button>

      {open ? (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-white shadow-2xl">
          {options.map((opt) => {
            const active = opt === value
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt)
                  setOpen(false)
                }}
                className={[
                  "w-full px-3 py-2 text-left text-sm transition",
                  active ? "bg-blue-600 text-white" : "text-black hover:bg-blue-600 hover:text-white",
                ].join(" ")}
              >
                {normalizeRoleLabel(opt)}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function SexSelect({ value, onChange, required = false }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-white/10 bg-slate-900 text-white px-3 py-2 pr-10 outline-none transition focus:border-orange-400 focus:bg-slate-900"
        required={required}
      >
        <option value="" className="bg-slate-900 text-white">
          Seleccione
        </option>
        {SEX_OPTIONS.map((opt) => (
          <option key={opt} value={opt} className="bg-slate-900 text-white">
            {opt}
          </option>
        ))}
      </select>

      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/60">
        ▾
      </span>
    </div>
  )
}

/* ---------------- Modals ---------------- */

function PaymentModal({ user, lastMensualidad, onClose, onSave }) {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, "0")
  const d = String(today.getDate()).padStart(2, "0")
  const todayStr = `${y}-${m}-${d}`

  const [startDate, setStartDate] = useState(todayStr)
  const [endDate, setEndDate] = useState("")
  const [saving, setSaving] = useState(false)

  const canSave = !!startDate && !!endDate && !saving

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#0b0f14] p-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Registrar pago</div>
          <button className="text-white/70 hover:text-white" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <div className="mt-3 text-sm text-white/70">
          Activar mensualidad de <b>{user.nombre}</b>.
        </div>

        {lastMensualidad?.fecha_fin ? (
          <div className="mt-2 text-xs text-white/50">
            Última mensualidad hasta: <b>{formatDateDMY(lastMensualidad.fecha_fin)}</b> (
            {lastMensualidad.estado})
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <label className="block">
            <div className="text-white/60 text-xs mb-1">Fecha inicio</div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-white/25"
            />
          </label>

          <label className="block">
            <div className="text-white/60 text-xs mb-1">Fecha fin</div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-white/25"
            />
          </label>
        </div>

        <p className="mt-3 text-xs text-white/50">
          Se verá <b>Activo</b> mientras estado sea “Activo” y la fecha fin sea ≥ hoy. Si vence,
          se apaga solo.
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10"
            disabled={saving}
            type="button"
          >
            Cancelar
          </button>
          <button
            onClick={async () => {
              try {
                setSaving(true)
                await onSave({ startDate, endDate })
              } finally {
                setSaving(false)
              }
            }}
            className="rounded-xl px-4 py-2 text-sm font-medium bg-white/10 hover:bg-white/15 border border-white/10 disabled:opacity-50"
            disabled={!canSave}
            type="button"
          >
            {saving ? "Guardando…" : "Activar"}
          </button>
        </div>
      </div>
    </div>
  )
}

function EditUserModal({ user, onClose, onSaved }) {
  const [telefono, setTelefono] = useState(user.telefono ?? "")
  const [role, setRole] = useState(user.role ?? "Alumno")
  const [fechaNacimiento, setFechaNacimiento] = useState(user.fecha_nacimiento ?? "")
  const [sexo, setSexo] = useState(user.sexo ?? "")
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState("")

  const canSave = !saving && role && sexo

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#0b0f14] p-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Editar usuario</div>
          <button className="text-white/70 hover:text-white" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <div className="mt-2 text-sm text-white/70">
          <b>{user.nombre}</b> <span className="text-white/50">({user.email})</span>
        </div>

        {err ? (
          <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {err}
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <label className="block">
            <div className="text-white/60 text-xs mb-1">Teléfono</div>
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-white/25"
            />
          </label>

          <div className="block">
            <div className="text-white/60 text-xs mb-1">Rol (usuarios.role)</div>
            <RolePicker value={role} onChange={setRole} />
          </div>

          <label className="block">
            <div className="text-white/60 text-xs mb-1">Sexo</div>
            <SexSelect value={sexo} onChange={setSexo} required />
          </label>

          <label className="block">
            <div className="text-white/60 text-xs mb-1">Fecha de nacimiento</div>
            <input
              type="date"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-white/25"
            />
          </label>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10"
            disabled={saving}
            type="button"
          >
            Cancelar
          </button>

          <button
            onClick={async () => {
              try {
                setSaving(true)
                setErr("")
                await updateUserBasic(user.id, {
                  telefono,
                  role,
                  fecha_nacimiento: fechaNacimiento || null,
                  sexo,
                })
                await onSaved()
              } catch (e) {
                setErr(e?.message ?? "No se pudo guardar (revisa permisos/RLS en usuarios).")
              } finally {
                setSaving(false)
              }
            }}
            className="rounded-xl px-4 py-2 text-sm font-medium bg-white/10 hover:bg-white/15 border border-white/10 disabled:opacity-50"
            disabled={!canSave}
            type="button"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>

        <p className="mt-3 text-xs text-white/50">
          Edita solo: teléfono, rol, sexo y fecha de nacimiento.
        </p>
      </div>
    </div>
  )
}

function CreateStudentModal({ onClose, onSubmit, loading }) {
  const [form, setForm] = useState({
    nombre: "",
    cedula: "",
    email: "",
    telefono: "",
    fecha_nacimiento: "",
    role: "Alumno",
    sexo: "",
  })

  const disabled =
    loading || !form.nombre.trim() || !form.email.trim() || !form.cedula.trim() || !form.sexo

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#0b0f14] p-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Agregar alumno</div>
          <button className="text-white/70 hover:text-white" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <Field label="Nombre">
            <input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-white/25"
            />
          </Field>

          <Field label="Cédula">
            <input
              value={form.cedula}
              onChange={(e) => setForm({ ...form, cedula: e.target.value })}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-white/25"
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-white/25"
            />
          </Field>

          <Field label="Teléfono">
            <input
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-white/25"
            />
          </Field>

          <Field label="Fecha nacimiento">
            <input
              type="date"
              value={form.fecha_nacimiento}
              onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-white/25"
            />
          </Field>

          <Field label="Sexo">
            <SexSelect
              value={form.sexo}
              onChange={(nextSexo) => setForm({ ...form, sexo: nextSexo })}
              required
            />
          </Field>

          <div className="block sm:col-span-2">
            <div className="text-white/60 text-xs mb-1">Rol</div>
            <RolePicker
              value={form.role}
              onChange={(nextRole) => setForm({ ...form, role: nextRole })}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10"
            disabled={loading}
            type="button"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSubmit(form)}
            className="rounded-xl px-4 py-2 text-sm font-medium bg-white/10 hover:bg-white/15 border border-white/10 disabled:opacity-50"
            disabled={disabled}
            type="button"
          >
            {loading ? "Creando…" : "Crear"}
          </button>
        </div>

        <p className="mt-3 text-xs text-white/50">
          Usa la Edge Function <b>create-student</b> y envía el email para setear contraseña.
        </p>
      </div>
    </div>
  )
}