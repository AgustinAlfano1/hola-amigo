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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { order_id, status } = await req.json();
    const validStatuses = ["confirmed", "shipped", "delivered", "cancelled"];
    if (!order_id || !validStatuses.includes(status)) {
      return new Response(JSON.stringify({ error: "Invalid params" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: order, error: orderError } = await supabase
      .from("orders").select("*").eq("id", order_id).single();
    if (orderError || !order) throw new Error("Order not found");

    const { data: userData } = await supabase.auth.admin.getUserById(order.user_id);
    if (!userData?.user?.email) throw new Error("User email not found");

    const { data: profile } = await supabase
      .from("profiles").select("full_name").eq("id", order.user_id).single();

    const customerName = profile?.full_name || "Cliente";
    const email = userData.user.email;
    const total = Number(order.total_amount).toLocaleString("es-AR");
    const resend = new Resend(RESEND_API_KEY);

    const headerHtml = `
      <div style="background: linear-gradient(135deg, #b91c1c, #991b1b); padding: 32px 20px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; font-size: 28px; margin: 0; letter-spacing: 4px; font-family: sans-serif; text-transform: uppercase;">FIAT MORÓN</h1>
        <p style="color: rgba(255,255,255,0.85); font-size: 12px; margin: 6px 0 0; letter-spacing: 2px; text-transform: uppercase;">Repuestos & Accesorios</p>
      </div>
    `;
    const footerHtml = `
      <div style="background: #1a1a1a; padding: 24px 20px; text-align: center; border-radius: 0 0 12px 12px;">
        <p style="color: #999; font-size: 12px; margin: 0;">Este email fue enviado automáticamente. No respondas a este correo.</p>
        <p style="color: #666; font-size: 11px; margin: 8px 0 0;">© ${new Date().getFullYear()} FIAT Morón. Todos los derechos reservados.</p>
      </div>
    `;

    const configs: Record<string, { subject: string; icon: string; color: string; title: string; body: string }> = {
      confirmed: {
        subject: "✅ Tu pedido fue confirmado",
        icon: "✅", color: "#2563eb", title: "Pedido confirmado",
        body: `Tu compra fue procesada exitosamente y ya estamos preparando tu pedido. Te notificaremos cuando esté listo para el despacho.`,
      },
      shipped: {
        subject: "🚚 Tu pedido está en camino",
        icon: "🚚", color: "#7c3aed", title: "Pedido enviado",
        body: `Tu pedido está en camino. Nuestro equipo lo despachó y será entregado a la brevedad. Ante cualquier consulta sobre la entrega, no dudes en contactarnos.`,
      },
      delivered: {
        subject: "📦 Tu pedido fue entregado",
        icon: "📦", color: "#16a34a", title: "Pedido entregado",
        body: `Tu pedido fue entregado correctamente. ¡Gracias por elegirnos! Si necesitás algo más, recordá que estamos disponibles para cualquier consulta.`,
      },
      cancelled: {
        subject: "❌ Tu pedido fue cancelado",
        icon: "❌", color: "#dc2626", title: "Pedido cancelado",
        body: `Lamentamos informarte que tu pedido fue cancelado. Si creés que es un error o querés realizar un nuevo pedido, contactanos por WhatsApp y con gusto te atendemos.`,
      },
    };

    const cfg = configs[status];
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        ${headerHtml}
        <div style="padding: 32px 28px;">
          <h2 style="color: #1a1a1a; font-size: 20px; margin: 0 0 16px;">¡Hola ${customerName}!</h2>
          <p style="color: #444; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">${cfg.body}</p>
          <div style="background: #f9f9f9; border-left: 4px solid ${cfg.color}; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
            <p style="color: ${cfg.color}; font-size: 17px; font-weight: bold; margin: 0; text-transform: uppercase;">${cfg.icon} ${cfg.title}</p>
          </div>
          <p style="color: #999; font-size: 13px; margin: 0;">¿Tenés alguna consulta? Contactanos por WhatsApp: <a href="https://wa.me/5491149989332" style="color: #b91c1c;">+54 9 11 4998-9332</a></p>
        </div>
        ${footerHtml}
      </div>
    `;

    const { error: emailError } = await resend.emails.send({
      from: "FIAT Morón <notificaciones@fiatmoron.com.ar>",
      to: [email],
      subject: cfg.subject,
      html,
    });

    if (emailError) throw new Error(`Resend error: ${JSON.stringify(emailError)}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
