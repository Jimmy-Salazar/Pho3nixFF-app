import { Link } from "react-router-dom"
import HomeNovedades from "./home/components/HomeNovedades"
import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  Clock3,
  Flame,
  Handshake,
  Megaphone,
  Trophy,
  Users,
} from "lucide-react"

import { supabase } from "../supabase"
import { useSemiAutoTranslation } from "../i18n/useSemiAutoTranslation"
import pho3nixLogo from "../assets/pho3nix-login-logo.png"
import lycanLogo from "../assets/lycan.png"

const HERO_IMAGE_URL =
  "https://rmolvzjluxutxmxzthjp.supabase.co/storage/v1/object/public/images/hero-home.png"

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/pho3nixff.ec",
    icon: "◎",
    text: "@pho3nixff.ec",
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@pho3nixff.ec",
    icon: "♪",
    text: "@pho3nixff.ec",
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/593",
    icon: "✆",
    text: "WhatsApp PHO3NIX",
  },
]

const INFO_CARDS = [
  {
    key: "about",
    icon: Users,
    title: "¿QUIÉNES SOMOS?",
    mobileTitle: "SOMOS",
    text: "Conoce nuestra historia, valores y lo que nos mueve.",
  },
  {
    key: "schedule",
    icon: Clock3,
    title: "HORARIOS",
    mobileTitle: "HORARIOS",
    text: "Descubre nuestros horarios y programaciones.",
  },
  {
    key: "partners",
    icon: Handshake,
    title: "PARTNERS",
    mobileTitle: "PARTNERS",
    text: "Conoce a nuestros aliados que hacen esto posible.",
  },
  {
    key: "news",
    icon: Megaphone,
    title: "NOVEDADES",
    mobileTitle: "NEWS",
    text: "Entérate de anuncios, eventos y promociones.",
  },
]

const STATS = [
  {
    key: "challenges",
    icon: Trophy,
    label: "DESAFÍOS",
    value: "Todo el año",
  },
  {
    key: "results",
    icon: Activity,
    label: "RESULTADOS",
    value: "Transforma tu vida",
  },
  {
    key: "passion",
    icon: Flame,
    label: "PASIÓN",
    value: "Estilo PHO3NIX",
  },
]

const SCHEDULES = [
  {
    key: "morning",
    title: "Mañana",
    times: ["6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM"],
  },
  {
    key: "afternoon",
    title: "Tarde",
    times: ["5:00 PM", "6:00 PM", "7:00 PM"],
  },
  {
    key: "saturday",
    title: "Sábado y feriados",
    times: ["Open Box 8:00 AM - 10:00 AM"],
  },
]

const FALLBACK_NEWS = [
  {
    id: "fallback-1",
    titleKey: "home.news.fallback.1.title",
    textKey: "home.news.fallback.1.text",
    title: "Nuevos retos PHO3NIX",
    text: "Muy pronto anunciaremos nuevos challenges internos para la comunidad.",
    imageUrl: "",
  },
  {
    id: "fallback-2",
    titleKey: "home.news.fallback.2.title",
    textKey: "home.news.fallback.2.text",
    title: "Open Box",
    text: "Los sábados mantenemos espacios abiertos para técnica, movilidad y recuperación.",
    imageUrl: "",
  },
  {
    id: "fallback-3",
    titleKey: "home.news.fallback.3.title",
    textKey: "home.news.fallback.3.text",
    title: "Promos y eventos",
    text: "Las promociones y anuncios especiales aparecerán aquí.",
    imageUrl: "",
  },
]


