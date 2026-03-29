// src/pages/Login.js

import { useEffect, useState } from "react"
import { supabase } from "../supabase"
import { useNavigate, Link } from "react-router-dom"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    const authError = sessionStorage.getItem("auth_error")
    if (authError) {
      console.log("[LOGIN] auth_error from sessionStorage:", authError)
      setError(authError)
      sessionStorage.removeItem("auth_error")
    }
  }, [])

const handleLogin = async (e) => {
  e.preventDefault()

  if (loading) {
    console.log("[LOGIN] blocked: already loading")
    return
  }

  try {
    console.log("[LOGIN] submit")
    console.log("[LOGIN] email:", email?.trim())

    setLoading(true)
    setError(null)

    // ✅ marcar intento de login manual ANTES del signIn
    sessionStorage.setItem("login_intent_at", String(Date.now()))

    console.log("[LOGIN] before signInWithPassword")

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    console.log("[LOGIN] after signInWithPassword", {
      hasSession: !!data?.session,
      hasUser: !!data?.user,
      userId: data?.user?.id || data?.session?.user?.id || null,
      error: error ? error.message : null,
    })

    if (error) throw error

    console.log("[LOGIN] navigate -> /dashboard")
    navigate("/dashboard")
  } catch (err) {
    console.error("[LOGIN] catch:", err)

    // ✅ limpiar si falló
    sessionStorage.removeItem("login_intent_at")

    setError(err?.message || "No se pudo iniciar sesión.")
  } finally {
    console.log("[LOGIN] finally -> setLoading(false)")
    setLoading(false)
  }
}

  return (
    <div className="fixed inset-0 login-bg overflow-hidden">
      <style>{`
        @keyframes phoenixFloat {
          0%,100% { transform: translateY(0) scale(1); filter: drop-shadow(0 0 10px rgba(255,120,0,.35)); }
          50% { transform: translateY(-2px) scale(1.03); filter: drop-shadow(0 0 14px rgba(255,0,90,.35)); }
        }
        @keyframes phoenixWings {
          0%,100% { transform: rotate(-6deg); }
          50% { transform: rotate(6deg); }
        }
        .phoenix-icon { animation: phoenixFloat 1.6s ease-in-out infinite; transform-origin: center; }
        .phoenix-wing { animation: phoenixWings .9s ease-in-out infinite; transform-origin: 12px 12px; }

        @keyframes fireBreath {
          0%,100% { opacity: .55; filter: blur(14px); }
          50% { opacity: .9; filter: blur(18px); }
        }
        .fire-border {
          position: absolute;
          inset: -10px;
          border-radius: 28px;
          pointer-events: none;
          background:
            radial-gradient(160px 90px at 15% 0%, rgba(255,140,0,.55), transparent 60%),
            radial-gradient(180px 110px at 85% 10%, rgba(255,0,90,.45), transparent 62%),
            radial-gradient(220px 140px at 50% 105%, rgba(255,140,0,.35), transparent 65%),
            radial-gradient(240px 160px at 0% 70%, rgba(255,0,90,.25), transparent 70%),
            radial-gradient(240px 160px at 100% 70%, rgba(255,140,0,.20), transparent 70%);
          animation: fireBreath 2.4s ease-in-out infinite;
          mix-blend-mode: screen;
        }

        @keyframes matchBurn {
          0% { transform: translateX(-120%); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateX(120%); opacity: .0; }
        }
        .btn-match {
          position: relative;
          overflow: hidden;
        }
        .btn-match::after {
          content: "";
          position: absolute;
          inset: -40% -25%;
          background: linear-gradient(90deg,
            transparent 0%,
            rgba(255,255,255,.10) 18%,
            rgba(255,200,0,.35) 40%,
            rgba(255,80,0,.55) 55%,
            rgba(255,0,90,.35) 66%,
            transparent 100%);
          transform: translateX(-120%);
          animation: matchBurn 1.05s linear infinite;
          mix-blend-mode: screen;
        }
        .btn-match::before {
          content: "";
          position: absolute;
          left: -20%;
          top: 50%;
          width: 38%;
          height: 220%;
          transform: translateY(-50%);
          background: radial-gradient(circle at 30% 50%, rgba(255,170,0,.55), transparent 60%);
          filter: blur(10px);
          opacity: .9;
        }
      `}</style>

      <div className="phoenix-orb phoenix-orb--a pointer-events-none" aria-hidden="true" />
      <div className="phoenix-orb phoenix-orb--b pointer-events-none" aria-hidden="true" />
      <div className="phoenix-orb phoenix-orb--c pointer-events-none" aria-hidden="true" />

      <div className="min-h-dvh w-full grid place-items-center p-4">
        <div className="relative w-full max-w-sm sm:max-w-md">
          <div className="fire-border" />

          <div className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_25px_80px_rgba(0,0,0,0.55)] overflow-hidden">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1600&auto=format&fit=crop"
                alt="Pho3nix Fitness"
                className="h-28 sm:h-40 w-full object-cover"
                draggable="false"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/65" />
            </div>

            <div className="p-5 sm:p-7">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-white/12 flex items-center justify-center phoenix-badge">
                  <span className="phoenix-emoji text-[28px] leading-none" aria-hidden="true">
                    🐦‍🔥
                  </span>
                </div>

                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
                    Pho3nix Functional Fitness
                  </h1>
                  <p className="text-xs sm:text-sm text-white/70">
                    Ingresa con tu correo y contraseña.
                  </p>
                </div>
              </div>

              <form onSubmit={handleLogin} className="mt-5 space-y-3.5">
                <div>
                  <label className="block text-xs sm:text-sm text-white/70 mb-1.5">
                    Correo
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-2.5 sm:py-3 text-white placeholder:text-white/35 outline-none focus:ring-2 focus:ring-orange-400/35 focus:border-orange-300/30"
                    placeholder="correo@dominio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm text-white/70 mb-1.5">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-2.5 sm:py-3 text-white placeholder:text-white/35 outline-none focus:ring-2 focus:ring-pink-400/25 focus:border-pink-300/25"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={[
                    "w-full rounded-2xl py-2.5 sm:py-3 font-semibold text-white transition relative",
                    "bg-gradient-to-r from-orange-500 to-pink-600 hover:opacity-95",
                    loading ? "btn-match cursor-wait opacity-90" : "",
                  ].join(" ")}
                >
                  {loading ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <span className="phoenix-dot" />
                      Ingresando...
                    </span>
                  ) : (
                    "Ingresar"
                  )}
                </button>

                {error && (
                  <div className="text-sm text-red-200 bg-red-500/10 border border-red-400/20 rounded-2xl px-4 py-3">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs sm:text-sm pt-1">
                  <button
                    type="button"
                    className="text-white/75 hover:text-white underline underline-offset-4"
                    onClick={async () => {
                      if (!email.trim()) {
                        setError("Escribe tu correo para recuperar la contraseña.")
                        return
                      }

                      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                        redirectTo: `${window.location.origin}/set-password`,
                      })

                      if (error) setError(error.message)
                      else setError("Te enviamos un correo para recuperar tu contraseña.")
                    }}
                  >
                    Recuperar contraseña
                  </button>

                  <Link
                    to="/set-password"
                    className="text-white/75 hover:text-white underline underline-offset-4"
                  >
                    Crear contraseña
                  </Link>
                </div>

                <p className="text-[11px] sm:text-xs text-white/55 leading-relaxed pt-1.5">
                  Si es tu primer acceso, usa <b>Crear contraseña</b> con el link que te envió el administrador.
                </p>

                <div className="mt-4 text-center text-[10px] sm:text-xs text-white/35">
                  © 2026 Pho3nix Fitness
                </div>
              </form>
            </div>
          </div>

          <div className="phoenix-glow pointer-events-none absolute inset-0 -z-10" />
        </div>
      </div>
    </div>
  )
}