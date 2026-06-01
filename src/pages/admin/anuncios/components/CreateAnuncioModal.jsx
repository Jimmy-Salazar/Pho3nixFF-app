// src/pages/admin/anuncios/components/CreateAnuncioModal.jsx

import { useMemo, useState } from "react"

export default function CreateAnuncioModal({
  initialAnuncio = null,
  saving = false,
  onClose,
  onSave,
}) {
  const [titulo, setTitulo] = useState(initialAnuncio?.titulo || "")
  const [contenido, setContenido] = useState(initialAnuncio?.contenido || "")
  const [fechaPublicacion, setFechaPublicacion] = useState(
    toLocalDateTimeInput(initialAnuncio?.fecha_publicacion)
  )
  const [activo, setActivo] = useState(initialAnuncio?.activo ?? true)
  const [mediaFile, setMediaFile] = useState(null)
  const [mediaUrl, setMediaUrl] = useState(initialAnuncio?.media_url || "")
  const [mediaTipo, setMediaTipo] = useState(initialAnuncio?.media_tipo || "")

  const previewUrl = useMemo(() => {
    if (mediaFile) return URL.createObjectURL(mediaFile)
    return mediaUrl
  }, [mediaFile, mediaUrl])

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setMediaFile(file)
    setMediaTipo(file.type.startsWith("video/") ? "video" : "imagen")
  }

  function clearMedia() {
    setMediaFile(null)
    setMediaUrl("")
    setMediaTipo("")
  }

  function handleSubmit(e) {
    e.preventDefault()

    if (!titulo.trim()) {
      alert("El título es obligatorio.")
      return
    }

    if (!contenido.trim()) {
      alert("El contenido es obligatorio.")
      return
    }

    onSave({
      titulo: titulo.trim(),
      contenido: contenido.trim(),
      fecha_publicacion: fechaPublicacion
        ? new Date(fechaPublicacion).toISOString()
        : new Date().toISOString(),
      activo,
      mediaFile,
      media_url: mediaUrl || null,
      media_tipo: mediaTipo || null,
    })
  }

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-2 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/85 backdrop-blur-xl"
        onClick={onClose}
        aria-label="Cerrar"
      />

      <form
        onSubmit={handleSubmit}
        className="phoenix-card relative z-[141] flex max-h-[92dvh] w-full max-w-[96vw] flex-col overflow-hidden rounded-[1.6rem] sm:max-w-3xl lg:max-w-6xl"
      >
        <div className="relative shrink-0 overflow-hidden border-b border-orange-500/15 bg-black/55 px-4 py-3 sm:px-5 sm:py-4">
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-orange-500/20 blur-3xl" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-orange-300 sm:text-sm">
                📣 {initialAnuncio ? "Editar anuncio" : "Crear anuncio"}
              </div>

              <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">
                {initialAnuncio ? "Actualizar anuncio" : "Crear anuncio"}
              </h2>

              <p className="mt-1 text-xs text-white/55 sm:text-sm">
                Se mostrará en la app y en novedades del Home.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-lg text-white/60 transition hover:border-orange-400/40 hover:text-orange-300 sm:h-9 sm:w-9 sm:text-xl"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5 lg:grid lg:grid-cols-[1.05fr_.95fr] lg:gap-4">
          <section className="grid min-h-0 gap-3 sm:gap-4 lg:grid-rows-[auto_1fr]">
            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
              <Field label="Título del anuncio" required>
                <input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Nuevo desafío PHO3NIX"
                  className="phoenix-input h-10 text-sm sm:h-11"
                />
              </Field>

              <Field label="Fecha y hora de publicación" required>
                <input
                  type="datetime-local"
                  value={fechaPublicacion}
                  onChange={(e) => setFechaPublicacion(e.target.value)}
                  className="phoenix-input h-10 text-sm sm:h-11"
                />
              </Field>
            </div>

            <div className="grid min-h-0 grid-cols-1 gap-3 sm:gap-4 md:grid-cols-[.85fr_1.15fr]">
              <div className="space-y-3 sm:space-y-4">
                <Field label="Imagen o video">
                  <label className="flex h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-orange-500/25 bg-black/30 p-3 text-center transition hover:bg-orange-500/10 sm:h-40 sm:p-4">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="text-2xl sm:text-3xl">🖼️</div>
                    <div className="mt-1.5 text-xs font-bold text-white/70 sm:text-sm">
                      Arrastra o selecciona
                    </div>
                    <div className="mt-1 text-[11px] text-white/40 sm:text-xs">
                      JPG, PNG, MP4, MOV
                    </div>
                  </label>
                </Field>

                <div className="rounded-2xl border border-white/10 bg-black/25 p-3 sm:p-4">
                  <label className="flex cursor-pointer items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-black text-white sm:text-sm">Estado</div>
                      <div className="mt-1 text-[11px] text-white/50 sm:text-xs">
                        {activo ? "Activo en la app" : "Oculto para usuarios"}
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={activo}
                      onChange={(e) => setActivo(e.target.checked)}
                      className="h-5 w-5 accent-orange-500"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-orange-500/15 bg-orange-500/10 p-2.5 sm:p-3">
                <div className="mb-2 text-[10px] font-black uppercase tracking-[0.12em] text-orange-300 sm:text-xs">
                  Vista previa
                </div>

                <div className="relative h-[190px] overflow-hidden rounded-2xl border border-white/10 bg-black/35 sm:h-[260px]">
                  {previewUrl ? (
                    mediaTipo === "video" ? (
                      <video
                        src={previewUrl}
                        className="h-full w-full object-cover"
                        controls
                      />
                    ) : (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    )
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-500/20 to-black text-3xl text-orange-500/35 sm:text-5xl">
                      PHO3NIX
                    </div>
                  )}

                  {previewUrl ? (
                    <button
                      type="button"
                      onClick={clearMedia}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:text-orange-300"
                    >
                      ×
                    </button>
                  ) : null}

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/75 to-transparent p-3 sm:p-4">
                    <h3 className="line-clamp-1 text-sm font-black text-orange-300 sm:text-lg">
                      {titulo || "Título del anuncio"}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/70 sm:text-sm">
                      {contenido || "Contenido del anuncio para previsualizar cómo se verá."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-3 min-h-0 sm:mt-4 lg:mt-0">
            <Field label="Contenido" required>
              <textarea
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                maxLength={500}
                placeholder="Escribe el contenido del anuncio..."
                className="h-[190px] w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm leading-6 text-white outline-none transition placeholder:text-white/30 focus:border-orange-500 focus:shadow-[0_0_0_4px_rgba(249,115,22,.15)] sm:h-[365px] sm:px-4 sm:py-3"
              />
              <div className="mt-1 text-right text-[11px] text-white/35 sm:text-xs">
                {contenido.length}/500
              </div>
            </Field>

            <div className="mt-3 rounded-2xl border border-orange-500/15 bg-orange-500/10 p-3 text-xs leading-5 text-white/65 sm:mt-4 sm:p-4 sm:text-sm sm:leading-6">
              <span className="font-black text-orange-300">Tip:</span>{" "}
              Usa títulos cortos y una imagen clara. Este anuncio también alimentará el popup de novedades del Home.
            </div>
          </section>
        </div>

        <div className="shrink-0 border-t border-orange-500/15 bg-black/45 p-3 sm:p-4">
          <div className="grid gap-2 sm:flex sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="phoenix-button-ghost py-2 text-xs disabled:opacity-60 sm:min-w-[140px] sm:text-sm"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="phoenix-button-primary py-2 text-xs disabled:opacity-60 sm:min-w-[180px] sm:text-sm"
            >
              {saving ? "Guardando..." : "Guardar anuncio"}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

function Field({ label, required = false, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-white/55 sm:mb-2 sm:text-xs">
        {label} {required ? <span className="text-orange-300">*</span> : null}
      </label>
      {children}
    </div>
  )
}

function toLocalDateTimeInput(value) {
  try {
    const date = value ? new Date(value) : new Date()
    const offset = date.getTimezoneOffset()
    const local = new Date(date.getTime() - offset * 60 * 1000)
    return local.toISOString().slice(0, 16)
  } catch {
    return ""
  }
}
