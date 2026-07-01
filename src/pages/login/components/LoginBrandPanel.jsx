// src/pages/login/components/LoginBrandPanel.jsx

import phoenixLoginLogo from "../assets/pho3nix-login-logo.png"

export default function LoginBrandPanel() {
  return (
    <div className="phoenix-login-brand-panel hidden min-w-0 flex-col items-center justify-center text-center lg:flex">
      <div className="relative flex items-center justify-center">
        <div className="phoenix-login-brand-logo-glow absolute h-[420px] w-[420px] rounded-full bg-orange-500/20 blur-3xl" />

        <img
          src={phoenixLoginLogo}
          alt="PHO3NIX"
          className="phoenix-login-logo relative z-10 w-[520px] max-w-full object-contain drop-shadow-[0_0_45px_rgba(249,115,22,0.75)]"
          draggable="false"
        />
      </div>

      <p className="mt-3 text-sm font-semibold uppercase tracking-[0.35em] text-orange-300">
        RENACE MÁS FUERTE
      </p>

      <p className="mt-6 max-w-md text-sm leading-6 text-white/50">
        Accede a tu espacio PHO3NIX para revisar WODs, resultados, rankings,
        mensualidades y novedades del box.
      </p>
    </div>
  )
}
