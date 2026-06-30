import { useEffect, useState } from "react"
import { supabase } from "../../../supabase"
import pho3nixLogo from "../../../assets/pho3nix-login-logo.png"
import AlumnoMobileNav from "../shared/AlumnoMobileNav"

export default function RetosAlumno() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    let alive = true

    async function loadProfile() {
      try {
        setLoading(true)

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user?.id) return

        const { data, error } = await supabase
          .from("usuarios")
          .select("id,nombre,email,foto_url")
          .eq("id", user.id)
          .maybeSingle()

        if (error) throw error

        if (alive) {
          setProfile(data || null)
        }
      } catch (error) {
        console.error("Error cargando perfil para retos:", error)
      } finally {
        if (alive) setLoading(false)
      }
    }

    loadProfile()

    return () => {
      alive = false
    }
  }, [])

  const profileName = profile?.nombre || "Alumno PHO3NIX"
  const initials = getInitials(profileName)

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
    <main className="phoenix-retos-page phoenix-student-dashboard h-[100dvh] w-screen max-w-full overflow-x-hidden overflow-y-auto bg-[#050505] pb-28 text-white">
      <div className="relative min-h-full w-full max-w-full overflow-x-hidden px-3 pt-3">
        <BackgroundOrbs />

        <header className="relative z-10 mb-3 flex items-center justify-between gap-3 border-b border-white/10 pb-2.5">
          <RetosAvatar
            loading={loading}
            initials={initials}
            fotoUrl={profile?.foto_url}
            nombre={profileName}
          />

          <div className="flex min-w-0 items-center gap-2">
            <img
              src={pho3nixLogo}
              alt="PHO3NIX"
              className="phoenix-themed-logo h-8 w-8 shrink-0 object-contain drop-shadow-[0_0_16px_rgba(249,115,22,0.35)]"
            />

            <div className="min-w-0">
              <p className="truncate text-xl font-black tracking-[0.14em] text-white">
                PHO<span className="text-orange-500">3</span>NIX
              </p>
              <p className="truncate text-[8px] font-black uppercase tracking-[0.2em] text-orange-500">
                Functional Fitness
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-orange-500/25 bg-orange-500/10 text-lg text-orange-300"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            ☰
          </button>
        </header>

        <section className="relative z-10 mb-5">
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">
            Retos
          </h1>

          <p className="mt-2 max-w-[330px] text-sm leading-5 text-white/55">
            Participa en competencias y desafía tus límites.
          </p>
        </section>

        <RetosEmptyState />
      </div>

      <AlumnoMobileNav />
    </main>
  )
}

function RetosEmptyState() {
  return (
    <section className="phoenix-themed-hero-card phoenix-retos-empty relative z-10 mt-6 overflow-hidden rounded-[1.45rem] border border-orange-500/25 bg-black/55 px-4 py-8 text-center shadow-2xl shadow-black/40">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(249,115,22,0.20),transparent_42%)]" />
      <div className="absolute -left-24 top-10 h-60 w-60 rounded-full bg-orange-600/15 blur-3xl" />
      <div className="absolute -right-24 bottom-0 h-60 w-60 rounded-full bg-red-600/10 blur-3xl" />

      <div className="relative z-10">
        <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[2rem] border border-orange-500/30 bg-orange-500/10 text-6xl shadow-[0_0_35px_rgba(249,115,22,0.25)]">
          🏆
        </div>

        <h2 className="mt-7 text-3xl font-black uppercase leading-tight tracking-tight text-white">
          Aún no hay
        </h2>

        <h3 className="mt-1 text-3xl font-black uppercase leading-tight tracking-tight text-orange-500">
          eventos próximos
        </h3>

        <div className="mx-auto mt-5 h-0.5 w-20 rounded-full bg-orange-500" />

        <p className="mx-auto mt-7 max-w-[320px] text-base leading-7 text-white/65">
          Mantente atento. Muy pronto anunciaremos nuevos retos,
          competencias y challenges para la comunidad{" "}
          <span className="font-black text-orange-400">PHO3NIX</span>.
        </p>

        <div className="mx-auto mt-8 h-px max-w-[280px] bg-white/10" />

        <div className="mt-7 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-orange-500/25 bg-orange-500/10 text-2xl">
            🔥
          </div>

          <div className="text-left">
            <p className="text-sm font-bold text-white">
              Sigue entrenando.
            </p>
            <p className="text-sm font-black text-orange-400">
              Tu momento llega.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function RetosAvatar({ loading, initials, fotoUrl, nombre }) {
  if (!loading && fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={nombre || "Alumno"}
        className="h-9 w-9 shrink-0 rounded-full border border-orange-500/35 object-cover shadow-[0_0_20px_rgba(249,115,22,0.18)]"
      />
    )
  }

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-orange-500/35 bg-orange-500/10 text-[11px] font-black text-orange-300 shadow-[0_0_20px_rgba(249,115,22,0.18)]">
      {loading ? "..." : initials}
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

function getInitials(name) {
  const parts = String(name || "PH")
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) return "PH"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}
