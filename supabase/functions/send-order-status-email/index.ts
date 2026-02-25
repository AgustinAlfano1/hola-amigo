import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify admin caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    const anonClient = createClient(SUPABASE_URL, anonKey!, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { order_id, status } = await req.json();
    if (!order_id || !["shipped", "delivered"].includes(status)) {
      return new Response(JSON.stringify({ error: "Invalid params" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get order + user email using service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderError || !order) throw new Error("Order not found");

    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(order.user_id);
    if (userError || !userData?.user?.email) throw new Error("User email not found");

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", order.user_id)
      .single();

    const customerName = profile?.full_name || "Cliente";
    const email = userData.user.email;
    const total = Number(order.total_amount).toLocaleString("es-AR");

    const resend = new Resend(RESEND_API_KEY);

    let subject: string;
    let html: string;

    if (status === "shipped") {
      subject = "🚚 ¡Tu pedido ha sido enviado!";
      html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a; font-size: 24px;">¡Hola ${customerName}!</h1>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Tu pedido por <strong>$${total}</strong> ya ha sido <strong>enviado</strong> y está en camino.
          </p>
          <div style="background: #f0f4ff; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <p style="color: #2754C5; font-size: 18px; font-weight: bold; margin: 0;">📦 Pedido en camino</p>
            <p style="color: #555; margin: 8px 0 0;">Llegará en las próximas horas. ¡Estate atento!</p>
          </div>
          <p style="color: #888; font-size: 14px;">Si tenés alguna consulta, no dudes en contactarnos.</p>
        </div>
      `;
    } else {
      subject = "✅ ¡Tu pedido fue entregado!";
      html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a; font-size: 24px;">¡Hola ${customerName}!</h1>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Tu pedido por <strong>$${total}</strong> ha sido <strong>entregado y recibido correctamente</strong>.
          </p>
          <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <p style="color: #16a34a; font-size: 18px; font-weight: bold; margin: 0;">✅ Pedido entregado</p>
            <p style="color: #555; margin: 8px 0 0;">¡Gracias por tu compra! Esperamos que disfrutes tu producto.</p>
          </div>
          <p style="color: #888; font-size: 14px;">Si tenés alguna consulta, no dudes en contactarnos.</p>
        </div>
      `;
    }

    const { error: emailError } = await resend.emails.send({
      from: "Notificaciones <onboarding@resend.dev>",
      to: [email],
      subject,
      html,
    });

    if (emailError) throw new Error(`Resend error: ${JSON.stringify(emailError)}`);

    console.log(`Status email (${status}) sent to ${email} for order ${order_id}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error sending status email:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
