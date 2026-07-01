// src/pages/login/components/CreatePasswordModal.jsx

import { useState } from "react"
import { supabase } from "../../../supabase"
import phoenixLoginLogo from "../assets/pho3nix-login-logo.png"
import PasswordInput from "./PasswordInput"
import PasswordStrength from "./PasswordStrength"
import RequirementItem from "./RequirementItem"
import usePasswordStrength from "../hooks/usePasswordStrength"

export default function CreatePasswordModal({ initialEmail = "", onClose }) {
  const [email, setEmail] = useState(initialEmail || "")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")

  const { checks, strength } = usePasswordStrength(newPassword)

  async function handleCreatePassword(e) {
    e.preventDefault()

    if (!email.trim()) {
      setMessageType("error")
      setMessage("Escribe tu correo electrónico.")
      return
    }

    if (newPassword !== confirmPassword) {
      setMessageType("error")
      setMessage("Las contraseñas no coinciden.")
      return
    }

    if (strength < 4) {
      setMessageType("error")
      setMessage("La contraseña debe cumplir todos los requisitos.")
      return
    }

    try {
      setSaving(true)
      setMessage("")
      setMessageType("")

      const { data } = await supabase.auth.getSession()

      if (data?.session) {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        })

        if (error) throw error

        setMessageType("success")
        setMessage("Contraseña creada correctamente. Ya puedes iniciar sesión.")
        return
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/set-password`,
      })

      if (error) throw error

      setMessageType("success")
      setMessage(
        "Por seguridad te enviamos un enlace a tu correo para crear o actualizar tu contraseña."
      )
    } catch (err) {
      setMessageType("error")
      setMessage(err?.message || "No se pudo crear la contraseña.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="phoenix-login-create-password-modal fixed inset-0 z-[160] flex items-center justify-center px-3 py-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
        aria-label="Cerrar"
      />

      <form
        onSubmit={handleCreatePassword}
        className="phoenix-login-create-password-card relative z-[161] w-full max-w-[560px] overflow-hidden rounded-[2rem] border border-orange-500/35 bg-black/70 shadow-[0_0_70px_rgba(249,115,22,0.22)] backdrop-blur-2xl"
      >
        <div className="phoenix-login-card-glow-a pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="phoenix-login-card-glow-b pointer-events-none absolute -bottom-20 -left-12 h-64 w-64 rounded-full bg-orange-700/15 blur-3xl" />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-2xl text-white/70 transition hover:border-orange-400/40 hover:text-orange-300"
          aria-label="Cerrar"
        >
          ×
        </button>

        <div className="relative z-10 px-6 py-7 sm:px-10 sm:py-8">
          <div className="mb-5 flex justify-center">
            <img
              src={phoenixLoginLogo}
              alt="PHO3NIX"
              className="phoenix-login-logo w-[210px] object-contain drop-shadow-[0_0_25px_rgba(249,115,22,0.65)]"
              draggable="false"
            />
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
              <span className="text-orange-500">Crear</span> contraseña
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/60">
              Crea una contraseña segura para proteger tu cuenta y continuar tu transformación.
            </p>
          </div>

          <div className="mt-6 space-y-4">
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
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <PasswordInput
              label="Nueva contraseña"
              value={newPassword}
              onChange={setNewPassword}
              show={showNewPassword}
              onToggle={() => setShowNewPassword((prev) => !prev)}
              autoComplete="new-password"
            />

            <PasswordStrength strength={strength} />

            <PasswordInput
              label="Confirmar contraseña"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((prev) => !prev)}
              autoComplete="new-password"
            />

            <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
              <RequirementItem ok={checks.min} text="Mínimo 8 caracteres" />
              <RequirementItem ok={checks.number} text="Un número" />
              <RequirementItem ok={checks.upper} text="Una mayúscula" />
              <RequirementItem ok={checks.symbol} text="Un símbolo" />
            </div>

            {message ? (
              <div
                className={[
                  "rounded-2xl border px-4 py-3 text-sm leading-6",
                  messageType === "success"
                    ? "border-green-400/25 bg-green-500/10 text-green-200"
                    : "border-red-400/25 bg-red-500/10 text-red-200",
                ].join(" ")}
              >
                {message}
              </div>
            ) : null}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-[0.9fr_1.45fr]">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-14 rounded-2xl border border-white/15 bg-black/35 text-sm font-black uppercase tracking-[0.12em] text-white/75 transition hover:border-orange-400/40 hover:text-orange-300 disabled:opacity-60"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="h-14 rounded-2xl bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 text-sm font-black uppercase tracking-[0.14em] text-black shadow-[0_0_35px_rgba(249,115,22,0.35)] transition hover:scale-[1.01] disabled:cursor-wait disabled:opacity-70"
            >
              {saving ? "Procesando..." : "Crear contraseña →"}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
