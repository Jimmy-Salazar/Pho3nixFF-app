import { useLocation, useNavigate } from "react-router-dom"

const ITEMS = [
  {
    key: "dashboard",
    label: "Inicio",
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
    key: "challenge",
    label: "Retos",
    icon: "🏆",
    to: "/alumno/retos",
  },
  {
    key: "personalrecord",
    label: "Mis PR",
    icon: "📈",
    to: "/alumno/personalrecord",
  },
  {
    key: "nutricion",
    label: "Nutrición",
    icon: "🥗",
    to: "/alumno/nutricion",
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

  if (path.startsWith("/alumno/dashboard")) return "dashboard"
  if (path.startsWith("/alumno/wods") || path.startsWith("/wods")) return "wods"

  if (
    path.startsWith("/alumno/personalrecord") ||
    path.startsWith("/alumno/pr") ||
    path.includes("personalrecord")
  ) {
    return "personalrecord"
  }

  if (path.startsWith("/alumno/nutricion") || path.includes("nutricion")) {
    return "nutricion"
  }

  if (
    path.startsWith("/alumno/retos") ||
    path.startsWith("/competencias") ||
    path.includes("challenge")
  ) {
    return "challenge"
  }

  if (path.startsWith("/alumno/perfil") || path.startsWith("/perfil")) {
    return "perfil"
  }

  return "dashboard"
}

export default function AlumnoMobileNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const activeKey = getActiveKey(location.pathname)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[150] border-t border-orange-500/20 bg-black/90 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-2xl lg:hidden">
      <div className="grid grid-cols-6 gap-1">
        {ITEMS.map((item) => {
          const active = item.key === activeKey

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => navigate(item.to)}
              className={[
                "flex min-h-[58px] min-w-0 flex-col items-center justify-center rounded-2xl text-[10px] font-black uppercase transition",
                active
                  ? "border border-orange-500/35 bg-orange-500/15 text-orange-300 shadow-[0_0_18px_rgba(249,115,22,0.22)]"
                  : "text-white/45 hover:bg-white/[0.04] hover:text-white/75",
              ].join(" ")}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="mt-1 max-w-full truncate">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
