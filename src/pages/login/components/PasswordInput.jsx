// src/pages/login/components/PasswordInput.jsx

export default function PasswordInput({
  label,
  value,
  onChange,
  show,
  onToggle,
  autoComplete = "new-password",
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/70">
        {label}
      </label>

      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/45">
          🔒
        </span>

        <input
          type={show ? "text" : "password"}
          className="h-14 w-full rounded-2xl border border-white/15 bg-black/35 px-12 pr-14 text-white outline-none transition placeholder:text-white/35 focus:border-orange-400/55 focus:shadow-[0_0_0_4px_rgba(249,115,22,0.15)]"
          placeholder="••••••••"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          autoComplete={autoComplete}
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-white/50 transition hover:text-orange-300"
          aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {show ? "🙈" : "👁️"}
        </button>
      </div>
    </div>
  )
}
