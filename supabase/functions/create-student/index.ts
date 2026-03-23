import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  }

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const { cedula, nombre, email } = await req.json()

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    // 1️⃣ Crear usuario en Auth
    const { data: userData, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          nombre,
          cedula,
          role: "student"
        }
      })

    if (createError) throw createError

    const userId = userData.user.id

    // 2️⃣ Insertar en tabla usuarios
    const { error: insertError } = await supabase
      .from("usuarios")
      .insert({
        id: userId,
        nombre,
        cedula,
        email,
        role: "student"
      })

    if (insertError) throw insertError

    // 3️⃣ Enviar email para crear contraseña
    const { error: resetError } =
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "http://localhost:5173/set-password"
      })

    if (resetError) throw resetError

    return new Response(
      JSON.stringify({ message: "Alumno creado correctamente" }),
      { status: 200, headers: corsHeaders }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: corsHeaders }
    )
  }
})