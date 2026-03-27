import lycanLogo from "../assets/lycan.png"
import pho3nixLogo from "../assets/pho3nix-logo.png"

export default function Footer() {
  const socialLinks = {
    instagram: "https://instagram.com/pho3nixff.ec",
    tiktok: "https://www.tiktok.com/@pho3nixff.ec",
    whatsapp:
      "https://wa.me/593979727407?text=Hola%20quiero%20informacion%20de%20PHO3NIX",
    maps: "https://maps.app.goo.gl/qSocV6BHLWw9suH76",
    lycan:
      "https://lycan-fitness.com/?srsltid=AfmBOopUbg9AGdXkQgLgQJ5FT71xo7ncg0QxI-oIZCwP2tfAsBcxoRH2",
  }

  return (
    <footer className="border-t border-white/10 bg-black/20">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8 text-sm text-slate-400 sm:px-8 lg:px-12 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="footer-logo-wrap h-15 w-15 overflow-hidden rounded-2xl border border-white/5 bg-black/40">
            <img
              src={pho3nixLogo}
              alt="Pho3nix"
              className="h-full w-full object-cover"
            />
          </div>

          <div>
            <p className="font-semibold text-white">
              PHO3NIX Functional Fitness
            </p>

            <p className="mt-1">
              Disciplina • Fuerza • Evolución
            </p>

            <p className="mt-2 text-xs text-slate-500">
              ©2026 Pho3nix Functional Fitness — Producto registrado
            </p>

            <p className="mt-2 text-xs text-slate-500">
              By Neutron
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <a
            href={socialLinks.instagram}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-3 hover:text-white"
          >
            <InstagramIcon />
            Instagram
          </a>

          <a
            href={socialLinks.tiktok}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-3 hover:text-white"
          >
            <TikTokIcon />
            TikTok
          </a>

          <a
            href={socialLinks.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-3 hover:text-white"
          >
            <WhatsAppIcon />
            WhatsApp
          </a>

          <a
            href={socialLinks.maps}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-3 hover:text-white"
          >
            <MapPinIcon />
            Ubicación
          </a>
        </div>

        <a
          href={socialLinks.lycan}
          target="_blank"
          rel="noreferrer"
          className="group inline-flex items-center gap-4 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 transition hover:border-orange-500/20 hover:bg-white/10"
        >
          <img
            src={lycanLogo}
            alt="Lycan"
            className="h-12 w-auto object-contain opacity-90 transition duration-300 group-hover:scale-105 group-hover:opacity-100"
          />

          <div>
            <p className="text-xs uppercase tracking-[0.20em] text-slate-500">
              Official Equipment Partner
            </p>

            <p className="font-semibold text-white group-hover:text-orange-300">
              Lycan Ecuador
            </p>
          </div>
        </a>
      </div>
    </footer>
  )
}

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
      <path d="M16 11.37a4 4 0 1 1-3.37-3.37A4 4 0 0 1 16 11.37z" />
      <path d="M17.5 6.5h.01" />
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="currentColor"
    >
      <path d="M16.5 3c.3 1.7 1.5 3.1 3.2 3.5v3.2c-1.3 0-2.5-.4-3.5-1.1v6.1c0 3.1-2.5 5.6-5.6 5.6S5 17.8 5 14.7s2.5-5.6 5.6-5.6c.3 0 .7 0 1 .1v3.3c-.3-.1-.6-.2-1-.2-1.3 0-2.3 1-2.3 2.3S9.3 17 10.6 17s2.3-1 2.3-2.3V3h3.6z" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 11.5a8.5 8.5 0 0 1-12.56 7.5L3 20.5l1.57-5.18A8.5 8.5 0 1 1 21 11.5Z" />
      <path d="M9 9.5c.2-.5.4-.5.7-.5h.6c.2 0 .5 0 .7.5.3.7 1 2.3 1.1 2.4.1.2.1.4 0 .6-.1.2-.2.4-.4.6l-.5.5c-.2.2-.3.3-.1.6.2.3.8 1.3 1.8 2 .2.2.5.4.8.6.3.2.5.2.7 0l.8-.9c.2-.2.4-.2.7-.1.3.1 1.8.8 2.1 1 .3.1.5.2.5.4 0 .2 0 1-.6 1.6-.6.6-1.4.9-2 .9-.6 0-1.4-.2-2.6-.7a10.8 10.8 0 0 1-4-2.8 9.7 9.7 0 0 1-2.2-3.6c-.4-1.1-.4-2-.3-2.5.2-.5.7-1.3 1.2-1.5Z" />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21s-6-5.33-6-10a6 6 0 1 1 12 0c0 4.67-6 10-6 10Z" />
      <circle cx="12" cy="11" r="2.5" />
    </svg>
  )
}