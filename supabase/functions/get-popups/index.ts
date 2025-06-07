// Edge function to get popups for a website
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
    const { userId, sessionId, url, recommendations, integrationKey } = await req.json();

    // Validate request
    if (!integrationKey && !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get website ID from integration key if provided
    let websiteId = null;
    if (integrationKey) {
      const { data: website } = await supabase
        .from("websites")
        .select("id, user_id")
        .eq("integration_key", integrationKey)
        .eq("status", "active")
        .single();

      if (website) {
        websiteId = website.id;
      }
    }

    // Get relevant popups
    const { data: popups, error } = await supabase
      .from("popups")
      .select(`
        *,
        popup_products(
          product_id,
          affiliate_products(*)
        )
      `)
      .eq("status", "active")
      .eq(websiteId ? "website_id" : "user_id", websiteId || userId);

    if (error) {
      throw error;
    }

    // Filter popups based on targeting rules
    const filteredPopups = popups?.filter(popup => {
      // Check if popup should be shown based on targeting rules
      const targeting = popup.targeting_rules || {};
      
      // Check device targeting
      if (targeting.deviceTypes && !targeting.deviceTypes.includes('all')) {
        const userAgent = req.headers.get('user-agent') || '';
        const isMobile = /mobile|android|iphone|ipad|ipod/i.test(userAgent);
        const isTablet = /tablet|ipad/i.test(userAgent);
        const deviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';
        
        if (!targeting.deviceTypes.includes(deviceType)) {
          return false;
        }
      }
      
      // Add more targeting filters as needed
      
      return true;
    }) || [];

    // Enhance popups with product data
    const enhancedPopups = filteredPopups.map(popup => {
      // If popup has products, add them to the config
      if (popup.popup_products && popup.popup_products.length > 0) {
        const products = popup.popup_products.map(pp => pp.affiliate_products);
        popup.config.content.products = products;
      } else if (recommendations && recommendations.length > 0) {
        // If no products are assigned but we have recommendations, use those
        popup.config.content.products = recommendations.slice(0, 3);
      }
      
      return popup;
    });

    return new Response(
      JSON.stringify(enhancedPopups),
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