// src/pages/admin/anuncios/mobile/AdminAnunciosMobile.jsx

import { useMemo } from "react"
import { supabase } from "../../../../supabase"
import pho3nixLogo from "../../../../assets/pho3nix-login-logo.png"
import { getAnuncioStatus } from "../utils/anunciosUtils"
import AdminMobileNav from "../../dashboard/mobile/AdminMobileNav"

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
    <main className="block h-[100dvh] w-screen max-w-full overflow-x-hidden overflow-y-auto bg-[#050505] pb-32 text-white lg:hidden">
      <div className="relative min-h-full w-full max-w-full overflow-x-hidden px-3.5 pt-3">
        <BackgroundOrbs />

        <header className="relative z-10 mb-4 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
          <button
            type="button"
            onClick={() => navigate("/admin/dashboard")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-orange-500/25 bg-orange-500/10 text-xl text-orange-300"
            aria-label="Volver al dashboard"
          >
            ☰
          </button>

          <div className="flex min-w-0 flex-col items-center">
            <img
              src={pho3nixLogo}
              alt="PHO3NIX"
              className="h-8 w-8 object-contain drop-shadow-[0_0_20px_rgba(249,115,22,0.35)]"
            />

            <p className="mt-0.5 text-lg font-black tracking-[0.14em] text-white">
              PHO<span className="text-orange-500">3</span>NIX
            </p>

            <p className="text-[8px] font-black uppercase tracking-[0.22em] text-orange-500">
              Functional Fitness
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/10 text-lg text-red-300"
            aria-label="Cerrar sesión"
          >
            ↪
          </button>
        </header>

        <section className="relative z-10 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-3xl font-black uppercase leading-none text-white">
                Anuncios
              </h1>

              <p className="mt-1.5 text-xs text-white/60">
                Gestiona los anuncios del box
              </p>
            </div>

            <button
              type="button"
              onClick={onCreate}
              className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-orange-500 px-3 text-[11px] font-black uppercase text-black shadow-[0_0_20px_rgba(249,115,22,0.22)]"
            >
              <span className="text-sm leading-none">＋</span>
              Nuevo
            </button>
          </div>

          <div className="mt-3">
            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar anuncio..."
              className="w-full rounded-2xl border border-white/10 bg-black/45 px-4 py-2.5 text-xs text-white outline-none placeholder:text-white/35 focus:border-orange-500/60"
            />
          </div>
        </section>

        <section className="relative z-10 mb-4 grid grid-cols-4 gap-1.5 overflow-x-hidden">
          {FILTERS.map((item) => {
            const active = statusFilter === item.key
            const counter = getFilterCounter(item.key, stats)

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onStatusFilterChange(item.key)}
                className={[
                  "min-w-0 rounded-2xl border px-2 py-2 text-center transition",
                  active
                    ? "border-orange-500 bg-orange-500/10 text-orange-300"
                    : "border-white/10 bg-black/35 text-white/55",
                ].join(" ")}
              >
                <div
                  className={[
                    "text-base",
                    item.key === "activo"
                      ? "text-emerald-400"
                      : item.key === "inactivo"
                      ? "text-white/35"
                      : "text-orange-400",
                  ].join(" ")}
                >
                  {item.icon}
                </div>

                <p className="mt-0.5 truncate text-[9px] font-black uppercase">
                  {item.label}
                </p>

                <p className="mt-0.5 text-[9px] text-white/35">{counter}</p>
              </button>
            )
          })}
        </section>

        {error ? (
          <div className="relative z-10 mb-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-200">
            {error}
          </div>
        ) : null}

        <section className="relative z-10 grid gap-2.5">
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

        <footer className="relative z-10 mt-4 flex items-center justify-between gap-3 text-xs text-white/50">
          <span>{showingLabel}</span>

          <span className="rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-black uppercase text-orange-300">
            Admin
          </span>
        </footer>

        <button
          type="button"
          onClick={handleLogout}
          className="relative z-10 mt-4 flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-red-500/45 bg-red-500/10 text-xs font-black uppercase text-red-300 transition hover:bg-red-500/15"
        >
          <span className="text-xl">↪</span>
          Cerrar sesión
        </button>
      </div>

      <AdminMobileNav />
    </main>
  )
}

function MobileAnuncioCard({ anuncio, onEdit }) {
  const status = getAnuncioStatus(anuncio)
  const statusConfig = getStatusConfig(status)

  return (
    <article className="relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-black/45 p-2.5 shadow-2xl shadow-black/30">
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative z-10 grid grid-cols-[88px_minmax(0,1fr)_34px] items-center gap-2.5">
        <AnuncioMedia anuncio={anuncio} />

        <div className="min-w-0">
          <div
            className={[
              "mb-1.5 inline-flex rounded-full px-2 py-0.5 text-[9px] font-black uppercase",
              statusConfig.className,
            ].join(" ")}
          >
            {statusConfig.label}
          </div>

          <h2 className="line-clamp-2 text-sm font-black leading-tight text-white">
            {anuncio.titulo || "Anuncio PHO3NIX"}
          </h2>

          <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-white/55">
            {anuncio.resumen || anuncio.contenido || "Sin contenido disponible."}
          </p>

          <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-white/45">
            <span>📅 {formatDate(anuncio.fecha_publicacion)}</span>
            <span>🕒 {formatTime(anuncio.fecha_publicacion)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onEdit(anuncio)}
          className="flex h-9 w-8 items-center justify-center rounded-2xl border border-white/10 bg-black/45 text-xl text-white/70 transition hover:border-orange-500/35 hover:text-orange-300"
          aria-label="Editar anuncio"
        >
          ⋮
        </button>
      </div>
    </article>
  )
}

function AnuncioMedia({ anuncio }) {
  const mediaUrl = anuncio?.media_url || anuncio?.imagen_url || ""
  const isVideo = anuncio?.media_tipo === "video"

  return (
    <div className="relative h-[92px] overflow-hidden rounded-[1.1rem] border border-white/10 bg-orange-500/10">
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
            className="h-10 w-10 object-contain opacity-80"
          />
        </div>
      )}

      {isVideo ? (
        <div className="absolute left-1.5 top-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[8px] font-black uppercase text-orange-300">
          Video
        </div>
      ) : null}
    </div>
  )
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
    <div className="rounded-[1.4rem] border border-dashed border-white/10 bg-black/35 p-4 text-xs text-white/45">
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
