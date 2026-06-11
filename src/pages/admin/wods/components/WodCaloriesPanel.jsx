// src/pages/admin/wods/components/WodCaloriesPanel.jsx

import WodIntensityBar from "./WodIntensityBar"

export default function WodCaloriesPanel({ estimate }) {
  const metabolicBlocks = Array.from({ length: 14 }, (_, i) => i + 1)
  const activeBlocks = Math.round((estimate.cargaMetabolica / 100) * 14)

  return (
    <aside className="relative h-full overflow-hidden rounded-[1.1rem] border border-orange-500/30 bg-black/35 p-3 shadow-[0_0_35px_rgba(249,115,22,.15)]">
      <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-orange-500/20 blur-3xl" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-2 flex items-center gap-2">
          <div className="text-xl">🔥</div>
          <h3 className="text-lg font-black uppercase tracking-tight text-orange-400">
            Estimación del WOD
          </h3>
        </div>

        <section className="flex-1 rounded-xl border border-white/10 bg-black/35 p-3">
          <div className="text-[10px] font-black uppercase tracking-[0.12em] text-white/45">
            Calorías estimadas
          </div>

          <div className="mt-1.5 flex items-end gap-1.5">
            <div className="text-3xl font-black leading-none text-orange-400">
              {estimate.caloriasMin} - {estimate.caloriasMax}
            </div>
            <div className="pb-0.5 text-xs font-black text-orange-300">kcal</div>
          </div>

          <p className="mt-1 text-xs text-white/50">
            {estimate.source === "empty" ? "Sin análisis" : "Rango estimado"}
          </p>

          <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-[10px] leading-4 text-white/60">
            ⓘ {estimate.nota}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-white/10 pt-3">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[0.1em] text-white/45">
                Intensidad estimada
              </div>
              <div className="mt-1.5 text-sm font-black text-orange-400">
                {estimate.intensidad}
              </div>
              <div className="mt-1.5 flex gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <span
                    key={i}
                    className={[
                      "h-1.5 w-1.5 rounded-full",
                      i < estimate.intensidadPuntos
                        ? "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,.7)]"
                        : "bg-white/10",
                    ].join(" ")}
                  />
                ))}
              </div>
            </div>

            <div className="border-l border-white/10 pl-3">
              <div className="text-[9px] font-black uppercase tracking-[0.1em] text-white/45">
                Duración estimada
              </div>
              <div className="mt-2 text-sm font-black text-orange-300">
                ◷ {estimate.duracion}
              </div>
            </div>
          </div>

          <div className="mt-3 border-t border-white/10 pt-3">
            <div className="text-[9px] font-black uppercase tracking-[0.1em] text-white/45">
              Carga metabólica
            </div>

            <div className="mt-2 flex gap-1">
              {metabolicBlocks.map((block) => (
                <span
                  key={block}
                  className={[
                    "h-3 flex-1 rounded",
                    block <= activeBlocks
                      ? "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,.45)]"
                      : "bg-white/10",
                  ].join(" ")}
                />
              ))}
            </div>

            <div className="mt-1.5 flex justify-between text-[9px] font-bold uppercase text-white/45">
              <span>Baja</span>
              <span>Máxima</span>
            </div>
          </div>

          <div className="mt-3 border-t border-white/10 pt-3">
            <div className="mb-3 text-[9px] font-black uppercase tracking-[0.1em] text-white/45">
              Distribución del esfuerzo
            </div>

            <WodIntensityBar icon="🏃" label="Cardio" value={estimate.cardio} />
            <WodIntensityBar icon="💪" label="Fuerza" value={estimate.fuerza} />
            <WodIntensityBar icon="⚡" label="Intensidad" value={estimate.intensidadScore} />
          </div>
        </section>

        <section className="mt-2 rounded-xl border border-orange-500/15 bg-orange-500/10 p-2.5">
          <div className="text-[10px] font-black uppercase text-orange-300">
            ☆ Tip PHO3NIX
          </div>
          <p className="mt-1 text-[10px] leading-4 text-white/65">
            {estimate.tip}
          </p>
        </section>
      </div>
    </aside>
  )
}
