import { supabase } from "../../../../supabase"

export async function fetchProfileBundle(userId) {
  if (!userId) throw new Error("No se recibió el usuario.")

  const [profileResult, mensualidadResult, rmResult, ejerciciosResult] =
    await Promise.all([
      supabase
        .from("usuarios")
        .select("id,nombre,email,telefono,cedula,role,fecha_nacimiento,foto_url,created_at")
        .eq("id", userId)
        .maybeSingle(),

      supabase
        .from("mensualidades")
        .select("id,usuario_id,fecha_inicio,fecha_fin,estado,created_at")
        .eq("usuario_id", userId)
        .order("fecha_fin", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1),

      supabase
        .from("rm")
        .select("id,usuario,ejercicio_id,peso_libras,fecha,created_at")
        .eq("usuario", userId)
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

  const profile = profileResult.data || null
  const mensualidad = mensualidadResult.data?.[0] || null
  const rms = rmResult.data || []
  const ejercicios = ejerciciosResult.data || []

  return {
    profile,
    mensualidad,
    rms,
    ejercicios,
  }
}

export async function updateProfile(userId, payload) {
  if (!userId) throw new Error("No se recibió el usuario.")

  const cleanPayload = {
    telefono: payload.telefono || null,
    fecha_nacimiento: payload.fecha_nacimiento || null,
  }

  const { data, error } = await supabase
    .from("usuarios")
    .update(cleanPayload)
    .eq("id", userId)
    .select("id,nombre,email,telefono,cedula,role,fecha_nacimiento,foto_url,created_at")
    .single()

  if (error) throw error

  return data
}

export async function uploadAvatar(userId, file) {
  if (!userId) throw new Error("No se recibió el usuario.")
  if (!file) throw new Error("No se seleccionó ninguna imagen.")

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"]

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Formato no permitido. Usa JPG, PNG o WEBP.")
  }

  const maxSizeMb = 5
  const maxSizeBytes = maxSizeMb * 1024 * 1024

  if (file.size > maxSizeBytes) {
    throw new Error(`La imagen no debe superar ${maxSizeMb}MB.`)
  }

  const extension = getFileExtension(file)
  const filePath = `avatars/${userId}-${Date.now()}.${extension}`

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

  const { data, error } = await supabase
    .from("usuarios")
    .update({ foto_url: publicUrl })
    .eq("id", userId)
    .select("id,nombre,email,telefono,cedula,role,fecha_nacimiento,foto_url,created_at")
    .single()

  if (error) throw error

  return {
    profile: data,
    foto_url: publicUrl,
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