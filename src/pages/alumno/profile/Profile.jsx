import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../../supabase"
import { mensualidadStatusInfo } from "../../../utils/mensualidades"
import { useAuth } from "../../../context/AuthContext"

import AlumnoSidebar from "../dashboard/components/AlumnoSidebar"
import AlumnoMobileNav from "../shared/AlumnoMobileNav"
import pho3nixLogo from "../../../assets/pho3nix-login-logo.png"

import NativeSecurityCard from "../../../components/security/NativeSecurityCard"

const DEFAULT_STATE = {
  profile: null,
  mensualidad: null,
  rms: [],
  ejercicios: [],
}

export default function ProfileAlumno() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const fileInputRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [editOpen, setEditOpen] = useState(false)
  const [data, setData] = useState(DEFAULT_STATE)

  useEffect(() => {
    let alive = true

    async function loadProfile() {
      try {
        setLoading(true)
        setError("")

        const { data: authData, error: authError } =
          await supabase.auth.getUser()

        if (authError) throw authError

        const authUser = authData?.user

        if (!authUser?.id) {
          throw new Error("No se encontró una sesión activa.")
        }

        const [profileResult, mensualidadResult, rmResult, ejerciciosResult] =
          await Promise.all([
            supabase
              .from("usuarios")
              .select(
                "id,nombre,email,telefono,cedula,role,fecha_nacimiento,foto_url,created_at"
              )
              .eq("id", authUser.id)
              .maybeSingle(),

            supabase
              .from("mensualidades")
              .select("id,usuario_id,fecha_inicio,fecha_fin,estado,created_at")
              .eq("usuario_id", authUser.id)
              .order("fecha_fin", { ascending: false })
              .order("created_at", { ascending: false })
              .limit(1),

            supabase
              .from("rm")
              .select("id,usuario,ejercicio_id,peso_libras,fecha,created_at")
              .eq("usuario", authUser.id)
              .order("fecha", { ascending: false })
              .order("created_at", { ascending: false }),

            supabase
              .from("ejercicios")
              .select("id,nombre")
              .order("nombre", { ascending: true }),
          ])

        if (profileResult.error) throw profileResult.error
        if (mensualidadResult.error) throw mensualidadResult.error
        if (rmResult.error) throw rmResult.error
        if (ejerciciosResult.error) throw ejerciciosResult.error

        if (!alive) return

        setData({
          profile: profileResult.data || {
            id: authUser.id,
            nombre: authUser.email || "Alumno PHO3NIX",
            email: authUser.email,
            role: "alumno",
            telefono: "",
            cedula: "",
            fecha_nacimiento: "",
            foto_url: "",
          },
          mensualidad: mensualidadResult.data?.[0] || null,
          rms: rmResult.data || [],
          ejercicios: ejerciciosResult.data || [],
        })
      } catch (err) {
        console.error("Error cargando perfil:", err)

        if (alive) {
          setError(err.message || "No se pudo cargar el perfil.")
        }
      } finally {
        if (alive) setLoading(false)
      }
    }

    loadProfile()

    return () => {
      alive = false
    }
  }, [])

  const exerciseMap = useMemo(() => {
    const map = new Map()

    data.ejercicios.forEach((item) => {
      map.set(item.id, item.nombre)
    })

    return map
  }, [data.ejercicios])

  const stats = useMemo(() => {
    const rms = data.rms || []

    const latestPr = rms[0] || null

    const bestGeneral = rms.reduce((best, item) => {
      if (!best) return item
      return Number(item.peso_libras || 0) > Number(best.peso_libras || 0)
        ? item
        : best
    }, null)

    const bestByExerciseMap = new Map()

    rms.forEach((item) => {
      const current = bestByExerciseMap.get(item.ejercicio_id)

      if (
        !current ||
        Number(item.peso_libras || 0) > Number(current.peso_libras || 0)
      ) {
        bestByExerciseMap.set(item.ejercicio_id, item)
      }
    })

    const bestByExercise = Array.from(bestByExerciseMap.values())
      .map((item) => ({
        ...item,
        ejercicio_nombre:
          exerciseMap.get(item.ejercicio_id) || "Ejercicio PHO3NIX",
      }))
      .sort((a, b) => Number(b.peso_libras || 0) - Number(a.peso_libras || 0))

    return {
      totalPr: rms.length,
      latestPr,
      bestGeneral,
      bestByExercise,
      recentPrs: rms.slice(0, 6).map((item) => ({
        ...item,
        ejercicio_nombre:
          exerciseMap.get(item.ejercicio_id) || "Ejercicio PHO3NIX",
      })),
      strongestExercise: bestByExercise[0] || null,
    }
  }, [data.rms, exerciseMap])

  const membership = useMemo(() => {
    return getMembershipLabel(data.mensualidad)
  }, [data.mensualidad])

  const profileName = data.profile?.nombre || "Alumno PHO3NIX"
  const initials = getInitials(profileName)

  const handlePickImage = () => {
    if (uploading) return
    fileInputRef.current?.click()
  }

  const handleUploadAvatar = async (event) => {
    const file = event.target.files?.[0]

    if (!file || !data.profile?.id) return

    try {
      setUploading(true)
      setError("")
      setSuccess("")

      validateImageFile(file)

      const extension = getFileExtension(file)
      const filePath = `avatars/${data.profile.id}-${Date.now()}.${extension}`

      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type,
        })

      if (uploadError) throw uploadError

      const { data: publicData } = supabase.storage
        .from("images")
        .getPublicUrl(filePath)

      const publicUrl = publicData?.publicUrl

      if (!publicUrl) {
        throw new Error("No se pudo obtener la URL pública de la imagen.")
      }

      const { data: updatedProfile, error: updateError } = await supabase
        .from("usuarios")
        .update({ foto_url: publicUrl })
        .eq("id", data.profile.id)
        .select(
          "id,nombre,email,telefono,cedula,role,fecha_nacimiento,foto_url,created_at"
        )
        .single()

      if (updateError) throw updateError

      setData((current) => ({
        ...current,
        profile: updatedProfile,
      }))

      setSuccess("Foto actualizada correctamente.")
    } catch (err) {
      console.error("Error subiendo foto:", err)
      setError(err.message || "No se pudo subir la foto.")
    } finally {
      setUploading(false)
      event.target.value = ""
    }
  }

  const handleSaveProfile = async (payload) => {
    if (!data.profile?.id) return

    try {
      setSaving(true)
      setError("")
      setSuccess("")

      const cleanPayload = {
        telefono: payload.telefono || null,
        fecha_nacimiento: payload.fecha_nacimiento || null,
      }

      const { data: updatedProfile, error: updateError } = await supabase
        .from("usuarios")
        .update(cleanPayload)
        .eq("id", data.profile.id)
        .select(
          "id,nombre,email,telefono,cedula,role,fecha_nacimiento,foto_url,created_at"
        )
        .single()

      if (updateError) throw updateError

      setData((current) => ({
        ...current,
        profile: updatedProfile,
      }))

      setEditOpen(false)
      setSuccess("Perfil actualizado correctamente.")
    } catch (err) {
      console.error("Error actualizando perfil:", err)
      setError(err.message || "No se pudo actualizar el perfil.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden bg-[#050505] text-white">
      {/* DESKTOP: se mantiene la estructura tipo PC */}
      <div className="hidden h-full overflow-hidden lg:grid lg:grid-cols-[270px_minmax(0,1fr)]">
        <AlumnoSidebar navigate={navigate} membership={membership} />

        <main className="min-w-0 overflow-hidden bg-[#050505]">
          <section className="relative h-dvh overflow-hidden p-4">
            <BackgroundOrbs />

            <div className="relative mx-auto flex h-full max-w-[1680px] flex-col gap-3 overflow-hidden">
              <HeaderBar
                loading={loading}
                name={profileName}
                email={data.profile?.email}
                onEdit={() => setEditOpen(true)}
              />

              {error ? <Alert type="error" text={error} /> : null}
              {success ? <Alert type="success" text={success} /> : null}

              <section className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[0.85fr_1.15fr]">
                <div className="grid min-h-0 gap-3">
                  <ProfileHeroCard
                    profile={data.profile}
                    initials={initials}
                    loading={loading}
                    uploading={uploading}
                    onPickImage={handlePickImage}
                  />

                  <ProfileMembershipCard
                    membership={membership}
                    mensualidad={data.mensualidad}
                    loading={loading}
                  />
                </div>

                <div className="grid min-h-0 gap-3">
                  <ProfileStatsSection loading={loading} stats={stats} />

                  <section className="grid min-h-0 gap-3 xl:grid-cols-[1fr_0.88fr]">
                    <ProfileInfoCard
                      profile={data.profile}
                      loading={loading}
                      onEdit={() => setEditOpen(true)}
                    />

                    <ProfileRecentPrList
                      items={stats.recentPrs}
                      loading={loading}
                    />
                  </section>

                  <ProfileTipsCard />
                </div>
              </section>
            </div>
          </section>
        </main>
      </div>

      {/* MOBILE: vista separada, no toca PC */}
      <div className="block h-full overflow-hidden lg:hidden">
        <ProfileMobile
          loading={loading}
          profile={data.profile}
          membership={membership}
          mensualidad={data.mensualidad}
          stats={stats}
          initials={initials}
          profileName={profileName}
          error={error}
          success={success}
          uploading={uploading}
          onPickImage={handlePickImage}
          onEdit={() => setEditOpen(true)}
          onLogout={logout}
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        className="hidden"
        onChange={handleUploadAvatar}
      />

      {editOpen ? (
        <ProfileEditModal
          profile={data.profile}
          saving={saving}
          onClose={() => setEditOpen(false)}
          onSave={handleSaveProfile}
        />
      ) : null}
    </div>
  )
}

/* =======================================================
   MOBILE
======================================================= */

function ProfileMobile({
  loading,
  profile,
  membership,
  mensualidad,
  stats,
  initials,
  profileName,
  error,
  success,
  uploading,
  onPickImage,
  onEdit,
  onLogout,
}) {
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await onLogout?.()
    } catch (error) {
      console.error("Error cerrando sesión:", error)
    }
  }

  return (
    <main className="h-[100dvh] w-screen max-w-full overflow-x-hidden overflow-y-auto bg-[#050505] pb-28 text-white">
      <div className="relative min-h-full w-full max-w-full overflow-x-hidden px-3 pt-3">
        <BackgroundOrbs />

        <header className="relative z-10 mb-3 flex items-center justify-between gap-3 border-b border-white/10 pb-2.5">
          <ProfileHeaderAvatar
            loading={loading}
            initials={initials}
            fotoUrl={profile?.foto_url}
            nombre={profileName}
          />

          <div className="flex min-w-0 items-center gap-2">
            <img
              src={pho3nixLogo}
              alt="PHO3NIX"
              className="h-8 w-8 shrink-0 object-contain drop-shadow-[0_0_16px_rgba(249,115,22,0.35)]"
            />

            <div className="min-w-0">
              <p className="truncate text-xl font-black tracking-[0.14em] text-white">
                PHO<span className="text-orange-500">3</span>NIX
              </p>
              <p className="truncate text-[8px] font-black uppercase tracking-[0.2em] text-orange-500">
                Functional Fitness
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-orange-500/25 bg-orange-500/10 text-lg text-orange-300"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            ☰
          </button>
        </header>

        <section className="relative z-10 mb-3">
          <h1 className="text-2xl font-black uppercase tracking-[0.08em] text-white">
            Mi Perfil
          </h1>
          <p className="mt-1 max-w-[300px] text-sm leading-5 text-white/55">
            Administra tu información personal y configuración de cuenta.
          </p>
        </section>

        {error ? <Alert type="error" text={error} /> : null}
        {success ? <Alert type="success" text={success} /> : null}

        <ProfileIdentityCard
          loading={loading}
          profile={profile}
          initials={initials}
          profileName={profileName}
          membership={membership}
          uploading={uploading}
          onPickImage={onPickImage}
        />

        <MobilePersonalInfoCard
          profile={profile}
          loading={loading}
          onEdit={onEdit}
        />

        <MobileMembershipCleanCard
          membership={membership}
          mensualidad={mensualidad}
          loading={loading}
        />

        <MobileSettingsCard
          onChangePassword={() => setChangePasswordOpen(true)}
          onLogout={handleLogout}
        />
      </div>

      {changePasswordOpen ? (
        <ChangePasswordModal
          profile={profile}
          onClose={() => setChangePasswordOpen(false)}
          onDone={handleLogout}
        />
      ) : null}

      <AlumnoMobileNav />
    </main>
  )
}

