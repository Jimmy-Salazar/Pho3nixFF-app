// src/theme/ThemeSwitcher.jsx
// Componente opcional para usar luego en Configuración/Admin.
// No está conectado todavía para no tocar secciones existentes.

import { usePhoenixTheme } from "./ThemeProvider"

export default function ThemeSwitcher() {
  const themeContext = usePhoenixTheme()

  if (!themeContext) return null

  const { themeCode, options, setTheme, setAutoTheme } = themeContext

  return (
    <div className="rounded-2xl border border-white/10 bg-black/45 p-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-white/65">
        Tema visual
      </p>

      <div className="mt-3 grid gap-2">
        <button
          type="button"
          onClick={setAutoTheme}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black uppercase text-white/65"
        >
          Automático por fecha
        </button>

        {options.map((item) => {
          const active = item.code === themeCode

          return (
            <button
              key={item.code}
              type="button"
              onClick={() => setTheme(item.code)}
              className={[
                "rounded-xl border px-3 py-2 text-left text-xs font-black uppercase transition",
                active
                  ? "border-orange-500/35 bg-orange-500/15 text-orange-300"
                  : "border-white/10 bg-white/[0.04] text-white/55",
              ].join(" ")}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