const HOME_TRANSLATIONS = [
  ["home.nav.home", "Inicio", "Home"],
  ["home.nav.about", "Quiénes somos", "About us"],
  ["home.nav.schedule", "Horarios", "Schedule"],
  ["home.nav.partners", "Partners", "Partners"],
  ["home.nav.news", "Novedades", "News"],
  ["home.login", "Iniciar sesión", "Log in"],
  ["home.hero.renace", "Renace.", "Rise."],
  ["home.hero.entrena", "Entrena.", "Train."],
  ["home.hero.superate", "Supérate.", "Evolve."],
  [
    "home.hero.description",
    "Más que un gimnasio, somos una comunidad. Entrena con propósito, vive con pasión y renace más fuerte cada día.",
    "More than a gym, we are a community. Train with purpose, live with passion, and rise stronger every day."
  ],
  ["home.join.cta", "Únete a PHO3NIX", "Join PHO3NIX"],
  ["home.stats.challenges.label", "DESAFÍOS", "CHALLENGES"],
  ["home.stats.challenges.value", "Todo el año", "All year"],
  ["home.stats.results.label", "RESULTADOS", "RESULTS"],
  ["home.stats.results.value", "Transforma tu vida", "Transform your life"],
  ["home.stats.passion.label", "PASIÓN", "PASSION"],
  ["home.stats.passion.value", "Estilo PHO3NIX", "PHO3NIX style"],
  ["home.info.about.title", "¿QUIÉNES SOMOS?", "ABOUT US"],
  ["home.info.about.mobile", "SOMOS", "ABOUT"],
  ["home.info.about.text", "Conoce nuestra historia, valores y lo que nos mueve.", "Discover our story, values, and what drives us."],
  ["home.info.schedule.title", "HORARIOS", "SCHEDULE"],
  ["home.info.schedule.mobile", "HORARIOS", "HOURS"],
  ["home.info.schedule.text", "Descubre nuestros horarios y programaciones.", "Check our class times and programming."],
  ["home.info.partners.title", "PARTNERS", "PARTNERS"],
  ["home.info.partners.mobile", "PARTNERS", "PARTNERS"],
  ["home.info.partners.text", "Conoce a nuestros aliados que hacen esto posible.", "Meet the partners who make this possible."],
  ["home.info.news.title", "NOVEDADES", "NEWS"],
  ["home.info.news.mobile", "NEWS", "NEWS"],
  ["home.info.news.text", "Entérate de anuncios, eventos y promociones.", "Stay updated on announcements, events, and promotions."],
  ["home.open", "Abrir", "Open"],
  ["home.partner.lycan", "Partner oficial LYCAN Ecuador", "Official partner LYCAN Ecuador"],
  ["home.popup.join.title", "Conecta con PHO3NIX", "Connect with PHO3NIX"],
  ["home.popup.about.title", "¿Quiénes somos?", "About us"],
  ["home.popup.schedule.title", "Horarios", "Schedule"],
  ["home.popup.partners.title", "Partners", "Partners"],
  ["home.popup.news.title", "Novedades", "News"],
  ["home.close", "Cerrar", "Close"],
  [
    "home.about.paragraph",
    "PHO3NIX Functional Fitness es una comunidad creada para personas que quieren entrenar con propósito, superar sus límites y construir disciplina dentro y fuera del box.",
    "PHO3NIX Functional Fitness is a community built for people who want to train with purpose, push their limits, and build discipline inside and outside the box."
  ],
  ["home.about.passion.title", "Pasión", "Passion"],
  ["home.about.passion.text", "Entrenamos con intensidad y enfoque.", "We train with intensity and focus."],
  ["home.about.community.title", "Comunidad", "Community"],
  ["home.about.community.text", "Nadie renace solo; avanzamos juntos.", "No one rises alone; we move forward together."],
  ["home.about.progress.title", "Progreso", "Progress"],
  ["home.about.progress.text", "Medimos, mejoramos y celebramos cada logro.", "We measure, improve, and celebrate every achievement."],
  ["home.schedule.morning", "Mañana", "Morning"],
  ["home.schedule.afternoon", "Tarde", "Afternoon"],
  ["home.schedule.saturday", "Sábado y feriados", "Saturday and holidays"],
  ["home.partners.lycan.title", "LYCAN Ecuador", "LYCAN Ecuador"],
  ["home.partners.lycan.text", "Partner de equipamiento y comunidad deportiva.", "Equipment and sports community partner."],
  [
    "home.partners.coming",
    "Próximamente se podrán mostrar más aliados, marcas y beneficios para miembros PHO3NIX.",
    "Soon we will show more partners, brands, and benefits for PHO3NIX members."
  ],
  ["home.news.default.title", "Novedades", "News"],
  ["home.news.default.empty", "Sin contenido disponible.", "No content available."],
  ["home.news.fallback.1.title", "Nuevos retos PHO3NIX", "New PHO3NIX challenges"],
  ["home.news.fallback.1.text", "Muy pronto anunciaremos nuevos challenges internos para la comunidad.", "Very soon we will announce new internal challenges for the community."],
  ["home.news.fallback.2.title", "Open Box", "Open Box"],
  ["home.news.fallback.2.text", "Los sábados mantenemos espacios abiertos para técnica, movilidad y recuperación.", "On Saturdays we keep open sessions for technique, mobility, and recovery."],
  ["home.news.fallback.3.title", "Promos y eventos", "Promos and events"],
  ["home.news.fallback.3.text", "Las promociones y anuncios especiales aparecerán aquí.", "Promotions and special announcements will appear here."],
]


