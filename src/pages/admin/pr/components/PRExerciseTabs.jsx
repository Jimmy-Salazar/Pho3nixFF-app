// src/pages/admin/pr/components/PRExerciseTabs.jsx

export default function PRExerciseTabs({ ejercicios, activeIndex, onSelect }) {
  return (
    <section className="phoenix-card min-h-[72px] overflow-hidden p-3">
      {ejercicios.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-black/25 p-4 text-sm text-white/50">
          No hay ejercicios registrados en la tabla ejercicios.
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ejercicios.map((ejercicio, index) => (
            <button
              key={ejercicio.id}
              type="button"
              onClick={() => onSelect(index)}
              className={[
                "shrink-0 rounded-full px-4 py-2 text-sm font-black transition",
                index === activeIndex
                  ? "bg-orange-500 text-black shadow-[0_0_18px_rgba(249,115,22,.35)]"
                  : "border border-white/10 bg-white/[0.04] text-white/60 hover:border-orange-400/30 hover:text-orange-300",
              ].join(" ")}
            >
              {ejercicio.nombre}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
