// src/pages/admin/wods/components/WodCaloriesPanel.jsx

import WodIntensityBar from "./WodIntensityBar"

export default function WodCaloriesPanel({ estimate }) {
  const metabolicBlocks = Array.from({ length: 14 }, (_, i) => i + 1)
  const activeBlocks = Math.round((estimate.cargaMetabolica / 100) * 14)

  return (
    <aside className="relative h-full overflow-hidden rounded-[1.7rem] border border-orange-500/30 bg-black/35 p-5 shadow-[0_0_35px_rgba(249,115,22,.15)]">
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-3 flex items-center gap-3">
          <div className="text-3xl">🔥</div>
          <h3 className="text-2xl font-black uppercase tracking-tight text-orange-400">
            Estimación del WOD
          </h3>
        </div>

        <section className="flex-1 rounded-2xl border border-white/10 bg-black/35 p-5">
          <div className="text-xs font-black uppercase tracking-[0.14em] text-white/45">
            Calorías estimadas
          </div>

          <div className="mt-2 flex items-end gap-2">
            <div className="text-5xl font-black leading-none text-orange-400">
              {estimate.caloriasMin} - {estimate.caloriasMax}
            </div>
            <div className="pb-1 text-lg font-black text-orange-300">kcal</div>
          </div>

          <p className="mt-2 text-sm text-white/50">
            {estimate.source === "empty" ? "Sin análisis" : "Rango estimado"}
          </p>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-5 text-white/60">
            ⓘ {estimate.nota}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.12em] text-white/45">
                Intensidad estimada
              </div>
              <div className="mt-2 text-lg font-black text-orange-400">
                {estimate.intensidad}
              </div>
              <div className="mt-2 flex gap-1.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <span
                    key={i}
                    className={[
                      "h-2 w-2 rounded-full",
                      i < estimate.intensidadPuntos
                        ? "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,.7)]"
                        : "bg-white/10",
                    ].join(" ")}
                  />
                ))}
              </div>
            </div>

            <div className="border-l border-white/10 pl-4">
              <div className="text-[11px] font-black uppercase tracking-[0.12em] text-white/45">
                Duración estimada
              </div>
              <div className="mt-3 text-lg font-black text-orange-300">
                ◷ {estimate.duracion}
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-white/10 pt-4">
            <div className="text-[11px] font-black uppercase tracking-[0.12em] text-white/45">
              Carga metabólica
            </div>

            <div className="mt-3 flex gap-1.5">
              {metabolicBlocks.map((block) => (
                <span
                  key={block}
                  className={[
                    "h-5 flex-1 rounded-md",
                    block <= activeBlocks
                      ? "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,.45)]"
                      : "bg-white/10",
                  ].join(" ")}
                />
              ))}
            </div>

            <div className="mt-2 flex justify-between text-[10px] font-bold uppercase text-white/45">
              <span>Baja</span>
              <span>Máxima</span>
            </div>
          </div>

          <div className="mt-4 border-t border-white/10 pt-4">
            <div className="mb-3 text-[11px] font-black uppercase tracking-[0.12em] text-white/45">
              Distribución del esfuerzo
            </div>

            <WodIntensityBar icon="🏃" label="Cardio" value={estimate.cardio} />
            <WodIntensityBar icon="💪" label="Fuerza" value={estimate.fuerza} />
            <WodIntensityBar icon="⚡" label="Intensidad" value={estimate.intensidadScore} />
          </div>
        </section>

        <section className="mt-3 rounded-2xl border border-orange-500/15 bg-orange-500/10 p-3">
          <div className="text-xs font-black uppercase text-orange-300">
            ☆ Tip PHO3NIX
          </div>
          <p className="mt-1 text-xs leading-5 text-white/65">
            {estimate.tip}
          </p>
        </section>
      </div>
    </aside>
  )
}
