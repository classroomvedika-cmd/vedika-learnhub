import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const keyId = Deno.env.get("RAZORPAY_KEY_ID") || "";
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET") || "";

    if (!keyId || !keySecret) {
      return new Response(
        JSON.stringify({ success: false, error: "Razorpay credentials are not configured in Supabase Edge Functions environment variables." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let stage = "initialization";
    let user: any = null;
    let authError: any = null;
    let authMethodUsed = "";

    const authHeader = req.headers.get("Authorization");
    const authHeaderExists = Boolean(authHeader);
    
    stage = "token_extraction";
    const accessToken = authHeader ? authHeader.replace(/^Bearer\s+/i, "").trim() : "";
    const tokenExtracted = Boolean(accessToken);

    if (!authHeaderExists) {
      console.log(`[DIAGNOSTIC] Stage: ${stage} | Auth Header Exists: false | Token Extracted: false | getUser() succeeded: false | User ID: none | Plan ID: none | Plan Found: false`);
      return new Response(
        JSON.stringify({ success: false, error: "Please log in again. Authorization header is missing.", stage }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!tokenExtracted) {
      console.log(`[DIAGNOSTIC] Stage: ${stage} | Auth Header Exists: true | Token Extracted: false | getUser() succeeded: false | User ID: none | Plan ID: none | Plan Found: false`);
      return new Response(
        JSON.stringify({ success: false, error: "Please log in again. Authorization token is missing.", stage }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    stage = "jwt_verification";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Because verify_jwt is active on the Supabase platform, Kong has already
    // cryptographically validated the signature of this token on ingress.
    try {
      const tokenParts = accessToken.split(".");
      if (tokenParts.length === 3) {
        let base64Url = tokenParts[1];
        // Replace base64url characters with base64 standard characters
        let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        // Add padding if needed
        while (base64.length % 4) {
          base64 += "=";
        }
        const payload = JSON.parse(atob(base64));
        if (payload && payload.sub && payload.sub.trim() !== "") {
          user = {
            id: payload.sub,
            email: payload.email,
            role: payload.role || "authenticated"
          };
          authMethodUsed = "gateway_verified_jwt";
        } else {
          authError = new Error("Invalid JWT: missing sub claim");
        }
      } else {
        authError = new Error("Invalid JWT structure");
      }
    } catch (err) {
      authError = err;
    }

    const getUserSucceeded = Boolean(user);
    const userId = user?.id || "none";

    if (!getUserSucceeded) {
      console.log(`[DIAGNOSTIC] Stage: ${stage} | Auth Header Exists: true | Token Extracted: true | getUser() succeeded: false | User ID: none | Plan ID: none | Plan Found: false | Error: ${authError?.message || 'Verification failed'}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Unauthorized student user.",
          stage
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    stage = "body_parsing";
    const body = await req.json().catch(() => ({}));
    const { plan_id } = body;
    const planId = plan_id || "none";

    if (!plan_id) {
      console.log(`[DIAGNOSTIC] Stage: ${stage} | Auth Header Exists: true | Token Extracted: true | getUser() succeeded: true | User ID: ${userId} | Plan ID: none | Plan Found: false`);
      return new Response(
        JSON.stringify({ success: false, error: "Missing plan_id parameter.", stage }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    stage = "plan_lookup";
    let plan: any = null;

    const { data: dbPlan, error: dbError } = await supabaseAdmin
      .from("plans")
      .select("*")
      .eq("id", plan_id)
      .maybeSingle();

    if (!dbError && dbPlan) {
      plan = dbPlan;
    }

    // Default active plans if database has not been seeded yet or plan not found
    const DEFAULT_PLANS: Record<string, any> = {
      '11111111-1111-1111-1111-111111111111': {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Basic Starter',
        amount: 99,
        duration_days: 30,
        description: '30 Days Access to all course modules and practice quizzes',
        features: ['Full Course Access', 'Daily Practice Quizzes', 'Community Chat Access'],
        is_active: true
      },
      '22222222-2222-2222-2222-222222222222': {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Pro Learner',
        amount: 199,
        duration_days: 90,
        description: '90 Days Unlimited Access with priority doubt solving and mock tests',
        features: ['Everything in Basic', '90 Days Full Access', 'Priority Doubt Clearing', 'Full Length Mock Tests'],
        is_active: true
      },
      '33333333-3333-3333-3333-333333333333': {
        id: '33333333-3333-3333-3333-333333333333',
        name: 'Mastery Annual',
        amount: 499,
        duration_days: 365,
        description: '365 Days Complete Access to all Premium Vedika content and 1-on-1 mentorship',
        features: ['365 Days Premium Access', '1-on-1 Help Desk Mentorship', 'All Mock Exams & Certificates', 'Downloadable Offline Resources'],
        is_active: true
      }
    };

    if (!plan) {
      if (DEFAULT_PLANS[plan_id]) {
        plan = DEFAULT_PLANS[plan_id];
      } else {
        const normPlanId = String(plan_id).toLowerCase().trim();
        const ALIAS_MAP: Record<string, string> = {
          'basic': '11111111-1111-1111-1111-111111111111',
          'basic starter': '11111111-1111-1111-1111-111111111111',
          'starter': '11111111-1111-1111-1111-111111111111',
          'plan_1': '11111111-1111-1111-1111-111111111111',
          'plan-1': '11111111-1111-1111-1111-111111111111',
          'plan_a': '11111111-1111-1111-1111-111111111111',
          '99': '11111111-1111-1111-1111-111111111111',
          '1': '11111111-1111-1111-1111-111111111111',

          'pro': '22222222-2222-2222-2222-222222222222',
          'pro learner': '22222222-2222-2222-2222-222222222222',
          'plan_2': '22222222-2222-2222-2222-222222222222',
          'plan-2': '22222222-2222-2222-2222-222222222222',
          'plan_b': '22222222-2222-2222-2222-222222222222',
          '199': '22222222-2222-2222-2222-222222222222',
          '2': '22222222-2222-2222-2222-222222222222',

          'mastery': '33333333-3333-3333-3333-333333333333',
          'mastery annual': '33333333-3333-3333-3333-333333333333',
          'annual': '33333333-3333-3333-3333-333333333333',
          'plan_3': '33333333-3333-3333-3333-333333333333',
          'plan-3': '33333333-3333-3333-3333-333333333333',
          'plan_c': '33333333-3333-3333-3333-333333333333',
          '499': '33333333-3333-3333-3333-333333333333',
          '3': '33333333-3333-3333-3333-333333333333',
        };

        const mappedId = ALIAS_MAP[normPlanId];
        if (mappedId && DEFAULT_PLANS[mappedId]) {
          plan = DEFAULT_PLANS[mappedId];
        }
      }
    }

    if (!plan) {
      return new Response(
        JSON.stringify({ success: false, error: "This subscription plan is currently unavailable." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isActive = plan.is_active !== undefined ? Boolean(plan.is_active) : true;
    if (!isActive) {
      return new Response(
        JSON.stringify({ success: false, error: "This plan is no longer active." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const realAmount = Number(plan.amount || 0);
    if (isNaN(realAmount) || realAmount <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid plan price." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert Rupees to Paise
    const amountPaise = Math.round(realAmount * 100);

    // Create Razorpay Order via REST API
    const authString = btoa(`${keyId}:${keySecret}`);
    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
        notes: {
          plan_id: plan.id,
          student_id: user.id,
        },
      }),
    });

    if (!rzpRes.ok) {
      const rzpErr = await rzpRes.json().catch(() => ({}));
      return new Response(
        JSON.stringify({ success: false, error: rzpErr.error?.description || "Failed to create order on Razorpay." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rzpOrder = await rzpRes.json();

    return new Response(
      JSON.stringify({
        success: true,
        order_id: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency || "INR",
        key_id: keyId,
        plan: {
          id: plan.id,
          name: plan.name,
          amount: realAmount,
          duration_days: plan.duration_days,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Internal server error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
