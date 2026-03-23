import { useEffect, useMemo, useState } from "react"
import { Link, NavLink } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { ROLES } from "../config/roles"
import { supabase } from "../supabase"

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
        return (
          <div className="avatar-user">
            {fotoUrl ? (
              <img className="avatar-user-img" src={fotoUrl} alt="avatar" />
            ) : (
              <span className="avatar-user-phoenix">🐦‍🔥</span>
            )}
          </div>
        )
      },
    [fotoUrl]
  )

  return (
    <header className="navbar">

      {/* ===== BRAND ===== */}

      <div className="navbar-left desktop-only">
        <span className="logo">🐦‍🔥 Pho3nix Functional Fitness</span>
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
        >
          Salir
        </button>

      </div>


      {/* ===== MOBILE ACTIONS ===== */}

      <div className="navbar-actions mobile-only">

        <button
          className="logout-btn"
          onClick={logout}
          type="button"
        >
          Salir
        </button>

        <button
          className="menu-toggle"
          onClick={toggleMenu}
          type="button"
        >
          {menuOpen ? "✕" : "☰"}
        </button>

      </div>

    </header>
  )
}