function ProfileHeaderAvatar({ loading, initials, fotoUrl, nombre }) {
  if (!loading && fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={nombre || "Alumno"}
        className="h-9 w-9 shrink-0 rounded-full border border-orange-500/35 object-cover shadow-[0_0_20px_rgba(249,115,22,0.18)]"
      />
    )
  }

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-orange-500/35 bg-orange-500/10 text-[11px] font-black text-orange-300 shadow-[0_0_20px_rgba(249,115,22,0.18)]">
      {loading ? "..." : initials}
    </div>
  )
}

function ProfileIdentityCard({
  loading,
  profile,
  initials,
  profileName,
  membership,
  uploading,
  onPickImage,
}) {
  return (
    <section className="relative z-10 mb-3 overflow-hidden rounded-[1.35rem] border border-orange-500/25 bg-black/55 shadow-2xl shadow-black/40">
      <div className="absolute inset-0 bg-[url('/images/backWODCardAlumno.png')] bg-cover bg-center opacity-14" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_84%_28%,rgba(249,115,22,0.20),transparent_34%),linear-gradient(90deg,#050505_0%,rgba(5,5,5,0.94)_52%,rgba(5,5,5,0.70)_100%)]" />
      <div className="absolute -right-20 top-10 h-64 w-64 rounded-full bg-orange-500/14 blur-3xl" />

      <div className="relative z-10 grid grid-cols-[104px_minmax(0,1fr)] items-center gap-3 p-3.5">
        <div className="relative mx-auto">
          {profile?.foto_url ? (
            <img
              src={profile.foto_url}
              alt={profileName}
              className="h-24 w-24 rounded-[1.45rem] border border-orange-500/35 object-cover shadow-[0_0_28px_rgba(249,115,22,0.26)]"
              onError={(event) => {
                event.currentTarget.style.display = "none"
              }}
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-[1.45rem] border border-orange-500/35 bg-orange-500/10 text-3xl font-black text-orange-300 shadow-[0_0_28px_rgba(249,115,22,0.26)]">
              {initials}
            </div>
          )}

          <button
            type="button"
            onClick={onPickImage}
            disabled={uploading}
            className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 text-lg text-black shadow-xl transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Cambiar foto"
            title="Cambiar foto"
          >
            {uploading ? "…" : "📷"}
          </button>
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">
            Atleta PHO3NIX
          </p>

          <h2 className="mt-2 truncate text-2xl font-black uppercase leading-none text-white">
            {loading ? "Cargando..." : profileName}
          </h2>

          <p className="mt-2 truncate text-xs text-white/55">
            ✉️ {profile?.email || "Sin correo registrado"}
          </p>

          <div
            className={[
              "mt-3 inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase",
              membership.status === "activa"
                ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-300"
                : membership.status === "por_vencer"
                ? "border-amber-500/35 bg-amber-500/10 text-amber-300"
                : "border-red-500/35 bg-red-500/10 text-red-300",
            ].join(" ")}
          >
            <span className="h-2 w-2 rounded-full bg-current" />
            <span className="truncate">Membresía {membership.title}</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function MobilePersonalInfoCard({ profile, loading, onEdit }) {
  const age = getProfileAge(profile?.fecha_nacimiento)

  return (
    <section className="relative z-10 mb-3 overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/45 p-3 shadow-2xl shadow-black/30">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-black uppercase tracking-[0.1em] text-white/70">
            Información personal
          </p>
          <p className="mt-0.5 text-[10px] font-bold text-white/35">
            Datos básicos del alumno
          </p>
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="shrink-0 rounded-xl border border-orange-500/25 bg-orange-500/10 px-3 py-2 text-[10px] font-black uppercase text-orange-300"
        >
          Editar ✎
        </button>
      </div>

      <div className="grid gap-2">
        <ProfileInfoRow
          icon="📞"
          label="Teléfono"
          value={loading ? "..." : profile?.telefono || "Sin teléfono"}
        />
        <ProfileInfoRow
          icon="🪪"
          label="Cédula"
          value={loading ? "..." : profile?.cedula || "Sin cédula"}
        />
        <ProfileInfoRow
          icon="🎂"
          label="Fecha de nacimiento"
          value={
            loading
              ? "..."
              : profile?.fecha_nacimiento
              ? `${formatDateShort(profile.fecha_nacimiento)}${age ? ` · ${age} años` : ""}`
              : "Sin fecha"
          }
        />
        <ProfileInfoRow
          icon="🛡️"
          label="Rol"
          value={loading ? "..." : formatRole(profile?.role)}
        />
        <ProfileInfoRow
          icon="✉️"
          label="Correo"
          value={loading ? "..." : profile?.email || "Sin correo"}
        />
      </div>
    </section>
  )
}

function ProfileInfoRow({ icon, label, value }) {
  return (
    <article className="grid grid-cols-[42px_minmax(0,1fr)_16px] items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 text-lg text-orange-300">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-white/35">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm font-bold text-white/80">
          {value || "-"}
        </p>
      </div>

      <span className="text-lg font-black text-white/25">›</span>
    </article>
  )
}

function MobileMembershipCleanCard({ membership, mensualidad, loading }) {
  const circumference = 2 * Math.PI * 30
  const progress = Math.min(Math.max(Number(membership.progress || 0), 0), 100)
  const offset = circumference - (progress / 100) * circumference

  return (
    <section className="relative z-10 mb-3 overflow-hidden rounded-[1.25rem] border border-orange-500/20 bg-black/45 p-3 shadow-2xl shadow-black/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_34%,rgba(249,115,22,0.18),transparent_32%)]" />

      <div className="relative z-10">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-lg text-orange-400">👑</span>
          <p className="text-xs font-black uppercase tracking-[0.1em] text-white/70">
            Mi membresía
          </p>
        </div>

        <div className="grid grid-cols-[92px_minmax(0,1fr)] items-center gap-3">
          <div className="relative h-[86px] w-[86px]">
            <svg viewBox="0 0 86 86" className="h-full w-full -rotate-90">
              <circle
                cx="43"
                cy="43"
                r="30"
                fill="none"
                stroke="rgba(255,255,255,0.10)"
                strokeWidth="8"
              />
              <circle
                cx="43"
                cy="43"
                r="30"
                fill="none"
                stroke="#f97316"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-xl font-black leading-none text-orange-400">
                {progress}%
              </p>
              <p className="mt-1 text-[8px] font-bold uppercase text-white/45">
                Progreso
              </p>
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={[
                  "h-2.5 w-2.5 rounded-full",
                  membership.status === "activa"
                    ? "bg-emerald-400"
                    : membership.status === "por_vencer"
                    ? "bg-amber-400"
                    : "bg-red-400",
                ].join(" ")}
              />
              <p
                className={[
                  "truncate text-2xl font-black uppercase",
                  membership.status === "activa"
                    ? "text-emerald-300"
                    : membership.status === "por_vencer"
                    ? "text-amber-300"
                    : "text-red-300",
                ].join(" ")}
              >
                {loading ? "..." : membership.title}
              </p>
            </div>

            <p className="mt-1 truncate text-sm text-white/60">
              {membership.subtitle}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <MembershipDateBox
                label="Inicio"
                value={formatDateShort(mensualidad?.fecha_inicio)}
              />
              <MembershipDateBox
                label="Fin"
                value={formatDateShort(mensualidad?.fecha_fin)}
              />
            </div>
          </div>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-orange-500 shadow-[0_0_18px_rgba(249,115,22,0.30)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </section>
  )
}

function MembershipDateBox({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
      <p className="text-[9px] font-black uppercase tracking-[0.1em] text-white/35">
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-black text-white">
        {value || "-"}
      </p>
    </div>
  )
}

function MobileSettingsCard({ onChangePassword, onLogout }) {
  return (
    <section className="relative z-10 mb-4 overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/45 p-3 shadow-2xl shadow-black/30">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg text-orange-400">⚙️</span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.1em] text-white/70">
            Configuración
          </p>
          <p className="mt-0.5 text-[10px] font-bold text-white/35">
            Seguridad de la cuenta
          </p>
        </div>
      </div>

      <div className="grid gap-2">
        <SettingsRow
          icon="🔒"
          label="Cambiar contraseña"
          onClick={onChangePassword}
        />

        <SettingsRow
          icon="↪"
          label="Cerrar sesión"
          onClick={onLogout}
          danger
        />
      </div>
    </section>
  )
}

function SettingsRow({ icon, label, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "grid w-full grid-cols-[42px_minmax(0,1fr)_16px] items-center gap-2.5 rounded-xl border p-2.5 text-left transition active:scale-[0.99]",
        danger
          ? "border-red-500/20 bg-red-500/10 active:bg-red-500/15"
          : "border-white/10 bg-white/[0.03] active:bg-orange-500/10",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-10 w-10 items-center justify-center rounded-xl border text-lg",
          danger
            ? "border-red-500/25 bg-red-500/10 text-red-300"
            : "border-orange-500/20 bg-orange-500/10 text-orange-300",
        ].join(" ")}
      >
        {icon}
      </div>

      <p
        className={[
          "truncate text-sm font-bold",
          danger ? "text-red-200" : "text-white/80",
        ].join(" ")}
      >
        {label}
      </p>

      <span className="text-lg font-black text-white/25">›</span>
    </button>
  )
}

function ChangePasswordModal({ profile, onClose, onDone }) {
  const [form, setForm] = useState({
    email: profile?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [saving, setSaving] = useState(false)
  const [localError, setLocalError] = useState("")
  const [localSuccess, setLocalSuccess] = useState("")

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setSaving(true)
      setLocalError("")
      setLocalSuccess("")

      const registeredEmail = String(profile?.email || "").trim().toLowerCase()
      const typedEmail = String(form.email || "").trim().toLowerCase()

      if (!registeredEmail) {
        throw new Error("No se encontró el correo registrado del alumno.")
      }

      if (typedEmail !== registeredEmail) {
        throw new Error("El correo debe ser el mismo registrado en tu perfil.")
      }

      if (!form.currentPassword) {
        throw new Error("Ingresa tu contraseña actual.")
      }

      if (!form.newPassword || form.newPassword.length < 6) {
        throw new Error("La nueva contraseña debe tener al menos 6 caracteres.")
      }

      if (form.newPassword !== form.confirmPassword) {
        throw new Error("La nueva contraseña y la confirmación no coinciden.")
      }

      if (form.currentPassword === form.newPassword) {
        throw new Error("La nueva contraseña debe ser diferente a la actual.")
      }

      const { error: updateError } = await supabase.auth.updateUser({
        email: registeredEmail,
        current_password: form.currentPassword,
        password: form.newPassword,
      })

      if (updateError) {
        const message = String(updateError.message || "").toLowerCase()

        if (
          message.includes("current") ||
          message.includes("password") ||
          message.includes("invalid")
        ) {
          throw new Error("No se pudo cambiar la contraseña. Verifica tu contraseña actual e intenta de nuevo.")
        }

        throw updateError
      }

      setLocalSuccess("Contraseña actualizada. Cerrando sesión...")

      window.setTimeout(() => {
        onDone?.()
      }, 900)
    } catch (error) {
      console.error("Error cambiando contraseña:", error)
      setLocalError(error.message || "No se pudo cambiar la contraseña.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/88 p-4 backdrop-blur-2xl">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={saving ? undefined : onClose}
        aria-label="Cerrar"
      />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex max-h-[88dvh] w-full max-w-md flex-col overflow-hidden rounded-[1.6rem] border border-orange-500/25 bg-[#060606] shadow-[0_0_60px_rgba(249,115,22,0.20)]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-orange-400">
              Cambiar contraseña
            </p>
            <p className="mt-0.5 text-[10px] font-bold text-white/35">
              Usa el correo registrado en tu perfil
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-black/55 text-lg text-white/70 disabled:opacity-40"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {localError ? (
            <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {localError}
            </div>
          ) : null}

          {localSuccess ? (
            <div className="mb-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
              {localSuccess}
            </div>
          ) : null}

          <div className="grid gap-3 rounded-[1.25rem] border border-white/10 bg-black/45 p-3">
            <PasswordField label="Correo registrado">
              <input
                type="email"
                value={form.email}
                readOnly
                className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white/70 outline-none"
              />
            </PasswordField>

            <PasswordField label="Contraseña actual">
              <input
                type="password"
                value={form.currentPassword}
                onChange={(event) =>
                  updateField("currentPassword", event.target.value)
                }
                autoComplete="current-password"
                className="h-11 w-full rounded-xl border border-white/10 bg-black/55 px-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-500/60"
                placeholder="Ingresa tu contraseña actual"
              />
            </PasswordField>

            <PasswordField label="Nueva contraseña">
              <input
                type="password"
                value={form.newPassword}
                onChange={(event) =>
                  updateField("newPassword", event.target.value)
                }
                autoComplete="new-password"
                className="h-11 w-full rounded-xl border border-white/10 bg-black/55 px-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-500/60"
                placeholder="Nueva contraseña"
              />
            </PasswordField>

            <PasswordField label="Confirmar nueva contraseña">
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(event) =>
                  updateField("confirmPassword", event.target.value)
                }
                autoComplete="new-password"
                className="h-11 w-full rounded-xl border border-white/10 bg-black/55 px-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-500/60"
                placeholder="Repite la nueva contraseña"
              />
            </PasswordField>

            <div className="rounded-xl border border-orange-500/15 bg-orange-500/10 p-3 text-xs leading-5 text-orange-100/75">
              Después de guardar, la sesión se cerrará y deberás ingresar con tu nueva contraseña.
            </div>

            <button
              type="submit"
              disabled={saving}
              className="h-11 rounded-xl bg-orange-500 text-xs font-black uppercase text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Guardar nueva contraseña"}
            </button>
			
			<NativeSecurityCard />
			
          </div>
        </div>
      </form>
    </div>
  )
}

