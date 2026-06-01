// src/pages/pr/components/PREmptyState.jsx

export default function PREmptyState() {
  return (
    <div className="flex min-h-[340px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-center">
      <div className="text-5xl">🏆</div>
      <h3 className="mt-4 text-xl font-black text-white">Sin PR registrados</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-white/50">
        Cuando registres tus marcas personales, aparecerán aquí con su mejora, historial y ranking.
      </p>
    </div>
  )
}
