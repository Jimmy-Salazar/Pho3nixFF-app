// src/pages/login/components/LoginCard.jsx

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../../supabase"
import phoenixLoginLogo from "../assets/pho3nix-login-logo.png"
import PasswordInput from "./PasswordInput"

export default function LoginCard({
  email,
  onEmailChange,
  onOpenCreatePassword,
}) {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    const authError = sessionStorage.getItem("auth_error")
    if (authError) {
      setError(authError)
      sessionStorage.removeItem("auth_error")
    }

    const rememberedEmail = localStorage.getItem("pho3nix_login_email")
    if (rememberedEmail) {
      onEmailChange(rememberedEmail)
    }
  }, [onEmailChange])

  async function handleLogin(e) {
    e.preventDefault()
    if (loading) return

    try {
      setLoading(true)
      setError(null)

      if (remember) {
        localStorage.setItem("pho3nix_login_email", email.trim())
      } else {
        localStorage.removeItem("pho3nix_login_email")
      }

      sessionStorage.setItem("login_intent_at", String(Date.now()))

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) throw error

      if (data?.session || data?.user) {
        navigate("/dashboard")
      }
    } catch (err) {
      sessionStorage.removeItem("login_intent_at")
      setError(err?.message || "No se pudo iniciar sesión.")
    } finally {
      setLoading(false)
    }
  }

  async function handleRecoverPassword() {
    if (!email.trim()) {
      setError("Escribe tu correo para recuperar la contraseña.")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/set-password`,
      })

      if (error) throw error

      setError("Te enviamos un correo para recuperar tu contraseña.")
    } catch (err) {
      setError(err?.message || "No se pudo enviar el correo de recuperación.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="phoenix-login-card-wrapper mx-auto w-full max-w-xl">
      <div className="relative">
        <div className="phoenix-login-card-aura absolute -inset-px rounded-[2rem] bg-gradient-to-br from-orange-500/55 via-white/10 to-orange-900/25 blur-[1px]" />

        <div className="phoenix-login-card-component relative overflow-hidden rounded-[2rem] border border-white/15 bg-black/55 shadow-[0_30px_100px_rgba(0,0,0,0.65)] backdrop-blur-2xl">
          <div className="phoenix-login-card-glow-a pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="phoenix-login-card-glow-b pointer-events-none absolute -bottom-24 left-10 h-60 w-60 rounded-full bg-orange-700/20 blur-3xl" />

          <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-10">
            <div className="mb-7 flex items-center justify-center lg:hidden">
              <img
                src={phoenixLoginLogo}
                alt="PHO3NIX"
                className="phoenix-login-logo w-[260px] object-contain drop-shadow-[0_0_25px_rgba(249,115,22,0.55)]"
                draggable="false"
              />
            </div>

            <div className="text-center">
              <div className="text-xs font-black uppercase tracking-[0.28em] text-orange-400">
                PHO3NIX Functional Fitness
              </div>

              <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
                <span className="text-orange-500">Bienvenido</span>{" "}
                de nuevo
              </h2>

              <p className="mt-3 text-sm text-white/65">
                Inicia sesión para continuar.
              </p>
            </div>

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/70">
                  Correo electrónico
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/45">
                    ✉️
                  </span>

                  <input
                    type="email"
                    className="h-14 w-full rounded-2xl border border-white/15 bg-black/35 px-12 text-white outline-none transition placeholder:text-white/35 focus:border-orange-400/55 focus:shadow-[0_0_0_4px_rgba(249,115,22,0.15)]"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => onEmailChange(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <PasswordInput
                label="Contraseña"
                value={password}
                onChange={setPassword}
                show={showPassword}
                onToggle={() => setShowPassword((prev) => !prev)}
                autoComplete="current-password"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <label className="inline-flex cursor-pointer items-center gap-2 text-white/65">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-black/40 accent-orange-500"
                  />
                  Recordarme
                </label>

                <button
                  type="button"
                  onClick={handleRecoverPassword}
                  disabled={loading}
                  className="font-semibold text-orange-400 transition hover:text-orange-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {error ? (
                <div
                  className={[
                    "rounded-2xl border px-4 py-3 text-sm leading-6",
                    String(error).toLowerCase().includes("enviamos")
                      ? "border-green-400/25 bg-green-500/10 text-green-200"
                      : "border-red-400/25 bg-red-500/10 text-red-200",
                  ].join(" ")}
                >
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className={[
                  "relative h-14 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 text-sm font-black uppercase tracking-[0.16em] text-black shadow-[0_0_35px_rgba(249,115,22,0.35)] transition hover:scale-[1.01] hover:shadow-[0_0_45px_rgba(249,115,22,0.5)] disabled:cursor-wait disabled:opacity-80",
                  loading ? "animate-pulse" : "",
                ].join(" ")}
              >
                {loading ? "Ingresando..." : "Iniciar sesión →"}
              </button>

              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs text-white/45">o</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <div className="text-center text-sm text-white/55">
                ¿No tienes cuenta?{" "}
                <span className="font-semibold text-orange-400">
                  Contacta a un administrador.
                </span>
              </div>

              <div className="flex items-center justify-center gap-4 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setError(null)
                    onOpenCreatePassword()
                  }}
                  className="text-white/60 underline underline-offset-4 transition hover:text-orange-300"
                >
                  Crear contraseña
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="text-white/60 underline underline-offset-4 transition hover:text-orange-300"
                >
                  Cancelar y volver al Home
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="mt-5 text-center text-xs text-white/35">
        © 2026 PHO3NIX Functional Fitness. Todos los derechos reservados.
      </div>
    </div>
  )
}
