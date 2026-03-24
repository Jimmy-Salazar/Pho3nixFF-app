import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { supabase } from "../supabase"
import heroImage from "../assets/hero-home.png"
import lycanLogo from "../assets/lycan.png"

export default function Home() {
  const [todayWod, setTodayWod] = useState(null)
  const [todayWodLoading, setTodayWodLoading] = useState(true)

  useEffect(() => {
    const elements = document.querySelectorAll("[data-reveal]")

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed")
          }
        })
      },
      { threshold: 0.14 }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let alive = true

    async function loadTodayWod() {
      try {
        setTodayWodLoading(true)

        const now = new Date()
        const todayIso = formatDateISO(now)

        const { data, error } = await supabase
          .from("wod")
          .select(
            "id,nombre,descripcion,modo_ranking,modalidad,fecha,activo,publicado,fecha_publicacion"
          )
          .eq("fecha", todayIso)
          .eq("activo", true)
          .limit(5)

        if (error) throw error

        const safeRows = (data || []).filter((item) => {
          if (item.publicado === true && item.fecha_publicacion) {
            return new Date(item.fecha_publicacion) <= now
          }
          return true
        })

        if (!alive) return
        setTodayWod(safeRows[0] || null)
      } catch (error) {
        console.error("Error cargando WOD del día:", error)
        if (!alive) return
        setTodayWod(null)
      } finally {
        if (alive) setTodayWodLoading(false)
      }
    }

    loadTodayWod()

    return () => {
      alive = false
    }
  }, [])

  const weekMorning = ["06:00", "07:00", "08:00", "09:00"]
  const weekEvening = ["17:00", "18:00", "19:00"]

  const socialLinks = {
    instagram: "https://instagram.com/pho3nixff.ec",
    whatsapp:
      "https://wa.me/593979727407?text=Hola%20quiero%20informacion%20de%20PHO3NIX",
    maps: "https://maps.app.goo.gl/qSocV6BHLWw9suH76",
    lycan:
      "https://lycan-fitness.com/?srsltid=AfmBOopUbg9AGdXkQgLgQJ5FT71xo7ncg0QxI-oIZCwP2tfAsBcxoRH2",
    tiktok: "https://www.tiktok.com/@pho3nixff.ec",
  }

  const values = [
    {
      title: "Entrena con propósito",
      description:
        "Cada clase tiene estructura, intención y exigencia real.",
    },
    {
      title: "Evolución progresiva",
      description:
        "El progreso se construye con disciplina, constancia y buena técnica.",
    },
    {
      title: "Mentalidad competitiva",
      description:
        "Entrenamos para rendir mejor dentro y fuera del box.",
    },
  ]

  return (
    <>
      <style>{`
        html {
          scroll-behavior: smooth;
        }

        @keyframes heroZoom {
          0% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.045) translateY(-6px); }
          100% { transform: scale(1) translateY(0); }
        }

        .hero-cinematic {
          animation: heroZoom 15s ease-in-out infinite;
          transform-origin: center center;
        }

        @keyframes glowText {
          0% { text-shadow: 0 0 0 rgba(249, 115, 22, 0.18); }
          50% { text-shadow: 0 0 18px rgba(249, 115, 22, 0.28); }
          100% { text-shadow: 0 0 0 rgba(249, 115, 22, 0.18); }
        }

        .hero-tagline {
          animation: glowText 3.5s ease-in-out infinite;
        }

        @keyframes lineSweep {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          20% {
            opacity: 0.4;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        .games-line {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(249, 115, 22, 0.05) 22%,
            rgba(249, 115, 22, 0.42) 50%,
            rgba(249, 115, 22, 0.05) 78%,
            transparent 100%
          );
          animation: lineSweep 5.4s linear infinite;
        }

        .reveal-base {
          opacity: 0;
          transition:
            opacity 0.9s ease,
            transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
          will-change: opacity, transform;
        }

        .reveal-left {
          transform: translateX(-56px);
        }

        .reveal-right {
          transform: translateX(56px);
        }

        .reveal-center {
          transform: translateY(40px) scale(0.985);
        }

        .revealed {
          opacity: 1;
          transform: translateX(0) translateY(0) scale(1);
        }

        @keyframes pulseSoft {
          0% { box-shadow: 0 0 0 rgba(249,115,22,0.08); }
          50% { box-shadow: 0 0 24px rgba(249,115,22,0.15); }
          100% { box-shadow: 0 0 0 rgba(249,115,22,0.08); }
        }

        .open-box-card {
          animation: pulseSoft 3.5s ease-in-out infinite;
        }

        .section-card {
          background:
            linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03));
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(10px);
        }

        .schedule-grid-card {
          background:
            linear-gradient(180deg, rgba(10,10,12,0.55), rgba(255,255,255,0.03));
          border: 1px solid rgba(255,255,255,0.08);
        }

        .floating-socials {
          position: fixed;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 60;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .floating-social-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 52px;
          height: 52px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(8, 11, 18, 0.72);
          backdrop-filter: blur(10px);
          color: white;
          transition: transform 0.25s ease, background 0.25s ease, border-color 0.25s ease;
          box-shadow: 0 8px 24px rgba(0,0,0,0.28);
        }

        .floating-social-btn:hover {
          transform: translateX(-3px) scale(1.05);
          background: rgba(249, 115, 22, 0.16);
          border-color: rgba(249, 115, 22, 0.25);
        }

        @media (max-width: 1024px) {
          .floating-socials {
            right: 10px;
            bottom: 14px;
            top: auto;
            transform: none;
          }

          .floating-social-btn {
            width: 48px;
            height: 48px;
            border-radius: 16px;
          }
        }

        @media (max-width: 640px) {
          .floating-socials {
            gap: 10px;
          }

          .floating-social-btn {
            width: 44px;
            height: 44px;
            border-radius: 14px;
          }
        }
      `}</style>

      <div className="min-h-screen overflow-x-hidden bg-[#0b0f17] text-white">
        <div className="floating-socials">
          <a
            href={socialLinks.instagram}
            target="_blank"
            rel="noreferrer"
            className="floating-social-btn"
            aria-label="Instagram"
            title="Instagram"
          >
            <InstagramIcon />
          </a>

          <a
            href={socialLinks.tiktok}
            target="_blank"
            rel="noreferrer"
            className="floating-social-btn"
            aria-label="TikTok"
            title="TikTok"
          >
            <TikTokIcon />
          </a>

          <a
            href={socialLinks.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="floating-social-btn"
            aria-label="WhatsApp"
            title="WhatsApp"
          >
            <WhatsAppIcon />
          </a>

          <a
            href={socialLinks.maps}
            target="_blank"
            rel="noreferrer"
            className="floating-social-btn"
            aria-label="Ubicación"
            title="Ubicación"
          >
            <MapPinIcon />
          </a>
        </div>

        <section className="relative min-h-screen overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={heroImage}
              alt="Atleta entrenando en PHO3NIX"
              className="hero-cinematic h-full w-full object-cover object-center"
            />
          </div>

          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.20),_transparent_35%),linear-gradient(180deg,_rgba(11,15,23,0.32)_0%,_rgba(11,15,23,0.52)_45%,_rgba(11,15,23,0.84)_100%)]" />
          <div className="games-line absolute left-0 top-24 h-px w-full opacity-50" />

          <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-6 py-16 sm:px-8 lg:px-12">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-sm text-orange-200 backdrop-blur-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/15 text-2xl shadow-lg shadow-orange-500/20">
                  🔥
                </div>
                <span className="text-xs font-bold tracking-[0.25em] sm:text-sm">
                  PHO3NIX FUNCTIONAL FITNESS
                </span>
              </div>

              <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                Fuerza, disciplina y evolución en cada sesión.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Un box diseñado para personas que buscan rendimiento real,
                comunidad y progreso constante dentro de un entorno exigente,
                técnico y profesional.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition duration-300 hover:scale-[1.03] hover:bg-orange-400"
                >
                  Iniciar sesión
                </Link>

                <a
                  href="#wod"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition duration-300 hover:bg-white/10"
                >
                  Ver inicio
                </a>
              </div>
            </div>
          </div>

          <div className="absolute bottom-8 right-6 z-10 max-w-md text-right sm:bottom-10 sm:right-10">
            <p className="hero-tagline text-lg font-bold text-white/95 sm:text-2xl">
              Renace más fuerte en cada entrenamiento.
            </p>
          </div>
        </section>

        <section
          id="wod"
          className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12"
        >
          <div
            data-reveal
            className="reveal-base reveal-center section-card rounded-[28px] p-8 md:p-10"
          >
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
              <div>
                <h2 className="text-sm text-3xl font-semibold uppercase text-orange-300 sm:text-4xl">
                  Wod del día
                </h2>

                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
                  {todayWodLoading
                    ? "Cargando WOD del día..."
                    : todayWod?.descripcion ||
                      "No hay WOD publicado para hoy."}
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                      Estado
                    </p>
                    <p className="mt-2 text-xl font-bold text-white">
                      {todayWodLoading
                        ? "Cargando..."
                        : todayWod
                        ? "WOD publicado"
                        : "Sin publicación"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-orange-200">
                      Modalidad
                    </p>
                    <p className="mt-2 text-xl font-bold text-white">
                      {todayWodLoading
                        ? "..."
                        : todayWod
                        ? formatModalidad(todayWod.modalidad)
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-black/30 p-6">
                {todayWodLoading ? (
                  <div>
                    <div className="mb-5">
                      <div className="h-4 w-28 animate-pulse rounded bg-white/10" />
                      <div className="mt-3 h-6 w-52 animate-pulse rounded bg-white/10" />
                    </div>

                    <div className="grid gap-3">
                      {[1, 2, 3].map((item) => (
                        <div
                          key={item}
                          className="h-16 animate-pulse rounded-2xl border border-white/10 bg-white/5"
                        />
                      ))}
                    </div>
                  </div>
                ) : todayWod ? (
                  <>
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">
                          WOD Publicado
                        </div>

                        <p className="mt-3 text-2xl font-black text-white">
                          {todayWod.nombre || "WOD del día"}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <p className="whitespace-pre-line text-sm leading-7 text-slate-200 sm:text-base">
                        {todayWod.descripcion || "Sin descripción disponible."}
                      </p>
                    </div>

                    <div className="mt-5 text-sm text-orange-300">
                      Disponible hoy en PHO3NIX
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-5">
                    <p className="text-sm leading-7 text-slate-300">
                      No hay WOD publicado para hoy.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section
          id="horarios"
          className="mx-auto max-w-7xl px-6 py-4 sm:px-8 lg:px-12"
        >
          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-300">
              Horarios
            </p>
            <h2 className="mt-4 text-3xl font-black sm:text-4xl">
              Bloques de entrenamiento
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
              Distribución clara de sesiones para mantener constancia, orden y
              disponibilidad durante la semana.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1fr_0.95fr]">
            <div
              data-reveal
              className="reveal-base reveal-left schedule-grid-card rounded-[28px] p-6"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.20em] text-orange-300">
                    Bloque mañana
                  </p>
                  <p className="mt-1 text-sm text-slate-400">Lunes a viernes</p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  AM
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {weekMorning.map((time) => (
                  <div
                    key={time}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-center"
                  >
                    <p className="text-lg font-bold text-white">{time}</p>
                  </div>
                ))}
              </div>
            </div>

            <div
              data-reveal
              className="reveal-base reveal-right schedule-grid-card rounded-[28px] p-6"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.20em] text-orange-300">
                    Bloque tarde
                  </p>
                  <p className="mt-1 text-sm text-slate-400">Lunes a viernes</p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  PM
                </div>
              </div>

              <div className="grid gap-3">
                {weekEvening.map((time) => (
                  <div
                    key={time}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5"
                  >
                    <p className="text-center text-lg font-bold text-white">
                      {time}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div
              data-reveal
              className="reveal-base reveal-center open-box-card rounded-[28px] border border-orange-500/20 bg-gradient-to-br from-orange-500/12 to-orange-500/5 p-6"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.20em] text-orange-200">
                    Sábado
                  </p>
                  <p className="mt-1 text-sm text-slate-300">Espacio libre</p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white">
                  OPEN BOX
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-black/25 p-6">
                <p className="text-xs uppercase tracking-[0.22em] text-orange-200">
                  Horario
                </p>
                <p className="mt-3 text-3xl font-black text-white">
                  08:00 AM - 10:00 AM
                </p>
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  Espacio para práctica, trabajo libre y mejora técnica en un
                  entorno controlado.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div
              data-reveal
              className="reveal-base reveal-left"
            >
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

            <div
              data-reveal
              className="reveal-base reveal-right section-card rounded-[28px] p-6"
            >
              <h3 className="text-xl font-bold">Lo que nos define</h3>

              <div className="mt-6 space-y-4">
                {values.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <p className="font-semibold text-orange-300">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20 sm:px-8 lg:px-12">
          <div
            data-reveal
            className="reveal-base reveal-center rounded-[28px] border border-orange-500/20 bg-gradient-to-br from-orange-500/12 via-orange-500/8 to-transparent p-8 text-center md:p-12"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-200">
              Acceso
            </p>
            <h2 className="mt-4 text-3xl font-black sm:text-4xl">
              ¿Ya formas parte de PHO3NIX?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Ingresa a tu cuenta para revisar tu progreso, consultar información
              del box y acceder a los módulos internos de la plataforma.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-5">
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-2xl bg-orange-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:scale-[1.02] hover:bg-orange-400"
              >
                Ir al login
              </Link>

              <a
                href={socialLinks.instagram}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <InstagramIcon />
                Instagram
              </a>

              <a
                href={socialLinks.tiktok}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <TikTokIcon />
                TikTok
              </a>

              <a
                href={socialLinks.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <WhatsAppIcon />
                WhatsApp
              </a>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10 bg-black/20">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8 text-sm text-slate-400 sm:px-8 lg:px-12 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-semibold text-white">PHO3NIX Functional Fitness</p>
              <p className="mt-1">Disciplina • Fuerza • Evolución</p>
              <p className="mt-2 text-xs text-slate-500">
                ©2026 Pho3nixff.ec. Todos los derechos reservados.
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Sitio por Neutron
              </p>
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
                alt="Lycan Ecuador"
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
      </div>
    </>
  )
}

function formatDateISO(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatModalidad(modalidad) {
  const m = String(modalidad || "").trim().toLowerCase()

  if (m === "single") return "Single"
  if (m === "duo") return "Duo"
  if (m === "trio") return "Trio"

  return "Single"
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