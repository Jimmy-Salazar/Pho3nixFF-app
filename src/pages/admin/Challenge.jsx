import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import DashboardSidebar from "./dashboard/components/DashboardSidebar"

import StatusBadge from "./challenge/components/StatusBadge"
import ChallengeForm from "./challenge/components/ChallengeForm"
import WodManager from "./challenge/components/WodManager"
import CompetitorManager from "./challenge/components/CompetitorManager"
import ResultManager from "./challenge/components/ResultManager"
import RankingPreview from "./challenge/components/RankingPreview"

//import { buildRanking } from "./challenge/utils/ranking"
//import { CATEGORIES } from "./challenge/utils/constants"

import { CATEGORIES } from "./challenge/utils/constants"

import {
  fetchCompetitions,
  fetchChallengeBundle,
  saveCompetition,
  saveWod,
  deleteWod,
  saveCompetitor,
  deleteCompetitor,
  saveResult,
  deleteResult,
} from "./challenge/utils/challengeService"

const MANAGER_TABS = [
  { id: "wods", label: "WODs", icon: "🏋️" },
  { id: "competitors", label: "Atletas", icon: "👥" },
  { id: "results", label: "Scores", icon: "📝" },
  { id: "ranking", label: "Ranking", icon: "🏆" },
]

export default function ChallengeAdmin() {
  const navigate = useNavigate()

  const [competitions, setCompetitions] = useState([])
  const [selectedId, setSelectedId] = useState(null)

	const [bundle, setBundle] = useState({
	  wods: [],
	  competitors: [],
	  results: [],
	  rankingGeneral: [],
	  rankingWodReal: [],
	})

  const [loading, setLoading] = useState(true)
  const [bundleLoading, setBundleLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [challengeFormOpen, setChallengeFormOpen] = useState(false)
  const [editingCompetition, setEditingCompetition] = useState(null)

  const [managerOpen, setManagerOpen] = useState(false)
  const [managerTab, setManagerTab] = useState("wods")

  const selectedCompetition = useMemo(() => {
    return competitions.find((item) => item.id === selectedId) || null
  }, [competitions, selectedId])

  const beginnerWods = useMemo(() => {
    return bundle.wods
      .filter((wod) => wod.nivel === "principiante")
      .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0))
  }, [bundle.wods])

  const advancedWods = useMemo(() => {
    return bundle.wods
      .filter((wod) => wod.nivel === "avanzado")
      .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0))
  }, [bundle.wods])

