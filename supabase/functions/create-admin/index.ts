//supabase/function/create-admin
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Content-Type": "application/json",
  }

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const authHeader = req.headers.get("Authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({
          code: 401,
          message: "Missing authorization header",
        }),
        {
          status: 401,
          headers: corsHeaders,
        }
      )
    }

    const token = authHeader.replace("Bearer ", "").trim()

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

    // Cliente admin (service role)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // ✅ validar usuario llamante con el token recibido
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.getUser(token)

    if (authError || !authData?.user) {
      return new Response(
        JSON.stringify({
          code: 401,
          message: "Invalid JWT",
          details: authError?.message ?? null,
        }),
        {
          status: 401,
          headers: corsHeaders,
        }
      )
    }

    const callerUser = authData.user

    // Verificar rol del que invoca
    const { data: callerProfile, error: callerProfileError } =
      await supabaseAdmin
        .from("perfiles")
        .select("rol")
        .eq("id", callerUser.id)
        .single()

    if (callerProfileError || !callerProfile) {
      return new Response(
        JSON.stringify({
          code: 403,
          message: "No se pudo verificar el perfil del usuario autenticado",
        }),
        {
          status: 403,
          headers: corsHeaders,
        }
      )
    }

    const callerRole = String(callerProfile.rol || "").toLowerCase().trim()

    if (callerRole !== "admin" && callerRole !== "administrador") {
      return new Response(
        JSON.stringify({
          code: 403,
          message: "Solo un administrador puede ejecutar esta función",
        }),
        {
          status: 403,
          headers: corsHeaders,
        }
      )
    }

    // ===== Datos del admin maestro =====
    const email = "jim82.77@gmail.com"
    const password = "Pho3nix_MA2026"
    const nombre = "Carlos Viteri"
    const cedula = "9999999999"
    const telefono = "9999999999"
    const fecha_nacimiento = "2020-03-07"
    const sexo = "Masculino"
    const role = "Admin"

    // 1) buscar si ya existe en auth
    const { data: listData, error: listError } =
      await supabaseAdmin.auth.admin.listUsers()

    if (listError) throw listError

    const existingUser = listData.users.find(
      (u) => (u.email || "").toLowerCase() === email.toLowerCase()
    )

    let userId = ""

    if (existingUser) {
      userId = existingUser.id

      const { error: updateAuthError } =
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          email,
          password,
          email_confirm: true,
          user_metadata: {
            nombre,
            cedula,
            role,
            sexo,
            display_name: nombre,
          },
        })

      if (updateAuthError) throw updateAuthError
    } else {
      const { data: userData, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            nombre,
            cedula,
            role,
            sexo,
            display_name: nombre,
          },
        })

      if (createError) throw createError
      if (!userData?.user?.id) {
        throw new Error("No se pudo crear el admin maestro en Auth")
      }

      userId = userData.user.id
    }

    // 2) usuarios
    const { error: usuariosError } = await supabaseAdmin
      .from("usuarios")
      .upsert(
        {
          id: userId,
          nombre,
          cedula,
          email,
          role,
          telefono,
          fecha_nacimiento,
          sexo,
        },
        { onConflict: "id" }
      )

    if (usuariosError) throw usuariosError

    // 3) perfiles
    const { error: perfilesError } = await supabaseAdmin
      .from("perfiles")
      .upsert(
        {
          id: userId,
          nombre,
          rol: role,
        },
        { onConflict: "id" }
      )

    if (perfilesError) throw perfilesError

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Admin maestro creado o actualizado correctamente",
        user_id: userId,
        email,
        role,
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: error?.message || "Error interno en create-admin",
      }),
      {
        status: 400,
        headers: corsHeaders,
      }
    )
  }
})