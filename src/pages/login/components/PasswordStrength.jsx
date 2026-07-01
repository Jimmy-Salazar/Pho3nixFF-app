// src/pages/login/components/PasswordStrength.jsx

export default function PasswordStrength({ strength }) {
  return (
    <div className="phoenix-login-password-strength">
      <div className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-white/70">
        Seguridad de la contraseña
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={[
              "h-2 rounded-full",
              step <= strength
                ? "bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.65)]"
                : "bg-white/20",
            ].join(" ")}
          />
        ))}
      </div>

      <div className="mt-2 grid grid-cols-4 text-center text-[10px] font-black uppercase text-white/55">
        <span className={strength <= 1 ? "text-orange-300" : ""}>Débil</span>
        <span className={strength === 2 ? "text-orange-300" : ""}>Media</span>
        <span className={strength === 3 ? "text-orange-300" : ""}>Buena</span>
        <span className={strength === 4 ? "text-orange-300" : ""}>Fuerte</span>
      </div>
    </div>
  )
}