function PasswordField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-white/60">
        {label}
      </span>
      {children}
    </label>
  )
}


function getProfileAge(value) {
  if (!value) return null

  try {
    const birth = new Date(`${value}T00:00:00`)
    const today = new Date()

    if (Number.isNaN(birth.getTime())) return null

    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age -= 1
    }

    return age >= 0 ? age : null
  } catch {
    return null
  }
}

/* =======================================================
   DESKTOP COMPONENTS
======================================================= */

function HeaderBar({ loading, name, email, onEdit }) {
  return (
    <header className="grid shrink-0 gap-3 xl:grid-cols-[1fr_auto] xl:items-center">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.26em] text-orange-400">
          Perfil PHO3NIX
        </p>

        <h1 className="mt-1 text-4xl font-black tracking-tight text-white md:text-5xl">
          {loading ? "Cargando perfil..." : name}
        </h1>

        <p className="mt-1 text-sm text-white/55">
          {email || "Tu información personal, membresía y rendimiento."}
        </p>
      </div>

      <button
        type="button"
        onClick={onEdit}
        className="rounded-2xl border border-orange-500/35 bg-orange-500/10 px-5 py-3 text-sm font-black uppercase text-orange-300 transition hover:bg-orange-500/15"
      >
        Editar perfil
      </button>
    </header>
  )
}

