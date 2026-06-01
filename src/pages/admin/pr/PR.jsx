// src/pages/admin/pr/pr.jsx

import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import DashboardSidebar from "../dashboard/components/DashboardSidebar"
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
    } else if (!selectedExerciseId && ejerciciosRows?.[0]?.id) {
      setSelectedExerciseId(ejerciciosRows[0].id)
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
    <div className="fixed inset-0 z-[80] overflow-hidden bg-[#05070d] text-white">
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
