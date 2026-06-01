// src/pages/admin/pr/components/PRLoadingState.jsx

export default function PRLoadingState() {
  return (
    <main className="phoenix-page flex min-w-0 items-center justify-center p-5">
      <div className="rounded-[2rem] border border-orange-500/20 bg-black/45 px-8 py-6 text-center shadow-[0_0_35px_rgba(249,115,22,.14)]">
        <div className="text-4xl">🏆</div>
        <div className="mt-3 text-lg font-black text-white">
          Cargando módulo PR...
        </div>
        <div className="mt-2 text-sm text-white/45">
          Leyendo ejercicios, ranking y atletas.
        </div>
      </div>
    </main>
  )
}
