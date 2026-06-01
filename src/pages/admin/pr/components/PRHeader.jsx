// src/pages/admin/pr/components/PRHeader.jsx

export default function PRHeader({ onCreate }) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-orange-500/20 bg-black/45 p-5 shadow-[0_0_35px_rgba(249,115,22,.14)] backdrop-blur-xl">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
      <div className="absolute right-8 top-1/2 hidden -translate-y-1/2 text-[8rem] leading-none text-orange-500/10 xl:block">
        🏆
      </div>

      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white">PR</h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
            Registra, mejora y supera tus marcas personales.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onCreate}
            className="phoenix-button-primary text-sm uppercase"
          >
            + Registrar PR
          </button>

          <button
            type="button"
            className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white/75 transition hover:border-orange-400/40 hover:text-orange-300"
          >
            ⧉ Filtros
          </button>
        </div>
      </div>
    </section>
  )
}
