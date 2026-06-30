import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import AlumnoSidebar from "../dashboard/components/AlumnoSidebar"
import AlumnoMobileNav from "../shared/AlumnoMobileNav"

import WodAlumnoHeader from "./components/WodAlumnoHeader"
import WodTodayPanel from "./components/WodTodayPanel"
import WodCaloriesCard from "./components/WodCaloriesCard"
import WeeklyCaloriesCard from "./components/WeeklyCaloriesCard"
import WodHistoryDay from "./components/WodHistoryDay"
import RegisterResultPanel from "./components/RegisterResultPanel"
import PreviousWodsPanel from "./components/PreviousWodsPanel"
import RecentResultsPanel from "./components/RecentResultsPanel"
import WodAlumnoMobilePro from "./mobile/WodAlumnoMobilePro"

import {
  fetchAlumnoWodData,
  saveAlumnoWodResult,
} from "./utils/wodAlumnoService"

import {
  buildDefaultMembership,
  getInitials,
  getMembershipLabel,
} from "./utils/wodAlumnoUtils"

const initialState = {
  profile: null,
  membership: buildDefaultMembership(),
  todayWod: null,
  previousWods: [],
  dayHistory: [],
  recentResults: [],
  weeklyCalories: {
    total: 0,
    target: 6000,
    days: [],
  },
  estimatedCalories: {
    value: 0,
    min: 0,
    max: 0,
    source: "Estimación local",
    notes: [],
  },
}

export default function WodsAlumno() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [data, setData] = useState(initialState)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      const payload = await fetchAlumnoWodData()

      setData({
        ...initialState,
        ...payload,
      })
    } catch (err) {
      console.error("ERROR WODS ALUMNO:", err)
      setError(err.message || "No se pudo cargar la pantalla de WODs.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const profileName = data.profile?.nombre || "Alumno PHO3NIX"
  const initials = getInitials(profileName)

  const membership = useMemo(() => {
    return getMembershipLabel(data.membership)
  }, [data.membership])

  const handleSaveResult = async (formPayload) => {
    const selectedWod =
      formPayload?.__selectedWod ||
      formPayload?.wodSeleccionado ||
      formPayload?.selectedWod ||
      null

    const effectiveWod = selectedWod?.id ? selectedWod : data.todayWod

    if (!effectiveWod?.id) {
      setError("No se pudo identificar el WOD seleccionado para registrar resultado.")
      return
    }

    try {
      setSaving(true)
      setError("")

      await saveAlumnoWodResult({
        wod: effectiveWod,
        result: formPayload,
        estimatedCalories: getWodMaxCalories(effectiveWod, data.estimatedCalories),
      })

      await loadData()
    } catch (err) {
      console.error("Error guardando resultado del WOD:", err)
      setError(err.message || "No se pudo guardar tu resultado.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] w-screen max-w-full overflow-hidden bg-[#050505] text-white">
      {/* MOBILE NUEVO: solo cambia el frontend móvil. La lógica y el menú inferior se mantienen. */}
      <div className="lg:hidden">
        <WodAlumnoMobilePro
          data={data}
          loading={loading}
          saving={saving}
          error={error}
          initials={initials}
          onBack={() => navigate("/alumno/dashboard")}
          onSaveResult={handleSaveResult}
        />
      </div>

      {/* DESKTOP ACTUAL: se mantiene intacto visualmente en pantallas lg+. */}
      <div className="hidden h-full w-full max-w-full grid-cols-[270px_minmax(0,1fr)] overflow-hidden lg:grid">
        <AlumnoSidebar navigate={navigate} membership={membership} />

        <main className="min-w-0 w-full max-w-full overflow-x-hidden overflow-y-auto bg-[#050505] lg:overflow-hidden">
          <section className="relative min-h-dvh w-full max-w-full overflow-x-hidden p-3 pb-28 sm:p-4 sm:pb-28 lg:h-dvh lg:overflow-hidden lg:p-4">
            <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-orange-600/20 blur-3xl" />
            <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-red-600/10 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />

            <div className="relative mx-auto flex min-h-dvh w-full max-w-[1680px] flex-col gap-3 overflow-x-hidden lg:h-full lg:min-h-0 lg:overflow-hidden">
              <div className="hidden min-w-0 w-full max-w-full lg:block">
                <WodAlumnoHeader
                  loading={loading}
                  profile={data.profile}
                  initials={initials}
                  membership={membership}
                />
              </div>

              {error ? (
                <div className="shrink-0 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <div className="grid min-h-0 min-w-0 w-full max-w-full flex-1 gap-3 overflow-x-hidden xl:grid-cols-[minmax(0,1fr)_430px]">
                <section className="grid min-h-0 min-w-0 w-full max-w-full gap-3 overflow-x-hidden xl:grid-rows-[auto_auto_1fr]">
                  <WodTodayPanel
                    wod={data.todayWod}
                    loading={loading}
                    onBack={() => navigate("/alumno/dashboard")}
                  />

                  <div className="grid min-h-0 min-w-0 w-full max-w-full gap-3 overflow-x-hidden xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                    <WodHistoryDay
                      rows={data.dayHistory}
                      loading={loading}
                      currentUserId={data.profile?.id}
                    />

                    <RegisterResultPanel
                      wod={data.todayWod}
                      saving={saving}
                      loading={loading}
                      onSave={handleSaveResult}
                    />
                  </div>

                  <PreviousWodsPanel
                    items={data.previousWods}
                    loading={loading}
                  />
                </section>

                <aside className="grid min-h-0 min-w-0 w-full max-w-full gap-3 overflow-x-hidden md:grid-cols-2 xl:grid-cols-1 xl:grid-rows-3">
                  <WodCaloriesCard
                    calories={data.estimatedCalories}
                    loading={loading}
                  />

                  <WeeklyCaloriesCard
                    data={data.weeklyCalories}
                    loading={loading}
                  />

                  <RecentResultsPanel
                    items={data.recentResults}
                    loading={loading}
                  />
                </aside>
              </div>
            </div>
          </section>
        </main>
      </div>

      <AlumnoMobileNav />
    </div>
  )
}

function getWodMaxCalories(wod, estimatedCalories) {
  const maxCalories = Number(wod?.calorias_max || 0)

  if (maxCalories > 0) {
    return maxCalories
  }

  const directValue =
    wod?.calorias_wod ??
    wod?.calorias ??
    wod?.calorias_estimadas ??
    wod?.calorias_estimada ??
    wod?.kcal ??
    null

  if (directValue !== null && directValue !== undefined && Number(directValue) > 0) {
    return Number(directValue)
  }

  return Number(estimatedCalories?.value || 0)
}

