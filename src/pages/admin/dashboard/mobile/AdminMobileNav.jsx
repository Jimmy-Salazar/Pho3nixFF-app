// src/pages/admin/dashboard/mobile/AdminMobileNav.jsx

import { useLocation, useNavigate } from "react-router-dom"

const ITEMS = [
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
    key: "prs",
    label: "PRs",
    icon: "🏆",
    to: "/admin/personalrecord",
  },
  {
    key: "challenge",
    label: "Retos",
    icon: "🏆",
    to: "/admin/challenge",
  },
]

function getActiveKey(pathname) {
  const path = String(pathname || "").toLowerCase()

  if (path === "/dashboard" || path.startsWith("/admin/dashboard")) {
    return "dashboard"
  }

  if (path.startsWith("/admin/users") || path.startsWith("/admin/alumnos")) {
    return "alumnos"
  }

  if (path.startsWith("/admin/wods")) return "wods"

  if (
    path.startsWith("/admin/personalrecord") ||
    path.startsWith("/admin/pr") ||
    path.startsWith("/registrar-rm")
  ) {
    return "prs"
  }

  if (
    path.startsWith("/admin/challenge") ||
    path.startsWith("/admin/competencias") ||
    path.startsWith("/challenger")
  ) {
    return "challenge"
  }


  return "dashboard"
}

export default function AdminMobileNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const activeKey = getActiveKey(location.pathname)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[170] border-t border-orange-500/20 bg-black/90 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-2xl lg:hidden">
      <div className="grid grid-cols-5 gap-1">
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
