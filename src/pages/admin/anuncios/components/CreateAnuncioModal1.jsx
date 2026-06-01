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
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar"
      />

      <form
        onSubmit={handleSubmit}
        className="phoenix-card relative z-[141] grid h-[92vh] w-full max-w-6xl grid-rows-[auto_1fr_auto] overflow-hidden"
      >
        <div className="relative overflow-hidden border-b border-orange-500/15 bg-black/55 px-5 py-4">
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-orange-500/20 blur-3xl" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em] text-orange-300">
                📣 {initialAnuncio ? "Editar anuncio" : "Crear anuncio"}
              </div>

              <h2 className="mt-1 text-2xl font-black text-white">
                {initialAnuncio ? "Actualizar anuncio" : "Crear anuncio"}
              </h2>

              <p className="mt-1 text-sm text-white/55">
                Se mostrará en la app y en el popup de novedades del Home.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-xl text-white/60 transition hover:border-orange-400/40 hover:text-orange-300"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
        </div>

        <div className="grid min-h-0 grid-cols-1 gap-4 p-5 lg:grid-cols-[1.05fr_.95fr]">
          <section className="grid min-h-0 grid-rows-[auto_1fr] gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Título del anuncio" required>
                <input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Nuevo desafío PHO3NIX"
                  className="phoenix-input h-11"
                />
              </Field>

              <Field label="Fecha y hora de publicación" required>
                <input
                  type="datetime-local"
                  value={fechaPublicacion}
                  onChange={(e) => setFechaPublicacion(e.target.value)}
                  className="phoenix-input h-11"
                />
              </Field>
            </div>

            <div className="grid min-h-0 grid-cols-1 gap-4 md:grid-cols-[.85fr_1.15fr]">
              <div className="space-y-4">
                <Field label="Imagen o video">
                  <label className="flex h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-orange-500/25 bg-black/30 p-4 text-center transition hover:bg-orange-500/10">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="text-3xl">🖼️</div>
                    <div className="mt-2 text-sm font-bold text-white/70">
                      Arrastra o selecciona
                    </div>
                    <div className="mt-1 text-xs text-white/40">
                      JPG, PNG, MP4, MOV
                    </div>
                  </label>
                </Field>

                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <label className="flex cursor-pointer items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-black text-white">Estado</div>
                      <div className="mt-1 text-xs text-white/50">
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

              <div className="rounded-2xl border border-orange-500/15 bg-orange-500/10 p-3">
                <div className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-orange-300">
                  Vista previa
                </div>

                <div className="relative h-[260px] overflow-hidden rounded-2xl border border-white/10 bg-black/35">
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
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-500/20 to-black text-5xl text-orange-500/35">
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

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/75 to-transparent p-4">
                    <h3 className="line-clamp-1 text-lg font-black text-orange-300">
                      {titulo || "Título del anuncio"}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-5 text-white/70">
                      {contenido || "Contenido del anuncio para previsualizar cómo se verá."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="min-h-0">
            <Field label="Contenido" required>
              <textarea
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                maxLength={500}
                placeholder="Escribe el contenido del anuncio..."
                className="h-[365px] w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/30 focus:border-orange-500 focus:shadow-[0_0_0_4px_rgba(249,115,22,.15)]"
              />
              <div className="mt-1 text-right text-xs text-white/35">
                {contenido.length}/500
              </div>
            </Field>

            <div className="mt-4 rounded-2xl border border-orange-500/15 bg-orange-500/10 p-4 text-sm leading-6 text-white/65">
              <span className="font-black text-orange-300">Tip:</span>{" "}
              Usa títulos cortos y una imagen clara. Este anuncio también alimentará el popup de novedades del Home.
            </div>
          </section>
        </div>

        <div className="flex justify-end gap-3 border-t border-orange-500/15 bg-black/45 p-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="phoenix-button-ghost min-w-[160px] py-2 text-sm disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={saving}
            className="phoenix-button-primary min-w-[200px] py-2 text-sm disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar anuncio"}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, required = false, children }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/55">
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
