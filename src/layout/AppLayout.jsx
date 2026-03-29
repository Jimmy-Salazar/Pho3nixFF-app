import { useEffect, useMemo } from "react"
import Navbar from "./Navbar"
import Footer from "./Footer"
import "../styles/layout.css"
import { useAuth } from "../context/AuthContext"

const PHOENIX_LOGO =
  "https://rmolvzjluxutxmxzthjp.supabase.co/storage/v1/object/public/images/pho3nix-logo.png"

export default function AppLayout({ children }) {
  const {
    birthdayPopup,
    mensualidadWarning,
    dismissBirthdayPopup,
    dismissMensualidadWarning,
  } = useAuth()

  const hasOverlayPopup = !!birthdayPopup || !!mensualidadWarning

  return (
    <div className="app-container">
      <BirthdayPopupStyles />

      <div className="app-bg" aria-hidden="true" />

      <Navbar />

      <main className="main-content">{children}</main>

      {!hasOverlayPopup ? <Footer /> : null}

		{birthdayPopup ? (
		  <BirthdayPopup
			nombre={birthdayPopup.nombre}
			rol={birthdayPopup.rol}
			onClose={dismissBirthdayPopup}
		  />
		) : null}

      {mensualidadWarning ? (
        <MensualidadWarningPopup
          diasRestantes={mensualidadWarning.diasRestantes}
          fechaFin={mensualidadWarning.fechaFin}
          onClose={dismissMensualidadWarning}
        />
      ) : null}
    </div>
  )
}

function BirthdayPopupStyles() {
  return (
    <style>{`
      @keyframes birthdayGlow {
        0%, 100% {
          box-shadow:
            0 0 0 rgba(249,115,22,0.12),
            0 0 0 rgba(255,0,90,0.08);
        }
        50% {
          box-shadow:
            0 0 28px rgba(249,115,22,0.22),
            0 0 52px rgba(255,0,90,0.10);
        }
      }

      @keyframes popupRiseIn {
        0% {
          opacity: 0;
          transform: translateY(18px) scale(0.96);
        }
        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes confettiFall {
        0% {
          transform: translate3d(0, -12vh, 0) rotate(0deg);
          opacity: 0;
        }
        10% {
          opacity: 1;
        }
        100% {
          transform: translate3d(var(--x-shift, 0px), 110vh, 0) rotate(720deg);
          opacity: 0;
        }
      }

      @keyframes phoenixFloatA {
        0%, 100% {
          transform: translateY(0px) translateX(0px) scale(1) rotate(0deg);
        }
        50% {
          transform: translateY(-8px) translateX(4px) scale(1.04) rotate(-2deg);
        }
      }

      @keyframes phoenixFloatB {
        0%, 100% {
          transform: translateY(0px) translateX(0px) scale(1) rotate(0deg);
        }
        50% {
          transform: translateY(6px) translateX(-6px) scale(1.03) rotate(2deg);
        }
      }

      @keyframes phoenixFloatC {
        0%, 100% {
          transform: translateY(0px) translateX(0px) scale(1) rotate(0deg);
        }
        50% {
          transform: translateY(-5px) translateX(-3px) scale(1.02) rotate(-1deg);
        }
      }

      .birthday-popup-card {
        animation:
          popupRiseIn .45s cubic-bezier(0.22, 1, 0.36, 1),
          birthdayGlow 3.2s ease-in-out infinite;
      }

      .birthday-confetti-piece {
        position: absolute;
        top: 0;
        width: 10px;
        height: 18px;
        border-radius: 999px;
        opacity: 0;
        animation: confettiFall var(--dur, 4.5s) linear infinite;
        animation-delay: var(--delay, 0s);
        will-change: transform, opacity;
      }

      .birthday-confetti-piece.square {
        border-radius: 3px;
      }

      .birthday-confetti-piece.dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
      }

      .phoenix-bg-a {
        animation: phoenixFloatA 6s ease-in-out infinite;
      }

      .phoenix-bg-b {
        animation: phoenixFloatB 7.5s ease-in-out infinite;
      }

      .phoenix-bg-c {
        animation: phoenixFloatC 5.8s ease-in-out infinite;
      }

      @media (max-width: 640px) {
        .phoenix-bg-c {
          display: none;
        }
      }
    `}</style>
  )
}

