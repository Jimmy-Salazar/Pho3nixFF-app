import { useEffect, useMemo, useState } from "react"
import { Link, NavLink } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { ROLES } from "../config/roles"
import { supabase } from "../supabase"

const DEFAULT_AVATAR =
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

  // ✅ Cargar foto del usuario
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

        const { data, error } = await supabase
          .from("usuarios")
          .select("foto_url")
          .eq("id", userId)
          .single()

        if (error) {
          if (alive) setFotoUrl(null)
          return
        }

        if (alive) {
          setFotoUrl(data?.foto_url || null)
        }
      } catch {
        if (alive) setFotoUrl(null)
      }
    }

    loadFoto()

    return () => {
      alive = false
    }
  }, [])

  // ✅ Avatar con fallback
  const AvatarUser = useMemo(
    () =>
      function AvatarUser() {
        const src =
          fotoUrl && fotoUrl.length > 5
            ? fotoUrl
            : DEFAULT_AVATAR

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

		<div className="navbar-left desktop-only">
		  <div className="logo-box">
			<img
			  src="https://rmolvzjluxutxmxzthjp.supabase.co/storage/v1/object/public/images/pho3nix-logo.png"
			  alt="phoenix"
			  className="logo-img"
			/>
			<span className="logo-text">
			  Pho3nix Functional Fitness
			</span>
		  </div>
		</div>

      <nav className="navbar-links-desktop desktop-only">

        <NavLink to="/dashboard" className={({ isActive }) => `navlink ${isActive ? "active" : ""}`}>
          Dashboard
        </NavLink>

        <NavLink to="/registrar-rm" className={({ isActive }) => `navlink ${isActive ? "active" : ""}`}>
          RM
        </NavLink>

        <NavLink to="/wods" className={({ isActive }) => `navlink ${isActive ? "active" : ""}`}>
          WOD
        </NavLink>

        <NavLink to="/pda" className={({ isActive }) => `navlink ${isActive ? "active" : ""}`}>
          PDA
        </NavLink>

        {isAdmin && (
          <NavLink to="/admin/users" className={({ isActive }) => `navlink ${isActive ? "active" : ""}`}>
            Personas
          </NavLink>
        )}

        {isAdmin && (
          <NavLink to="/admin" className={({ isActive }) => `navlink ${isActive ? "active" : ""}`}>
            Admin
          </NavLink>
        )}

      </nav>

      {/* RIGHT */}

      <div className="navbar-right desktop-only">

        <div className="user-chip">
          <AvatarUser />
          <span className="user-role">{safeNombre}</span>
        </div>

        <button
          className="logout-btn"
          onClick={logout}
          title="Cerrar sesión"
        >
          <LogoutIcon />
        </button>

      </div>

      {/* MOBILE */}

      <div className="navbar-actions mobile-only">

        <button
          className="logout-btn"
          onClick={logout}
          title="Cerrar sesión"
        >
          <LogoutIcon />
        </button>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "✕" : "☰"}
        </button>

      </div>

    </header>
  )
}