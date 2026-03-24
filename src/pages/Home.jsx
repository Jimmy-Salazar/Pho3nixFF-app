import { Link } from "react-router-dom"

export default function Home() {
  const weekMorning = ["06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM"]
  const weekEvening = ["05:00 PM", "06:00 PM", "07:00 PM"]

  const socialLinks = {
    instagram: "https://instagram.com/pho3nixff.ec",
    whatsapp: "https://wa.me/593979727407?text=Hola%2C%20quiero%20informaci%C3%B3n%20de%20PHO3NIX",
    maps: "https://maps.app.goo.gl/qSocV6BHLWw9suH76",
  }

  const benefits = [
    {
      title: "Entrenamiento funcional",
      description:
        "Sesiones dinámicas enfocadas en fuerza, resistencia, movilidad y rendimiento real.",
      icon: "🏋️",
    },
    {
      title: "Comunidad y disciplina",
      description:
        "Un ambiente que te exige, te impulsa y te ayuda a evolucionar con constancia.",
      icon: "🔥",
    },
    {
      title: "Progreso medible",
      description:
        "Cada entrenamiento es una oportunidad para mejorar marcas, técnica y capacidad física.",
      icon: "📈",
    },
  ]

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0b0f17] text-white">
	//<img
 // src="https://rmolvzjluxutxmxzthjp.supabase.co/storage/v1/object/public/images/logo.png"
 // alt="Logo Pho3nix"
 // className="fixed top-4 right-6 w-20 sm:w-24 md:w-28 opacity-90 hover:scale-105 transition duration-300 z-50"
