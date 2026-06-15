import { useState } from "react"
import {
  Alert,
  BackgroundOrbs,
  LoadingState,
  MobileModal,
} from "./AdminNutricionUi"
import {
  AthleteFullDetail,
  FiltersBar,
  HeaderSection,
  MetaDistributionCard,
  MobileAthleteList,
  ObjectivesSummaryCard,
  StatsGrid,
} from "./AdminNutricionSections"

export default function AdminNutricionMobile({
  loading,
  error,
  data,
  filters,
  filteredAthletes,
  selectedAthlete,
  detailOpen,
  utils,
  onReload,
  onFilterChange,
  onResetFilters,
  onOpenDetail,
  onCloseDetail,
}) {
  const [view, setView] = useState("general")

  return (
    <main className="relative h-[100dvh] w-screen max-w-full overflow-x-hidden overflow-y-auto bg-[#050505] pb-24 text-white">
      <div className="relative min-h-full w-full max-w-full overflow-x-hidden px-2.5 pt-2.5">
        <BackgroundOrbs />

        <div className="relative z-10">
          <HeaderSection title="Nutrición" subtitle="Vista general" onReload={onReload} compact />

          <div className="mb-2.5 grid grid-cols-2 gap-1.5 rounded-2xl border border-white/10 bg-black/35 p-1">
            <button
              type="button"
              onClick={() => setView("general")}
              className={[
                "h-9 rounded-xl text-[11px] font-black uppercase transition",
                view === "general" ? "bg-orange-500 text-black" : "text-white/55",
              ].join(" ")}
            >
              General
            </button>
            <button
              type="button"
              onClick={() => setView("atletas")}
              className={[
                "h-9 rounded-xl text-[11px] font-black uppercase transition",
                view === "atletas" ? "bg-orange-500 text-black" : "text-white/55",
              ].join(" ")}
            >
              Atletas
            </button>
          </div>

          {error ? <div className="mb-3"><Alert text={error} /></div> : null}

          {loading ? (
            <LoadingState text="Cargando nutrición..." />
          ) : view === "general" ? (
            <div className="space-y-2.5">
              <StatsGrid resumen={data.resumen} utils={utils} />
              <MetaDistributionCard distribucion={data.distribucionMetas} utils={utils} />
              <ObjectivesSummaryCard objetivos={data.resumenObjetivos} utils={utils} />
            </div>
          ) : (
            <div className="space-y-2.5">
              <FiltersBar
                filters={filters}
                onFilterChange={onFilterChange}
                onResetFilters={onResetFilters}
                compact
              />
              <MobileAthleteList
                atletas={filteredAthletes}
                utils={utils}
                onOpenDetail={onOpenDetail}
              />
            </div>
          )}
        </div>
      </div>

      {detailOpen ? (
        <MobileModal title="Detalle del atleta" onClose={onCloseDetail}>
          <div className="max-h-[72dvh] overflow-y-auto pr-1">
            <AthleteFullDetail athlete={selectedAthlete} utils={utils} />
          </div>
        </MobileModal>
      ) : null}
    </main>
  )
}
