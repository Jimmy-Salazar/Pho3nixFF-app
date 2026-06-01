// src/pages/admin/anuncios/services/anunciosService.js

import { supabase } from "../../../../supabase"

const BUCKET = "anuncios"

export async function fetchAnuncios() {
  const { data, error } = await supabase
    .from("anuncios")
    .select("id,titulo,contenido,fecha_publicacion,activo,created_at,media_url,media_tipo,creado_por")
    .order("fecha_publicacion", { ascending: false })

  if (error) throw error
  return data || []
}

export async function createAnuncio(payload) {
  const media = await uploadMediaIfNeeded(payload.mediaFile)

  const { error } = await supabase.from("anuncios").insert({
    titulo: payload.titulo,
    contenido: payload.contenido,
    fecha_publicacion: payload.fecha_publicacion,
    activo: payload.activo,
    media_url: media?.url || payload.media_url || null,
    media_tipo: media?.tipo || payload.media_tipo || null,
  })

  if (error) throw error
}

export async function updateAnuncio(id, payload) {
  const media = await uploadMediaIfNeeded(payload.mediaFile)

  const { error } = await supabase
    .from("anuncios")
    .update({
      titulo: payload.titulo,
      contenido: payload.contenido,
      fecha_publicacion: payload.fecha_publicacion,
      activo: payload.activo,
      media_url: media?.url || payload.media_url || null,
      media_tipo: media?.tipo || payload.media_tipo || null,
    })
    .eq("id", id)

  if (error) throw error
}

export async function deleteAnuncio(id) {
  const { error } = await supabase.from("anuncios").delete().eq("id", id)
  if (error) throw error
}

async function uploadMediaIfNeeded(file) {
  if (!file) return null

  const ext = file.name.split(".").pop() || "file"
  const tipo = file.type.startsWith("video/") ? "video" : "imagen"
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    })

  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)

  return {
    url: data.publicUrl,
    tipo,
  }
}
