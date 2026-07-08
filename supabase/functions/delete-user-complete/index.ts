import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const IGNORABLE_CODES = new Set([
  "42P01", // tabla no existe
  "42703", // columna no existe
  "PGRST204", // columna no encontrada en PostgREST
])

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Método no permitido." }, 405)
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Faltan variables SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.")
    }

    const authHeader = req.headers.get("Authorization") || ""
    const token = authHeader.replace("Bearer ", "").trim()

    if (!token) {
      return jsonResponse({ error: "No se recibió token de autorización." }, 401)
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const { data: callerData, error: callerError } = await supabase.auth.getUser(token)

    if (callerError || !callerData?.user?.id) {
      return jsonResponse({ error: "Sesión no válida." }, 401)
    }

    const callerId = callerData.user.id

    const { data: callerProfile, error: callerProfileError } = await supabase
      .from("usuarios")
      .select("id,role")
      .eq("id", callerId)
      .maybeSingle()

    if (callerProfileError) throw callerProfileError

    if (!isAdminRole(callerProfile?.role)) {
      return jsonResponse({ error: "Solo un administrador puede eliminar usuarios." }, 403)
    }

    const body = await req.json().catch(() => ({}))
    const userId = body?.user_id || body?.userId || body?.id

    if (!userId) {
      return jsonResponse({ error: "No se recibió el ID del usuario a eliminar." }, 400)
    }

    if (String(userId) === String(callerId)) {
      return jsonResponse({ error: "No puedes eliminar tu propio usuario administrador." }, 400)
    }

    const { data: targetUser, error: targetError } = await supabase
      .from("usuarios")
      .select("id,nombre,email,role")
      .eq("id", userId)
      .maybeSingle()

    if (targetError) throw targetError

    if (!targetUser) {
      return jsonResponse({ error: "El usuario no existe en la tabla usuarios." }, 404)
    }

    if (isAdminRole(targetUser.role)) {
      return jsonResponse({ error: "Por seguridad, no se permite eliminar administradores desde esta función." }, 400)
    }

    const summary: Record<string, number> = {}

    // PR / RM
    await deleteWhere(supabase, summary, "rm", "usuario", userId)
    await deleteWhere(supabase, summary, "rm", "usuario_id", userId)
    await deleteWhere(supabase, summary, "rm", "alumno_id", userId)

    // WOD: primero limpiar posibles registros hijos por resultado.
    const wodResultadoIds = await collectIdsByColumns(supabase, "wod_resultados", [
      "usuario_id",
      "usuario",
      "alumno_id",
      "user_id",
    ], userId)

    for (const resultadoId of wodResultadoIds) {
      await deleteWhere(supabase, summary, "wod_resultado_participantes", "resultado_id", resultadoId)
      await deleteWhere(supabase, summary, "wod_resultado_participantes", "wod_resultado_id", resultadoId)
    }

    await deleteWhere(supabase, summary, "wod_resultado_participantes", "usuario_id", userId)
    await deleteWhere(supabase, summary, "wod_resultado_participantes", "usuario", userId)
    await deleteWhere(supabase, summary, "wod_resultado_participantes", "alumno_id", userId)
    await deleteWhere(supabase, summary, "wod_resultado_participantes", "user_id", userId)

    await deleteWhere(supabase, summary, "wod_resultados", "usuario_id", userId)
    await deleteWhere(supabase, summary, "wod_resultados", "usuario", userId)
    await deleteWhere(supabase, summary, "wod_resultados", "alumno_id", userId)
    await deleteWhere(supabase, summary, "wod_resultados", "user_id", userId)

    // Mensualidades y perfil.
    await deleteWhere(supabase, summary, "mensualidades", "usuario_id", userId)
    await deleteWhere(supabase, summary, "mensualidades", "usuario", userId)
    await deleteWhere(supabase, summary, "perfiles", "id", userId)
    await deleteWhere(supabase, summary, "perfiles", "usuario_id", userId)

    // Usuario visible en la app.
    await deleteWhere(supabase, summary, "usuarios", "id", userId, { strict: true })

    // Usuario de Supabase Auth.
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId)

    if (authDeleteError) {
      throw authDeleteError
    }

    return jsonResponse({
      message: `Usuario ${targetUser.nombre || targetUser.email || ""} eliminado definitivamente.`,
      deleted: summary,
    })
  } catch (error) {
    return jsonResponse(
      {
        error: error?.message || "No se pudo eliminar el usuario.",
      },
      400,
    )
  }
})

function isAdminRole(role: unknown) {
  const value = String(role || "").trim().toLowerCase()
  return value === "admin" || value === "administrador"
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  })
}

async function collectIdsByColumns(
  supabase: any,
  table: string,
  columns: string[],
  value: string,
) {
  const ids = new Set<string>()

  for (const column of columns) {
    const { data, error } = await supabase
      .from(table)
      .select("id")
      .eq(column, value)

    if (error) {
      if (isIgnorable(error)) continue
      throw error
    }

    ;(data || []).forEach((row: any) => {
      if (row?.id) ids.add(String(row.id))
    })
  }

  return Array.from(ids)
}

async function deleteWhere(
  supabase: any,
  summary: Record<string, number>,
  table: string,
  column: string,
  value: string,
  options: { strict?: boolean } = {},
) {
  const { data, error } = await supabase
    .from(table)
    .delete()
    .eq(column, value)
    .select("id")

  if (error) {
    if (!options.strict && isIgnorable(error)) {
      return
    }

    throw error
  }

  const count = Array.isArray(data) ? data.length : 0
  const key = `${table}.${column}`
  summary[key] = (summary[key] || 0) + count
}

function isIgnorable(error: any) {
  const code = String(error?.code || "")
  const message = String(error?.message || "").toLowerCase()

  return (
    IGNORABLE_CODES.has(code) ||
    message.includes("does not exist") ||
    message.includes("could not find") ||
    message.includes("schema cache")
  )
}
