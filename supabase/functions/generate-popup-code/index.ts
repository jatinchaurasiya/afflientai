import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.8";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
    const { websiteId, popupId } = await req.json();

    // Validate request
    if (!websiteId || !popupId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get website and popup details
    const [websiteResult, popupResult] = await Promise.all([
      supabase
        .from("websites")
        .select("integration_key, domain")
        .eq("id", websiteId)
        .single(),
      supabase
        .from("popups")
        .select("*")
        .eq("id", popupId)
        .single()
    ]);

    if (websiteResult.error || popupResult.error) {
      throw new Error("Failed to fetch website or popup details");
    }

    const { integration_key, domain } = websiteResult.data;
    const popup = popupResult.data;

    // Generate the popup injector code
    const code = generatePopupInjectorCode(websiteId, popupId, integration_key, popup);

    return new Response(
      JSON.stringify({ 
        code,
        website: {
          domain,
          integration_key
        },
        popup: {
          id: popup.id,
          name: popup.name
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating popup code:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate popup code" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function generatePopupInjectorCode(
  websiteId: string,
  popupId: string,
  integrationKey: string,
  popup: any
): string {
  // Extract trigger settings
  const triggerType = popup.trigger_rules?.type || "scroll_percentage";
  const triggerValue = popup.trigger_rules?.value || 50;
  const timeDelay = popup.trigger_rules?.delay || 5000;

  return `<!-- AffiliateAI Popup Integration -->
<script>
  (function() {
    window.AffiliateAI = window.AffiliateAI || {};
    window.AffiliateAI.config = {
      siteId: '${websiteId}',
      apiKey: '${integrationKey}',
      popupId: '${popupId}',
      baseUrl: 'https://api.affilient.ai',
      options: {
        scrollThreshold: ${triggerType === "scroll_percentage" ? triggerValue / 100 : 0.7},
        timeDelay: ${triggerType === "time_delay" ? triggerValue * 1000 : timeDelay},
        maxPopupsPerSession: 3,
        cooldownPeriod: 300000 // 5 minutes
      }
    };
    
    var script = document.createElement('script');
    script.src = 'https://cdn.affilient.ai/popup-injector.min.js';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>`;
}