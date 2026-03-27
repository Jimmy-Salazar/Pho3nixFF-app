import { Outlet } from "react-router-dom"

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Topbar */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
              🐦‍🔥
            </div>
            <div>
              <p className="text-sm text-slate-300">Pho3nix Fitness</p>
              <p className="text-lg font-bold leading-5">Panel</p>
            </div>
          </div>

          {/* Esto luego lo conectamos a tu Navbar real / AuthContext */}
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">
              admin
            </span>
            <button className="rounded-xl bg-rose-500/80 px-4 py-2 text-sm font-semibold hover:bg-rose-500 transition">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}