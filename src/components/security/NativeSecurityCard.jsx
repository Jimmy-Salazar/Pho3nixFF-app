import { useEffect, useState } from "react"
import {
  disableBiometricLogin,
  enableBiometricLogin,
  getBiometricStatus,
} from "../../lib/native/biometricAuth"
import { isNativeApp } from "../../lib/native/platform"

function getStatusText(status) {
  if (!isNativeApp()) return "Disponible solo en la app móvil."
  if (!status.available) return "Este dispositivo no tiene biometría disponible."
  if (status.enabled) return "Ingreso con huella activado en este celular."
  return "Puedes activar el ingreso rápido con huella."
}

export default function NativeSecurityCard() {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [status, setStatus] = useState({
    enabled: false,
    available: false,
    canUse: false,
    reason: "",
    biometryType: null,
  })
  const [message, setMessage] = useState("")

  async function loadStatus() {
    try {
      setLoading(true)
      setMessage("")

      if (!isNativeApp()) {
        setVisible(false)
        return
      }

      setVisible(true)

      const nextStatus = await getBiometricStatus()
      setStatus(nextStatus)
    } catch (error) {
      console.warn("No se pudo cargar estado biométrico:", error)
      setMessage("No se pudo revisar la biometría del dispositivo.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [])

  async function handleEnable() {
    try {
      setWorking(true)
      setMessage("")

      const result = await enableBiometricLogin()

      if (!result.ok) {
        setMessage("No se pudo activar la huella.")
        return
      }

      setMessage("Ingreso con huella activado correctamente.")
      await loadStatus()
    } catch (error) {
      console.error("Error activando huella:", error)
      setMessage("No se pudo activar la huella.")
    } finally {
      setWorking(false)
    }
  }

  async function handleDisable() {
    try {
      setWorking(true)
      setMessage("")

      await disableBiometricLogin()
      setMessage("Ingreso con huella desactivado.")
      await loadStatus()
    } catch (error) {
      console.error("Error desactivando huella:", error)
      setMessage("No se pudo desactivar la huella.")
    } finally {
      setWorking(false)
    }
  }

  if (!visible) return null

  const disabled = loading || working || !status.available

  return (
    <section className="relative overflow-hidden rounded-[1.6rem] border border-orange-500/20 bg-black/45 p-4 shadow-2xl shadow-black/30">
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-orange-500/15 blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
              Seguridad
            </p>

            <h3 className="mt-1 text-xl font-black text-white">
              Ingreso con huella
            </h3>

            <p className="mt-1 text-sm leading-5 text-white/55">
              {loading ? "Revisando dispositivo..." : getStatusText(status)}
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-500/25 bg-orange-500/10 text-2xl">
            🔐
          </div>
        </div>

        {status.available ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-white/70">
                  Estado
                </p>
                <p
                  className={[
                    "mt-0.5 text-sm font-black",
                    status.enabled ? "text-emerald-300" : "text-white/45",
                  ].join(" ")}
                >
                  {status.enabled ? "Activado" : "Desactivado"}
                </p>
              </div>

              <span
                className={[
                  "rounded-full border px-3 py-1 text-[10px] font-black uppercase",
                  status.enabled
                    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                    : "border-white/10 bg-black/35 text-white/45",
                ].join(" ")}
              >
                {status.enabled ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>
        ) : null}

        {message ? (
          <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/70">
            {message}
          </p>
        ) : null}

        <div className="mt-4">
          {status.enabled ? (
            <button
              type="button"
              onClick={handleDisable}
              disabled={loading || working}
              className="flex h-12 w-full items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/10 px-4 text-sm font-black uppercase text-red-300 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {working ? "Procesando..." : "Desactivar huella"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleEnable}
              disabled={disabled}
              className="flex h-12 w-full items-center justify-center rounded-2xl bg-orange-500 px-4 text-sm font-black uppercase text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {working ? "Verificando..." : "Activar ingreso con huella"}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