function ProfileHeroCard({
  profile,
  initials,
  loading,
  uploading,
  onPickImage,
}) {
  const photoUrl = profile?.foto_url || ""

  return (
    <article className="relative min-h-[315px] overflow-hidden rounded-[2rem] border border-orange-500/20 bg-black/45 p-5 shadow-2xl shadow-black/30">
      <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-orange-500/20 blur-3xl" />
      <div className="absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-red-500/10 blur-3xl" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
        <div className="relative">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={profile?.nombre || "Foto de perfil"}
              className="h-36 w-36 rounded-[2rem] border border-orange-500/35 object-cover shadow-[0_0_35px_rgba(249,115,22,0.25)]"
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
            />
          ) : (
            <div className="flex h-36 w-36 items-center justify-center rounded-[2rem] border border-orange-500/35 bg-orange-500/10 text-4xl font-black text-orange-300 shadow-[0_0_35px_rgba(249,115,22,0.25)]">
              {initials}
            </div>
          )}

          <button
            type="button"
            onClick={onPickImage}
            disabled={uploading}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-2xl border border-orange-500/35 bg-orange-500 px-4 py-2 text-xs font-black uppercase text-black shadow-xl transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? "Subiendo..." : "Cambiar foto"}
          </button>
        </div>

        <h2 className="mt-8 text-2xl font-black uppercase text-white">
          {loading ? "Cargando..." : profile?.nombre || "Alumno PHO3NIX"}
        </h2>

        <p className="mt-1 text-sm text-white/50">
          {profile?.email || "Sin correo registrado"}
        </p>

        <div className="mt-4 rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-orange-300">
          {formatRole(profile?.role)}
        </div>

        <p className="mt-4 max-w-xs text-xs leading-5 text-white/40">
          Sube una foto desde tu PC o celular. Formatos permitidos: JPG, PNG o
          WEBP.
        </p>
      </div>
    </article>
  )
}

