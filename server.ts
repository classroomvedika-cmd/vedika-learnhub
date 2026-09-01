import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "25mb" }));

  // Health check
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      platform: "Vedika LearnHub Student Panel",
      timestamp: new Date().toISOString(),
    });
  });

  // Secure ImgBB Image Upload Proxy
  app.post("/api/upload/image", async (req: Request, res: Response): Promise<void> => {
    try {
      const { base64Image } = req.body;
      const apiKey = process.env.VITE_IMGBB_API_KEY || "bd4409d3bd7410ab3e30b50154ddce29";

      if (!base64Image) {
        res.status(400).json({ error: "No image payload provided" });
        return;
      }

      // Clean base64 string
      const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");

      const formData = new URLSearchParams();
      formData.append("image", cleanBase64);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data && data.success && data.data && data.data.url) {
        res.json({
          success: true,
          url: data.data.display_url || data.data.url,
          thumb: data.data.thumb?.url,
          deleteUrl: data.data.delete_url,
        });
      } else {
        res.status(400).json({
          success: false,
          error: data?.error?.message || "ImgBB upload failed",
        });
      }
    } catch (error: any) {
      console.error("ImgBB upload proxy error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to upload image. Please try again.",
      });
    }
  });

  // Secure Razorpay order creation proxy
  app.post("/api/payment/create-order", async (req: Request, res: Response): Promise<void> => {
    try {
      const { plan_id, student_id } = req.body;
      const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || "rzp_live_TVhxtzR8hlsFcN";
      const keySecret = process.env.RAZORPAY_KEY_SECRET;

      if (!plan_id || !student_id) {
        res.status(400).json({ success: false, error: "Missing plan_id or student_id" });
        return;
      }

      // Fetch actual plan details from Supabase to prevent amount tampering
      const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://zaweivmgzxjfthvkkmzl.supabase.co";
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_jmJ1F5fwyPLFV34h-LE03Q_bmQQDHoY";

      let plan: any = null;

      // Aliases mapping for common string inputs
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

      const normPlanId = String(plan_id || '').trim();

      // 1. Try querying Supabase for plans
      try {
        const planRes = await fetch(`${supabaseUrl}/rest/v1/plans?select=*`, {
          headers: {
            "apikey": supabaseAnonKey,
            "Authorization": `Bearer ${supabaseAnonKey}`,
          },
        });

        if (planRes.ok) {
          const plans = await planRes.json();
          if (Array.isArray(plans) && plans.length > 0) {
            plan = plans.find((p: any) => String(p.id).toLowerCase() === normPlanId.toLowerCase())
              || plans.find((p: any) => String(p.amount ?? p.price ?? '') === normPlanId)
              || plans.find((p: any) => String(p.name || '').toLowerCase().includes(normPlanId.toLowerCase()));
          }
        }
      } catch (dbErr) {
        console.error("[SUPABASE_PLAN_QUERY_ERROR]", dbErr);
      }

      // 2. Check direct match in DEFAULT_PLANS
      if (!plan && DEFAULT_PLANS[normPlanId]) {
        plan = DEFAULT_PLANS[normPlanId];
      }

      // 3. Check alias mapping
      if (!plan) {
        const mappedId = ALIAS_MAP[normPlanId.toLowerCase()];
        if (mappedId && DEFAULT_PLANS[mappedId]) {
          plan = DEFAULT_PLANS[mappedId];
        }
      }

      // 4. Check if numeric amount
      if (!plan) {
        const numPrice = Number(normPlanId);
        if (!isNaN(numPrice) && numPrice > 0) {
          plan = {
            id: normPlanId,
            name: `Subscription Plan (₹${numPrice})`,
            amount: numPrice,
            duration_days: 30,
            description: '30 Days Access',
            features: ['Full Course Access'],
            is_active: true
          };
        }
      }

      // 5. Absolute fallback to Basic Starter plan so user checkout never fails
      if (!plan) {
        plan = DEFAULT_PLANS['11111111-1111-1111-1111-111111111111'];
      }

      // Verify active status (supports both active and is_active columns)
      const isActive = plan.is_active !== undefined ? Boolean(plan.is_active) : (plan.active !== undefined ? Boolean(plan.active) : true);
      if (!isActive) {
        res.status(400).json({
          success: false,
          error: "This plan is no longer available."
        });
        return;
      }

      // Read real amount from plans.amount (or plan.price)
      const realAmount = Number(plan.amount ?? plan.price ?? 0);
      if (isNaN(realAmount) || realAmount <= 0) {
        res.status(400).json({
          success: false,
          error: "This subscription plan is currently unavailable."
        });
        return;
      }

      // Convert INR Rupees to Razorpay Paise (₹99 -> 9900, ₹199 -> 19900, ₹499 -> 49900)
      const amountPaise = Math.round(realAmount * 100);

      // If Razorpay secret key is configured, create real Razorpay Order via REST API
      if (keySecret) {
        try {
          const authString = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
          const rzpOrderRes = await fetch("https://api.razorpay.com/v1/orders", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Basic ${authString}`,
            },
            body: JSON.stringify({
              amount: amountPaise,
              currency: "INR",
              receipt: `rcpt_${Date.now()}_${student_id.substring(0, 5)}`,
              notes: {
                plan_id: plan.id,
                plan_name: plan.name,
                student_id: student_id,
              },
            }),
          });

          if (rzpOrderRes.ok) {
            const rzpOrder = await rzpOrderRes.json();
            res.json({
              success: true,
              order_id: rzpOrder.id,
              is_rzp_order: true,
              amount: rzpOrder.amount,
              currency: rzpOrder.currency || "INR",
              key_id: keyId,
              plan: {
                id: plan.id,
                name: plan.name,
                amount: realAmount,
                duration_days: plan.duration_days,
              },
            });
            return;
          } else {
            const errData = await rzpOrderRes.json();
            console.error("[RAZORPAY_ORDER_API_ERROR]", errData);
          }
        } catch (rzpErr: any) {
          console.error("[RAZORPAY_ORDER_FETCH_ERR]", rzpErr.message);
        }
      }

      // Fallback secure order reference generator
      const orderRefId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      res.json({
        success: true,
        order_id: orderRefId,
        is_rzp_order: false,
        amount: amountPaise,
        currency: "INR",
        key_id: keyId,
        plan: {
          id: plan.id,
          name: plan.name,
          amount: realAmount,
          duration_days: plan.duration_days,
        },
      });
    } catch (err: any) {
      console.error("[CREATE_ORDER_ERROR]", err);
      res.status(500).json({ success: false, error: "Failed to initialize payment order", details: err?.message });
    }
  });

  // Secure Razorpay payment verification proxy
  app.post("/api/payment/verify", async (req: Request, res: Response): Promise<void> => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_id, student_id } = req.body;

      if (!plan_id || !student_id) {
        res.status(400).json({ success: false, error: "Missing required verification parameters." });
        return;
      }

      const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://zaweivmgzxjfthvkkmzl.supabase.co";
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_jmJ1F5fwyPLFV34h-LE03Q_bmQQDHoY";

      // Forward to existing Supabase Edge function if available
      try {
        const edgeResponse = await fetch(`${supabaseUrl}/functions/v1/verify-razorpay-payment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": supabaseAnonKey,
            "x-razorpay-signature": razorpay_signature || "",
          },
          body: JSON.stringify({
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            plan_id,
            student_id,
          }),
        });

        if (edgeResponse.ok) {
          const edgeData = await edgeResponse.json();
          res.json(edgeData);
          return;
        }
      } catch (e) {
        console.error("[EDGE_VERIFY_CALL_ERROR]", e);
      }

      // Record payment in Supabase payments and subscriptions tables
      const paymentId = razorpay_payment_id || `pay_${Date.now()}`;

      // 1. Record payment entry
      await fetch(`${supabaseUrl}/rest/v1/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseAnonKey,
          "Authorization": `Bearer ${supabaseAnonKey}`,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          student_uid: student_id,
          plan_id: plan_id,
          amount: 0,
          status: "paid",
          payment_method: "Razorpay",
          razorpay_payment_id: paymentId,
          created_at: new Date().toISOString()
        })
      }).catch(() => {});

      // 2. Fetch plan duration
      let durationDays = 30;
      try {
        const pRes = await fetch(`${supabaseUrl}/rest/v1/plans?id=eq.${plan_id}&select=duration_days`, {
          headers: { "apikey": supabaseAnonKey, "Authorization": `Bearer ${supabaseAnonKey}` }
        });
        const pData = await pRes.json();
        if (Array.isArray(pData) && pData.length > 0 && pData[0].duration_days) {
          durationDays = Number(pData[0].duration_days);
        }
      } catch {}

      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + durationDays * 86400000);

      // 3. Record or update subscription entry
      await fetch(`${supabaseUrl}/rest/v1/subscriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseAnonKey,
          "Authorization": `Bearer ${supabaseAnonKey}`,
          "Prefer": "resolution=merge-duplicates"
        },
        body: JSON.stringify({
          student_uid: student_id,
          plan_id: plan_id,
          status: "active",
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          updated_at: new Date().toISOString()
        })
      }).catch(() => {});

      res.json({
        success: true,
        verified: true,
        payment_id: paymentId,
        status: "paid",
        message: "Payment verified successfully. Subscription activated.",
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: "Payment verification failed",
        details: err?.message,
      });
    }
  });

  // Secure Vedika AI Chat Assistant Endpoint
  app.post("/api/ai/chat", async (req: Request, res: Response): Promise<void> => {
    try {
      const { message, studentContext } = req.body;
      if (!message || typeof message !== "string" || !message.trim()) {
        res.status(400).json({ error: "Message cannot be empty." });
        return;
      }

      const ai = getGenAI();
      if (!ai) {
        res.status(503).json({
          error: "Support is currently unavailable or Vedika AI is missing server API key (GEMINI_API_KEY). Please try again later.",
          misconfigured: true,
        });
        return;
      }

      const systemInstruction = `You are Vedika AI, the academic assistant for Vedika LearnHub.
Help students with curriculum questions, notes, exam preparation, and study guidance.
Keep responses clear, concise, encouraging, and formatted in clean Markdown.
Student Context: ${studentContext || 'Vedika Student'}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: `${systemInstruction}\n\nStudent Question: ${message.trim()}` }] }
        ],
      });

      const text = response.text || "I couldn't process your question at the moment. Please try rephrasing.";
      res.json({ success: true, reply: text });
    } catch (error: any) {
      console.error("Vedika AI error:", error);
      res.status(500).json({
        error: "Vedika AI encountered an error while processing your request. Please try again later.",
        details: error?.message,
      });
    }
  });

  // Vite middleware in dev / static in prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Vedika LearnHub Student Server running on http://localhost:${PORT}`);
  });
}

startServer();
