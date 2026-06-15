import {
  Alert,
  BackgroundOrbs,
  LoadingState,
  MobileModal,
} from "./AdminNutricionUi"
import {
  AthleteDetailPanel,
  AthleteFullDetail,
  AthletesTableCard,
  HeaderSection,
  MetaDistributionCard,
  ObjectivesSummaryCard,
  StatsGrid,
} from "./AdminNutricionSections"

export default function AdminNutricionDesktop({
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
  onSelectAthlete,
  onOpenDetail,
  onCloseDetail,
}) {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#050505] p-4 text-white">
      <BackgroundOrbs />

      <div className="relative z-10 mx-auto w-full max-w-[1680px]">
        <HeaderSection onReload={onReload} />

        {error ? <div className="mb-4"><Alert text={error} /></div> : null}

        {loading ? (
          <LoadingState text="Cargando panel de nutrición..." />
        ) : (
          <>
            <StatsGrid resumen={data.resumen} utils={utils} />

            <section className="mb-4 grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,2.15fr)]">
              <MetaDistributionCard distribucion={data.distribucionMetas} utils={utils} />
              <ObjectivesSummaryCard objetivos={data.resumenObjetivos} utils={utils} />
            </section>

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
              <AthletesTableCard
                atletas={filteredAthletes}
                filters={filters}
                utils={utils}
                selectedAthlete={selectedAthlete}
                onFilterChange={onFilterChange}
                onResetFilters={onResetFilters}
                onSelectAthlete={onSelectAthlete}
                onOpenDetail={onOpenDetail}
              />

              <AthleteDetailPanel
                athlete={selectedAthlete}
                utils={utils}
                onOpenDetail={onOpenDetail}
              />
            </section>
          </>
        )}
      </div>

      {detailOpen ? (
        <MobileModal title="Análisis completo" onClose={onCloseDetail}>
          <div className="max-h-[75dvh] overflow-y-auto pr-1">
            <AthleteFullDetail athlete={selectedAthlete} utils={utils} />
          </div>
        </MobileModal>
      ) : null}
    </main>
  )
}
