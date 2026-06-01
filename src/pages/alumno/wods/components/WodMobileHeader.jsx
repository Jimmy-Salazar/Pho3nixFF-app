import pho3nixLogo from "../../../../assets/pho3nix-login-logo.png"

export default function WodMobileHeader({ profile, initials, loading, onBack }) {
  return (
    <header className="w-full max-w-full overflow-hidden lg:hidden">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-2xl text-orange-300"
          aria-label="Volver al dashboard"
        >
          ☰
        </button>

        <div className="flex min-w-0 items-center justify-center gap-2">
          <img
            src={pho3nixLogo}
            alt="PHO3NIX"
            className="h-10 w-10 shrink-0 object-contain drop-shadow-[0_0_18px_rgba(249,115,22,0.4)]"
          />

          <div className="min-w-0 text-center">
            <p className="truncate text-2xl font-black tracking-[0.16em] text-white">
              PHO<span className="text-orange-500">3</span>NIX
            </p>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-500">
              WODs
            </p>
          </div>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-orange-500/35 bg-orange-500/15 text-sm font-black text-orange-300 shadow-[0_0_20px_rgba(249,115,22,0.2)]">
          {loading ? "..." : initials}
        </div>
      </div>

      <div className="mt-4 min-w-0">
        <h1 className="text-3xl font-black uppercase leading-tight text-white">
          WOD del <span className="text-orange-500">día</span>
        </h1>
        <p className="mt-1 truncate text-sm text-white/50">
          {profile?.nombre || "Alumno PHO3NIX"}
        </p>
      </div>
    </header>
  )
}
