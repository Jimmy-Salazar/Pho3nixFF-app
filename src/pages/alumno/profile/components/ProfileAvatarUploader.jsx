import { useRef, useState } from "react"

export default function ProfileAvatarUploader({
  profile,
  initials,
  uploading,
  onUpload,
}) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState("")

  const imageUrl = preview || profile?.foto_url || ""

  const handlePickFile = () => {
    if (uploading) return
    inputRef.current?.click()
  }

  const handleChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const localPreview = URL.createObjectURL(file)
    setPreview(localPreview)

    try {
      await onUpload(file)
    } finally {
      event.target.value = ""
    }
  }

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-orange-500/20 bg-black/45 p-5 shadow-2xl shadow-black/30">
      <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-orange-500/20 blur-3xl" />

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="relative">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={profile?.nombre || "Foto de perfil"}
              className="h-36 w-36 rounded-[2rem] border border-orange-500/30 object-cover shadow-[0_0_35px_rgba(249,115,22,0.22)]"
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
            />
          ) : (
            <div className="flex h-36 w-36 items-center justify-center rounded-[2rem] border border-orange-500/30 bg-orange-500/10 text-4xl font-black text-orange-300 shadow-[0_0_35px_rgba(249,115,22,0.22)]">
              {initials}
            </div>
          )}

          <button
            type="button"
            onClick={handlePickFile}
            disabled={uploading}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-2xl border border-orange-500/35 bg-orange-500 px-4 py-2 text-xs font-black uppercase text-black shadow-xl transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? "Subiendo..." : "Cambiar foto"}
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/*"
          className="hidden"
          onChange={handleChange}
        />

        <h2 className="mt-8 text-2xl font-black uppercase text-white">
          {profile?.nombre || "Alumno PHO3NIX"}
        </h2>

        <p className="mt-1 text-sm text-white/50">
          {profile?.email || "Sin correo registrado"}
        </p>

        <p className="mt-4 max-w-xs text-xs leading-5 text-white/40">
          Puedes subir una imagen desde tu PC o celular. Formatos permitidos:
          JPG, PNG o WEBP.
        </p>
      </div>
    </section>
  )
}