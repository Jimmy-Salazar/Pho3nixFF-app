import { useMemo } from "react"
import { useLocation } from "react-router-dom"
import pho3nixLogo from "../../../../assets/pho3nix-login-logo.png"
import { supabase } from "../../../../supabase"

const MENU_ITEMS = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: "⌂",
    to: "/alumno/dashboard",
  },
  {
    key: "wods",
    label: "WODs",
    icon: "🏋️",
    to: "/alumno/wods",
  },
  {
    key: "personalrecord",
    label: "Personal Records",
    icon: "📈",
    to: "/alumno/personalrecord",
  },
  {
    key: "challenge",
    label: "Challenge",
    icon: "🏆",
    to: "/competencias",
  },
  {
    key: "perfil",
    label: "Perfil",
    icon: "👤",
    to: "/alumno/perfil",
  },
]

function getActiveKey(pathname) {
  const path = String(pathname || "").toLowerCase()

  if (path.startsWith("/alumno/dashboard") || path === "/dashboard") {
    return "dashboard"
  }

  if (path.startsWith("/alumno/wods") || path.startsWith("/wods")) {
    return "wods"
  }

  if (
    path.startsWith("/alumno/personalrecord") ||
    path.startsWith("/alumno/personalrecords") ||
    path.startsWith("/alumno/pr") ||
    path.startsWith("/personalrecord") ||
    path.includes("personalrecord") ||
    path.includes("/rm")
  ) {
    return "personalrecord"
  }

  if (path.startsWith("/competencias") || path.includes("challenge")) {
    return "challenge"
  }

  if (
    path.startsWith("/alumno/perfil") ||
    path.startsWith("/perfil") ||
    path.startsWith("/profile")
  ) {
    return "perfil"
  }

  return "dashboard"
}

export default function AlumnoSidebar({ navigate, membership }) {
  const location = useLocation()

  const selectedKey = useMemo(() => {
    return getActiveKey(location.pathname)
  }, [location.pathname])

  const activeItem = useMemo(() => {
    return MENU_ITEMS.find((item) => item.key === selectedKey) || MENU_ITEMS[0]
  }, [selectedKey])

  const safeMembership = membership || {
    status: "vencida",
    title: "Sin membresía",
    subtitle: "Consulta con administración",
    progress: 15,
  }

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
          className="h-20 w-20 object-contain drop-shadow-[0_0_24px_rgba(249,115,22,0.38)]"
        />

        <div className="mt-2 text-xl font-black tracking-[0.12em] text-white">
          PHO<span className="text-orange-500">3</span>NIX
        </div>

        <div className="mt-1 max-w-[190px] text-[15px] font-bold uppercase tracking-[0.16em] text-orange-500">
          Functional Fitness
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-hidden">
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
          Alumno
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

      <div className="mb-4 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">
          Membresía
        </p>

        <p
          className={[
            "mt-2 text-xl font-black uppercase",
            safeMembership.status === "activa"
              ? "text-emerald-300"
              : safeMembership.status === "por_vencer"
              ? "text-amber-300"
              : "text-red-300",
          ].join(" ")}
        >
          {safeMembership.title}
        </p>

        <p className="mt-1 text-xs text-white/60">
          {safeMembership.subtitle}
        </p>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className={[
              "h-full rounded-full",
              safeMembership.status === "activa"
                ? "bg-emerald-400"
                : safeMembership.status === "por_vencer"
                ? "bg-orange-500"
                : "bg-red-500",
            ].join(" ")}
            style={{ width: `${safeMembership.progress}%` }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full shrink-0 items-center gap-3 rounded-xl border border-orange-500/15 bg-black/35 px-4 py-3 text-sm font-semibold text-white/75 transition hover:border-orange-400/30 hover:text-orange-300"
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