function ProfileMembershipCard({ membership, mensualidad, loading }) {
  return (
    <article className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 p-5 shadow-2xl shadow-black/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_35%,rgba(249,115,22,0.16),transparent_34%)]" />

      <div className="relative z-10">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
          Membresía
        </p>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div>
            <h3
              className={[
                "text-3xl font-black uppercase",
                membership.status === "activa"
                  ? "text-emerald-300"
                  : membership.status === "por_vencer"
                  ? "text-amber-300"
                  : "text-red-300",
              ].join(" ")}
            >
              {loading ? "..." : membership.title}
            </h3>

            <p className="mt-1 text-sm text-white/55">
              {membership.subtitle}
            </p>
          </div>

          <div className="text-4xl">💳</div>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className={[
              "h-full rounded-full",
              membership.status === "activa"
                ? "bg-emerald-400"
                : membership.status === "por_vencer"
                ? "bg-orange-500"
                : "bg-red-500",
            ].join(" ")}
            style={{ width: `${membership.progress}%` }}
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <MiniInfo
            label="Inicio"
            value={formatDateShort(mensualidad?.fecha_inicio)}
          />

          <MiniInfo
            label="Fin"
            value={formatDateShort(mensualidad?.fecha_fin)}
          />
        </div>
      </div>
    </article>
  )
}