const rankingCards = useMemo(() => {
  return CATEGORIES.map((category) => ({
    ...category,
    rows: (bundle.rankingGeneral || [])
      .filter((row) => row.categoria === category.value)
      .sort((a, b) => Number(a.position || 0) - Number(b.position || 0)),
  }))
}, [bundle.rankingGeneral])

  const loadCompetitions = useCallback(
    async (preferredId = null) => {
      try {
        setError("")

        const rows = await fetchCompetitions()
        setCompetitions(rows)

        const activeCompetition = rows.find((item) => item.estado === "activa")

        const nextId =
          preferredId ||
          selectedId ||
          activeCompetition?.id ||
          rows[0]?.id ||
          null

        setSelectedId(nextId)
      } catch (err) {
        console.error("Error cargando competencias:", err)
        setError(err.message || "No se pudieron cargar las competencias.")
      } finally {
        setLoading(false)
      }
    },
    [selectedId]
  )

  const refreshBundle = useCallback(async () => {
    if (!selectedId) {
setBundle({
  wods: [],
  competitors: [],
  results: [],
  rankingGeneral: [],
  rankingWodReal: [],
})
      return
    }

    try {
      setBundleLoading(true)
      setError("")

      const data = await fetchChallengeBundle(selectedId)
      setBundle(data)
    } catch (err) {
      console.error("Error cargando datos del challenge:", err)
      setError(err.message || "No se pudo cargar la información del challenge.")
    } finally {
      setBundleLoading(false)
    }
  }, [selectedId])

  useEffect(() => {
    loadCompetitions()
  }, [])

  useEffect(() => {
    refreshBundle()
  }, [refreshBundle])

  const handleSaveCompetition = async (payload, id) => {
    try {
      setSaving(true)
      setError("")

      const saved = await saveCompetition(payload, id)

      setChallengeFormOpen(false)
      setEditingCompetition(null)

      await loadCompetitions(saved.id)
    } catch (err) {
      console.error("Error guardando competencia:", err)
      setError(err.message || "No se pudo guardar la competencia.")
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (nextStatus) => {
    if (!selectedCompetition) return

    try {
      setSaving(true)
      setError("")

      const payload = {
        nombre: selectedCompetition.nombre,
        descripcion: selectedCompetition.descripcion,
        fecha_inicio: selectedCompetition.fecha_inicio,
        fecha_fin: selectedCompetition.fecha_fin,
        flyer_url: selectedCompetition.flyer_url,
        estado: nextStatus,
      }

      await saveCompetition(payload, selectedCompetition.id)
      await loadCompetitions(selectedCompetition.id)
    } catch (err) {
      console.error("Error cambiando estado:", err)
      setError(err.message || "No se pudo cambiar el estado.")
    } finally {
      setSaving(false)
    }
  }

  const runAndReload = async (action) => {
    try {
      setSaving(true)
      setError("")

      await action()
      await refreshBundle()
    } catch (err) {
      console.error("Error guardando cambios:", err)
      setError(err.message || "Ocurrió un error guardando los cambios.")
    } finally {
      setSaving(false)
    }
  }

  const openNewCompetition = () => {
    setEditingCompetition(null)
    setChallengeFormOpen(true)
  }

  const openEditCompetition = () => {
    if (!selectedCompetition) return
    setEditingCompetition(selectedCompetition)
    setChallengeFormOpen(true)
  }

  const openManager = (tab = "wods") => {
    setManagerTab(tab)
    setManagerOpen(true)
  }

  if (loading) {
    return (
      <ChallengeAdminShell navigate={navigate}>
        <div className="flex h-full items-center justify-center p-6">
          <div className="rounded-[2rem] border border-orange-500/25 bg-white/[0.04] px-8 py-6 text-sm font-bold text-orange-200 shadow-2xl shadow-orange-950/30">
            Cargando PHO3NIX Challenge...
          </div>
        </div>
      </ChallengeAdminShell>
    )
  }

  return (
    <ChallengeAdminShell navigate={navigate}>
      <section className="relative flex min-h-dvh flex-col overflow-y-auto bg-[#030405] p-3 text-white lg:h-dvh lg:overflow-hidden lg:p-4">
        <div className="pointer-events-none absolute -left-28 top-0 h-80 w-80 rounded-full bg-orange-600/20 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-red-700/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />

        <div className="relative flex min-h-0 flex-1 flex-col gap-3">
          <MobileAdminBar navigate={navigate} />

          {error ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <section className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[0.72fr_1.05fr_0.86fr]">
            <ChallengeIntroPanel
              competitions={competitions}
              selectedId={selectedId}
              selectedCompetition={selectedCompetition}
              saving={saving}
              onSelect={setSelectedId}
              onCreate={openNewCompetition}
              onEdit={openEditCompetition}
              onActivate={() => handleStatusChange("activa")}
              onClose={() => handleStatusChange("cerrada")}
            />

            <ChallengeVisualPanel selectedCompetition={selectedCompetition} />

            <WodPreviewPanel
              beginnerWods={beginnerWods}
              advancedWods={advancedWods}
              loading={bundleLoading}
              onOpen={() => openManager("wods")}
            />
          </section>

          <RankingBoard
            rankingCards={rankingCards}
            loading={bundleLoading}
            onOpen={() => openManager("ranking")}
          />

          <footer className="hidden shrink-0 items-center justify-between px-6 py-1 text-[11px] font-black uppercase tracking-[0.45em] text-white/45 lg:flex">
            <span>Entrena. Compite. Supérate.</span>
            <span className="text-orange-500">Sé Fénix.</span>
            <span className="tracking-[0.18em] text-orange-500">#WEAREPHO3NIX</span>
          </footer>
        </div>
      </section>

      <ChallengeForm
        open={challengeFormOpen}
        saving={saving}
        initialData={editingCompetition}
        onClose={() => {
          setChallengeFormOpen(false)
          setEditingCompetition(null)
        }}
        onSave={handleSaveCompetition}
      />

      {managerOpen ? (
        <ChallengeManagerModal
          activeTab={managerTab}
          setActiveTab={setManagerTab}
          onClose={() => setManagerOpen(false)}
          selectedCompetition={selectedCompetition}
          bundle={bundle}
          saving={saving}
          runAndReload={runAndReload}
        />
      ) : null}
    </ChallengeAdminShell>
  )
}

function ChallengeAdminShell({ navigate, children }) {
  return (
    <div className="fixed inset-0 z-[80] overflow-hidden bg-[#05070d] text-white">
      <div className="grid h-full grid-cols-1 overflow-hidden lg:grid-cols-[270px_1fr]">
        <DashboardSidebar navigate={navigate} />

        <main className="min-w-0 overflow-hidden bg-[#050505]">
          {children}
        </main>
      </div>
    </div>
  )
}

function MobileAdminBar({ navigate }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-orange-500/20 bg-black/60 px-4 py-3 lg:hidden">
      <div>
        <div className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
          PHO3NIX
        </div>
        <div className="text-sm font-black text-white">Challenge</div>
      </div>

      <select
        onChange={(e) => navigate(e.target.value)}
        value="/admin/challenge"
        className="rounded-xl border border-white/10 bg-black px-3 py-2 text-xs font-bold text-white outline-none"
      >
        <option value="/admin/dashboard">Dashboard</option>
        <option value="/admin/alumnos">Alumnos</option>
        <option value="/admin/wods">WODs</option>
        <option value="/admin/anuncios">Anuncios</option>
        <option value="/admin/personalrecord">Personal Records</option>
        <option value="/admin/challenge">Challenge</option>
      </select>
    </div>
  )
}

function ChallengeIntroPanel({
  competitions,
  selectedId,
  selectedCompetition,
  saving,
  onSelect,
  onCreate,
  onEdit,
  onActivate,
  onClose,
}) {
  const dateText = getDateRangeText(selectedCompetition)

  return (
    <article className="relative min-h-[420px] overflow-hidden rounded-[2rem] border border-white/10 bg-black/55 p-5 shadow-2xl shadow-black/40 lg:min-h-0">
      <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-orange-500/15 blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.07),transparent_42%)]" />

      <div className="relative flex h-full flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-500">
                PHO3NIX
              </p>
              <h1 className="mt-4 text-5xl font-black uppercase leading-[0.86] tracking-tight sm:text-6xl lg:text-7xl">
                <span className="block text-white">25.6</span>
                <span className="block text-orange-500">Challenge</span>
              </h1>
            </div>

            {selectedCompetition ? (
              <StatusBadge status={selectedCompetition.estado} />
            ) : null}
          </div>

          <p className="mt-5 max-w-sm text-sm font-semibold uppercase leading-6 tracking-[0.08em] text-white/70">
            Supera tus límites. Demuestra tu Fénix.
          </p>

          <div className="mt-6 space-y-3 text-sm font-bold text-white/65">
            <InfoLine icon="📅" text={dateText} />
            <InfoLine icon="👥" text="4 categorías" />
            <InfoLine icon="🏆" text="Un solo ranking por categoría" />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
              Challenge activo
            </label>

            <select
              value={selectedId || ""}
              onChange={(e) => onSelect(e.target.value || null)}
              className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-orange-500/60"
            >
              <option value="">Sin competencia</option>
              {competitions.map((competition) => (
                <option key={competition.id} value={competition.id}>
                  {competition.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onCreate}
              className="rounded-2xl bg-orange-500 px-4 py-3 text-xs font-black uppercase text-black transition hover:bg-orange-400"
            >
              Nueva
            </button>

            <button
              type="button"
              onClick={onEdit}
              disabled={!selectedCompetition}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-black uppercase text-white/80 transition hover:border-orange-500/40 hover:text-orange-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Editar
            </button>
          </div>

          {selectedCompetition ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={onActivate}
                className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-xs font-black uppercase text-emerald-300 transition hover:bg-emerald-500/15 disabled:opacity-50"
              >
                Activar
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={onClose}
                className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs font-black uppercase text-red-300 transition hover:bg-red-500/15 disabled:opacity-50"
              >
                Cerrar
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}

function ChallengeVisualPanel({ selectedCompetition }) {
  const visualUrl = selectedCompetition?.flyer_url || "/images/fondochallenge.png"

  return (
    <article className="relative min-h-[420px] overflow-hidden rounded-[2rem] border border-white/10 bg-black/50 shadow-2xl shadow-orange-950/20 lg:min-h-0">
      <img
        src={visualUrl}
        alt={selectedCompetition?.nombre || "PHO3NIX Challenge"}
        className="absolute inset-0 h-full w-full object-cover object-center opacity-95"
        onError={(e) => {
          e.currentTarget.src = "/images/fondochallenge.png"
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_85%,rgba(249,115,22,0.24),transparent_28%)]" />

      <div className="absolute bottom-5 left-5 right-5 rounded-[1.6rem] border border-orange-500/20 bg-black/55 p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-400">
              Current Arena
            </p>

            <h2 className="mt-1 truncate text-xl font-black uppercase text-white">
              {selectedCompetition?.nombre || "PHO3NIX Challenge"}
            </h2>
          </div>

          <div className="hidden rounded-2xl border border-orange-500/25 bg-orange-500/10 px-4 py-3 text-sm font-black uppercase text-orange-300 sm:block">
            Sé Fénix
          </div>
        </div>
      </div>
    </article>
  )
}

function WodPreviewPanel({ beginnerWods, advancedWods, loading, onOpen }) {
  return (
    <article className="min-h-[420px] overflow-hidden rounded-[2rem] border border-white/10 bg-black/55 shadow-2xl shadow-black/40 lg:min-h-0">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl text-orange-500">🏋️</span>
          <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-white">
            WODs
          </h2>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="rounded-xl border border-orange-500/30 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-orange-300 transition hover:bg-orange-500/10"
        >
          Gestionar
        </button>
      </div>

      <div className="grid h-[calc(100%-73px)] min-h-0 gap-3 p-4 sm:grid-cols-2">
        <WodLevelColumn
          title="Principiante"
          subtitle="Enfoque: técnica y resistencia"
          icon="🚶"
          wods={beginnerWods}
          loading={loading}
          onOpen={onOpen}
        />

        <WodLevelColumn
          title="Avanzado"
          subtitle="Enfoque: fuerza y rendimiento"
          icon="🏃"
          wods={advancedWods}
          loading={loading}
          onOpen={onOpen}
        />
      </div>
    </article>
  )
}

function WodLevelColumn({ title, subtitle, icon, wods, loading, onOpen }) {
  const visibleWods = wods.slice(0, 3)

  return (
    <section className="flex min-h-0 flex-col rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-3">
      <div className="mb-3 flex items-start gap-3">
        <span className="text-2xl text-orange-500">{icon}</span>
        <div>
          <h3 className="text-lg font-black uppercase text-orange-500">
            {title}
          </h3>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white/40">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-hidden">
        {loading ? (
          <MiniEmpty text="Cargando WODs..." />
        ) : visibleWods.length ? (
          visibleWods.map((wod, index) => (
            <WodMiniCard key={wod.id} wod={wod} index={index} />
          ))
        ) : (
          <MiniEmpty text="Sin WODs registrados." />
        )}
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="mt-3 flex w-full items-center justify-between rounded-xl border border-orange-500/35 px-4 py-2.5 text-xs font-black uppercase text-orange-400 transition hover:bg-orange-500/10"
      >
        Ver todos los WODs
        <span>→</span>
      </button>
    </section>
  )
}

function WodMiniCard({ wod, index }) {
  const icon = index === 0 ? "⏱️" : index === 1 ? "8" : "🏋️"

  return (
    <article className="grid grid-cols-[1fr_58px] gap-3 rounded-xl border border-white/10 bg-black/35 p-3">
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-500">
          WOD {wod.orden || index + 1}
        </p>

        <h4 className="mt-1 truncate text-sm font-black uppercase text-white">
          {wod.nombre || "WOD Challenge"}
        </h4>

        <p className="mt-1 truncate text-xs font-semibold uppercase text-white/45">
          {wod.time_cap || (wod.scoring === "time" ? "Por tiempo" : "Max reps")}
        </p>
      </div>

      <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-2xl font-black text-orange-500">
        {icon}
      </div>
    </article>
  )
}

function RankingBoard({ rankingCards, loading, onOpen }) {
  return (
    <section className="min-h-[310px] shrink-0 overflow-hidden rounded-[2rem] border border-white/10 bg-black/55 shadow-2xl shadow-black/40 lg:h-[34vh] lg:min-h-0">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl text-orange-500">🏆</span>
          <div>
            <h2 className="text-xl font-black uppercase tracking-[0.12em] text-white">
              Ranking General
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
              Actualizado en tiempo real
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="hidden rounded-xl border border-orange-500/35 px-5 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-orange-400 transition hover:bg-orange-500/10 sm:flex sm:items-center sm:gap-4"
        >
          Ver ranking completo
          <span>→</span>
        </button>
      </div>

      <div className="challenge-scrollbar flex h-[calc(100%-73px)] gap-3 overflow-x-auto p-4 lg:grid lg:grid-cols-4 lg:overflow-hidden">
        {rankingCards.map((category) => (
          <RankingCategoryCard
            key={category.value}
            title={category.label}
            rows={category.rows}
            loading={loading}
            onOpen={onOpen}
          />
        ))}
      </div>
    </section>
  )
}

function RankingCategoryCard({ title, rows, loading, onOpen }) {
  const visibleRows = rows.slice(0, 3)

  return (
    <article className="flex min-w-[280px] flex-col rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-3 lg:min-w-0">
      <h3 className="mb-3 text-center text-sm font-black uppercase tracking-[0.08em] text-orange-500">
        {title}
      </h3>

      <div className="min-h-0 flex-1 space-y-2">
        {loading ? (
          <MiniEmpty text="Cargando..." />
        ) : visibleRows.length ? (
          visibleRows.map((row) => (
            <RankingMiniRow key={row.id} row={row} />
          ))
        ) : (
          <MiniEmpty text="Sin atletas con score." />
        )}
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="mt-3 text-xs font-black uppercase text-orange-500 transition hover:text-orange-300"
      >
        Ver todos →
      </button>
    </article>
  )
}

function RankingMiniRow({ row }) {
  return (
    <div className="grid grid-cols-[38px_34px_1fr_auto] items-center gap-2 rounded-xl border border-white/10 bg-black/35 p-2">
      <PositionBadge number={row.position} />

      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-orange-500/20 bg-orange-500/10 text-xs font-black uppercase text-orange-300">
        {getInitials(row.nombre)}
      </div>

      <div className="min-w-0">
        <p className="truncate text-xs font-bold uppercase text-white">
          {row.nombre}
        </p>
      </div>

      <p className="text-sm font-black text-orange-500">
        {row.total}
      </p>
    </div>
  )
}

function PositionBadge({ number }) {
  const className =
    number === 1
      ? "bg-yellow-500 text-black"
      : number === 2
      ? "bg-zinc-300 text-black"
      : number === 3
      ? "bg-orange-800 text-white"
      : "bg-white/10 text-white/60"

  return (
    <div className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-black ${className}`}>
      {number}
    </div>
  )
}

function ChallengeManagerModal({
  activeTab,
  setActiveTab,
  onClose,
  selectedCompetition,
  bundle,
  saving,
  runAndReload,
}) {
  return (
    <div className="fixed inset-0 z-[220] bg-black/80 p-3 backdrop-blur-xl sm:p-5">
      <div className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-[2rem] border border-orange-500/25 bg-[#07090d] shadow-2xl shadow-orange-950/40">
        <header className="flex shrink-0 flex-col gap-3 border-b border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-500">
              Gestión Challenge
            </p>
            <h2 className="mt-1 text-xl font-black uppercase text-white">
              {selectedCompetition?.nombre || "PHO3NIX Challenge"}
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {MANAGER_TABS.map((tab) => (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "rounded-xl px-3 py-2 text-xs font-black uppercase transition",
                  activeTab === tab.id
                    ? "bg-orange-500 text-black"
                    : "border border-white/10 text-white/55 hover:border-orange-500/40 hover:text-orange-300",
                ].join(" ")}
              >
                {tab.icon} {tab.label}
              </button>
            ))}

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-red-500/30 px-3 py-2 text-xs font-black uppercase text-red-300 transition hover:bg-red-500/10"
            >
              Cerrar
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === "wods" ? (
            <WodManager
              wods={bundle.wods}
              saving={saving}
              onSave={(payload, id) =>
                runAndReload(() =>
                  saveWod(
                    {
                      ...payload,
                      competencia_id: selectedCompetition.id,
                    },
                    id
                  )
                )
              }
              onDelete={(id) => runAndReload(() => deleteWod(id))}
            />
          ) : null}

          {activeTab === "competitors" ? (
            <CompetitorManager
              competitors={bundle.competitors}
              saving={saving}
              onSave={(payload, id) =>
                runAndReload(() =>
                  saveCompetitor(
                    {
                      ...payload,
                      competencia_id: selectedCompetition.id,
                    },
                    id
                  )
                )
              }
              onDelete={(id) => runAndReload(() => deleteCompetitor(id))}
            />
          ) : null}

          {activeTab === "results" ? (
            <ResultManager
              wods={bundle.wods}
              competitors={bundle.competitors}
              results={bundle.results}
              saving={saving}
              onSave={(payload, id) =>
                runAndReload(() =>
                  saveResult(
                    {
                      ...payload,
                      competencia_id: selectedCompetition.id,
                    },
                    id
                  )
                )
              }
              onDelete={(id) => runAndReload(() => deleteResult(id))}
            />
          ) : null}

{activeTab === "ranking" ? (
  <RankingPreview
    wods={bundle.wods}
    competitors={bundle.competitors}
    results={bundle.results}
    rankingGeneral={bundle.rankingGeneral}
    rankingWodReal={bundle.rankingWodReal}
  />
) : null}
        </div>
      </div>
    </div>
  )
}

function InfoLine({ icon, text }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-orange-500">{icon}</span>
      <span>{text}</span>
    </div>
  )
}

function MiniEmpty({ text }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-black/25 p-3 text-xs font-semibold text-white/35">
      {text}
    </div>
  )
}

function getDateRangeText(competition) {
  if (!competition) return "Fecha por definir"

  const start = formatDateShort(competition.fecha_inicio)
  const end = formatDateShort(competition.fecha_fin)

  if (start && end) return `${start} - ${end}`
  if (start) return `Desde ${start}`
  if (end) return `Hasta ${end}`

  return "Fecha por definir"
}

function formatDateShort(value) {
  if (!value) return ""

  try {
    const date = new Date(`${value}T00:00:00`)
    return new Intl.DateTimeFormat("es-EC", {
      day: "2-digit",
      month: "short",
    })
      .format(date)
      .replace(".", "")
      .toUpperCase()
  } catch {
    return String(value)
  }
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