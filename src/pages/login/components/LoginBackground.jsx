// src/pages/login/components/LoginBackground.jsx

import heroHome from "../../../assets/hero-home.png"

export default function LoginBackground() {
  return (
    <>
      <div
        className="phoenix-login-bg-image absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${heroHome}")` }}
      />

      <div className="phoenix-login-bg-dark absolute inset-0 bg-black/76" />

      <div className="phoenix-login-bg-radial absolute inset-0 bg-[radial-gradient(circle_at_28%_45%,rgba(249,115,22,0.24),transparent_28%),radial-gradient(circle_at_74%_35%,rgba(234,88,12,0.16),transparent_32%),linear-gradient(90deg,rgba(0,0,0,0.94)_0%,rgba(0,0,0,0.58)_48%,rgba(0,0,0,0.90)_100%)]" />

      <div className="phoenix-login-ring-a pointer-events-none absolute -bottom-28 -left-20 h-[520px] w-[520px] rounded-full border border-orange-500/45 shadow-[0_0_55px_rgba(249,115,22,0.45)]" />

      <div className="phoenix-login-ring-b pointer-events-none absolute -bottom-40 right-[-90px] h-[520px] w-[520px] rounded-full border border-orange-500/35 shadow-[0_0_55px_rgba(249,115,22,0.35)]" />

      <div className="phoenix-login-watermark pointer-events-none absolute right-[-40px] top-1/2 hidden -translate-y-1/2 rotate-90 select-none text-[7rem] font-black uppercase leading-none tracking-[0.18em] text-transparent [-webkit-text-stroke:1px_rgba(249,115,22,0.20)] xl:block">
        PHO3NIX
      </div>
    </>
  )
}