function BirthdayPopup({ nombre, rol, onClose }) {
  useEffect(() => {
    let audioCtx = null

    const playBirthdayTone = async () => {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext
        if (!AudioContextClass) return

        audioCtx = new AudioContextClass()

        const now = audioCtx.currentTime
        const notes = [
          { f: 523.25, d: 0.18 },
          { f: 523.25, d: 0.18 },
          { f: 587.33, d: 0.28 },
          { f: 523.25, d: 0.28 },
          { f: 698.46, d: 0.28 },
          { f: 659.25, d: 0.4 },
        ]

        let t = now + 0.02

        notes.forEach((note) => {
          const osc = audioCtx.createOscillator()
          const gain = audioCtx.createGain()

          osc.type = "sine"
          osc.frequency.setValueAtTime(note.f, t)

          gain.gain.setValueAtTime(0.0001, t)
          gain.gain.exponentialRampToValueAtTime(0.045, t + 0.03)
          gain.gain.exponentialRampToValueAtTime(0.0001, t + note.d)

          osc.connect(gain)
          gain.connect(audioCtx.destination)

          osc.start(t)
          osc.stop(t + note.d + 0.02)

          t += note.d + 0.03
        })
      } catch (e) {
        console.warn("No se pudo reproducir el sonido de cumpleaños:", e)
      }
    }

    playBirthdayTone()

    return () => {
      try {
        audioCtx?.close?.()
      } catch {}
    }
  }, [])

  const confetti = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => {
        const colors = [
          "#f97316",
          "#fb923c",
          "#f59e0b",
          "#ffffff",
          "#ec4899",
        ]
        const shapes = ["", "square", "dot"]

        return {
          id: i,
          left: `${(i * 3.4) % 100}%`,
          color: colors[i % colors.length],
          delay: `${(i % 9) * 0.18}s`,
          dur: `${4 + (i % 4) * 0.55}s`,
          xShift: `${((i % 5) - 2) * (12 + i)}px`,
          shape: shapes[i % shapes.length],
        }
      }),
    []
  )

  const content = getBirthdayContent(rol, nombre)

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {confetti.map((piece) => (
          <span
            key={piece.id}
            className={`birthday-confetti-piece ${piece.shape}`}
            style={{
              left: piece.left,
              background: piece.color,
              ["--delay"]: piece.delay,
              ["--dur"]: piece.dur,
              ["--x-shift"]: piece.xShift,
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-lg overflow-hidden rounded-[30px] border border-orange-500/30 bg-[#0b0f14] p-6 shadow-[0_25px_90px_rgba(255,120,0,0.18)] birthday-popup-card">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,140,0,0.20),transparent_42%),radial-gradient(circle_at_bottom,rgba(255,0,90,0.12),transparent_36%)]" />

        <img
          src={PHOENIX_LOGO}
          alt=""
          className="phoenix-bg-a pointer-events-none absolute right-[-12px] top-[-10px] h-36 w-36 object-contain opacity-[0.12]"
        />

        <img
          src={PHOENIX_LOGO}
          alt=""
          className="phoenix-bg-b pointer-events-none absolute left-[-18px] top-[30%] h-24 w-24 object-contain opacity-[0.08]"
        />

        <img
          src={PHOENIX_LOGO}
          alt=""
          className="phoenix-bg-c pointer-events-none absolute bottom-[-12px] right-[18%] h-20 w-20 object-contain opacity-[0.06]"
        />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          ✕
        </button>

        <div className="relative z-10 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border border-orange-400/20 bg-orange-500/10 shadow-lg shadow-orange-500/10">
            <img
              src={PHOENIX_LOGO}
              alt="Pho3nix logo"
              className="h-full w-full object-contain p-2"
            />
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-300">
            {content.badge}
          </p>

          <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
            ¡Feliz cumpleaños!
          </h2>

          <p className="mt-2 text-xl font-semibold text-orange-300">{nombre}</p>

          <p className="mt-5 text-sm leading-7 text-white/75 sm:text-base">
            {content.message}
          </p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
            {content.footer}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 px-6 py-3 font-bold text-slate-950 shadow-lg shadow-orange-500/20 transition hover:scale-[1.02]"
          >
            Gracias 🔥
          </button>
        </div>
      </div>
    </div>
  )
}

function getBirthdayContent(rol, nombre) {
  const role = String(rol || "").toLowerCase().trim()

  if (role === "admin" || role === "administrador") {
    return {
      badge: "Pho3nix Functional Fitness",
      message:
        `Hoy celebramos tu día, ${nombre}. Gracias por ser parte fundamental del crecimiento de Pho3nix y por impulsar esta comunidad con visión, liderazgo y compromiso.`,
      footer:
        "Que este nuevo año venga con salud, claridad, fuerza y grandes logros para seguir construyendo algo extraordinario. 🔥",
    }
  }

  if (role === "coach") {
    return {
      badge: "Equipo Pho3nix",
      message:
        `Hoy celebramos tu día, ${nombre}. Gracias por tu energía, tu disciplina y por inspirar a otros a mejorar en cada entrenamiento dentro de Pho3nix.`,
      footer:
        "Que este nuevo año venga con más fortaleza, evolución y grandes metas cumplidas dentro y fuera del box. 🔥",
    }
  }

  return {
    badge: "Pho3nix Functional Fitness",
    message:
      `Hoy celebramos tu día, ${nombre}. Todo el equipo de Pho3nix te desea salud, fuerza y muchos logros en este nuevo año. Gracias por ser parte de esta comunidad.`,
    footer:
      "Que este nuevo ciclo venga con más disciplina, evolución y energía para seguir renaciendo más fuerte. 🔥",
  }
}

function MensualidadWarningPopup({ diasRestantes, fechaFin, onClose }) {
  const mensaje =
    diasRestantes === 0
      ? "Tu mensualidad vence hoy. Renueva para evitar quedar inactivo."
      : diasRestantes === 1
      ? "Tu mensualidad vence mañana. Renueva para evitar quedar inactivo."
      : `Tu mensualidad está próxima a vencer. Te quedan ${diasRestantes} días.`

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/65 p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-500/30 bg-[#0b0f14] p-6 shadow-[0_25px_80px_rgba(245,158,11,0.12)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.16),transparent_40%)]" />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          ✕
        </button>

        <div className="relative z-10">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-500/10 text-3xl">
            ⏳
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">
            Aviso de membresía
          </p>

          <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
            Mensualidad por vencer
          </h2>

          <p className="mt-4 text-sm leading-6 text-white/75">{mensaje}</p>

          <p className="mt-3 text-sm text-white/60">
            Fecha fin: <span className="font-semibold text-white">{formatDateDMY(fechaFin)}</span>
          </p>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-400 px-5 py-3 font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:scale-[1.02]"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatDateDMY(value) {
  if (!value) return "-"
  try {
    const [y, m, d] = String(value).split("-")
    if (!y || !m || !d) return String(value)
    return `${d}/${m}/${y}`
  } catch {
    return String(value)
  }
}