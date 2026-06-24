import { useEffect, useState } from "react"
import { supabase } from "../../supabase"
import {
  canUseBiometricLogin,
  verifyBiometricIdentity,
} from "../../lib/native/biometricAuth"

function withTimeout(promise, fallbackValue, delay = 2500) {
  return Promise.race([
    promise,
    new Promise((resolve) => {
      window.setTimeout(() => resolve(fallbackValue), delay)
    }),
  ])
}

export default function BiometricLoginButton({
  onSuccess,
  className = "",
}) {
  const [visible, setVisible] = useState(false)
  const [checking, setChecking] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    let alive = true

    async function check() {
      try {
        setChecking(true)
        setMessage("")

        const [biometricStatus, sessionResult] = await Promise.all([
          withTimeout(
            canUseBiometricLogin(),
            {
              canUse: false,
            },
            2500
          ),
          supabase.auth.getSession(),
        ])

        const hasSession = !!sessionResult?.data?.session

        if (alive) {
          setVisible(!!biometricStatus.canUse && hasSession)
        }
      } catch (error) {
        console.warn("No se pudo validar biometría:", error)

        if (alive) {
          setVisible(false)
        }
      } finally {
        if (alive) {
          setChecking(false)
        }
      }
    }

    check()

    return () => {
      alive = false
    }
  }, [])

  async function handleBiometricLogin() {
    try {
      setLoading(true)
      setMessage("")

      const { data } = await supabase.auth.getSession()
      const session = data?.session

      if (!session) {
        setMessage("Primero ingresa con correo y contraseña.")
        setVisible(false)
        return
      }

      const verification = await withTimeout(
        verifyBiometricIdentity({
          title: "PHO3NIX",
          subtitle: "Ingreso con huella",
          description: "Confirma tu identidad para continuar.",
          reason: "Ingresa a PHO3NIX con tu huella.",
        }),
        {
          ok: false,
          reason: "timeout",
          message: "La verificación tardó demasiado.",
        },
        12000
      )

      if (!verification.ok) {
        setMessage(verification?.message || "No se pudo verificar la huella.")
        return
      }

      await onSuccess?.(session)
    } catch (error) {
      console.error("Error ingresando con huella:", error)
      setMessage(error?.message || "No se pudo ingresar con huella.")
    } finally {
      setLoading(false)
    }
  }

  if (checking || !visible) return null

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={handleBiometricLogin}
        disabled={loading}
        className={[
          "flex w-full items-center justify-center gap-2 rounded-2xl border border-orange-500/25 bg-orange-500/10 px-4 py-3 text-sm font-black uppercase text-orange-300 transition hover:bg-orange-500/15 disabled:cursor-not-allowed disabled:opacity-60",
          className,
        ].join(" ")}
      >
        <span className="text-base">🔐</span>
        {loading ? "Verificando..." : "Ingresar con huella"}
      </button>

      {message ? (
        <p className="mt-2 text-center text-xs font-semibold text-red-300">
          {message}
        </p>
      ) : null}
    </div>
  )
}
