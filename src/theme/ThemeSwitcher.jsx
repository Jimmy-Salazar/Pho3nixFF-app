// src/theme/ThemeSwitcher.jsx
// Opcional: úsalo luego en Admin/Configuración.

import { usePhoenixTheme } from "./ThemeProvider"

export default function ThemeSwitcher() {
  const themeContext = usePhoenixTheme()

  if (!themeContext) return null

  const { themeCode, options, setTheme, setAutoTheme, resetTheme } = themeContext

  return (
    <div className="rounded-2xl border border-white/10 bg-black/45 p-4 text-white">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/50">
        Tema visual
      </p>

      <div className="mt-3 grid gap-2">
        {options.map((theme) => {
          const active = theme.code === themeCode

          return (
            <button
              key={theme.code}
              type="button"
              onClick={() => setTheme(theme.code)}
              className={[
                "rounded-xl border px-4 py-3 text-left text-sm font-black uppercase transition",
                active
                  ? "border-sky-400/45 bg-sky-400/15 text-sky-300"
                  : "border-white/10 bg-white/[0.04] text-white/60 hover:border-sky-400/30 hover:text-sky-300",
              ].join(" ")}
            >
              <span className="block">{theme.label}</span>
              {theme.description ? (
                <span className="mt-1 block text-[10px] font-semibold normal-case text-white/35">
                  {theme.description}
                </span>
              ) : null}
            </button>
          )
        })}

        <button
          type="button"
          onClick={setAutoTheme}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm font-black uppercase text-white/60 hover:border-sky-400/30 hover:text-sky-300"
        >
          Automático por fecha
        </button>

        <button
          type="button"
          onClick={resetTheme}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm font-black uppercase text-white/40 hover:text-white/70"
        >
          Resetear tema
        </button>
      </div>
    </div>
  )
}
