import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../supabase"
import pho3nixLogo from "../../assets/pho3nix-login-logo.png"
import BiometricLoginButton from "../../components/security/BiometricLoginButton"
import { getBiometricEnabled } from "../../lib/native/appPreferences"
import { enableBiometricLogin } from "../../lib/native/biometricAuth"
import { isNativeApp } from "../../lib/native/platform"

export default function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [biometricPromptOpen, setBiometricPromptOpen] = useState(false)
  const [biometricLoading, setBiometricLoading] = useState(false)
  const [biometricMessage, setBiometricMessage] = useState("")
  const [membershipPopupOpen, setMembershipPopupOpen] = useState(false)
  const [membershipPopupMessage, setMembershipPopupMessage] = useState("")

  const coachPhone = "593979727407"
  const whatsappMessage =
    "Mensaje enviado desde la Web...\nBuen dia, quisiera informacion sobre el Entrenamiento de Crosffit..."
  const whatsappUrl = `https://wa.me/${coachPhone}?text=${encodeURIComponent(
    whatsappMessage
  )}`

  const handleContactAdmin = () => {
    window.open(whatsappUrl, "_blank", "noopener,noreferrer")
  }

  useEffect(() => {
    const savedEmail = localStorage.getItem("pho3nix_login_email")
    const authError = sessionStorage.getItem("auth_error")

    if (savedEmail) {
      setEmail(savedEmail)
      setRemember(true)
    }

    if (authError) {
      showMembershipPopup(authError)
      sessionStorage.removeItem("auth_error")
    }
  }, [])

  const goToDashboard = () => {
    navigate("/dashboard", { replace: true })
  }

  const showMembershipPopup = (
    message = "No tienes mensualidad activa. Comunícate con administración para renovar tu acceso."
  ) => {
    setError(message)
    setMembershipPopupMessage(message)
    setMembershipPopupOpen(true)
  }

  const validateActiveMembershipOrPopup = async (sessionArg = null) => {
    try {
      const session =
        sessionArg ||
        (await supabase.auth.getSession())?.data?.session

      const sessionUser = session?.user

      if (!sessionUser?.id) {
        return false
      }

      let resolvedRol = sessionUser.user_metadata?.role || null

      const { data: usr, error: userError } = await supabase
        .from("usuarios")
        .select("role")
        .eq("id", sessionUser.id)
        .maybeSingle()

      if (userError) throw userError

      if (usr?.role) {
        resolvedRol = usr.role
      }

      const role = normalizeRole(resolvedRol)

      if (!role) {
        const message = "No se pudo determinar tu rol. Comunícate con administración."
        sessionStorage.setItem("auth_error", message)
        await supabase.auth.signOut()
        showMembershipPopup(message)
        return false
      }

      if (!needsMensualidad(role)) {
        return true
      }

      const { data: mensualidades, error: mensualidadError } = await supabase
        .from("mensualidades")
        .select("id,estado,fecha_inicio,fecha_fin,created_at")
        .eq("usuario_id", sessionUser.id)
        .order("fecha_fin", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)

      if (mensualidadError) throw mensualidadError

      const last = mensualidades?.[0] || null
      const estado = String(last?.estado || "").trim().toLowerCase()
      const dias = daysUntil(last?.fecha_fin)

      const ok = !!last && estado === "activo" && Number(dias) >= 0

      if (!ok) {
        const message =
          "No tienes mensualidad activa. Comunícate con administración para renovar tu acceso."

        sessionStorage.setItem("auth_error", message)
        await supabase.auth.signOut()
        showMembershipPopup(message)
        return false
      }

      return true
    } catch (error) {
      console.error("Error validando mensualidad:", error)

      const message =
        error?.message || "No se pudo validar tu mensualidad. Intenta nuevamente."

      sessionStorage.setItem("auth_error", message)
      await supabase.auth.signOut()
      showMembershipPopup(message)
      return false
    }
  }

  const withTimeout = (promise, fallbackValue, delay = 700) => {
    return Promise.race([
      promise,
      new Promise((resolve) => {
        window.setTimeout(() => resolve(fallbackValue), delay)
      }),
    ])
  }

  const handleBiometricSuccess = async (session) => {
    const canEnter = await validateActiveMembershipOrPopup(session)

    if (!canEnter) return

    goToDashboard()
  }

  const handleAcceptBiometric = async () => {
    try {
      setBiometricLoading(true)
      setBiometricMessage("")

      const result = await withTimeout(
        enableBiometricLogin(),
        {
          ok: false,
          reason: "timeout",
          message: "La verificación tardó demasiado. Revisa permisos biométricos o vuelve a intentar.",
        },
        12000
      )

      if (!result?.ok) {
        setBiometricMessage(result?.message || "No se pudo activar la huella. Puedes continuar sin activarla.")
        return
      }

      setBiometricPromptOpen(false)

      const canEnter = await validateActiveMembershipOrPopup()
      if (!canEnter) return

      goToDashboard()
    } catch (error) {
      console.error("Error activando huella:", error)
      setBiometricMessage(error?.message || "No se pudo activar la huella. Puedes continuar sin activarla.")
    } finally {
      setBiometricLoading(false)
    }
  }

  const handleSkipBiometric = async () => {
    setBiometricPromptOpen(false)

    const canEnter = await validateActiveMembershipOrPopup()
    if (!canEnter) return

    goToDashboard()
  }

  const handleLogin = async (event) => {
    event.preventDefault()

    if (loading || biometricPromptOpen) return

    try {
      setLoading(true)
      setError("")
      setSuccess("")
      setBiometricMessage("")

      const cleanEmail = email.trim().toLowerCase()

      if (!cleanEmail || !password) {
        throw new Error("Ingresa tu correo y contraseña.")
      }

      const { data: loginData, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        })

      if (loginError) throw loginError

      const canEnter = await validateActiveMembershipOrPopup(loginData?.session)

      if (!canEnter) {
        setLoading(false)
        return
      }

      if (remember) {
        localStorage.setItem("pho3nix_login_email", cleanEmail)
      } else {
        localStorage.removeItem("pho3nix_login_email")
      }

      setLoading(false)

      if (!isNativeApp()) {
        goToDashboard()
        return
      }

      const biometricEnabled = await withTimeout(
        getBiometricEnabled(),
        false,
        700
      )

      if (biometricEnabled) {
        goToDashboard()
        return
      }

      setBiometricPromptOpen(true)
    } catch (err) {
      console.error("Error iniciando sesión:", err)

      const message = String(err?.message || "").toLowerCase()

      if (message.includes("invalid login credentials")) {
        setError("Correo o contraseña incorrectos.")
      } else if (message.includes("email not confirmed")) {
        setError("Debes confirmar tu correo antes de iniciar sesión.")
      } else {
        setError(err?.message || "No se pudo iniciar sesión.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (resetLoading) return

    try {
      setResetLoading(true)
      setError("")
      setSuccess("")

      const cleanEmail = email.trim().toLowerCase()

      if (!cleanEmail) {
        throw new Error("Ingresa tu correo para enviarte el enlace de recuperación.")
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        cleanEmail,
        {
          redirectTo: `${window.location.origin}/set-password`,
        }
      )

      if (resetError) throw resetError

      setSuccess("Te enviamos un enlace para restablecer tu contraseña.")
    } catch (err) {
      console.error("Error enviando recuperación:", err)
      setError(err?.message || "No se pudo enviar el correo de recuperación.")
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <main className="relative h-[100svh] overflow-hidden bg-[#050505] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.22),transparent_34%),radial-gradient(circle_at_20%_90%,rgba(185,28,28,0.24),transparent_30%),linear-gradient(180deg,#050505_0%,#0b0b0b_48%,#050505_100%)]" />
        <div className="absolute inset-0 bg-[url('/images/imagenchallenge.png')] bg-cover bg-center opacity-20 lg:opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/70 to-black/85 lg:bg-gradient-to-r lg:from-black/65 lg:via-black/75 lg:to-black/80" />
        <div className="absolute -left-28 top-24 h-72 w-72 rounded-full bg-orange-600/20 blur-3xl" />
        <div className="absolute -right-28 bottom-10 h-80 w-80 rounded-full bg-red-600/15 blur-3xl" />
      </div>

      <section className="relative z-10 grid h-[100svh] grid-cols-1 overflow-hidden lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden overflow-hidden lg:block">
          <div className="absolute inset-0 bg-[url('/images/imagenchallenge.png')] bg-cover bg-center opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/45" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_70%,rgba(249,115,22,0.22),transparent_32%)]" />

          <div className="relative z-10 flex h-full flex-col justify-center px-16">
            <img
              src={pho3nixLogo}
              alt="PHO3NIX"
              className="h-32 w-32 object-contain drop-shadow-[0_0_35px_rgba(249,115,22,0.45)]"
            />

            <h1 className="mt-8 text-7xl font-black tracking-[0.16em] text-white">
              PHO<span className="text-orange-500">3</span>NIX
            </h1>

            <p className="mt-3 text-2xl font-black uppercase tracking-[0.24em] text-orange-500">
              Functional Fitness
            </p>

            <div className="mt-14 max-w-xl">
              <p className="text-3xl font-black uppercase leading-tight text-white">
                Supera tus límites.
              </p>
              <p className="text-3xl font-black uppercase leading-tight text-orange-500">
                Transforma tu vida.
              </p>
            </div>
          </div>
        </div>

        <div className="flex h-[100svh] items-center justify-center overflow-hidden px-4 py-3 sm:px-6 lg:px-10">
          <div className="w-full max-w-[410px] lg:max-w-[500px]">
            <div className="mb-4 flex flex-col items-center text-center lg:hidden">
              <img
                src={pho3nixLogo}
                alt="PHO3NIX"
                className="h-20 w-20 object-contain drop-shadow-[0_0_28px_rgba(249,115,22,0.45)] sm:h-24 sm:w-24"
              />

              <h1 className="mt-1 text-3xl font-black tracking-[0.18em] text-white sm:text-4xl">
                PHO<span className="text-orange-500">3</span>NIX
              </h1>

              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.26em] text-orange-500 sm:text-xs">
                Functional Fitness
              </p>

              <div className="mt-4 text-center sm:mt-6">
                <p className="text-lg font-black uppercase leading-tight text-white sm:text-xl">
                  Supera tus límites.
                </p>
                <p className="text-lg font-black uppercase leading-tight text-orange-500 sm:text-xl">
                  Transforma tu vida.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleLogin}
              className="relative overflow-hidden rounded-[1.7rem] border border-white/10 bg-black/60 p-4 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:rounded-[2rem] sm:p-6 lg:p-9"
            >
              <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-orange-500/15 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 left-8 h-56 w-56 rounded-full bg-red-500/10 blur-3xl" />

              <div className="relative z-10">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="rounded-xl border border-orange-500/25 bg-orange-500/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] text-orange-300 transition hover:bg-orange-500/15"
                  >
                    ← Home
                  </button>

                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
                    PHO3NIX
                  </span>
                </div>

                <div className="text-center">
                  <h2 className="text-2xl font-black uppercase tracking-tight text-white sm:text-4xl">
                    Iniciar <span className="text-orange-500">sesión</span>
                  </h2>

                  <p className="mt-1 text-xs text-white/55 sm:mt-2 sm:text-base">
                    Bienvenido de nuevo a PHO3NIX
                  </p>
                </div>

                {error ? (
                  <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-200 sm:mt-5 sm:py-3 sm:text-sm">
                    {error}
                  </div>
                ) : null}

                {success ? (
                  <div className="mt-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-200 sm:mt-5 sm:py-3 sm:text-sm">
                    {success}
                  </div>
                ) : null}

                <div className="mt-5 space-y-3 sm:mt-7 sm:space-y-5">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-white sm:mb-2 sm:text-sm">
                      Correo electrónico
                    </span>

                    <div className="grid grid-cols-[42px_1fr] items-center rounded-2xl border border-white/10 bg-white/[0.04] transition focus-within:border-orange-500/60 sm:grid-cols-[44px_1fr]">
                      <span className="flex h-12 items-center justify-center text-lg text-white/60 sm:h-14 sm:text-xl">
                        ✉
                      </span>

                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="Ingresa tu correo"
                        autoComplete="email"
                        className="h-12 min-w-0 bg-transparent pr-4 text-sm text-white outline-none placeholder:text-white/35 sm:h-14 sm:text-base"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-white sm:mb-2 sm:text-sm">
                      Contraseña
                    </span>

                    <div className="grid grid-cols-[42px_1fr_42px] items-center rounded-2xl border border-white/10 bg-white/[0.04] transition focus-within:border-orange-500/60 sm:grid-cols-[44px_1fr_44px]">
                      <span className="flex h-12 items-center justify-center text-lg text-white/60 sm:h-14 sm:text-xl">
                        🔒
                      </span>

                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Ingresa tu contraseña"
                        autoComplete="current-password"
                        className="h-12 min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-white/35 sm:h-14 sm:text-base"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="flex h-12 items-center justify-center text-base text-white/55 transition hover:text-orange-300 sm:h-14 sm:text-lg"
                        aria-label={
                          showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                        }
                      >
                        {showPassword ? "🙈" : "👁"}
                      </button>
                    </div>
                  </label>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 sm:mt-5">
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-white/70 sm:text-sm">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(event) => setRemember(event.target.checked)}
                      className="h-4 w-4 accent-orange-500"
                    />

                    <span>Recordarme</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={resetLoading}
                    className="text-xs font-bold text-orange-400 transition hover:text-orange-300 disabled:opacity-60 sm:text-sm"
                  >
                    {resetLoading ? "Enviando..." : "¿Olvidaste tu contraseña?"}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-5 flex h-12 w-full items-center justify-center gap-3 rounded-2xl bg-orange-500 px-5 text-sm font-black uppercase text-black shadow-[0_0_28px_rgba(249,115,22,0.32)] transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-70 sm:mt-7 sm:h-14 sm:text-base"
                >
                  <span>{loading ? "Ingresando..." : "Ingresar"}</span>
                  <span className="text-2xl">→</span>
                </button>

                <BiometricLoginButton onSuccess={handleBiometricSuccess} />

                <div className="mt-5 text-center text-xs text-white/55 sm:mt-7 sm:text-sm">
                  ¿No tienes cuenta?{" "}
                  <button
                    type="button"
                    onClick={handleContactAdmin}
                    className="font-bold text-orange-400 transition hover:text-orange-300"
                  >
                    Contacta al administrador
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>

      {biometricPromptOpen ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-[390px] overflow-hidden rounded-[1.8rem] border border-orange-500/25 bg-[#080808] p-5 shadow-2xl shadow-black/70">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-orange-500/25 bg-orange-500/10 text-3xl">
                🔐
              </div>

              <h3 className="mt-4 text-xl font-black uppercase text-white">
                Activar ingreso con huella
              </h3>

              <p className="mt-2 text-sm leading-5 text-white/60">
                Tus datos son correctos. ¿Quieres activar el acceso rápido con huella en este celular?
              </p>

              <p className="mt-2 text-xs leading-5 text-white/35">
                No guardamos tu contraseña. La huella solo desbloquea tu sesión en esta app.
              </p>
            </div>

            {biometricMessage ? (
              <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-center text-xs font-semibold text-red-200">
                {biometricMessage}
              </div>
            ) : null}

            <div className="mt-5 grid gap-2">
              <button
                type="button"
                onClick={handleAcceptBiometric}
                disabled={biometricLoading}
                className="flex h-12 w-full items-center justify-center rounded-2xl bg-orange-500 px-4 text-sm font-black uppercase text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {biometricLoading ? "Verificando..." : "Sí, activar huella"}
              </button>

              <button
                type="button"
                onClick={handleSkipBiometric}
                className="flex h-11 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-xs font-black uppercase text-white/65 transition hover:bg-white/[0.07]"
              >
                Continuar sin huella
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {membershipPopupOpen ? (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/85 px-4 backdrop-blur-sm">
          <div className="w-full max-w-[390px] overflow-hidden rounded-[1.8rem] border border-red-500/25 bg-[#080808] p-5 text-center shadow-2xl shadow-black/70">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-red-500/25 bg-red-500/10 text-3xl">
              ⚠️
            </div>

            <h3 className="mt-4 text-xl font-black uppercase text-white">
              Mensualidad inactiva
            </h3>

            <p className="mt-2 text-sm leading-5 text-white/60">
              {membershipPopupMessage ||
                "No tienes mensualidad activa. Comunícate con administración para renovar tu acceso."}
            </p>

            <button
              type="button"
              onClick={() => setMembershipPopupOpen(false)}
              className="mt-5 flex h-11 w-full items-center justify-center rounded-2xl bg-orange-500 text-sm font-black uppercase text-black transition hover:bg-orange-400"
            >
              Entendido
            </button>
          </div>
        </div>
      ) : null}

    </main>
  )
}
function normalizeRole(value) {
  return String(value || "").trim().toLowerCase()
}

function needsMensualidad(role) {
  const normalized = normalizeRole(role)
  return normalized === "alumno" || normalized === "coach"
}

function todayISO() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function parseDate(value) {
  if (!value) return null

  const [year, month, day] = String(value).split("-").map(Number)

  if (!year || !month || !day) return null

  return new Date(year, month - 1, day)
}

function daysUntil(dateStr) {
  const target = parseDate(dateStr)
  const today = parseDate(todayISO())

  if (!target || !today) return null

  return Math.floor((target.getTime() - today.getTime()) / 86400000)
}
