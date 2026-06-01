// src/pages/admin/anuncios/mobile/AdminAnunciosMobile.jsx

import { useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { supabase } from "../../../../supabase"
import pho3nixLogo from "../../../../assets/pho3nix-login-logo.png"
import { getAnuncioStatus } from "../utils/anunciosUtils"

const FILTERS = [
  {
    key: "todos",
    label: "Todos",
    icon: "▦",
  },
  {
    key: "activo",
    label: "Activos",
    icon: "●",
  },
  {
    key: "programado",
    label: "Programados",
    icon: "◷",
  },
  {
    key: "inactivo",
    label: "Inactivos",
    icon: "●",
  },
]

export default function AdminAnunciosMobile({
  loading,
  error,
  anuncios,
  stats,
  search,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  onCreate,
  onEdit,
  onDelete,
  navigate,
}) {
  const [searchOpen, setSearchOpen] = useState(false)

  const showingLabel = useMemo(() => {
    if (loading) return "Cargando anuncios..."

    const total = stats?.total || 0
    const current = anuncios?.length || 0

    return `Mostrando ${current} de ${total} anuncios`
  }, [loading, anuncios, stats])

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
    <main className="block h-[100dvh] w-screen max-w-full overflow-x-hidden overflow-y-auto bg-[#050505] pb-36 text-white lg:hidden">
      <div className="relative min-h-full w-full max-w-full overflow-x-hidden px-4 pt-4">
        <BackgroundOrbs />

        <header className="relative z-10 mb-6 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <button
            type="button"
            onClick={() => navigate("/admin/dashboard")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-orange-500/25 bg-orange-500/10 text-2xl text-orange-300"
            aria-label="Volver al dashboard"
          >
            ☰
          </button>

          <div className="flex min-w-0 flex-col items-center">
            <img
              src={pho3nixLogo}
              alt="PHO3NIX"
              className="h-10 w-10 object-contain drop-shadow-[0_0_20px_rgba(249,115,22,0.35)]"
            />

            <p className="mt-1 text-xl font-black tracking-[0.14em] text-white">
              PHO<span className="text-orange-500">3</span>NIX
            </p>

            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-orange-500">
              Functional Fitness
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/10 text-xl text-red-300"
            aria-label="Cerrar sesión"
          >
            ↪
          </button>
        </header>

        <section className="relative z-10 mb-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-4xl font-black uppercase leading-none text-white">
                Anuncios
              </h1>

              <p className="mt-2 text-sm text-white/60">
                Gestiona los anuncios del box
              </p>
            </div>

            <div className="flex shrink-0 gap-3">
              <button
                type="button"
                onClick={() => setSearchOpen((current) => !current)}
                className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-2xl text-white/80"
                aria-label="Buscar"
              >
                🔍
              </button>

              <button
                type="button"
                onClick={onCreate}
                className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 text-sm font-black uppercase text-black shadow-[0_0_24px_rgba(249,115,22,0.26)]"
              >
                <span className="text-xl">＋</span>
                Nuevo
              </button>
            </div>
          </div>

          {searchOpen ? (
            <div className="mt-4">
              <input
                type="search"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Buscar por título o contenido..."
                className="h-13 w-full rounded-2xl border border-orange-500/25 bg-black/55 px-4 py-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-orange-500/60"
              />
            </div>
          ) : null}
        </section>

        <section className="relative z-10 mb-5 grid grid-cols-4 gap-2 overflow-x-hidden">
          {FILTERS.map((item) => {
            const active = statusFilter === item.key
            const counter = getFilterCounter(item.key, stats)

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onStatusFilterChange(item.key)}
                className={[
                  "min-w-0 rounded-2xl border p-3 text-center transition",
                  active
                    ? "border-orange-500 bg-orange-500/10 text-orange-300"
                    : "border-white/10 bg-black/35 text-white/55",
                ].join(" ")}
              >
                <div
                  className={[
                    "text-lg",
                    item.key === "activo"
                      ? "text-emerald-400"
                      : item.key === "inactivo"
                      ? "text-white/35"
                      : "text-orange-400",
                  ].join(" ")}
                >
                  {item.icon}
                </div>

                <p className="mt-1 truncate text-[10px] font-black uppercase">
                  {item.label}
                </p>

                <p className="mt-1 text-[10px] text-white/35">{counter}</p>
              </button>
            )
          })}
        </section>

        {error ? (
          <div className="relative z-10 mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <section className="relative z-10 grid gap-4">
          {loading ? (
            <MobileEmpty text="Cargando anuncios..." />
          ) : anuncios.length === 0 ? (
            <MobileEmpty text="No hay anuncios para mostrar." />
          ) : (
            anuncios.map((anuncio) => (
              <MobileAnuncioCard
                key={anuncio.id}
                anuncio={anuncio}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </section>

        <footer className="relative z-10 mt-6 flex items-center justify-between gap-3 text-sm text-white/50">
          <span>{showingLabel}</span>

          <span className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-black uppercase text-orange-300">
            Admin
          </span>
        </footer>

        <button
          type="button"
          onClick={handleLogout}
          className="relative z-10 mt-5 flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-red-500/45 bg-red-500/10 text-sm font-black uppercase text-red-300 transition hover:bg-red-500/15"
        >
          <span className="text-2xl">↪</span>
          Cerrar sesión
        </button>
      </div>

      <AdminAnunciosMobileNav />
    </main>
  )
}

function MobileAnuncioCard({ anuncio, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const status = getAnuncioStatus(anuncio)
  const statusConfig = getStatusConfig(status)

  return (
    <article className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-black/45 p-3 shadow-2xl shadow-black/30">
      <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative z-10 grid grid-cols-[120px_minmax(0,1fr)_auto] gap-3">
        <AnuncioMedia anuncio={anuncio} />

        <div className="min-w-0 py-1">
          <div
            className={[
              "mb-2 inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase",
              statusConfig.className,
            ].join(" ")}
          >
            {statusConfig.label}
          </div>

          <h2 className="line-clamp-2 text-lg font-black leading-tight text-white">
            {anuncio.titulo || "Anuncio PHO3NIX"}
          </h2>

          <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/55">
            {anuncio.resumen || anuncio.contenido || "Sin contenido disponible."}
          </p>

          <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/45">
            <span>📅 {formatDate(anuncio.fecha_publicacion)}</span>
            <span>🕒 {formatTime(anuncio.fecha_publicacion)}</span>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            className="flex h-10 w-8 items-center justify-center rounded-xl text-2xl text-white/60"
            aria-label="Opciones"
          >
            ⋮
          </button>

          {menuOpen ? (
            <div className="absolute right-0 top-10 z-30 w-36 overflow-hidden rounded-2xl border border-white/10 bg-[#080808] shadow-2xl">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  onEdit(anuncio)
                }}
                className="block w-full px-4 py-3 text-left text-sm font-bold text-white/80 hover:bg-white/[0.05]"
              >
                Editar
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  onDelete(anuncio)
                }}
                className="block w-full px-4 py-3 text-left text-sm font-bold text-red-300 hover:bg-red-500/10"
              >
                Eliminar
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}

function AnuncioMedia({ anuncio }) {
  const mediaUrl = anuncio?.media_url || anuncio?.imagen_url || ""
  const isVideo = anuncio?.media_tipo === "video"

  return (
    <div className="relative h-[135px] overflow-hidden rounded-[1.4rem] border border-white/10 bg-orange-500/10">
      {mediaUrl ? (
        isVideo ? (
          <video
            src={mediaUrl}
            className="h-full w-full object-cover"
            muted
            playsInline
          />
        ) : (
          <img
            src={mediaUrl}
            alt={anuncio?.titulo || "Anuncio"}
            className="h-full w-full object-cover"
          />
        )
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <img
            src={pho3nixLogo}
            alt="PHO3NIX"
            className="h-16 w-16 object-contain opacity-80"
          />
        </div>
      )}

      {isVideo ? (
        <div className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-1 text-[10px] font-black uppercase text-orange-300">
          Video
        </div>
      ) : null}
    </div>
  )
}

function AdminAnunciosMobileNav() {
  const navigate = useNavigate()
  const location = useLocation()

  const items = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: "⌂",
      to: "/admin/dashboard",
    },
    {
      key: "wods",
      label: "WODs",
      icon: "🏋️",
      to: "/admin/wods",
    },
    {
      key: "alumnos",
      label: "Alumnos",
      icon: "👥",
      to: "/admin/users",
    },
    {
      key: "eventos",
      label: "Eventos",
      icon: "▣",
      to: "/admin/competencias",
    },
    {
      key: "mas",
      label: "Más",
      icon: "•••",
      to: "/admin/dashboard",
    },
  ]

  const activeKey = getActiveKey(location.pathname)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[150] border-t border-orange-500/20 bg-black/90 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-2xl lg:hidden">
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => {
          const active = item.key === activeKey

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => navigate(item.to)}
              className={[
                "flex min-h-[58px] flex-col items-center justify-center rounded-2xl text-[10px] font-black uppercase transition",
                active
                  ? "border border-orange-500/35 bg-orange-500/15 text-orange-300 shadow-[0_0_18px_rgba(249,115,22,0.22)]"
                  : "text-white/45 hover:bg-white/[0.04] hover:text-white/75",
              ].join(" ")}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="mt-1 truncate">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function getActiveKey(pathname) {
  const path = String(pathname || "").toLowerCase()

  if (path.startsWith("/admin/dashboard")) return "dashboard"
  if (path.startsWith("/admin/wods")) return "wods"
  if (path.startsWith("/admin/users") || path.startsWith("/admin/alumnos")) {
    return "alumnos"
  }
  if (path.startsWith("/admin/competencias")) return "eventos"

  return "mas"
}

function getFilterCounter(key, stats) {
  if (key === "todos") return stats?.total || 0
  if (key === "activo") return stats?.activos || 0
  if (key === "programado") return stats?.programados || 0
  if (key === "inactivo") return stats?.inactivos || 0

  return 0
}

function getStatusConfig(status) {
  if (status === "activo") {
    return {
      label: "Activo",
      className: "bg-emerald-500/15 text-emerald-300",
    }
  }

  if (status === "programado") {
    return {
      label: "Programado",
      className: "bg-amber-500/15 text-amber-300",
    }
  }

  return {
    label: "Inactivo",
    className: "bg-red-500/15 text-red-300",
  }
}

function MobileEmpty({ text }) {
  return (
    <div className="rounded-[1.6rem] border border-dashed border-white/10 bg-black/35 p-5 text-sm text-white/45">
      {text}
    </div>
  )
}

function BackgroundOrbs() {
  return (
    <>
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-orange-600/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-red-600/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />
    </>
  )
}

function formatDate(value) {
  if (!value) return "-"

  try {
    return new Intl.DateTimeFormat("es-EC", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
      .format(new Date(value))
      .replace(".", "")
  } catch {
    return "-"
  }
}

function formatTime(value) {
  if (!value) return "--:--"

  try {
    return new Intl.DateTimeFormat("es-EC", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value))
  } catch {
    return "--:--"
  }
}