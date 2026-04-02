import { useEffect, useMemo, useState } from "react"
import { Link, NavLink } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { ROLES } from "../config/roles"
import { supabase } from "../supabase"

const DEFAULT_AVATAR =
  "https://rmolvzjluxutxmxzthjp.supabase.co/storage/v1/object/public/images/pho3nix-logo.png"

const BRAND_LOGO =
  "https://rmolvzjluxutxmxzthjp.supabase.co/storage/v1/object/public/images/pho3nix-logo.png"

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [fotoUrl, setFotoUrl] = useState(null)

  const { nombre, rol, logout } = useAuth()

  const safeNombre = nombre || "Usuario"

  const closeMenu = () => setMenuOpen(false)
  const toggleMenu = () => setMenuOpen((v) => !v)

  const isAdmin =
    String(rol || "").toLowerCase() === String(ROLES.ADMIN || "").toLowerCase() ||
    String(rol || "").toLowerCase() === "administrador" ||
    String(rol || "").toLowerCase() === "admin"

  useEffect(() => {
    if (!menuOpen) return

    const isMobile = () => window.matchMedia("(max-width: 768px)").matches
    if (!isMobile()) return

    let lastY = window.scrollY

    const onScroll = () => {
      const y = window.scrollY
      if (Math.abs(y - lastY) > 0) setMenuOpen(false)
      lastY = y
    }

    window.addEventListener("scroll", onScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", onScroll)
    }
  }, [menuOpen])

  useEffect(() => {
    let alive = true

    const loadFoto = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser()
        const userId = userData?.user?.id

        if (!userId) {
          if (alive) setFotoUrl(null)
          return
        }

        const { data } = await supabase
          .from("usuarios")
          .select("foto_url")
          .eq("id", userId)
          .single()

        if (alive) setFotoUrl(data?.foto_url || null)
      } catch {
        if (alive) setFotoUrl(null)
      }
    }

    loadFoto()

    return () => {
      alive = false
    }
  }, [])

  const AvatarUser = useMemo(
    () =>
      function AvatarUser() {
        const src = fotoUrl && fotoUrl.length > 5 ? fotoUrl : DEFAULT_AVATAR

        return (
          <div className="avatar-user">
            <img
              className="avatar-user-img"
              src={src}
              alt="avatar"
              onError={(e) => {
                e.currentTarget.src = DEFAULT_AVATAR
              }}
            />
          </div>
        )
      },
    [fotoUrl]
  )

  const LogoutIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M18 12l3-3m0 0l-3-3m3 3H9"
      />
    </svg>
  )

  return (
    <header className="navbar">
      {/* ===== BRAND DESKTOP ===== */}
      <div className="navbar-left desktop-only">
        <div className="logo-box">
          <img
            src={BRAND_LOGO}
            alt="Pho3nix logo"
            className="logo-img"
          />
          <span className="logo-text">Pho3nix Functional Fitness</span>
        </div>
      </div>

      {/* ===== LINKS DESKTOP ===== */}
      <nav className="navbar-links-desktop desktop-only">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `navlink ${isActive ? "active" : ""}`}
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/registrar-rm"
          className={({ isActive }) => `navlink ${isActive ? "active" : ""}`}
        >
          RM
        </NavLink>

        <NavLink
          to="/wods"
          className={({ isActive }) => `navlink ${isActive ? "active" : ""}`}
        >
          WOD
        </NavLink>

        <NavLink
          to="/pda"
          className={({ isActive }) => `navlink ${isActive ? "active" : ""}`}
        >
          PDA
        </NavLink>

        {isAdmin && (
          <NavLink
            to="/admin/competencias"
            className={({ isActive }) => `navlink ${isActive ? "active" : ""}`}
          >
            Challenger
          </NavLink>
        )}

        {isAdmin && (
          <NavLink
            to="/admin/users"
            className={({ isActive }) => `navlink ${isActive ? "active" : ""}`}
          >
            Personas
          </NavLink>
        )}

        {isAdmin && (
          <NavLink
            to="/admin"
            end
            className={({ isActive }) => `navlink ${isActive ? "active" : ""}`}
          >
            Admin
          </NavLink>
        )}
      </nav>

      {/* ===== MOBILE USER ===== */}
      <div className="navbar-left mobile-only">
        <div className="user-chip">
          <AvatarUser />
          <span className="user-name">{safeNombre}</span>
        </div>
      </div>

      {/* ===== OVERLAY ===== */}
      {menuOpen && (
        <button
          className="nav-overlay"
          aria-label="Cerrar menú"
          onClick={closeMenu}
          type="button"
        />
      )}

      {/* ===== MOBILE MENU ===== */}
      <nav className={`navbar-links ${menuOpen ? "open" : ""}`}>
        <Link to="/dashboard" onClick={closeMenu}>
          Dashboard
        </Link>

        <Link to="/registrar-rm" onClick={closeMenu}>
          RM
        </Link>

        <Link to="/wods" onClick={closeMenu}>
          WOD
        </Link>

        <Link to="/pda" onClick={closeMenu}>
          PDA
        </Link>

        {isAdmin && (
          <Link to="/admin/competencias" onClick={closeMenu}>
            Challenger
          </Link>
        )}

        {isAdmin && (
          <Link to="/admin/users" onClick={closeMenu}>
            Personas
          </Link>
        )}

        {isAdmin && (
          <Link to="/admin" onClick={closeMenu}>
            Admin
          </Link>
        )}
      </nav>

      {/* ===== DESKTOP RIGHT ===== */}
      <div className="navbar-right desktop-only">
        <div className="user-chip">
          <AvatarUser />
          <span className="user-role">{safeNombre}</span>
        </div>

        <button
          className="logout-btn"
          onClick={logout}
          type="button"
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <LogoutIcon />
        </button>
      </div>

      {/* ===== MOBILE ACTIONS ===== */}
      <div className="navbar-actions mobile-only">
        <button
          className="logout-btn"
          onClick={logout}
          type="button"
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <LogoutIcon />
        </button>

        <button
          className="menu-toggle"
          onClick={toggleMenu}
          type="button"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>
    </header>
  )
}