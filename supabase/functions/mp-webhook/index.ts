import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const MP_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MP_ACCESS_TOKEN) throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    console.log("MP Webhook received:", JSON.stringify(body));

    if (body.type === "payment" || body.action === "payment.updated" || body.action === "payment.created") {
      const paymentId = body.data?.id;
      if (!paymentId) {
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const paymentResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } }
      );

      const payment = await paymentResponse.json();
      console.log("Payment details:", JSON.stringify(payment));

      const orderId = payment.external_reference;
      const paymentStatus = payment.status;

      if (orderId) {
        // Aprobado → queda en "pending" para que Nicolás confirme manualmente
        // Rechazado/cancelado → se cancela automáticamente
        let orderStatus = "pending";
        if (paymentStatus === "rejected" || paymentStatus === "cancelled") orderStatus = "cancelled";

        await supabase.from("orders").update({ status: orderStatus }).eq("id", orderId);

        const { data: order } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();

        if (order) {
          // Traer items del pedido (con product_id para descontar stock)
          const { data: orderItems } = await supabase
            .from("order_items")
            .select("product_name, product_brand, quantity, price_at_purchase, product_id")
            .eq("order_id", orderId);

          // Descontar stock solo si el pago fue aprobado
          if (paymentStatus === "approved" && orderItems) {
            for (const item of orderItems) {
              if (!item.product_id) continue;
              // Leer stock actual
              const { data: product } = await supabase
                .from("products")
                .select("stock_quantity")
                .eq("id", item.product_id)
                .single();
              if (product) {
                const newStock = Math.max(0, (product.stock_quantity || 0) - item.quantity);
                await supabase
                  .from("products")
                  .update({
                    stock_quantity: newStock,
                    in_stock: newStock > 0,
                  })
                  .eq("id", item.product_id);
              }
            }
          }

          // Traer teléfono del perfil
          const { data: profile } = await supabase
            .from("profiles")
            .select("phone")
            .eq("id", order.user_id)
            .single();

          const customerName = order.billing_name || "Cliente";
          const total = Number(order.total_amount).toLocaleString("es-AR");

          const statusText =
            orderStatus === "confirmed" ? "✅ Pago aprobado" :
            orderStatus === "cancelled" ? "❌ Pago rechazado" :
            "⏳ Pago pendiente";

          const itemsList = (orderItems || [])
            .map((i: any) => `${i.quantity}x ${i.product_name}${i.product_brand ? ` (${i.product_brand})` : ""} - $${Number(i.price_at_purchase).toLocaleString("es-AR")}`)
            .join(" | ");

          const deliveryText = order.delivery_type === "shipping"
            ? `Envío: ${order.shipping_address || ""} (CP: ${order.shipping_postal_code || ""})`
            : "Retiro en local";

          const message = [
            `${customerName} - Total: $${total}`,
            profile?.phone ? `Tel: ${profile.phone}` : null,
            order.billing_dni_cuit ? `DNI/CUIT: ${order.billing_dni_cuit}` : null,
            order.invoice_type === "factura_a" ? "Factura A" : "Consumidor Final",
            deliveryText,
            itemsList ? `Productos: ${itemsList}` : null,
          ].filter(Boolean).join(" | ");

          await supabase.from("notifications").insert({
            type: "order",
            title: statusText,
            message,
            order_id: orderId,
          });
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