function ProfileStatsSection({ loading, stats }) {
  return (
    <section className="grid shrink-0 gap-3 sm:grid-cols-4">
      <StatCard
        icon="🏋️"
        label="PR registrados"
        value={loading ? "..." : stats.totalPr}
        footer="Tus marcas"
      />

      <StatCard
        icon="🔥"
        label="Mejor marca"
        value={
          loading
            ? "..."
            : stats.bestGeneral?.peso_libras
            ? `${stats.bestGeneral.peso_libras} lb`
            : "--"
        }
        footer="Marca más alta"
      />

      <StatCard
        icon="📈"
        label="Último PR"
        value={
          loading
            ? "..."
            : stats.latestPr?.peso_libras
            ? `${stats.latestPr.peso_libras} lb`
            : "--"
        }
        footer={stats.latestPr?.fecha ? formatDateShort(stats.latestPr.fecha) : "Sin registro"}
      />

      <StatCard
        icon="⚡"
        label="Ejercicio fuerte"
        value={
          loading
            ? "..."
            : stats.strongestExercise?.ejercicio_nombre
            ? shortExercise(stats.strongestExercise.ejercicio_nombre)
            : "--"
        }
        footer={
          stats.strongestExercise?.peso_libras
            ? `${stats.strongestExercise.peso_libras} lb`
            : "Sin registro"
        }
      />
    </section>
  )
}

