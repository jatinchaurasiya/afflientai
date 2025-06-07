// Edge function to track user events
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.8";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Parse request body
    const {
      event_type,
      session_id,
      user_id,
      url,
      timestamp,
      integration_key,
      popup_id,
      product_id,
      link_id,
      value,
      metadata
    } = await req.json();

    // Validate request
    if (!integration_key || !session_id || !event_type) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify integration key
    const { data: website, error: websiteError } = await supabase
      .from("websites")
      .select("id, user_id, domain, status")
      .eq("integration_key", integration_key)
      .eq("status", "active")
      .single();

    if (websiteError || !website) {
      return new Response(
        JSON.stringify({ error: "Invalid integration key" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Store event in database
    const { data: interaction, error: interactionError } = await supabase
      .from("user_interactions")
      .insert({
        website_id: website.id,
        session_id,
        user_id,
        event_type,
        popup_id,
        product_id,
        link_id,
        event_value: value,
        metadata: metadata || {},
        timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString()
      });

    if (interactionError) {
      throw interactionError;
    }

    // Process specific event types
    if (event_type === 'popup_displayed' && popup_id) {
      await trackPopupEvent(popup_id, 'displayed', session_id, metadata);
    } else if (event_type === 'popup_clicked' && popup_id) {
      await trackPopupEvent(popup_id, 'clicked', session_id, metadata);
    } else if (event_type === 'product_clicked' && product_id) {
      await trackProductClick(product_id, session_id, url);
    } else if (event_type === 'conversion' && product_id) {
      await trackConversion(product_id, value || 0, session_id);
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Track popup event
async function trackPopupEvent(popupId: string, eventType: string, sessionId: string, metadata: any) {
  try {
    await supabase
      .from("popup_events")
      .insert({
        popup_id: popupId,
        event_type: eventType,
        user_session: sessionId,
        user_agent: metadata?.user_agent,
        ip_address: metadata?.ip_address,
        referrer: metadata?.referrer,
        page_url: metadata?.url,
        metadata: metadata || {}
      });
  } catch (error) {
    console.error("Error tracking popup event:", error);
  }
}

// Track product click
async function trackProductClick(productId: string, sessionId: string, url: string) {
  try {
    // Find the affiliate link for this product
    const { data: product } = await supabase
      .from("affiliate_products")
      .select("id, account_id")
      .eq("id", productId)
      .single();

    if (!product) return;

    // Update link analytics
    const today = new Date().toISOString().split('T')[0];
    
    // Get the affiliate link
    const { data: link } = await supabase
      .from("affiliate_links")
      .select("id, user_id, account_id")
      .eq("product_id", productId)
      .single();

    if (!link) return;

    // Update link analytics
    await supabase
      .from("link_analytics")
      .upsert({
        user_id: link.user_id,
        account_id: link.account_id,
        link_id: link.id,
        date: today,
        clicks: 1
      }, {
        onConflict: "user_id,account_id,link_id,date",
        ignoreDuplicates: false
      });

  } catch (error) {
    console.error("Error tracking product click:", error);
  }
}

// Track conversion
async function trackConversion(productId: string, value: number, sessionId: string) {
  try {
    // Find the affiliate link for this product
    const { data: product } = await supabase
      .from("affiliate_products")
      .select("id, account_id, commission_rate")
      .eq("id", productId)
      .single();

    if (!product) return;

    // Get the affiliate link
    const { data: link } = await supabase
      .from("affiliate_links")
      .select("id, user_id, account_id")
      .eq("product_id", productId)
      .single();

    if (!link) return;

    // Calculate commission
    const commission = value * (product.commission_rate / 100);

    // Update link analytics
    const today = new Date().toISOString().split('T')[0];
    
    await supabase
      .from("link_analytics")
      .upsert({
        user_id: link.user_id,
        account_id: link.account_id,
        link_id: link.id,
        date: today,
        conversions: 1,
        revenue: value,
        commissions: commission
      }, {
        onConflict: "user_id,account_id,link_id,date",
        ignoreDuplicates: false
      });

  } catch (error) {
    console.error("Error tracking conversion:", error);
  }
}