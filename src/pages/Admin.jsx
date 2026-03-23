import { useNavigate } from "react-router-dom"

const adminModules = [
  {
    key: "personas",
    title: "Personas",
    badge: "Usuarios",
    description:
      "Gestiona alumnos, administradores, mensualidades, estados y datos generales del box.",
    to: "/admin/users",
    tone: "orange",
  },
  {
    key: "wods",
    title: "WODs",
    badge: "Programación",
    description:
      "Crea, programa y administra los WODs semanales, además del control de Open Box.",
    to: "/admin/wods",
    tone: "red",
  },
  {
    key: "competencias",
    title: "Competencias",
    badge: "Próximamente",
    description:
      "Administra eventos, competiciones internas, fechas especiales y participación del box.",
    to: null,
    tone: "blue",
  },
  {
    key: "pdas",
    title: "PDAs",
    badge: "Programación",
    description:
      "Crea, programa y administra los PDA de diciembre, junto con su publicación y seguimiento.",
    to: "/admin/pda",
    tone: "purple",
  },
]

export default function Admin() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-white md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-3xl border border-orange-500/20 bg-white/5 p-5 shadow-2xl backdrop-blur-xl">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">
            Admin Center
          </div>

          <h1 className="text-2xl font-black tracking-tight md:text-4xl">
            Panel Administrativo
          </h1>

          <p className="mt-2 text-sm text-slate-300 md:text-base">
            Gestiona los módulos principales del sistema PHO3NIX desde un solo lugar.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {adminModules.map((module) => (
            <button
              key={module.key}
              type="button"
              onClick={() => {
                if (module.to) {
                  navigate(module.to)
                } else {
                  alert("Este módulo aún está en desarrollo.")
                }
              }}
              className="group rounded-3xl border border-white/10 bg-white/5 p-5 text-left shadow-2xl backdrop-blur-xl transition hover:bg-white/[0.07]"
            >
              <div className="flex items-center justify-between gap-3">
                <ModuleBadge tone={module.tone}>{module.badge}</ModuleBadge>

                <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-1 text-[11px] text-white/60">
                  {module.to ? "Disponible" : "En progreso"}
                </div>
              </div>

              <h2 className="mt-5 text-2xl font-black tracking-tight text-white">
                {module.title}
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/65">
                {module.description}
              </p>

              <div className="mt-6 text-sm font-medium text-orange-300 transition group-hover:text-orange-200">
                {module.to ? "Abrir módulo →" : "Disponible próximamente"}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Ranking
            </div>

            <h3 className="mt-4 text-2xl font-black text-white">Registro RM</h3>

            <p className="mt-3 text-sm leading-6 text-white/65">
              Accede al módulo de récords máximos para registrar nuevas marcas,
              consultar rankings y revisar la evolución de los atletas.
            </p>

            <button
              type="button"
              onClick={() => navigate("/registrar-rm")}
              className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/15"
            >
              Ir a RM
            </button>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">
              Estructura
            </div>

            <h3 className="mt-4 text-2xl font-black text-white">
              Administración centralizada
            </h3>

            <p className="mt-3 text-sm leading-6 text-white/65">
              Desde esta pantalla se controlan los módulos que requieren gestión
              administrativa: WODs, Competencias, PDAs y Personas. La vista pública
              de cada módulo se mantiene separada para no mezclar operación con consumo.
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/55">
              Recomendación actual: mantener aquí toda la programación y configuración del sistema.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ModuleBadge({ tone, children }) {
  const styles = {
    orange: "border-orange-400/20 bg-orange-500/10 text-orange-300",
    red: "border-red-400/20 bg-red-500/10 text-red-300",
    blue: "border-blue-400/20 bg-blue-500/10 text-blue-300",
    purple: "border-purple-400/20 bg-purple-500/10 text-purple-300",
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
        styles[tone] || styles.orange
      }`}
    >
      {children}
    </div>
  )
}