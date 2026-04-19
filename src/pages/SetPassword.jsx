import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase"

export default function SetPassword() {
  const navigate = useNavigate()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [validSession, setValidSession] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const passwordRules = useMemo(() => {
    return {
      minLength: password.length >= 6,
      matches: password.length > 0 && password === confirmPassword,
    }
  }, [password, confirmPassword])

  useEffect(() => {
    let mounted = true

    async function checkSession() {
      try {
        setCheckingSession(true)
        setError("")

        const hash = window.location.hash || ""
        const query = new URLSearchParams(window.location.search)
        const typeFromQuery = query.get("type")
        const hashParams = new URLSearchParams(hash.replace(/^#/, ""))
        const typeFromHash = hashParams.get("type")
        const accessToken = hashParams.get("access_token")
        const refreshToken = hashParams.get("refresh_token")

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (sessionError) {
            throw sessionError
          }

          window.history.replaceState(
            {},
            document.title,
            window.location.pathname + window.location.search
          )
        }

        const { data, error: getSessionError } = await supabase.auth.getSession()

        if (getSessionError) {
          throw getSessionError
        }

        const isRecovery =
          typeFromQuery === "recovery" ||
          typeFromHash === "recovery" ||
          !!data?.session

        if (!mounted) return

        if (isRecovery && data?.session) {
          setValidSession(true)
        } else {
          setValidSession(false)
          setError("El enlace es inválido o ha expirado. Solicita uno nuevo.")
        }
      } catch (err) {
        if (!mounted) return
        setValidSession(false)
        setError(err?.message || "No se pudo validar el enlace de recuperación.")
      } finally {
        if (mounted) setCheckingSession(false)
      }
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      if (event === "PASSWORD_RECOVERY" || session) {
        setValidSession(true)
        setCheckingSession(false)
        setError("")
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function handleSetPassword(e) {
    e.preventDefault()

    if (!validSession) {
      setError("La sesión no es válida para actualizar la contraseña.")
      return
    }

    if (!passwordRules.minLength) {
      setError("La contraseña debe tener al menos 6 caracteres.")
      return
    }

    if (!passwordRules.matches) {
      setError("Las contraseñas no coinciden.")
      return
    }

    try {
      setLoading(true)
      setError("")
      setSuccess("")

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) {
        throw updateError
      }

      setSuccess("Contraseña creada correctamente. Redirigiendo al login...")

      setTimeout(() => {
        navigate("/login")
      }, 1400)
    } catch (err) {
      setError(err?.message || "No se pudo actualizar la contraseña.")
    } finally {
      setLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#030712] px-4 py-10 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
          <div className="w-full rounded-[28px] border border-white/10 bg-white/[0.04] p-6 text-center shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur">
            <div className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-full border border-cyan-400/30 bg-cyan-400/10" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
              Verificando sesión
            </p>
            <p className="mt-3 text-sm text-white/60">
              Estamos validando tu enlace para crear la contraseña.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!validSession) {
    return (
      <div className="min-h-screen bg-[#030712] px-4 py-10 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
          <div className="w-full rounded-[28px] border border-red-400/20 bg-red-500/10 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-300">
              Enlace no válido
            </p>
            <h1 className="mt-3 text-2xl font-black uppercase tracking-tight text-white">
              No se pudo abrir la recuperación
            </h1>
            <p className="mt-3 text-sm leading-6 text-red-100/80">
              {error || "El enlace ya expiró o no es válido."}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15"
              >
                Ir al login
              </button>

              <button
                type="button"
                onClick={() => navigate("/")}
                className="rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-200 transition hover:bg-red-400/20"
              >
                Ir al inicio
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#030712] px-4 py-8 text-white">
      <div className="mx-auto flex min-h-[75vh] max-w-md items-center justify-center">
        <div className="w-full overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.14),transparent_24%),linear-gradient(135deg,#071122_0%,#050816_48%,#02040a_100%)] shadow-[0_30px_120px_rgba(0,0,0,0.5)]">
          <div className="border-b border-white/10 px-6 py-6">
            <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-cyan-300">
              PHO3NIX FITNESS
            </div>

            <h1 className="mt-4 text-3xl font-black uppercase tracking-tight text-white">
              Crear nueva contraseña
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/65">
              Configura tu acceso para ingresar a la plataforma.
            </p>
          </div>

          <div className="px-6 py-6">
            {(error || success) && (
              <div className="mb-5 space-y-3">
                {error && (
                  <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                    {success}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSetPassword} className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/55">
                  Nueva contraseña
                </label>

                <div className="flex overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingresa tu nueva contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="border-l border-white/10 px-4 text-xs font-bold uppercase tracking-[0.14em] text-white/60 transition hover:bg-white/10"
                  >
                    {showPassword ? "Ocultar" : "Ver"}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/55">
                  Confirmar contraseña
                </label>

                <div className="flex overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repite tu contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="border-l border-white/10 px-4 text-xs font-bold uppercase tracking-[0.14em] text-white/60 transition hover:bg-white/10"
                  >
                    {showConfirmPassword ? "Ocultar" : "Ver"}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-white/45">
                  Validaciones
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-white/70">Mínimo 6 caracteres</span>
                    <span
                      className={
                        passwordRules.minLength ? "text-emerald-300" : "text-white/35"
                      }
                    >
                      {passwordRules.minLength ? "✓" : "•"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-white/70">Las contraseñas coinciden</span>
                    <span
                      className={
                        passwordRules.matches ? "text-emerald-300" : "text-white/35"
                      }
                    >
                      {passwordRules.matches ? "✓" : "•"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-cyan-300 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Guardando..." : "Guardar contraseña"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}