function StatCard({ icon, label, value, footer }) {
  return (
    <article className="relative min-h-[140px] overflow-hidden rounded-[2rem] border border-orange-500/20 bg-gradient-to-b from-orange-500/15 to-black/35 p-4 shadow-2xl shadow-black/30">
      <div className="absolute inset-x-5 bottom-0 h-px bg-orange-500/60 shadow-[0_0_18px_rgba(249,115,22,0.7)]" />

      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="text-3xl">{icon}</div>

        <div className="mt-3 text-2xl font-black text-white">
          {value}
        </div>

        <p className="mt-1 text-xs font-black uppercase text-orange-300">
          {label}
        </p>

        <p className="mt-2 text-[11px] text-white/45">
          {footer}
        </p>
      </div>
    </article>
  )
}

function ProfileInfoCard({ profile, loading, onEdit }) {
  return (
    <article className="min-h-0 overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 p-5 shadow-2xl shadow-black/30">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
            Información personal
          </p>

          <h3 className="mt-1 text-xl font-black uppercase text-white">
            Datos del alumno
          </h3>
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="rounded-xl border border-orange-500/25 px-3 py-2 text-xs font-black uppercase text-orange-300 transition hover:bg-orange-500/10"
        >
          Editar
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <InfoItem label="Nombre" value={loading ? "..." : profile?.nombre} />
        <InfoItem label="Correo" value={loading ? "..." : profile?.email} />
        <InfoItem label="Teléfono" value={loading ? "..." : profile?.telefono} />
        <InfoItem label="Cédula" value={loading ? "..." : profile?.cedula} />
        <InfoItem
          label="Nacimiento"
          value={loading ? "..." : formatDateShort(profile?.fecha_nacimiento)}
        />
        <InfoItem label="Rol" value={loading ? "..." : formatRole(profile?.role)} />
      </div>
    </article>
  )
}

function ProfileRecentPrList({ items = [], loading = false }) {
  return (
    <article className="min-h-0 overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 p-5 shadow-2xl shadow-black/30">
      <div className="mb-4">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
          Rendimiento
        </p>

        <h3 className="mt-1 text-xl font-black uppercase text-white">
          Últimos PR
        </h3>
      </div>

      {loading ? (
        <EmptyCard text="Cargando marcas..." />
      ) : items.length === 0 ? (
        <EmptyCard text="Aún no tienes PR registrados." />
      ) : (
        <div className="space-y-2">
          {items.slice(0, 4).map((item) => (
            <article
              key={item.id}
              className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-black uppercase text-white">
                  {item.ejercicio_nombre}
                </p>

                <p className="mt-1 text-xs text-white/45">
                  {formatDateShort(item.fecha)}
                </p>
              </div>

              <div className="text-lg font-black text-orange-400">
                {item.peso_libras} lb
              </div>
            </article>
          ))}
        </div>
      )}
    </article>
  )
}

function ProfileTipsCard() {
  return (
    <article className="shrink-0 overflow-hidden rounded-[2rem] border border-orange-500/20 bg-orange-500/10 p-4 shadow-2xl shadow-black/30">
      <div className="grid gap-3 md:grid-cols-[auto_1fr_auto] md:items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/25 bg-orange-500/10 text-2xl">
          🧠
        </div>

        <div>
          <p className="text-sm font-black uppercase text-white">
            Tip PHO3NIX
          </p>

          <p className="mt-1 text-sm text-white/55">
            Mantén actualizados tus datos y registra tus PR para medir tu
            progreso real.
          </p>
        </div>

        <div className="hidden rounded-2xl border border-orange-500/25 bg-black/30 px-4 py-2 text-xs font-black uppercase text-orange-300 md:block">
          Sé constante
        </div>
      </div>
    </article>
  )
}

