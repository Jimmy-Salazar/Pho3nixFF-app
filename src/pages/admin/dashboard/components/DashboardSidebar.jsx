import { useMemo } from "react"
import { useLocation } from "react-router-dom"
import pho3nixLogo from "../../../../assets/pho3nix-login-logo.png"
import { supabase } from "../../../../supabase"

const MENU_ITEMS = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: "⌂",
    to: "/admin/dashboard",
  },
  {
    key: "alumnos",
    label: "Alumnos",
    icon: "👥",
    to: "/admin/alumnos",
  },
  {
    key: "wods",
    label: "WODs",
    icon: "🏋️",
    to: "/admin/wods",
  },
  {
    key: "nutricion",
    label: "Nutrición",
    icon: "🥗",
    to: "/admin/nutricion",
  },
  {
    key: "anuncios",
    label: "Anuncios",
    icon: "📣",
    to: "/admin/anuncios",
  },
  {
    key: "personalrecord",
    label: "Personal Records",
    icon: "📈",
    to: "/admin/personalrecord",
  },
  {
    key: "challenge",
    label: "Challenge",
    icon: "🔥",
    to: "/admin/challenge",
  },
]

function getActiveKey(pathname) {
  const path = String(pathname || "").toLowerCase()

  if (path === "/admin" || path.startsWith("/admin/dashboard") || path === "/dashboard") {
    return "dashboard"
  }

  if (path.startsWith("/admin/alumnos") || path.startsWith("/admin/users")) {
    return "alumnos"
  }

  if (path.startsWith("/admin/wods")) {
    return "wods"
  }

  if (path.startsWith("/admin/nutricion")) {
    return "nutricion"
  }

  if (path.startsWith("/admin/anuncios")) {
    return "anuncios"
  }

  if (
    path.startsWith("/admin/personalrecord") ||
    path.startsWith("/admin/registrar-rm") ||
    path.startsWith("/registrar-rm") ||
    path.includes("/rm")
  ) {
    return "personalrecord"
  }

  if (path.startsWith("/admin/challenge") || path.startsWith("/challenger")) {
    return "challenge"
  }

  return "dashboard"
}

export default function DashboardSidebar({ navigate }) {
  const location = useLocation()

  const selectedKey = useMemo(() => {
    return getActiveKey(location.pathname)
  }, [location.pathname])

  const activeItem = useMemo(() => {
    return MENU_ITEMS.find((item) => item.key === selectedKey) || MENU_ITEMS[0]
  }, [selectedKey])

  const handleNavigate = (item) => {
    navigate(item.to)
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Error cerrando sesión:", error)
    } finally {
      window.location.replace("/")
    }
  }

  return (
    <aside className="hidden h-full overflow-hidden border-r border-orange-500/15 bg-black/55 px-3 py-4 backdrop-blur-xl lg:flex lg:flex-col">
      <div className="mb-5 flex shrink-0 flex-col items-center text-center">
        <img
          src={pho3nixLogo}
          alt="PHO3NIX"
          className="h-16 w-16 object-contain drop-shadow-[0_0_24px_rgba(249,115,22,0.35)]"
        />

        <div className="mt-2 text-xl font-black tracking-[0.12em] text-white">
          PHO<span className="text-orange-500">3</span>NIX
        </div>

        <div className="mt-1 max-w-[190px] text-[20px] font-bold leading-tight text-white/60">
          Functional Fitness
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        <button
          type="button"
          onClick={() => handleNavigate(activeItem)}
          className="phoenix-sidebar-item phoenix-sidebar-active w-full text-left text-sm font-black"
        >
          <span className="flex h-5 w-5 items-center justify-center text-base">
            {activeItem.icon}
          </span>

          <span className="truncate">
            {activeItem.label}
          </span>
        </button>

        <div className="px-3 pb-1 pt-4 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
          Gestión
        </div>

        {MENU_ITEMS.map((item) => {
          const isActive = item.key === selectedKey

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleNavigate(item)}
              className={[
                "phoenix-sidebar-item w-full text-left text-sm font-bold",
                isActive
                  ? "border border-orange-500/35 bg-orange-500/10 text-orange-300"
                  : "text-white/75",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-5 w-5 shrink-0 items-center justify-center text-base",
                  isActive ? "text-orange-400" : "text-white/55",
                ].join(" ")}
              >
                {item.icon}
              </span>

              <span className="truncate">
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-3 flex w-full shrink-0 items-center gap-3 rounded-xl border border-orange-500/15 bg-black/35 px-4 py-3 text-sm font-semibold text-white/75 transition hover:border-orange-400/30 hover:text-orange-300"
      >
        <span className="flex h-5 w-5 items-center justify-center text-lg">
          ↪
        </span>

        <span className="truncate">
          Cerrar sesión
        </span>
      </button>
    </aside>
  )
}