/>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.20),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(234,88,12,0.16),_transparent_24%),linear-gradient(180deg,_#101522_0%,_#0b0f17_50%,_#090c12_100%)]" />

        <div className="phoenix-orb absolute -left-20 top-10 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="phoenix-orb-delayed absolute right-[-70px] top-24 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="games-line absolute left-0 top-24 h-px w-full opacity-40" />
        <div className="games-line-delayed absolute left-0 top-40 h-px w-full opacity-30" />

        <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-16 sm:px-8 lg:px-12">
          <div className="grid w-full gap-14 lg:grid-cols-2 lg:items-center">
            <div className="fade-up">
              <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-sm text-orange-200 backdrop-blur-sm">
                <div className="phoenix-logo-fire flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/15 text-2xl shadow-lg shadow-orange-500/20">
                  🔥
                </div>
                <span className="phoenix-title-games text-xs font-bold tracking-[0.25em] sm:text-sm">
                  PHO3NIX FUNCTIONAL FITNESS
                </span>
              </div>

              <h1 className="games-title max-w-3xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                Renace más fuerte en cada entrenamiento.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Un box diseñado para personas que buscan disciplina, rendimiento,
                comunidad y evolución real. En PHO3NIX entrenas con intensidad,
                técnica y propósito.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition duration-300 hover:scale-[1.03] hover:bg-orange-400"
                >
                  Iniciar sesión
                </Link>

                <a
                  href="#horarios"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition duration-300 hover:bg-white/10"
                >
                  Ver horarios
                </a>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <p className="text-2xl font-bold text-orange-300">Fuerza</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Construye potencia y control.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <p className="text-2xl font-bold text-orange-300">Resistencia</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Mejora tu condición física.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <p className="text-2xl font-bold text-orange-300">Disciplina</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Evoluciona con constancia.
                  </p>
                </div>
              </div>
            </div>

            <div className="fade-up-delayed relative">
              <div className="games-frame rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-md">
                <div className="rounded-[28px] border border-orange-500/20 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.25em] text-orange-300/80">
                        PHO3NIX
                      </p>
                      <h2 className="mt-2 text-2xl font-bold">
                        Functional Fitness
                      </h2>
                    </div>

                    <div className="phoenix-logo-fire flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/15 text-3xl shadow-inner shadow-orange-500/10">
                      🔥
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm text-slate-400">Enfoque</p>
                      <p className="mt-1 text-lg font-semibold">
                        Técnica • Rendimiento • Superación
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm text-slate-400">Ambiente</p>
                      <p className="mt-1 text-lg font-semibold">
                        Comunidad fuerte y energía competitiva
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm text-slate-400">Mentalidad</p>
                      <p className="mt-1 text-lg font-semibold">
                        Caer, levantarse y volver más fuerte
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4">
                    <p className="text-sm text-orange-200">
                      “No se trata solo de entrenar. Se trata de evolucionar.”
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <a
                      href={socialLinks.instagram}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                    >
                      <InstagramIcon />
                      Instagram
                    </a>

                    <a
                      href={socialLinks.whatsapp}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                    >
                      <WhatsAppIcon />
                      WhatsApp
                    </a>

                    <a
                      href={socialLinks.maps}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                    >
                      <MapPinIcon />
                      Ubicación
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-300">
              Quiénes somos
            </p>
            <h2 className="mt-4 text-3xl font-black sm:text-4xl">
              Más que un box, una comunidad de evolución.
            </h2>
            <p className="mt-6 max-w-3xl text-base leading-7 text-slate-300">
              PHO3NIX Functional Fitness es un espacio orientado al desarrollo
              físico y mental a través del entrenamiento funcional. Aquí cada
              sesión está diseñada para exigirte, enseñarte y ayudarte a crecer.
            </p>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
              Nuestro enfoque combina intensidad, técnica, progresión y
              acompañamiento para que principiantes y atletas avanzados puedan
              evolucionar dentro de una misma comunidad.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-xl font-bold">Lo que nos define</h3>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="font-semibold text-orange-300">Entrena con propósito</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Cada clase tiene intención, estructura y exigencia real.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="font-semibold text-orange-300">Evolución progresiva</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  El progreso se construye con constancia, técnica y disciplina.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="font-semibold text-orange-300">Mentalidad competitiva</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Entrenamos para rendir mejor dentro y fuera del box.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-6 sm:px-8 lg:px-12">
        <div className="grid gap-6 md:grid-cols-3">
          {benefits.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 transition duration-300 hover:-translate-y-1 hover:bg-white/10"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-3xl">
                {item.icon}
              </div>
              <h3 className="mt-5 text-xl font-bold">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="horarios"
        className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12"
      >
        <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-orange-500/10 via-white/5 to-transparent p-8 md:p-10">
          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-300">
              Horarios
            </p>
            <h2 className="mt-4 text-3xl font-black sm:text-4xl">
              Bloques de entrenamiento y Open Box
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
              Organizamos nuestros bloques para que puedas entrenar en la mañana,
              en la tarde y aprovechar el espacio del sábado para Open Box.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-xl font-bold">Bloque mañana</h3>
                <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-300">
                  Lunes a viernes
                </span>
              </div>

              <div className="grid gap-3">
                {weekMorning.map((time) => (
                  <div
                    key={time}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <p className="text-lg font-semibold text-orange-300">{time}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-xl font-bold">Bloque tarde</h3>
                <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-300">
                  Lunes a viernes
                </span>
              </div>

              <div className="grid gap-3">
                {weekEvening.map((time) => (
                  <div
                    key={time}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <p className="text-lg font-semibold text-orange-300">{time}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="open-box-card rounded-3xl border border-orange-500/20 bg-orange-500/10 p-6">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-xl font-bold">Sábado</h3>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                  OPEN BOX
                </span>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-5">
                <p className="text-sm uppercase tracking-[0.20em] text-orange-200">
                  Horario
                </p>
                <p className="mt-2 text-3xl font-black text-white">08:00 AM - 10:00 AM</p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Espacio para práctica, trabajo libre y mejora técnica.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 sm:px-8 lg:px-12">
        <div className="rounded-3xl border border-orange-500/20 bg-orange-500/10 p-8 text-center md:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-200">
            Acceso
          </p>
          <h2 className="mt-4 text-3xl font-black sm:text-4xl">
            ¿Ya formas parte de PHO3NIX?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Ingresa a tu cuenta para revisar tu progreso, consultar información
            del box y acceder a tus módulos dentro de la plataforma.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-2xl bg-orange-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:scale-[1.02] hover:bg-orange-400"
            >
              Ir al login
            </Link>

            <a
              href={socialLinks.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <WhatsAppIcon />
              Contactar por WhatsApp
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-black/20">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 text-sm text-slate-400 sm:px-8 lg:px-12 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-white">PHO3NIX Functional Fitness</p>
            <p className="mt-1">Disciplina • Fuerza • Evolución</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href={socialLinks.instagram}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 hover:text-white"
            >
              <InstagramIcon />
              Instagram
            </a>

            <a
              href={socialLinks.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 hover:text-white"
            >
              <WhatsAppIcon />
              WhatsApp
            </a>

            <a
              href={socialLinks.maps}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 hover:text-white"
            >
              <MapPinIcon />
              Google Maps
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
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

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
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
      className="h-5 w-5"
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