/* =======================================================
   MODAL
======================================================= */

function ProfileEditModal({ profile, saving, onClose, onSave }) {
  const [form, setForm] = useState({
    telefono: profile?.telefono || "",
    fecha_nacimiento: profile?.fecha_nacimiento || "",
  })

  const handleSubmit = (event) => {
    event.preventDefault()
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-[220] bg-black/80 p-4 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-2xl items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="w-full overflow-hidden rounded-[2rem] border border-orange-500/25 bg-[#07090d] shadow-2xl shadow-orange-950/40"
        >
          <header className="border-b border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-400">
              Editar perfil
            </p>

            <h2 className="mt-1 text-2xl font-black uppercase text-white">
              Información editable
            </h2>
          </header>

          <div className="grid gap-4 p-5">
            <Field
              label="Teléfono"
              value={form.telefono}
              onChange={(value) =>
                setForm((current) => ({ ...current, telefono: value }))
              }
              placeholder="Ej: 0999999999"
            />

            <Field
              label="Fecha de nacimiento"
              type="date"
              value={form.fecha_nacimiento}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  fecha_nacimiento: value,
                }))
              }
            />

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/45">
              Nombre, correo, cédula, rol y membresía solo pueden ser
              modificados por administración.
            </div>
          </div>

          <footer className="flex justify-end gap-3 border-t border-white/10 p-5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-black uppercase text-white/60 transition hover:text-white disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black uppercase text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}

/* =======================================================
   UI HELPERS
======================================================= */

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/45">
        {label}
      </span>

      <input
        type={type}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-orange-500/60"
      />
    </label>
  )
}

function MiniInfo({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-white">
        {value || "-"}
      </p>
    </div>
  )
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-black text-white">
        {value || "-"}
      </p>
    </div>
  )
}

function EmptyCard({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-black/25 p-4 text-sm text-white/40">
      {text}
    </div>
  )
}

function Alert({ type, text }) {
  const isError = type === "error"

  return (
    <div
      className={[
        "relative z-10 mb-4 rounded-2xl border px-4 py-3 text-sm",
        isError
          ? "border-red-500/30 bg-red-500/10 text-red-200"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
      ].join(" ")}
    >
      {text}
    </div>
  )
}

function BackgroundOrbs() {
  return (
    <>
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-orange-600/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-red-600/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />
    </>
  )
}

/* =======================================================
   LOGIC HELPERS
======================================================= */

function getMembershipLabel(mensualidad) {
  if (!mensualidad) {
    return {
      status: "vencida",
      title: "Sin membresía",
      subtitle: "Consulta con administración",
      progress: 15,
    }
  }

  const info = mensualidadStatusInfo(mensualidad, new Date())

  if (!info.active) {
    return {
      status: "vencida",
      title: "Vencida",
      subtitle: "Renueva tu mensualidad",
      progress: 15,
    }
  }

  if (info.daysLeft !== null && info.daysLeft <= 7) {
    return {
      status: "por_vencer",
      title: "Por vencer",
      subtitle:
        info.daysLeft === 0
          ? "Vence hoy"
          : `Vence en ${info.daysLeft} día(s)`,
      progress: 72,
    }
  }

  return {
    status: "activa",
    title: "Activa",
    subtitle:
      info.daysLeft !== null
        ? `Vence en ${info.daysLeft} día(s)`
        : "Mensualidad activa",
    progress: 92,
  }
}

function validateImageFile(file) {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"]

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Formato no permitido. Usa JPG, PNG o WEBP.")
  }

  const maxSizeMb = 5
  const maxSizeBytes = maxSizeMb * 1024 * 1024

  if (file.size > maxSizeBytes) {
    throw new Error(`La imagen no debe superar ${maxSizeMb}MB.`)
  }
}

function getFileExtension(file) {
  const name = String(file.name || "")
  const ext = name.split(".").pop()?.toLowerCase()

  if (ext === "jpg" || ext === "jpeg") return "jpg"
  if (ext === "png") return "png"
  if (ext === "webp") return "webp"

  if (file.type === "image/png") return "png"
  if (file.type === "image/webp") return "webp"

  return "jpg"
}

function getInitials(name) {
  const parts = String(name || "PH")
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) return "PH"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function formatRole(role) {
  const value = String(role || "").trim().toLowerCase()

  if (value === "admin" || value === "administrador") return "Administrador"
  if (value === "coach") return "Coach"
  if (value === "alumno") return "Alumno"

  return role || "Alumno"
}

function formatDateShort(value) {
  if (!value) return "-"

  try {
    const date = new Date(`${value}T00:00:00`)

    return new Intl.DateTimeFormat("es-EC", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
      .format(date)
      .replace(".", "")
  } catch {
    return String(value)
  }
}

function shortExercise(value) {
  const text = String(value || "")

  if (text.length <= 12) return text

  return `${text.slice(0, 12)}...`
}