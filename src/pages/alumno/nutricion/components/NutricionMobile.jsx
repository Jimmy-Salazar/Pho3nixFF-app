import pho3nixLogo from "../../../../assets/pho3nix-login-logo.png"
import { supabase } from "../../../../supabase"
import {
  Alert,
  Avatar,
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

export default function NutricionMobile({
  loading,
  usuario,
  initials,
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

  const handleMobileLogout = async () => {
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
        <BackgroundOrbs />

        <header className="relative z-10 mb-3 flex items-center justify-between gap-3 border-b border-white/10 pb-2.5">
          <Avatar
            loading={loading}
            initials={initials}
            fotoUrl={usuario?.foto_url}
            nombre={usuario?.nombre}
          />

          <div className="flex min-w-0 items-center gap-2">
            <img
              src={pho3nixLogo}
              alt="PHO3NIX"
              className="h-8 w-8 shrink-0 object-contain drop-shadow-[0_0_16px_rgba(249,115,22,0.35)]"
            />

            <div className="min-w-0">
              <p className="truncate text-xl font-black tracking-[0.14em] text-white">
                PHO<span className="text-orange-500">3</span>NIX
              </p>
              <p className="truncate text-[8px] font-black uppercase tracking-[0.2em] text-orange-500">
                Functional Fitness
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleMobileLogout}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-orange-500/25 bg-orange-500/10 text-lg text-orange-300"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            ☰
          </button>
        </header>

        <NutricionIntro score={score} />

        <Alert type="error" text={error} />
        <Alert type="success" text={success} />


        <DatosAtletaCard
          usuario={usuario}
          form={form}
          saving={saving}
          analyzing={analyzing}
          onSave={onSave}
        />

        <RangoReferenciaCard referencia={referencia} hasReference={hasReference} />

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

        <RecomendacionIACard
          analisis={ultimoAnalisis}
          metaLabel={metaLabel}
        />

        <EvolucionNutricionCard historial={historial} />

        <HistorialAnalisisCard historial={historial} metasLabels={metasLabels} />
      </div>
    </main>
  )
}