export default function Home() {
  const [activePopup, setActivePopup] = useState(null)
  const [newsItems, setNewsItems] = useState(FALLBACK_NEWS)
  const { language, toggleLanguage, t } = useSemiAutoTranslation({
    modulo: "home",
    entries: HOME_TRANSLATIONS,
  })

  const popupTitle = useMemo(() => {
    if (activePopup === "join") return t("home.popup.join.title", "Conecta con PHO3NIX")
    if (activePopup === "about") return t("home.popup.about.title", "¿Quiénes somos?")
    if (activePopup === "schedule") return t("home.popup.schedule.title", "Horarios")
    if (activePopup === "partners") return t("home.popup.partners.title", "Partners")
    if (activePopup === "news") {
      const firstNews = newsItems?.[0]
      if (firstNews?.titleKey) return t(firstNews.titleKey, firstNews.title || "Novedades")
      return firstNews?.title || t("home.popup.news.title", "Novedades")
    }
    return ""
  }, [activePopup, newsItems, t])

  useEffect(() => {
    if (!activePopup) return

    const onKeyDown = (event) => {
      if (event.key === "Escape") setActivePopup(null)
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [activePopup])

  useEffect(() => {
    let alive = true

    async function loadNews() {
      try {
        const { data, error } = await supabase
		  .from("anuncios")
		  .select("id,titulo,contenido,media_url,media_tipo,fecha_publicacion,activo")
          .eq("activo", true)
          .order("fecha_publicacion", { ascending: false })
          .limit(5)

        if (error) throw error

		const mapped = (data || []).map((item) => ({
		  id: item.id,
		  title: item.titulo || "Novedad PHO3NIX",
		  text:
			item.contenido ||
			"Nueva actualización disponible para la comunidad.",
		  imageUrl:
			item.media_tipo === "video"
			  ? ""
			  : item.media_url || "",
		  mediaUrl: item.media_url || "",
		  mediaTipo: item.media_tipo || "",
		  date: item.fecha_publicacion || "",
		}))

        if (alive && mapped.length > 0) {
          setNewsItems(mapped)
        }
      } catch (error) {
        console.warn("No se pudieron cargar las novedades:", error)
        if (alive) setNewsItems(FALLBACK_NEWS)
      }
    }

    loadNews()

    return () => {
      alive = false
    }
  }, [])

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-black text-white">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url("${HERO_IMAGE_URL}")`,
        }}
      />

      <div className="pointer-events-none absolute inset-0 z-[1] hidden items-center justify-center lg:flex">
        <div className="translate-x-[18%] translate-y-[14%] text-[12rem] font-black uppercase tracking-[0.16em] text-orange-500/10 xl:text-[16rem]">
          PHO3NIX
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden">
        <img
          src={pho3nixLogo}
          alt=""
          aria-hidden="true"
          className="absolute right-[-72px] top-[13%] h-[290px] w-[290px] object-contain opacity-[0.11] mix-blend-screen blur-[0.4px] sm:right-[-40px] sm:top-[9%] sm:h-[420px] sm:w-[420px] md:right-[10%] md:top-[8%] md:h-[520px] md:w-[520px] md:opacity-[0.16] lg:right-[16%] lg:top-[3%] lg:h-[720px] lg:w-[720px] lg:opacity-[0.18]"
        />

        <div className="absolute right-[-48px] top-[20%] h-[280px] w-[280px] rounded-full bg-orange-500/13 blur-[80px] sm:right-[0%] sm:h-[380px] sm:w-[380px] md:right-[17%] md:top-[18%] md:h-[520px] md:w-[520px] md:bg-orange-500/20 md:blur-[120px]" />
      </div>

      <div className="absolute inset-0 z-[3] bg-[radial-gradient(circle_at_72%_45%,rgba(249,115,22,0.18),transparent_34%),linear-gradient(90deg,rgba(0,0,0,0.95)_0%,rgba(0,0,0,0.84)_35%,rgba(0,0,0,0.42)_65%,rgba(0,0,0,0.80)_100%)]" />
      <div className="absolute inset-0 z-[4] bg-[linear-gradient(180deg,rgba(0,0,0,0.66)_0%,rgba(0,0,0,0.08)_44%,rgba(0,0,0,0.90)_100%)]" />
      <div className="absolute -left-24 bottom-12 z-[5] h-72 w-72 rounded-full bg-orange-600/20 blur-3xl" />
      <div className="absolute right-[22%] top-24 z-[5] h-96 w-96 rounded-full bg-red-500/10 blur-3xl" />

      <header className="relative z-20 flex h-[58px] items-center justify-between px-3 sm:h-[76px] sm:px-8 lg:px-14">
        <Link to="/" className="flex items-center gap-2 sm:gap-3">
          <img
            src={pho3nixLogo}
            alt="PHO3NIX"
            className="h-8 w-8 object-contain sm:h-14 sm:w-14"
          />

          <div className="leading-none">
            <div className="text-base font-black tracking-[0.13em] sm:text-3xl sm:tracking-[0.18em]">
              PHO<span className="text-orange-500">3</span>NIX
            </div>
            <div className="mt-1 text-[7px] font-bold uppercase tracking-[0.32em] text-orange-500 sm:text-[11px] sm:tracking-[0.55em]">
              Functional Fitness
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-bold uppercase tracking-[0.08em] text-white/85 lg:flex">
          <button className="text-orange-400">{t("home.nav.home", "Inicio")}</button>
          <button
            type="button"
            onClick={() => setActivePopup("about")}
            className="transition hover:text-orange-300"
          >
            {t("home.nav.about", "Quiénes somos")}
          </button>
          <button
            type="button"
            onClick={() => setActivePopup("schedule")}
            className="transition hover:text-orange-300"
          >
            {t("home.nav.schedule", "Horarios")}
          </button>
          <button
            type="button"
            onClick={() => setActivePopup("partners")}
            className="transition hover:text-orange-300"
          >
            {t("home.nav.partners", "Partners")}
          </button>
          <button
            type="button"
            onClick={() => setActivePopup("news")}
            className="transition hover:text-orange-300"
          >
            {t("home.nav.news", "Novedades")}
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLanguage}
            className="rounded-md border border-white/15 bg-black/40 px-1.5 py-1 text-[9px] font-black uppercase tracking-[0.03em] text-white/70 transition hover:border-orange-500/60 hover:text-orange-300 sm:rounded-xl sm:px-3 sm:py-3 sm:text-xs"
            title="Cambiar idioma"
          >
            {language === "es" ? "EN" : "ES"}
          </button>

          <Link
            to="/login"
            className="rounded-md border border-orange-500/80 bg-black/40 px-1.5 py-1 text-[9px] font-black uppercase tracking-[0.03em] text-orange-300 shadow-[0_0_24px_rgba(249,115,22,0.18)] transition hover:bg-orange-500 hover:text-black sm:rounded-xl sm:px-5 sm:py-3 sm:text-sm"
          >
            {t("home.login", "Iniciar sesión")}
          </Link>
        </div>
      </header>

      <section className="relative z-10 flex h-[calc(100dvh-58px)] flex-col justify-between px-3 pb-[46px] sm:h-[calc(100dvh-76px)] sm:px-8 sm:pb-4 lg:px-14">
        <div className="grid flex-1 grid-cols-1 items-center lg:grid-cols-[minmax(420px,0.68fr)_1fr]">
          <div className="max-w-[620px] -translate-y-3 pt-1 sm:-translate-y-3 lg:-translate-y-4 lg:pt-0">
            <div className="mb-2 h-1 w-16 rounded-full bg-orange-500 shadow-[0_0_18px_rgba(249,115,22,0.9)] sm:mb-3 sm:w-24" />

            <h1 className="text-[2rem] font-black uppercase leading-[0.9] tracking-tight min-[390px]:text-[2.3rem] sm:text-[4.5rem] lg:text-[5.4rem] xl:text-[6.3rem]">
              <span className="block text-white drop-shadow-[0_4px_16px_rgba(255,255,255,0.15)]">
                {t("home.hero.renace", "Renace.")}
              </span>
              <span className="block text-white">{t("home.hero.entrena", "Entrena.")}</span>
              <span className="block bg-gradient-to-r from-orange-500 via-red-500 to-orange-300 bg-clip-text text-transparent">
                {t("home.hero.superate", "Supérate.")}
              </span>
            </h1>

            <p className="mt-2 max-w-xl text-[11px] leading-4 text-white/75 min-[390px]:text-xs min-[390px]:leading-5 sm:mt-4 sm:text-lg sm:leading-8">
              {t(
                "home.hero.description",
                "Más que un gimnasio, somos una comunidad. Entrena con propósito, vive con pasión y renace más fuerte cada día."
              )}
            </p>

            <div className="mt-3 flex flex-wrap gap-3 sm:mt-6">
              <button
                type="button"
                onClick={() => setActivePopup("join")}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-[11px] font-black uppercase text-black shadow-[0_0_26px_rgba(249,115,22,0.35)] transition hover:bg-orange-400 sm:gap-3 sm:rounded-xl sm:px-7 sm:py-3 sm:text-sm"
              >
                {t("home.join.cta", "Únete a PHO3NIX")}
                <span>→</span>
              </button>
            </div>

            <div className="mt-3 grid max-w-[300px] grid-cols-3 gap-1.5 min-[390px]:max-w-[330px] sm:mt-6 sm:max-w-[460px] sm:gap-3">
              {STATS.map((item) => {
                const Icon = item.icon

                return (
                  <div
                    key={item.label}
                    className="aspect-square rounded-xl border border-orange-500/25 bg-black/40 p-1.5 text-center shadow-[0_0_18px_rgba(249,115,22,0.10)] backdrop-blur-md sm:rounded-2xl sm:p-4"
                  >
                    <Icon className="mx-auto h-4 w-4 text-orange-500 sm:h-7 sm:w-7" strokeWidth={2.5} />
                    <div className="mt-1 text-[7px] font-black uppercase text-white sm:text-xs">
                      {t(`home.stats.${item.key}.label`, item.label)}
                    </div>
                    <div className="mt-0.5 text-[7px] leading-tight text-white/65 sm:mt-1 sm:text-sm">
                      {t(`home.stats.${item.key}.value`, item.value)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="hidden lg:block" />
        </div>

        <div className="relative z-10 grid grid-cols-4 gap-1.5 sm:gap-3">
          {INFO_CARDS.map((item) => {
            const Icon = item.icon

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActivePopup(item.key)}
                className="group min-h-[52px] rounded-xl border border-orange-500/25 bg-black/45 p-1.5 text-center shadow-[0_0_34px_rgba(249,115,22,0.11)] backdrop-blur-md transition hover:-translate-y-1 hover:border-orange-400/60 hover:bg-black/60 sm:min-h-[128px] sm:rounded-2xl sm:p-5 sm:text-left"
              >
                <div className="flex flex-col items-center gap-1 sm:flex-row sm:items-start sm:gap-3">
                  <Icon
                    className="h-4 w-4 text-orange-500 sm:h-9 sm:w-9"
                    strokeWidth={2.4}
                  />

                  <div>
                    <h3 className="text-[7px] font-black uppercase leading-tight text-white sm:text-lg">
                      <span className="sm:hidden">{t(`home.info.${item.key}.mobile`, item.mobileTitle)}</span>
                      <span className="hidden sm:inline">{t(`home.info.${item.key}.title`, item.title)}</span>
                    </h3>
                    <p className="mt-1 hidden text-sm leading-6 text-white/65 sm:block">
                      {t(`home.info.${item.key}.text`, item.text)}
                    </p>
                    <div className="hidden font-black uppercase text-orange-400 sm:mt-4 sm:block sm:text-xs">
                      {t("home.open", "Abrir")} <span className="transition group-hover:translate-x-1">→</span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="relative z-10 flex items-center justify-between pt-1 text-[9px] text-white/45 sm:pt-2 sm:text-[11px]">
          <div className="hidden items-center gap-2 sm:flex">
            <img
              src={lycanLogo}
              alt="LYCAN Ecuador"
              className="h-5 w-auto opacity-60"
            />
            <span>{t("home.partner.lycan", "Partner oficial LYCAN Ecuador")}</span>
          </div>

          <div className="mx-auto sm:mx-0">
            © 2025 <span className="text-orange-400">PHO3NIX</span> Functional Fitness
          </div>
        </div>
      </section>

      <aside className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-3 sm:flex">
        {SOCIAL_LINKS.map((item) => (
          <a
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            aria-label={item.label}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-orange-500/35 bg-black/45 text-lg font-black text-orange-300 shadow-[0_0_22px_rgba(249,115,22,0.12)] backdrop-blur-md transition hover:border-orange-400 hover:bg-orange-500 hover:text-black"
            title={item.label}
          >
            {item.icon}
          </a>
        ))}
      </aside>

      <div className="absolute bottom-[10px] left-1/2 z-20 flex -translate-x-1/2 gap-2 sm:hidden">
        {SOCIAL_LINKS.map((item) => (
          <a
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-orange-500/35 bg-black/60 text-sm font-black text-orange-300 shadow-[0_0_18px_rgba(249,115,22,0.12)]"
            aria-label={item.label}
          >
            {item.icon}
          </a>
        ))}
      </div>

      {activePopup ? (
        <HomePopup
          title={popupTitle}
          type={activePopup}
          newsItems={newsItems}
          t={t}
          onClose={() => setActivePopup(null)}
        />
      ) : null}
    </main>
  )
}

function HomePopup({ title, type, newsItems, t, onClose }) {
  const compactPopup = type === "about" || type === "schedule"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-3 backdrop-blur-sm sm:px-4">
      <div className="relative max-h-[92dvh] w-full max-w-3xl overflow-hidden rounded-[1.35rem] border border-orange-500/30 bg-[#080b12] shadow-[0_0_70px_rgba(249,115,22,0.28)] sm:rounded-[2rem]">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="relative z-10 border-b border-white/10 px-4 py-3 sm:px-7 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-400 sm:text-xs sm:tracking-[0.25em]">
                PHO3NIX
              </div>
              <h2 className="mt-1 text-lg font-black uppercase text-white sm:text-3xl">
                {title}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-xl text-white transition hover:border-orange-400 hover:text-orange-300 sm:h-10 sm:w-10"
              aria-label={t("home.close", "Cerrar")}
            >
              ×
            </button>
          </div>
        </div>

        <div
          className={[
            "relative z-10 px-4 py-4 sm:px-7 sm:py-6",
            compactPopup ? "overflow-hidden" : "max-h-[70dvh] overflow-y-auto",
          ].join(" ")}
        >
          {type === "join" ? <JoinContent t={t} /> : null}
          {type === "about" ? <AboutContent t={t} /> : null}
          {type === "schedule" ? <ScheduleContent t={t} /> : null}
          {type === "partners" ? <PartnersContent t={t} /> : null}
          {type === "news" ? <NewsContent newsItems={newsItems} t={t} /> : null}
        </div>
      </div>
    </div>
  )
}

function JoinContent({ t }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {SOCIAL_LINKS.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 transition hover:border-orange-400 hover:bg-orange-500/10"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-orange-500/40 bg-black/30 text-lg font-black text-orange-300">
              {item.icon}
            </div>

            <div>
              <div className="text-sm font-black uppercase tracking-[0.12em] text-orange-300">
                {item.label}
              </div>
              <div className="mt-1 text-xs text-white/55">
                {item.text}
              </div>
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}

function AboutContent({ t }) {
  return (
    <div className="space-y-3 text-xs leading-5 text-white/70 sm:text-base sm:leading-7">
      <p>
        {t(
          "home.about.paragraph",
          "PHO3NIX Functional Fitness es una comunidad creada para personas que quieren entrenar con propósito, superar sus límites y construir disciplina dentro y fuera del box."
        )}
      </p>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          [Flame, "passion", "Pasión", "Entrenamos con intensidad y enfoque."],
          [Handshake, "community", "Comunidad", "Nadie renace solo; avanzamos juntos."],
          [Trophy, "progress", "Progreso", "Medimos, mejoramos y celebramos cada logro."],
        ].map(([Icon, key, title, text]) => (
          <div
            key={title}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 sm:p-4"
          >
            <Icon className="h-5 w-5 text-orange-400 sm:h-7 sm:w-7" strokeWidth={2.4} />
            <div className="mt-2 text-xs font-black uppercase text-white sm:mt-3 sm:text-base">
              {t(`home.about.${key}.title`, title)}
            </div>
            <p className="mt-1 text-[10px] leading-4 text-white/60 sm:mt-2 sm:text-sm sm:leading-5">
              {t(`home.about.${key}.text`, text)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ScheduleContent({ t }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3 sm:gap-4">
      {SCHEDULES.map((block) => (
        <div
          key={t(`home.schedule.${block.key}`, block.title)}
          className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-3 sm:p-4"
        >
          <h3 className="text-sm font-black uppercase text-orange-300 sm:text-lg">
            {t(`home.schedule.${block.key}`, block.title)}
          </h3>

          <div className="mt-2 space-y-1.5 sm:mt-4 sm:space-y-2">
            {block.times.map((time) => (
              <div
                key={time}
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white/80 sm:py-2 sm:text-sm"
              >
                {time}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function PartnersContent({ t }) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-black text-white">{t("home.partners.lycan.title", "LYCAN Ecuador")}</h3>
            <p className="mt-2 text-sm leading-6 text-white/60">
              {t("home.partners.lycan.text", "Partner de equipamiento y comunidad deportiva.")}
            </p>
          </div>

          <img
            src={lycanLogo}
            alt="LYCAN Ecuador"
            className="h-12 w-auto object-contain"
          />
        </div>
      </div>

      <p className="text-sm leading-6 text-white/60">
        {t(
          "home.partners.coming",
          "Próximamente se podrán mostrar más aliados, marcas y beneficios para miembros PHO3NIX."
        )}
      </p>
    </div>
  )
}

function NewsContent({ newsItems, t }) {
  const safeNews = newsItems?.length ? newsItems : FALLBACK_NEWS

  return (
    <div className="grid gap-3">
      {safeNews.map((item, index) => (
        <article
          key={item.id || item.title || index}
          className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"
        >
		{item.mediaTipo === "video" && item.mediaUrl ? (
		  <video
			src={item.mediaUrl}
			className="h-[260px] w-[50%] mx-auto rounded-t-2x1 object-cover sm:h-[420px]"
			autoPlay
			muted
			loop
			playsInline
			controls
		  />
		) : item.imageUrl ? (
		  <img
			src={item.imageUrl}
			alt={item.title}
			className="h-28 w-full object-cover sm:h-36"
		  />
		) : null}

          <div className="p-4">
            <h3 className="text-lg font-black uppercase text-orange-300">
              {item.titleKey ? t(item.titleKey, item.title) : item.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-white/60">
              {item.textKey ? t(item.textKey, item.text) : item.text}
            </p>
          </div>
        </article>
      ))}
    </div>
  )
}
