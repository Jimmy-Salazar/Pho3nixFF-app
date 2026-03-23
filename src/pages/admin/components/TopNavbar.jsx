import { NavLink } from "react-router-dom"

const linkBase =
  "px-4 py-2 rounded-xl text-sm font-medium transition backdrop-blur border border-white/10"
const linkInactive = "text-slate-300 hover:text-white hover:bg-white/5"
const linkActive = "text-white bg-white/10"

export default function TopNavbar() {
  return (
    <header className="w-full">
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          {/* Brand */}
          <div className="flex items-center gap-3 min-w-[160px]">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-fuchsia-500/80 to-sky-500/80 grid place-items-center shadow-[0_0_26px_rgba(236,72,153,0.18)] border border-white/10">
              <span className="text-lg">🐦‍🔥</span>
            </div>
            <div className="leading-tight">
              <div className="font-semibold text-white">Pho3nix</div>
              <div className="text-xs text-slate-300">Fitness</div>
            </div>
          </div>

          {/* Tabs */}
          <nav className="hidden md:flex items-center gap-2">
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              Usuarios
            </NavLink>

            <NavLink
              to="/admin/wods"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              WODs
            </NavLink>

            <NavLink
              to="/admin/competitions"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              Competencias
            </NavLink>

            <NavLink
              to="/admin/alerts"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              Alertas
            </NavLink>

            <NavLink
              to="/admin/pdas"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              PDAs
            </NavLink>
          </nav>

          {/* Mobile hint */}
          <div className="md:hidden text-xs text-slate-300">
            Menú en AdminLayout
          </div>
        </div>
      </div>
    </header>
  )
}