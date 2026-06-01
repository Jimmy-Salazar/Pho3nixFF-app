// src/pages/admin/Users.jsx
import { useEffect, useMemo, useRef, useState } from "react"
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"
import { useNavigate } from "react-router-dom"
import DashboardSidebar from "./dashboard/components/DashboardSidebar"
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
const FILTER_OPTIONS = [
  { key: "all", label: "Todos" },
  { key: "active", label: "Activos" },
  { key: "expiring", label: "Por vencer" },
  { key: "inactive", label: "Inactivos" },
]

export default function Users() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState([])
  const [error, setError] = useState("")

  const [search, setSearch] = useState("")
  const [role, setRole] = useState("all")
  const [filter, setFilter] = useState("all")

  const [openCreate, setOpenCreate] = useState(false)
  const [creating, setCreating] = useState(false)

  const [mensMap, setMensMap] = useState(new Map())

  const [payModalOpen, setPayModalOpen] = useState(false)
  const [payUser, setPayUser] = useState(null)
  const [payMens, setPayMens] = useState(null)

  const [editOpen, setEditOpen] = useState(false)
  const [editUser, setEditUser] = useState(null)

  const load = async () => {
    try {
      setError("")
      setLoading(true)

      const users = await fetchUsers({ search, role, limit: 300 })
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
        statusLabel: "Activa",
        paymentLabel: "Sin pago (Admin)",
        daysLeft: null,
        expiring: false,
      }
    }

    const m = mensMap.get(u.id)
    if (!m) {
      return {
        active: false,
        mensualidad: null,
        forced: false,
        statusLabel: "Inactiva",
        paymentLabel: "Sin pago activo",
        daysLeft: null,
        expiring: false,
      }
    }

    const info = mensualidadStatusInfo(m)
    const daysLeft = getDaysLeft(m.fecha_fin)
    const expiring = info.active && daysLeft !== null && daysLeft <= 7 && daysLeft >= 0

    return {
      active: info.active,
      mensualidad: m,
      forced: false,
      statusLabel: info.active ? (expiring ? "Por vencer" : "Activa") : "Inactiva",
      paymentLabel: m.fecha_fin
        ? `${formatDateReadable(m.fecha_fin)}${daysLeft !== null ? ` · ${daysLeft === 0 ? "Hoy" : `en ${daysLeft} día(s)`}` : ""}`
        : "Sin fecha",
      daysLeft,
      expiring,
    }
  }

  const enrichedRows = useMemo(() => {
    return rows.map((u) => ({
      ...u,
      status: computeStatus(u),
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, mensMap])

  const stats = useMemo(() => {
    const total = enrichedRows.length
    const admins = enrichedRows.filter((u) => isAdminRole(u.role)).length
    const active = enrichedRows.filter((u) => u.status.active && !isAdminRole(u.role)).length
    const expiring = enrichedRows.filter((u) => u.status.expiring).length
    const inactive = enrichedRows.filter((u) => !u.status.active && !isAdminRole(u.role)).length

    return { total, active, expiring, inactive, admins }
  }, [enrichedRows])

  const filteredRows = useMemo(() => {
    if (filter === "active") {
      return enrichedRows.filter((u) => u.status.active && !u.status.expiring)
    }
    if (filter === "expiring") {
      return enrichedRows.filter((u) => u.status.expiring)
    }
    if (filter === "inactive") {
      return enrichedRows.filter((u) => !u.status.active)
    }
    return enrichedRows
  }, [enrichedRows, filter])

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
      `¿Borrar a ${u.nombre}? Recomendado: NO borrar, mejor desactivar mensualidad.`
    )
    if (!ok) return
    alert("Borrado aún no implementado. (Recomendado: desactivar mensualidad)")
  }

  return (
    <div className="fixed inset-0 z-[80] overflow-hidden bg-black text-white">
      <div className="grid h-full grid-cols-[270px_1fr] overflow-hidden">
        <DashboardSidebar navigate={navigate} />

        <main className="phoenix-page min-w-0 overflow-hidden p-5">
          <div className="grid h-full grid-rows-[auto_auto_1fr_auto] gap-4 overflow-hidden">
            <UsersTopHeader onCreate={() => setOpenCreate(true)} />

            <section className="grid grid-cols-5 gap-3">
              <UsersMetricCard icon="👥" label="Total alumnos" value={stats.total} note="Todos los miembros" tone="purple" />
              <UsersMetricCard icon="✅" label="Activos" value={stats.active} note={`${percent(stats.active, Math.max(stats.total - stats.admins, 1))}% del total`} tone="green" />
              <UsersMetricCard icon="🕘" label="Por vencer (≤ 7 días)" value={stats.expiring} note="Atención requerida" tone="amber" />
              <UsersMetricCard icon="✕" label="Inactivos" value={stats.inactive} note="Sin mensualidad activa" tone="red" />
              <UsersMetricCard icon="🛡️" label="Administradores" value={stats.admins} note="Acceso al sistema" tone="blue" />
            </section>

            <section className="min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-2xl backdrop-blur-xl">
              <div className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-white/[0.025] p-4">
                <div className="relative min-w-[320px] flex-1">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar alumno por nombre, email, cédula o teléfono..."
                    className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 pr-11 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-orange-400/45"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
                    ⌕
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {FILTER_OPTIONS.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setFilter(item.key)}
                      className={[
                        "h-11 rounded-xl border px-4 text-sm font-black transition",
                        filter === item.key
                          ? "border-orange-500 bg-orange-500/15 text-orange-300 shadow-[0_0_22px_rgba(249,115,22,0.15)]"
                          : "border-white/10 bg-black/20 text-white/65 hover:border-orange-400/35 hover:text-white",
                      ].join(" ")}
                    >
                      {item.label}
                      <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs">
                        {getFilterCount(item.key, enrichedRows)}
                      </span>
                    </button>
                  ))}
                </div>

                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="h-11 rounded-xl border border-white/10 bg-black/25 px-3 text-sm font-bold text-white outline-none focus:border-orange-400/45"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r} className="bg-slate-950 text-white">
                      {r === "all" ? "Todos los roles" : r}
                    </option>
                  ))}
                </select>
              </div>

              {error ? (
                <div className="m-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <div className="hidden h-[calc(100%-76px)] overflow-auto md:block">
                <UsersDesktopTable
                  loading={loading}
                  rows={filteredRows}
                  onToggleStatus={onToggleStatus}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                />
              </div>

              <div className="h-[calc(100%-76px)] overflow-y-auto p-3 md:hidden">
                <UsersMobileCards
                  loading={loading}
                  rows={filteredRows}
                  onToggleStatus={onToggleStatus}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-orange-500/25 bg-white/[0.04] px-5 py-3 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15 text-xl">
                    👥
                  </div>
                  <div>
                    <div className="text-sm font-black text-white">Consejo rápido</div>
                    <div className="text-xs text-white/50">
                      Puedes activar, pausar o vencer mensualidades desde el perfil de cada alumno.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => exportUsersToExcel(filteredRows)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-white/75 transition hover:border-orange-400/40 hover:text-orange-300"
                >
                  📊 Exportar Excel
                </button>
              </div>
            </section>
          </div>
        </main>

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

function UsersTopHeader({ onCreate }) {
  return (
    <section className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white">
          Alumnos <span className="text-purple-300">👥</span>
        </h1>
        <p className="mt-1 text-base text-white/55">
          Gestiona a todos los miembros del box.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/80">
          📅 <span className="ml-2">{formatHumanDate(new Date())}</span>
        </div>

        <button
          type="button"
          onClick={onCreate}
          className="phoenix-button-primary text-sm uppercase"
        >
          + Nuevo alumno
        </button>
      </div>
    </section>
  )
}

function UsersMetricCard({ icon, label, value, note, tone }) {
  const toneClass = {
    purple: "bg-purple-500/15 text-purple-300",
    green: "bg-emerald-500/15 text-emerald-300",
    amber: "bg-amber-500/15 text-amber-300",
    red: "bg-red-500/15 text-red-300",
    blue: "bg-blue-500/15 text-blue-300",
  }[tone]

  return (
    <article className="phoenix-card p-4">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${toneClass} text-xl`}>
        {icon}
      </div>

      <div className="mt-3 text-3xl font-black text-white">{value}</div>
      <div className="text-sm font-bold text-white/80">{label}</div>
      <div className="mt-2 text-xs text-white/45">{note}</div>
    </article>
  )
}

function UsersDesktopTable({ loading, rows, onToggleStatus, handleEdit, handleDelete }) {
  return (
    <div className="h-full overflow-auto">
      <table className="min-w-full text-sm whitespace-nowrap">
        <thead className="sticky top-0 z-10 bg-[#11151c] text-xs uppercase tracking-[0.08em] text-white/55">
          <tr>
            <th className="px-4 py-3 text-left font-black">Alumno</th>
            <th className="px-4 py-3 text-left font-black">Mensualidad</th>
            <th className="px-4 py-3 text-left font-black">Próximo pago</th>
            <th className="px-4 py-3 text-left font-black">Estado</th>
            <th className="px-4 py-3 text-left font-black">Acceso</th>
            <th className="px-4 py-3 text-right font-black">Acciones</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-white/7">
          {loading ? (
            <tr>
              <td className="px-4 py-6 text-white/60" colSpan={6}>
                Cargando alumnos…
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td className="px-4 py-6 text-white/60" colSpan={6}>
                No hay resultados.
              </td>
            </tr>
          ) : (
            rows.map((u) => {
              const st = u.status
              const isForcedAdmin = st.forced === true

              return (
                <tr key={u.id} className="transition hover:bg-white/[0.035]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar fotoUrl={u.foto_url} nombre={u.nombre} />
                      <div className="min-w-0">
                        <div className="truncate font-black text-white">
                          {u.nombre}
                          {isForcedAdmin ? <span className="ml-1 text-amber-300">★</span> : null}
                        </div>
                        <div className="truncate text-xs text-white/50">
                          {u.email || "Sin email"} · {u.telefono || "Sin teléfono"}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <MembershipPill status={st} />
                  </td>

                  <td className="px-4 py-3">
                    <div className="text-sm text-white/80">
                      {st.forced ? "—" : st.mensualidad?.fecha_fin ? formatDateReadable(st.mensualidad.fecha_fin) : "—"}
                    </div>
                    <div className="text-xs text-orange-300">
                      {st.forced ? "Sin pago (Admin)" : st.daysLeft !== null ? (st.daysLeft === 0 ? "Hoy" : `En ${st.daysLeft} día(s)`) : "Sin pago activo"}
                    </div>
                  </td>

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
                    <RolePill role={u.role} />
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
    </div>
  )
}

function UsersMobileCards({ loading, rows, onToggleStatus, handleEdit, handleDelete }) {
  if (loading) {
    return <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/60">Cargando alumnos…</div>
  }

  if (!rows.length) {
    return <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/60">No hay resultados.</div>
  }

  return (
    <div className="space-y-3">
      {rows.map((u) => {
        const st = u.status
        const isForcedAdmin = st.forced === true

        return (
          <article key={u.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-3">
              <Avatar fotoUrl={u.foto_url} nombre={u.nombre} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-black text-white">{u.nombre}</div>
                <div className="truncate text-xs text-white/50">{u.email}</div>
              </div>
              <StatusDot active={st.active} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <InfoMini label="Rol" value={normalizeRoleLabel(u.role)} />
              <InfoMini label="Pago" value={st.forced ? "Admin" : st.daysLeft !== null ? `En ${st.daysLeft} día(s)` : "Sin pago"} />
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={isForcedAdmin}
                onClick={() => onToggleStatus(u)}
                className="flex-1 rounded-xl border border-orange-500/25 bg-orange-500/10 px-3 py-2 text-xs font-black text-orange-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {st.active ? "Desactivar" : "Activar"}
              </button>
              <IconButtonSm title="Editar" onClick={() => handleEdit(u)} icon="✏️" />
              <IconButtonSm title="Borrar" danger onClick={() => handleDelete(u)} icon="🗑️" />
            </div>
          </article>
        )
      })}
    </div>
  )
}

function InfoMini({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.12em] text-white/35">{label}</div>
      <div className="mt-1 font-bold text-white/80">{value}</div>
    </div>
  )
}

function MembershipPill({ status }) {
  const cls = status.expiring
    ? "border-amber-500/25 bg-amber-500/15 text-amber-300"
    : status.active
      ? "border-emerald-500/25 bg-emerald-500/15 text-emerald-300"
      : "border-red-500/25 bg-red-500/15 text-red-300"

  return (
    <span className={`inline-flex rounded-xl border px-3 py-1.5 text-xs font-black ${cls}`}>
      {status.statusLabel}
    </span>
  )
}

function getFilterCount(key, rows) {
  if (key === "active") return rows.filter((u) => u.status.active && !u.status.expiring).length
  if (key === "expiring") return rows.filter((u) => u.status.expiring).length
  if (key === "inactive") return rows.filter((u) => !u.status.active).length
  return rows.length
}

function getDaysLeft(value) {
  if (!value) return null
  const today = new Date()
  const end = new Date(`${value}T23:59:59`)
  if (Number.isNaN(end.getTime())) return null
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endStart = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  return Math.ceil((endStart - todayStart) / 86400000)
}

function formatDateReadable(value) {
  if (!value) return "—"
  try {
    const d = new Date(`${value}T00:00:00`)
    return d.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return String(value)
  }
}

function formatHumanDate(value) {
  const d = value instanceof Date ? value : new Date(value)
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function percent(value, total) {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

function isAdminRole(role) {
  const r = String(role || "").trim().toLowerCase()
  return r === "admin" || r === "administrador"
}



function exportUsersToExcel(rows) {
  const data = rows.map((u) => ({
    Nombre: u.nombre || "",
    Email: u.email || "",
    Telefono: u.telefono || "",
    Cedula: u.cedula || "",
    Rol: normalizeRoleLabel(u.role),
    Estado: u.status?.statusLabel || "",
    FechaFin: u.status?.mensualidad?.fecha_fin
      ? formatDateReadable(u.status.mensualidad.fecha_fin)
      : "",
    DiasRestantes: u.status?.daysLeft ?? "",
    Activo: u.status?.active ? "SI" : "NO",
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(workbook, worksheet, "Alumnos")

  worksheet["!cols"] = [
    { wch: 25 },
    { wch: 32 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 10 },
  ]

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  })

  const file = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })

  saveAs(
    file,
    `pho3nix-alumnos-${new Date().toISOString().slice(0, 10)}.xlsx`
  )
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

function normalizeRoleLabel(role) {
  const r = String(role || "").trim().toLowerCase()
  if (r === "admin" || r === "administrador") return "Administrador"
  if (r === "coach") return "Coach"
  if (r === "alumno" || r === "student") return "Alumno"
  return role || "—"
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
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    telefono: user?.telefono || "",
    role: user?.role || "Alumno",
    fecha_nacimiento: user?.fecha_nacimiento || "",
    sexo: user?.sexo || "",
  })

  const setField = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSave = async (e) => {
    e.preventDefault()

    try {
      setSaving(true)

      await updateUserBasic(user.id, {
        telefono: form.telefono.trim() || null,
        role: form.role,
        fecha_nacimiento: form.fecha_nacimiento || null,
        sexo: form.sexo || null,
      })

      await onSaved()
    } catch (e) {
      alert(e?.message || "No se pudo actualizar el usuario.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar"
      />

      <form
        onSubmit={handleSave}
        className="phoenix-card relative z-[141] w-full max-w-2xl overflow-hidden"
      >
        <div className="relative overflow-hidden border-b border-orange-500/15 bg-black/55 p-5 sm:p-6">
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="absolute -bottom-24 left-10 h-52 w-52 rounded-full bg-red-500/10 blur-3xl" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar fotoUrl={user?.foto_url} nombre={user?.nombre} />

              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-orange-300">
                  Editar usuario
                </div>

                <h2 className="mt-3 truncate text-2xl font-black text-white sm:text-3xl">
                  {user?.nombre || "Usuario"}
                </h2>

                <p className="mt-1 truncate text-sm text-white/55">
                  {user?.email || "Sin email registrado"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/35 text-lg text-white/70 transition hover:border-orange-400/40 hover:text-orange-300"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <PhoenixField
              label="Teléfono"
              value={form.telefono}
              onChange={(e) => setField("telefono", e.target.value)}
              placeholder="Ej: 0990000000"
            />

            <PhoenixField
              label="Fecha de nacimiento"
              type="date"
              value={form.fecha_nacimiento}
              onChange={(e) => setField("fecha_nacimiento", e.target.value)}
            />

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                Sexo
              </label>

              <select
                value={form.sexo}
                onChange={(e) => setField("sexo", e.target.value)}
                className="phoenix-input"
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
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                Rol
              </label>

              <select
                value={form.role}
                onChange={(e) => setField("role", e.target.value)}
                className="phoenix-input"
              >
                {ROLE_PICKER_OPTIONS.map((option) => (
                  <option key={option} value={option} className="bg-black text-white">
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-orange-500/15 bg-orange-500/10 p-4 text-sm leading-6 text-white/65">
            <span className="font-black text-orange-300">Importante:</span>{" "}
            Desde aquí solo editamos datos básicos. La mensualidad se gestiona desde el estado del alumno.
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-orange-500/15 bg-black/40 p-5 sm:flex-row sm:justify-end sm:p-6">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="phoenix-button-ghost text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={saving}
            className="phoenix-button-primary text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
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
    sexo: "Masculino",
  })

  const setField = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const disabled =
    loading ||
    !form.nombre.trim() ||
    !form.email.trim() ||
    !form.cedula.trim() ||
    !form.sexo

  const handleSubmit = (e) => {
    e.preventDefault()
    if (disabled) return

    onSubmit({
      nombre: form.nombre.trim(),
      cedula: form.cedula.trim(),
      email: form.email.trim().toLowerCase(),
      telefono: form.telefono.trim() || null,
      fecha_nacimiento: form.fecha_nacimiento || null,
      role: form.role,
      sexo: form.sexo,
    })
  }

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar"
      />

      <form
        onSubmit={handleSubmit}
        className="phoenix-card relative z-[141] w-full max-w-3xl overflow-hidden"
      >
        <div className="relative overflow-hidden border-b border-orange-500/15 bg-black/55 p-5 sm:p-6">
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="absolute -bottom-24 left-10 h-52 w-52 rounded-full bg-red-500/10 blur-3xl" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-orange-300">
                Nuevo miembro
              </div>

              <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
                Registrar <span className="text-orange-400">alumno</span>
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
                Crea el perfil del alumno. Luego podrás activar su mensualidad desde el listado.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/35 text-lg text-white/70 transition hover:border-orange-400/40 hover:text-orange-300"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
        </div>

        <div className="max-h-[70dvh] overflow-y-auto p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <PhoenixField
              label="Nombre completo"
              required
              value={form.nombre}
              onChange={(e) => setField("nombre", e.target.value)}
              placeholder="Ej: Jimmy Salazar"
            />

            <PhoenixField
              label="Cédula"
              required
              value={form.cedula}
              onChange={(e) => setField("cedula", e.target.value)}
              placeholder="Ej: 0900000000"
            />

            <PhoenixField
              label="Email"
              required
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="correo@ejemplo.com"
            />

            <PhoenixField
              label="Teléfono"
              value={form.telefono}
              onChange={(e) => setField("telefono", e.target.value)}
              placeholder="Ej: 0990000000"
            />

            <PhoenixField
              label="Fecha de nacimiento"
              type="date"
              value={form.fecha_nacimiento}
              onChange={(e) => setField("fecha_nacimiento", e.target.value)}
            />

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                Sexo <span className="text-orange-300">*</span>
              </label>

              <select
                value={form.sexo}
                onChange={(e) => setField("sexo", e.target.value)}
                className="phoenix-input"
                required
              >
                <option value="" className="bg-black text-white">
                  Seleccionar
                </option>

                {SEX_OPTIONS.map((option) => (
                  <option key={option} value={option} className="bg-black text-white">
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
                Tipo de acceso
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {ROLE_PICKER_OPTIONS.map((option) => {
                  const active = form.role === option

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setField("role", option)}
                      className={[
                        "rounded-2xl border px-4 py-3 text-left transition",
                        active
                          ? "border-orange-500/40 bg-orange-500/15 text-orange-300 shadow-[0_0_22px_rgba(249,115,22,0.14)]"
                          : "border-white/10 bg-black/25 text-white/65 hover:border-orange-400/30 hover:text-white",
                      ].join(" ")}
                    >
                      <div className="text-sm font-black">{option}</div>
                      <div className="mt-1 text-[11px] text-white/45">
                        {option === "Alumno"
                          ? "Acceso regular"
                          : option === "Coach"
                            ? "Gestión deportiva"
                            : "Acceso completo"}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-orange-500/15 bg-orange-500/10 p-4 text-sm leading-6 text-white/65">
            <span className="font-black text-orange-300">Nota:</span>{" "}
            Se usará la Edge Function <b>create-student</b> y se enviará el email para que el usuario configure su contraseña.
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-orange-500/15 bg-black/40 p-5 sm:flex-row sm:justify-end sm:p-6">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="phoenix-button-ghost text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={disabled}
            className="phoenix-button-primary text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creando alumno..." : "Crear alumno"}
          </button>
        </div>
      </form>
    </div>
  )
}

function PhoenixField({
  label,
  required = false,
  type = "text",
  value,
  onChange,
  placeholder = "",
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
        {label} {required ? <span className="text-orange-300">*</span> : null}
      </label>

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="phoenix-input"
        required={required}
      />
    </div>
  )
}
