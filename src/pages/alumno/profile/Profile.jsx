import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../../supabase"
import { mensualidadStatusInfo } from "../../../utils/mensualidades"

import AlumnoSidebar from "../dashboard/components/AlumnoSidebar"
import AlumnoMobileNav from "../shared/AlumnoMobileNav"

const DEFAULT_STATE = {
  profile: null,
  mensualidad: null,
  rms: [],
  ejercicios: [],
}

export default function ProfileAlumno() {
  const navigate = useNavigate()
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
}) {
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Error cerrando sesión:", error)
    } finally {
      window.location.replace("/")
    }
  }

  return (
    <main className="h-[100dvh] w-screen max-w-full overflow-x-hidden overflow-y-auto bg-[#050505] pb-24 text-white">
      <div className="relative min-h-full w-full max-w-full overflow-x-hidden px-4 pt-4">
        <BackgroundOrbs />

        <header className="relative z-10 mb-5 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-orange-500/25 bg-orange-500/10 text-xl text-orange-300"
              aria-label="Cerrar sesión"
            >
              ↪
            </button>

            <div className="min-w-0">
              <p className="truncate text-2xl font-black tracking-[0.18em] text-white">
                PHO<span className="text-orange-500">3</span>NIX
              </p>

              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-500">
                Perfil del alumno
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onEdit}
            className="shrink-0 rounded-2xl border border-orange-500/25 bg-orange-500/10 px-4 py-3 text-xs font-black uppercase text-orange-300"
          >
            Editar
          </button>
        </header>

        {error ? <Alert type="error" text={error} /> : null}
        {success ? <Alert type="success" text={success} /> : null}

        <section className="relative z-10 mb-4 overflow-hidden rounded-[2rem] border border-orange-500/20 bg-black/45 p-5 shadow-2xl shadow-black/30">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-orange-500/20 blur-3xl" />

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="relative">
              {profile?.foto_url ? (
                <img
                  src={profile.foto_url}
                  alt={profileName}
                  className="h-32 w-32 rounded-[2rem] border border-orange-500/35 object-cover shadow-[0_0_35px_rgba(249,115,22,0.25)]"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-[2rem] border border-orange-500/35 bg-orange-500/10 text-4xl font-black text-orange-300 shadow-[0_0_35px_rgba(249,115,22,0.25)]">
                  {initials}
                </div>
              )}

              <button
                type="button"
                onClick={onPickImage}
                disabled={uploading}
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-2xl bg-orange-500 px-4 py-2 text-xs font-black uppercase text-black shadow-xl transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? "Subiendo..." : "Cambiar foto"}
              </button>
            </div>

            <h1 className="mt-8 max-w-full truncate text-3xl font-black uppercase text-white">
              {loading ? "Cargando..." : profileName}
            </h1>

            <p className="mt-1 max-w-full truncate text-sm text-white/50">
              {profile?.email || "Sin correo registrado"}
            </p>

            <div className="mt-4 rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-orange-300">
              {formatRole(profile?.role)}
            </div>
          </div>
        </section>

        <section className="relative z-10 mb-4 grid grid-cols-2 gap-3">
          <MobileProfileMetric
            icon="🏋️"
            label="PR registrados"
            value={loading ? "..." : stats.totalPr}
            footer="Tus marcas"
          />

          <MobileProfileMetric
            icon="🔥"
            label="Mejor marca"
            value={
              loading
                ? "..."
                : stats.bestGeneral?.peso_libras
                ? `${stats.bestGeneral.peso_libras} lb`
                : "--"
            }
            footer={
              stats.bestGeneral?.ejercicio_nombre
                ? stats.bestGeneral.ejercicio_nombre
                : "Sin registro"
            }
          />

          <MobileProfileMetric
            icon="📈"
            label="Último PR"
            value={
              loading
                ? "..."
                : stats.latestPr?.peso_libras
                ? `${stats.latestPr.peso_libras} lb`
                : "--"
            }
            footer={
              stats.latestPr?.fecha
                ? formatDateShort(stats.latestPr.fecha)
                : "Sin registro"
            }
          />

          <MobileProfileMetric
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

        <MobileMembershipCard
          membership={membership}
          mensualidad={mensualidad}
          loading={loading}
        />

        <MobileInfoCard profile={profile} loading={loading} onEdit={onEdit} />

        <MobileRecentPrList items={stats.recentPrs} loading={loading} />

        <MobileTipsCard />
      </div>

      <AlumnoMobileNav />
    </main>
  )
}

function MobileProfileMetric({ icon, label, value, footer }) {
  return (
    <article className="relative min-w-0 overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/45 p-4 shadow-2xl shadow-black/30">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-orange-500/15 blur-3xl" />

      <div className="relative z-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-2xl">
          {icon}
        </div>

        <p className="mt-3 truncate text-2xl font-black text-white">
          {value}
        </p>

        <p className="mt-1 truncate text-[10px] font-black uppercase tracking-[0.12em] text-orange-400">
          {label}
        </p>

        <p className="mt-1 truncate text-[11px] text-white/50">
          {footer}
        </p>
      </div>
    </article>
  )
}

function MobileMembershipCard({ membership, mensualidad, loading }) {
  return (
    <article className="relative z-10 mb-4 overflow-hidden rounded-[1.7rem] border border-white/10 bg-black/45 p-5 shadow-2xl shadow-black/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_35%,rgba(249,115,22,0.16),transparent_34%)]" />

      <div className="relative z-10">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
          Membresía
        </p>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h3
              className={[
                "truncate text-3xl font-black uppercase",
                membership.status === "activa"
                  ? "text-emerald-300"
                  : membership.status === "por_vencer"
                  ? "text-amber-300"
                  : "text-red-300",
              ].join(" ")}
            >
              {loading ? "..." : membership.title}
            </h3>

            <p className="mt-1 truncate text-sm text-white/55">
              {membership.subtitle}
            </p>
          </div>

          <div className="shrink-0 text-4xl">💳</div>
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

function MobileInfoCard({ profile, loading, onEdit }) {
  return (
    <article className="relative z-10 mb-4 overflow-hidden rounded-[1.7rem] border border-white/10 bg-black/45 p-5 shadow-2xl shadow-black/30">
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

      <div className="grid gap-3">
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

function MobileRecentPrList({ items = [], loading = false }) {
  return (
    <article className="relative z-10 mb-4 overflow-hidden rounded-[1.7rem] border border-white/10 bg-black/45 p-5 shadow-2xl shadow-black/30">
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
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-black uppercase text-white">
                  {item.ejercicio_nombre}
                </p>

                <p className="mt-1 text-xs text-white/45">
                  {formatDateShort(item.fecha)}
                </p>
              </div>

              <div className="shrink-0 text-lg font-black text-orange-400">
                {item.peso_libras} lb
              </div>
            </article>
          ))}
        </div>
      )}
    </article>
  )
}

function MobileTipsCard() {
  return (
    <article className="relative z-10 mb-4 overflow-hidden rounded-[1.7rem] border border-orange-500/20 bg-orange-500/10 p-4 shadow-2xl shadow-black/30">
      <div className="grid gap-3 grid-cols-[auto_minmax(0,1fr)] items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/25 bg-orange-500/10 text-2xl">
          🧠
        </div>

        <div className="min-w-0">
          <p className="text-sm font-black uppercase text-white">
            Tip PHO3NIX
          </p>

          <p className="mt-1 text-sm text-white/55">
            Registra tus PR y mantén tus datos actualizados.
          </p>
        </div>
      </div>
    </article>
  )
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