import {
  Alert,
  BackgroundOrbs,
  GoalSelector,
} from "./NutricionUi"
import {
  AnalisisMensualCard,
  DatosAtletaCard,
  NutricionIntro,
  EvolucionNutricionCard,
  HistorialAnalisisCard,
  RangoReferenciaCard,
  RecomendacionIACard,
  Resumen30DiasCard,
} from "./NutricionSections"

export default function NutricionDesktop({
  loading,
  usuario,
  form,
  referencia,
  hasReference,
  resumenWods,
  resumenPrs,
  historial,
  ultimoAnalisis,
  puedeAnalizar,
  diasParaAnalizar,
  proximoAnalisis,
  error,
  success,
  saving,
  analyzing,
  metasLabels,
  onChange,
  onSave,
  onAnalizar,
}) {
  const score = ultimoAnalisis?.score_pho3nix || "--"
  const metaBloqueada = !puedeAnalizar && !!ultimoAnalisis?.meta
  const metaActiva = metaBloqueada ? ultimoAnalisis.meta : form.meta
  const metaLabel = metasLabels?.[metaActiva] || "Objetivo nutricional"

  return (
    <main className="phoenix-nutrition-desktop min-w-0 w-full max-w-full overflow-x-hidden overflow-y-auto bg-[#050505] lg:overflow-hidden">
      <section className="relative min-h-dvh w-full max-w-full overflow-x-hidden p-3 pb-28 sm:p-4 sm:pb-28 lg:h-dvh lg:overflow-hidden lg:p-4">
        <BackgroundOrbs />

        <div className="relative mx-auto flex min-h-dvh w-full max-w-[1680px] flex-col gap-3 overflow-x-hidden lg:h-full lg:min-h-0 lg:overflow-hidden">


          <NutricionIntro score={score} />

          <Alert type="error" text={error} />
          <Alert type="success" text={success} />

          <div className="grid min-h-0 min-w-0 w-full max-w-full flex-1 gap-3 overflow-x-hidden xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <section className="min-h-0 overflow-y-auto pr-1">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                <DatosAtletaCard
                  usuario={usuario}
                  form={form}
                  saving={saving}
                  analyzing={analyzing}
                  onSave={onSave}
                />

                <RangoReferenciaCard referencia={referencia} hasReference={hasReference} />
              </div>

              <GoalSelector
                meta={metaActiva}
                locked={metaBloqueada}
                diasParaAnalizar={diasParaAnalizar}
                proximoAnalisis={proximoAnalisis}
                onChange={(value) => onChange("meta", value)}
              />

              <Resumen30DiasCard resumenWods={resumenWods} resumenPrs={resumenPrs} />

              <AnalisisMensualCard
                ultimoAnalisis={ultimoAnalisis}
                puedeAnalizar={puedeAnalizar}
                diasParaAnalizar={diasParaAnalizar}
                proximoAnalisis={proximoAnalisis}
                analyzing={analyzing}
                saving={saving}
                onAnalizar={onAnalizar}
              />
            </section>

            <section className="min-h-0 overflow-y-auto pr-1">
              <RecomendacionIACard analisis={ultimoAnalisis} metaLabel={metaLabel} />

              <div className="grid gap-3 xl:grid-cols-2">
                <EvolucionNutricionCard historial={historial} />
                <HistorialAnalisisCard historial={historial} metasLabels={metasLabels} />
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  )
}
