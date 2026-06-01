// src/pages/admin/anuncios/utils/anunciosUtils.js

export function getAnuncioStatus(anuncio) {
  if (!anuncio?.activo) return "inactivo"
  const now = new Date()
  const publishAt = anuncio?.fecha_publicacion ? new Date(anuncio.fecha_publicacion) : null
  if (publishAt && publishAt > now) return "programado"
  return "activo"
}

export function formatDateTime(value) {
  if (!value) return "Sin fecha"

  try {
    const date = new Date(value)
    return new Intl.DateTimeFormat("es-EC", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date)
  } catch {
    return String(value)
  }
}
