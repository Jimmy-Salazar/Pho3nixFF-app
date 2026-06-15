import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import DashboardSidebar from "../dashboard/components/DashboardSidebar"
import AdminMobileNav from "../dashboard/mobile/AdminMobileNav"
import {
  adminNutricionUtils,
  fetchAdminNutricionData,
  filtrarAtletas,
} from "./utils/adminNutricionService"

import AdminNutricionDesktop from "./components/AdminNutricionDesktop"
import AdminNutricionMobile from "./components/AdminNutricionMobile"

const DEFAULT_DATA = {
  admin: null,
  atletas: [],
  resumen: null,
  distribucionMetas: [],
  resumenObjetivos: [],
  generadoEn: null,
}

const DEFAULT_FILTERS = {
  search: "",
  meta: "todas",
  estado: "todos",
  score: "todos",
}

export default function AdminNutricion() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [data, setData] = useState(DEFAULT_DATA)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [selectedAthleteId, setSelectedAthleteId] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)

  async function loadData() {
    try {
      setLoading(true)
      setError("")

      const payload = await fetchAdminNutricionData()
      setData(payload)

      const firstWithAnalysis = payload.atletas?.find((item) => item.tiene_analisis)
      const firstAny = payload.atletas?.[0]

      setSelectedAthleteId((current) => current || firstWithAnalysis?.id || firstAny?.id || null)
    } catch (err) {
      console.error("ERROR ADMIN NUTRICIÓN:", err)
      setError(err.message || "No se pudo cargar el panel de nutrición.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredAthletes = useMemo(() => {
    return filtrarAtletas(data.atletas || [], filters)
  }, [data.atletas, filters])

  const selectedAthlete = useMemo(() => {
    return (
      data.atletas.find((item) => item.id === selectedAthleteId) ||
      filteredAthletes[0] ||
      null
    )
  }, [data.atletas, filteredAthletes, selectedAthleteId])

  function updateFilter(key, value) {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS)
  }

  function selectAthlete(athlete) {
    setSelectedAthleteId(athlete?.id || null)
  }

  function openAthleteDetail(athlete) {
    selectAthlete(athlete)
    setDetailOpen(true)
  }

  const commonProps = {
    loading,
    error,
    data,
    filters,
    filteredAthletes,
    selectedAthlete,
    detailOpen,
    utils: adminNutricionUtils,
    onReload: loadData,
    onFilterChange: updateFilter,
    onResetFilters: resetFilters,
    onSelectAthlete: selectAthlete,
    onOpenDetail: openAthleteDetail,
    onCloseDetail: () => setDetailOpen(false),
  }

  return (
    <div className="fixed inset-0 z-[80] w-screen max-w-full overflow-hidden bg-[#050505] text-white">
      <div className="hidden h-full w-full max-w-full overflow-hidden lg:grid lg:grid-cols-[270px_minmax(0,1fr)]">
        <DashboardSidebar navigate={navigate} />

        <main className="min-w-0 w-full max-w-full overflow-x-hidden overflow-y-auto bg-[#050505]">
          <AdminNutricionDesktop {...commonProps} />
        </main>
      </div>

      <div className="block h-full w-full max-w-full overflow-hidden lg:hidden">
        <AdminNutricionMobile {...commonProps} />
      </div>

      <AdminMobileNav />
    </div>
  )
}
