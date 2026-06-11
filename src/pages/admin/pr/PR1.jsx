// src/pages/admin/pr/pr.jsx

import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../../supabase"
import pho3nixLogo from "../../../assets/pho3nix-login-logo.png"
import DashboardSidebar from "../dashboard/components/DashboardSidebar"
import AdminMobileNav from "../dashboard/mobile/AdminMobileNav"
import { getExerciseFigure } from "./utils/exerciseFigures"
import PRHeader from "./components/PRHeader"
import PRStatsCards from "./components/PRStatsCards"
import PRFilterBar from "./components/PRFilterBar"
import PRRankingCard from "./components/PRRankingCard"
import PRMotivationCard from "./components/PRMotivationCard"
import RegisterPRModal from "./modals/RegisterPRModal"
import { formatDate, formatWeight, round } from "./utils/formatPR"
import {
  fetchAlumnosPR,
  fetchAllPRRecords,
  fetchEjerciciosPR,
  fetchPerfil,
  fetchTop20PorEjercicio,
  getCurrentUserId,
  insertPRRecord,
} from "./services/prService"

export default function PR() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [sessionUserId, setSessionUserId] = useState(null)
  const [rolActual, setRolActual] = useState(null)

  const [ejercicios, setEjercicios] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [allPRRecords, setAllPRRecords] = useState([])
  const [exerciseRows, setExerciseRows] = useState([])
  const [ranking, setRanking] = useState([])

  const [selectedExerciseId, setSelectedExerciseId] = useState("")
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("todos")
  const [exerciseFilter, setExerciseFilter] = useState("todos")
  const [registerOpen, setRegisterOpen] = useState(false)

  const [exerciseSearch, setExerciseSearch] = useState("")
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false)
  const [exerciseModalMode, setExerciseModalMode] = useState("create")
  const [exerciseDraftName, setExerciseDraftName] = useState("")
  const [selectedManageExercise, setSelectedManageExercise] = useState(null)
  const [deleteExerciseTarget, setDeleteExerciseTarget] = useState(null)
  const [exerciseSaving, setExerciseSaving] = useState(false)

  const esAdminOCoach = ["admin", "coach"].includes(normalizeRole(rolActual))

  const ejercicioActual = useMemo(() => {
    return (
      ejercicios.find((item) => String(item.id) === String(selectedExerciseId)) ||
      ejercicios[0] ||
      null
    )
  }, [ejercicios, selectedExerciseId])

  const filteredExerciseRows = useMemo(() => {
    const term = search.trim().toLowerCase()

    return exerciseRows.filter((row) => {
      const matchesSearch =
        !term ||
        String(row.ejercicio || "").toLowerCase().includes(term) ||
        String(row.atletaMarca || "").toLowerCase().includes(term) ||
        String(row.atletaAnterior || "").toLowerCase().includes(term)

      const matchesType = typeFilter === "todos" || row.tipo === typeFilter

      const matchesExercise =
        exerciseFilter === "todos" ||
        String(row.ejercicio_id) === String(exerciseFilter)

      return matchesSearch && matchesType && matchesExercise
    })
  }, [exerciseRows, search, typeFilter, exerciseFilter])

  const managedExerciseRows = useMemo(() => {
    return buildManagedExerciseRows(ejercicios, allPRRecords, exerciseSearch)
  }, [ejercicios, allPRRecords, exerciseSearch])

  const managedExerciseStats = useMemo(() => {
    const withRecords = managedExerciseRows.filter((row) => row.registros > 0).length

    return {
      total: ejercicios.length,
      withRecords,
      withoutRecords: Math.max(ejercicios.length - withRecords, 0),
    }
  }, [ejercicios.length, managedExerciseRows])

  const stats = useMemo(() => {
    const exercisesWithPR = exerciseRows.filter((row) => row.tieneRegistro)
    const improvements = exerciseRows.filter((row) => Number(row.mejora || 0) > 0)

    const averageImprovement =
      improvements.length > 0
        ? round(
            improvements.reduce((sum, row) => {
              const prev = Number(row.anterior || 0)
              const curr = Number(row.marca || 0)
              if (!prev || !curr) return sum
              return sum + ((curr - prev) / prev) * 100
            }, 0) / improvements.length,
            1
          )
        : 0

    return {
      total: allPRRecords.length,
      monthlyImprovements: improvements.length,
      uniqueExercises: exercisesWithPR.length,
      averageImprovement,
    }
  }, [allPRRecords.length, exerciseRows])

  useEffect(() => {
    initPR()
  }, [])

  useEffect(() => {
    if (!ejercicioActual?.id) {
      setRanking([])
      return
    }

    loadRanking(ejercicioActual.id)
  }, [ejercicioActual?.id])

  async function initPR() {
    try {
      setLoading(true)

      const userId = await getCurrentUserId()
      setSessionUserId(userId)

      const [perfil, ejerciciosRows, alumnosRows, rmRows] = await Promise.all([
        userId ? fetchPerfil(userId) : null,
        fetchEjerciciosPR(),
        fetchAlumnosPR(),
        fetchAllPRRecords(),
      ])

      const rows = buildExerciseRows(ejerciciosRows || [], rmRows || [])

      setRolActual(perfil?.rol || perfil?.role || null)
      setEjercicios(ejerciciosRows || [])
      setAlumnos(alumnosRows || [])
      setAllPRRecords(rmRows || [])
      setExerciseRows(rows)

      if (ejerciciosRows?.[0]?.id) {
        setSelectedExerciseId(ejerciciosRows[0].id)
      }
    } catch (error) {
      console.error("Error cargando PR:", error)
      alert(error?.message || "No se pudo cargar el módulo PR.")
    } finally {
      setLoading(false)
    }
  }

  async function reloadPRData({ nextSelectedExerciseId } = {}) {
    const [ejerciciosRows, rmRows] = await Promise.all([
      fetchEjerciciosPR(),
      fetchAllPRRecords(),
    ])

    const rows = buildExerciseRows(ejerciciosRows || [], rmRows || [])

    setEjercicios(ejerciciosRows || [])
    setAllPRRecords(rmRows || [])
    setExerciseRows(rows)

    if (nextSelectedExerciseId) {
      setSelectedExerciseId(nextSelectedExerciseId)
    } else {
      const selectedStillExists = (ejerciciosRows || []).some((item) => {
        return String(item.id) === String(selectedExerciseId)
      })

      if ((!selectedExerciseId || !selectedStillExists) && ejerciciosRows?.[0]?.id) {
        setSelectedExerciseId(ejerciciosRows[0].id)
      }
    }
  }

  async function loadRanking(ejercicioId) {
    try {
      const rows = await fetchTop20PorEjercicio(ejercicioId)
      setRanking(rows || [])
    } catch (error) {
      console.error("Error cargando ranking PR:", error)
      setRanking([])
    }
  }

  function openCreateExerciseModal() {
    setExerciseModalMode("create")
    setSelectedManageExercise(null)
    setExerciseDraftName("")
    setExerciseModalOpen(true)
  }

  function openEditExerciseModal(row) {
    setExerciseModalMode("edit")
    setSelectedManageExercise(row)
    setExerciseDraftName(row?.nombre || "")
    setExerciseModalOpen(true)
  }

  async function handleSaveExercise() {
    const nombre = String(exerciseDraftName || "").trim()

    if (!nombre) {
      alert("Escribe el nombre del ejercicio.")
      return
    }

    const duplicated = ejercicios.some((item) => {
      const sameName = String(item.nombre || "").trim().toLowerCase() === nombre.toLowerCase()
      const differentId = String(item.id) !== String(selectedManageExercise?.id || "")

      return sameName && differentId
    })

    if (duplicated) {
      alert("Ya existe un ejercicio con ese nombre.")
      return
    }

    try {
      setExerciseSaving(true)

      if (exerciseModalMode === "edit" && selectedManageExercise?.id) {
        const { error } = await supabase
          .from("ejercicios")
          .update({ nombre })
          .eq("id", selectedManageExercise.id)

        if (error) throw error

        await reloadPRData({ nextSelectedExerciseId: selectedManageExercise.id })
      } else {
        const { data, error } = await supabase
          .from("ejercicios")
          .insert({ nombre })
          .select("id")
          .single()

        if (error) throw error

        await reloadPRData({ nextSelectedExerciseId: data?.id })
      }

      setExerciseModalOpen(false)
      setSelectedManageExercise(null)
      setExerciseDraftName("")
    } catch (error) {
      console.error("Error guardando ejercicio:", error)
      alert(error?.message || "No se pudo guardar el ejercicio.")
    } finally {
      setExerciseSaving(false)
    }
  }

  function openDeleteExerciseModal(row) {
    setDeleteExerciseTarget(row)
  }

  async function handleDeleteExercise() {
    if (!deleteExerciseTarget?.id) return

    if (Number(deleteExerciseTarget.registros || 0) > 0) {
      setDeleteExerciseTarget(null)
      alert(
        "Este ejercicio ya tiene PR registrados. Para proteger el historial, no se elimina."
      )
      return
    }

    try {
      setExerciseSaving(true)

      const { error } = await supabase
        .from("ejercicios")
        .delete()
        .eq("id", deleteExerciseTarget.id)

      if (error) throw error

      await reloadPRData()
      setDeleteExerciseTarget(null)
    } catch (error) {
      console.error("Error eliminando ejercicio:", error)
      alert(error?.message || "No se pudo eliminar el ejercicio.")
    } finally {
      setExerciseSaving(false)
    }
  }

  function handleSelectExercise(row) {
    setSelectedExerciseId(row.ejercicio_id)
  }

  async function handleSavePR(payload) {
    try {
      setSaving(true)

      await insertPRRecord({
        alumnoId: payload.alumnoId,
        ejercicioId: payload.ejercicioId,
        pesoLibras: payload.total,
        fecha: payload.fecha,
        registradoPor: sessionUserId,
      })

      await reloadPRData({ nextSelectedExerciseId: payload.ejercicioId })
      await loadRanking(payload.ejercicioId)

      setRegisterOpen(false)
    } catch (error) {
      console.error("Error guardando PR:", error)
      alert(error?.message || "No se pudo guardar el PR.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <AdminPrExercisesMobile
        loading={loading}
        stats={managedExerciseStats}
        rows={managedExerciseRows}
        search={exerciseSearch}
        onSearchChange={setExerciseSearch}
        onCreate={openCreateExerciseModal}
        onEdit={openEditExerciseModal}
        onDelete={openDeleteExerciseModal}
        navigate={navigate}
        rolActual={rolActual}
      />

      <div className="hidden overflow-hidden bg-[#05070d] text-white lg:fixed lg:inset-0 lg:z-[80] lg:block">
        <div className="grid h-full grid-cols-[270px_1fr] overflow-hidden">
        <DashboardSidebar navigate={navigate} />

        <main className="phoenix-page min-w-0 overflow-hidden p-5">
          <div className="grid h-full grid-rows-[auto_auto_auto_1fr] gap-4 overflow-hidden">
            <PRHeader onCreate={() => setRegisterOpen(true)} />

            <PRStatsCards stats={stats} loading={loading} />

            <PRFilterBar
              search={search}
              onSearchChange={setSearch}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
              exerciseFilter={exerciseFilter}
              onExerciseFilterChange={setExerciseFilter}
              ejercicios={ejercicios}
            />

            <section className="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
              <ExerciseSummaryTable
                loading={loading}
                rows={filteredExerciseRows}
                selectedExerciseId={selectedExerciseId}
                onSelectExercise={handleSelectExercise}
              />

              <aside className="grid min-h-0 grid-rows-[1fr_auto] gap-4">
                <PRRankingCard
                  ranking={ranking}
                  ejercicioActual={ejercicioActual}
                  sessionUserId={sessionUserId}
                />

                <PRMotivationCard />
              </aside>
            </section>
          </div>
        </main>

        {registerOpen ? (
          <RegisterPRModal
            saving={saving}
            sessionUserId={sessionUserId}
            esAdminOCoach={esAdminOCoach}
            alumnos={alumnos}
            ejercicios={ejercicios}
            ejercicioActual={ejercicioActual}
            onClose={() => !saving && setRegisterOpen(false)}
            onSave={handleSavePR}
          />
        ) : null}
        </div>
      </div>

      {exerciseModalOpen ? (
        <ExerciseNameModal
          mode={exerciseModalMode}
          value={exerciseDraftName}
          saving={exerciseSaving}
          onChange={setExerciseDraftName}
          onClose={() => {
            if (!exerciseSaving) setExerciseModalOpen(false)
          }}
          onSave={handleSaveExercise}
        />
      ) : null}

      {deleteExerciseTarget ? (
        <DeleteExerciseModal
          exercise={deleteExerciseTarget}
          saving={exerciseSaving}
          onClose={() => {
            if (!exerciseSaving) setDeleteExerciseTarget(null)
          }}
          onDelete={handleDeleteExercise}
        />
      ) : null}
    </>
  )
}

function AdminPrExercisesMobile({
  loading,
  stats,
  rows,
  search,
  onSearchChange,
  onCreate,
  onEdit,
  onDelete,
  navigate,
  rolActual,
}) {
  const roleLabel = normalizeRole(rolActual) === "admin" ? "Administrador" : "Coach"

  async function handleLogout() {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Error cerrando sesión:", error)
    } finally {
      window.location.replace("/")
    }
  }

  return (
    <main className="h-[100dvh] w-screen max-w-full overflow-x-hidden overflow-y-auto bg-[#050505] pb-28 text-white lg:hidden">
      <div className="relative min-h-full w-full max-w-full overflow-x-hidden px-3 pt-3">
        <AdminPrBackground />

        <header className="relative z-10 mb-3 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-orange-500/55 bg-orange-500/10 text-sm font-black text-orange-300 shadow-[0_0_24px_rgba(249,115,22,0.22)]">
            PR
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <img
              src={pho3nixLogo}
              alt="PHO3NIX"
              className="h-10 w-10 shrink-0 object-contain drop-shadow-[0_0_20px_rgba(249,115,22,0.35)]"
            />

            <div className="min-w-0">
              <p className="truncate text-2xl font-black tracking-[0.14em] text-white">
                PHO<span className="text-orange-500">3</span>NIX
              </p>
              <p className="truncate text-[9px] font-black uppercase tracking-[0.22em] text-orange-500">
                Functional Fitness
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-500/25 bg-orange-500/10 text-xl text-orange-300"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            ↪
          </button>
        </header>

        <section className="relative z-10 mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
              {roleLabel}
            </p>

            <h1 className="mt-1 text-3xl font-black uppercase leading-none text-white">
              PRs / Ejercicios
            </h1>

            <p className="mt-2 max-w-[270px] text-sm leading-5 text-white/55">
              Administra el catálogo de ejercicios disponibles para los records personales.
            </p>
          </div>

          <button
            type="button"
            onClick={onCreate}
            className="shrink-0 rounded-2xl bg-orange-500 px-3.5 py-3 text-xs font-black uppercase text-black shadow-[0_0_24px_rgba(249,115,22,0.25)]"
          >
            + Agregar
          </button>
        </section>

        <section className="relative z-10 mb-3 grid grid-cols-3 overflow-hidden rounded-[1.25rem] border border-orange-500/20 bg-black/50 shadow-2xl shadow-black/40">
          <AdminPrMetric icon="🏋️" value={loading ? "..." : stats.total} label="Ejercicios" />
          <AdminPrMetric icon="🏆" value={loading ? "..." : stats.withRecords} label="Con PR" />
          <AdminPrMetric icon="○" value={loading ? "..." : stats.withoutRecords} label="Sin PR" />
        </section>

        <section className="relative z-10 mb-3 flex items-center gap-2 rounded-[1.15rem] border border-white/10 bg-black/45 px-3 py-3 shadow-2xl shadow-black/25">
          <span className="text-lg text-white/35">⌕</span>
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar ejercicio..."
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/30"
          />
        </section>

        <section className="relative z-10 mb-4 overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/45 shadow-2xl shadow-black/30">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-white/70">
                Mis ejercicios
              </p>
              <p className="mt-0.5 text-[10px] text-white/35">
                {loading ? "Cargando..." : `${rows.length} ejercicio(s) encontrados`}
              </p>
            </div>

            <span className="rounded-xl border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-[10px] font-black uppercase text-orange-300">
              A-Z
            </span>
          </div>

          {loading ? (
            <AdminPrEmpty text="Cargando ejercicios..." />
          ) : rows.length === 0 ? (
            <AdminPrEmpty text="No hay ejercicios para mostrar." />
          ) : (
            <div className="divide-y divide-white/10">
              {rows.map((row) => (
                <AdminExerciseRow
                  key={row.id}
                  row={row}
                  onEdit={() => onEdit(row)}
                  onDelete={() => onDelete(row)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <AdminMobileNav />
    </main>
  )
}

function AdminPrMetric({ icon, value, label }) {
  return (
    <article className="relative min-w-0 border-r border-white/10 px-2 py-4 text-center last:border-r-0">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-orange-500/35 bg-orange-500/10 text-xl text-orange-300 shadow-[0_0_16px_rgba(249,115,22,0.18)]">
        {icon}
      </div>

      <p className="mt-2 truncate text-2xl font-black leading-none text-white">
        {value}
      </p>

      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.06em] text-white/45">
        {label}
      </p>
    </article>
  )
}

function AdminExerciseRow({ row, onEdit, onDelete }) {
  const hasRecords = Number(row.registros || 0) > 0

  return (
    <article className="grid grid-cols-[58px_minmax(0,1fr)] gap-2.5 px-3 py-3">
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-orange-500/20 bg-orange-500/10">
        <img
          src={getExerciseFigure(row.nombre)}
          alt={row.nombre}
          className="h-full w-full object-cover object-[center_28%]"
          onError={(event) => {
            event.currentTarget.src = "/pr-exercises/default.png"
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
      </div>

      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-black uppercase text-white">
              {row.nombre}
            </p>

            <p className="mt-0.5 truncate text-[11px] font-bold text-white/40">
              1RM · LB · {hasRecords ? `${row.registros} registro(s)` : "Sin registros"}
            </p>
          </div>

          <span
            className={[
              "shrink-0 rounded-xl border px-2 py-1 text-[9px] font-black uppercase",
              hasRecords
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                : "border-white/10 bg-white/[0.04] text-white/40",
            ].join(" ")}
          >
            {hasRecords ? "Con PR" : "Nuevo"}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="h-10 rounded-xl border border-orange-500/25 bg-orange-500/10 text-xs font-black uppercase text-orange-300"
          >
            ✎ Editar
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="h-10 rounded-xl border border-red-500/25 bg-red-500/10 text-xs font-black uppercase text-red-300"
          >
            🗑 Eliminar
          </button>
        </div>
      </div>
    </article>
  )
}

function ExerciseNameModal({
  mode,
  value,
  saving,
  onChange,
  onClose,
  onSave,
}) {
  const isEdit = mode === "edit"

  return (
    <div className="fixed inset-0 z-[260] flex items-center justify-center bg-black/88 p-4 backdrop-blur-2xl">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Cerrar"
      />

      <section className="relative z-10 w-full max-w-md overflow-hidden rounded-[1.6rem] border border-orange-500/25 bg-[#060606] shadow-[0_0_60px_rgba(249,115,22,0.20)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(249,115,22,0.18),transparent_36%)]" />

        <div className="relative z-10 flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-400">
              {isEdit ? "Editar ejercicio" : "Agregar ejercicio"}
            </p>
            <h3 className="mt-1 text-xl font-black text-white">
              {isEdit ? "Actualizar nombre" : "Nuevo ejercicio PR"}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/55 text-xl text-white/70"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="relative z-10 p-4">
          <label className="text-[10px] font-black uppercase tracking-[0.14em] text-white/40">
            Nombre del ejercicio
          </label>

          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            autoFocus
            placeholder="Ej: Back Squat"
            className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/45 px-3 text-sm font-bold text-white outline-none placeholder:text-white/30 focus:border-orange-500/55"
          />

          <p className="mt-3 rounded-xl border border-orange-500/15 bg-orange-500/10 p-3 text-xs leading-5 text-orange-100/70">
            Por ahora tu tabla ejercicios solo tiene el campo nombre. Tipo, unidad y estado se pueden agregar después con una migración.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-11 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-black uppercase text-white/65 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="h-11 rounded-xl bg-orange-500 text-xs font-black uppercase text-black shadow-[0_0_24px_rgba(249,115,22,0.25)] disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

function DeleteExerciseModal({ exercise, saving, onClose, onDelete }) {
  const hasRecords = Number(exercise?.registros || 0) > 0

  return (
    <div className="fixed inset-0 z-[260] flex items-center justify-center bg-black/88 p-4 backdrop-blur-2xl">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Cerrar"
      />

      <section className="relative z-10 w-full max-w-md overflow-hidden rounded-[1.6rem] border border-red-500/25 bg-[#060606] shadow-[0_0_60px_rgba(239,68,68,0.16)]">
        <div className="border-b border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-red-300">
            Eliminar ejercicio
          </p>

          <h3 className="mt-1 text-xl font-black text-white">
            {exercise?.nombre || "Ejercicio"}
          </h3>
        </div>

        <div className="p-4">
          {hasRecords ? (
            <p className="rounded-xl border border-orange-500/20 bg-orange-500/10 p-3 text-sm leading-6 text-orange-100/75">
              Este ejercicio tiene {exercise.registros} PR registrado(s). Para proteger el historial, no se elimina.
            </p>
          ) : (
            <p className="text-sm leading-6 text-white/65">
              Este ejercicio no tiene PR registrados. Puedes eliminarlo sin afectar historial.
            </p>
          )}

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-11 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-black uppercase text-white/65 disabled:opacity-50"
            >
              {hasRecords ? "Entendido" : "Cancelar"}
            </button>

            <button
              type="button"
              onClick={hasRecords ? onClose : onDelete}
              disabled={saving}
              className={[
                "h-11 rounded-xl text-xs font-black uppercase disabled:opacity-50",
                hasRecords
                  ? "border border-orange-500/25 bg-orange-500/10 text-orange-300"
                  : "bg-red-500 text-white shadow-[0_0_24px_rgba(239,68,68,0.20)]",
              ].join(" ")}
            >
              {hasRecords ? "No eliminar" : saving ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

function AdminPrEmpty({ text }) {
  return (
    <div className="m-3 rounded-xl border border-dashed border-white/10 bg-black/25 p-4 text-center text-xs text-white/40">
      {text}
    </div>
  )
}

function AdminPrBackground() {
  return (
    <>
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-orange-600/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-red-600/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />
    </>
  )
}

function ExerciseSummaryTable({
  loading,
  rows,
  selectedExerciseId,
  onSelectExercise,
}) {
  return (
    <section className="phoenix-card grid min-h-0 grid-rows-[auto_1fr] overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <div>
          <h2 className="text-lg font-black uppercase text-white">
            Ejercicios PR
          </h2>

          <p className="mt-1 text-xs text-white/45">
            {loading
              ? "Cargando..."
              : `${rows.length} ejercicio(s) encontrados`}
          </p>
        </div>

        <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-xs font-black uppercase text-orange-300">
          Selecciona un ejercicio
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[360px] items-center justify-center text-sm text-white/50">
          Cargando ejercicios PR...
        </div>
      ) : rows.length === 0 ? (
        <div className="flex min-h-[360px] items-center justify-center text-center text-sm text-white/50">
          No hay ejercicios registrados para este filtro.
        </div>
      ) : (
        <div className="min-h-0 overflow-y-auto overflow-x-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#f97316_#09090b]">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-[#0b0f14] text-xs uppercase tracking-[0.12em] text-white/45">
              <tr>
                <th className="px-4 py-4 text-left">Ejercicio</th>
                <th className="px-4 py-4 text-left">Tipo</th>
                <th className="px-4 py-4 text-left">Marca</th>
                <th className="px-4 py-4 text-left">Anterior</th>
                <th className="px-4 py-4 text-left">Mejora</th>
                <th className="px-4 py-4 text-left">Fecha</th>
                <th className="px-4 py-4 text-right">Estado</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <ExerciseSummaryRow
                  key={row.ejercicio_id}
                  row={row}
                  selected={String(row.ejercicio_id) === String(selectedExerciseId)}
                  onClick={() => onSelectExercise(row)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function ExerciseSummaryRow({ row, selected, onClick }) {
  return (
    <tr
      onClick={onClick}
      className={[
        "cursor-pointer border-b border-white/10 transition hover:bg-orange-500/[0.08]",
        selected ? "bg-orange-500/[0.10]" : "",
      ].join(" ")}
    >
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
<div
  className={[
    "relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-black/50",
    selected
      ? "border-orange-500/55 shadow-[0_0_18px_rgba(249,115,22,0.35)]"
      : "border-white/10",
  ].join(" ")}
>
<img
  src={getExerciseFigure(row.ejercicio)}
  alt={row.ejercicio}
  className="h-full w-full object-cover object-[center_28%]"
  onError={(e) => {
    e.currentTarget.src = "/pr-exercises/default.png"
  }}
/>

  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
</div>

          <div>
            <div className="font-black text-white">
              {row.ejercicio}
            </div>

            <div className="mt-1 text-xs text-white/40">
              {row.tieneRegistro
                ? `Mejor marca: ${row.atletaMarca || "Atleta"}`
                : "Sin registros todavía"}
            </div>
          </div>
        </div>
      </td>

      <td className="px-4 py-4">
        <span className="rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-black text-orange-300">
          {row.tipo || "1RM"}
        </span>
      </td>

      <td className="px-4 py-4">
        {row.marca !== null ? (
          <div>
            <div className="text-2xl font-black text-white">
              {formatWeight(row.marca, row.unidad)}
            </div>

            <div className="mt-1 text-xs text-white/40">
              {row.atletaMarca || "Atleta"}
            </div>
          </div>
        ) : (
          <span className="text-white/35">Sin registro</span>
        )}
      </td>

      <td className="px-4 py-4">
        {row.anterior !== null ? (
          <div>
            <div className="font-black text-white/75">
              {formatWeight(row.anterior, row.unidad)}
            </div>

            <div className="mt-1 text-xs text-white/40">
              {row.atletaAnterior || "Atleta"}
            </div>
          </div>
        ) : (
          <span className="text-white/35">—</span>
        )}
      </td>

      <td className="px-4 py-4">
        {row.mejora !== null && row.mejora > 0 ? (
          <div className="font-black text-green-300">
            +{row.mejora} {row.unidad}
            {row.mejoraPercent !== null ? (
              <div className="mt-1 text-xs">
                +{row.mejoraPercent}%
              </div>
            ) : null}
          </div>
        ) : (
          <span className="text-white/35">—</span>
        )}
      </td>

      <td className="px-4 py-4 text-white/70">
        {row.fecha ? formatDate(row.fecha) : "—"}
      </td>

      <td className="px-4 py-4 text-right">
        {selected ? (
          <span className="rounded-xl border border-orange-500/25 bg-orange-500/10 px-3 py-2 text-xs font-black text-orange-300">
            Activo
          </span>
        ) : (
          <span className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs font-bold text-white/45">
            Ver top 3
          </span>
        )}
      </td>
    </tr>
  )
}

function buildManagedExerciseRows(ejercicios = [], rmRows = [], search = "") {
  const term = String(search || "").trim().toLowerCase()

  return (ejercicios || [])
    .map((ejercicio) => {
      const registros = (rmRows || []).filter((item) => {
        return String(item.ejercicio_id) === String(ejercicio.id)
      })

      return {
        id: ejercicio.id,
        nombre: ejercicio.nombre,
        created_at: ejercicio.created_at,
        registros: registros.length,
      }
    })
    .filter((row) => {
      if (!term) return true
      return String(row.nombre || "").toLowerCase().includes(term)
    })
    .sort((a, b) => {
      return String(a.nombre || "").localeCompare(String(b.nombre || ""), "es")
    })
}

function buildExerciseRows(ejerciciosRows, rmRows) {
  return (ejerciciosRows || []).map((ejercicio) => {
    const registros = (rmRows || [])
      .filter((rm) => String(rm.ejercicio_id) === String(ejercicio.id))
      .sort((a, b) => {
        const pesoDiff = Number(b.peso_libras || 0) - Number(a.peso_libras || 0)
        if (pesoDiff !== 0) return pesoDiff

        const dateA = new Date(`${a.fecha || "1900-01-01"}T00:00:00`).getTime()
        const dateB = new Date(`${b.fecha || "1900-01-01"}T00:00:00`).getTime()
        return dateB - dateA
      })

    const mejor = registros[0] || null
    const anterior = registros[1] || null

    const marca = mejor ? Number(mejor.peso_libras || 0) : null
    const marcaAnterior = anterior ? Number(anterior.peso_libras || 0) : null

    const mejora =
      marca !== null && marcaAnterior !== null ? round(marca - marcaAnterior, 1) : null

    const mejoraPercent =
      marca !== null && marcaAnterior !== null && marcaAnterior > 0
        ? round(((marca - marcaAnterior) / marcaAnterior) * 100, 1)
        : null

    return {
      id: ejercicio.id,
      ejercicio_id: ejercicio.id,
      ejercicio: ejercicio.nombre,

      tipo: "1RM",
      unidad: "lb",

      marca,
      atletaMarca: getAthleteName(mejor),
      fecha: mejor?.fecha || null,

      anterior: marcaAnterior,
      atletaAnterior: getAthleteName(anterior),
      fechaAnterior: anterior?.fecha || null,

      mejora,
      mejoraPercent,

      tieneRegistro: !!mejor,
    }
  })
}

function getAthleteName(row) {
  if (!row) return null

  return (
    row.usuarios?.nombre ||
    row.usuario_nombre ||
    row.nombre_usuario ||
    row.nombre ||
    null
  )
}

function normalizeRole(role) {
  return String(role || "").trim().toLowerCase()
}
