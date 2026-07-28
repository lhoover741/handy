const MAX_MESSAGE_LENGTH = 1200;
const MAX_HISTORY_MESSAGES = 12;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/api/chat")) {
      return json(request, env, {
        ok: true,
        service: `${env.BUSINESS_NAME || "Go Direct Home Services"} AI Chat`,
        model: env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
      });
    }

    if (url.pathname !== "/api/chat") {
      return json(request, env, { ok: false, message: "Not found." }, 404);
    }

    if (request.method !== "POST") {
      return json(request, env, { ok: false, message: "Method not allowed." }, 405);
    }

    if (!env.OPENROUTER_API_KEY) {
      return json(request, env, {
        ok: false,
        message: "The website assistant is not configured yet.",
      }, 503);
    }

    try {
      const body = await request.json();
      const message = clean(body?.message, MAX_MESSAGE_LENGTH);
      const history = normalizeHistory(body?.history);

      if (!message) {
        return json(request, env, { ok: false, message: "Please enter a message." }, 400);
      }

      const model = env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
      const systemPrompt = buildSystemPrompt(env);
      const messages = [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: message },
      ];

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      let response;
      try {
        response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": request.headers.get("Origin") || "https://go.govdirect.org",
            "X-OpenRouter-Title": `${env.BUSINESS_NAME || "Go Direct Home Services"} Assistant`,
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.3,
            max_tokens: 350,
          }),
        });
      } finally {
        clearTimeout(timeout);
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error("OpenRouter error", response.status, data?.error?.message || data);
        return json(request, env, {
          ok: false,
          message: response.status === 429
            ? "The assistant is busy right now. Please try again shortly."
            : "The assistant is temporarily unavailable. Please use the free estimate form or call/text (773) 573-5152.",
        }, response.status === 429 ? 429 : 502);
      }

      const reply = clean(data?.choices?.[0]?.message?.content, 4000);
      if (!reply) throw new Error("OpenRouter returned an empty response.");

      return json(request, env, { ok: true, reply });
    } catch (error) {
      console.error("Chat worker error", error);
      return json(request, env, {
        ok: false,
        message: error?.name === "AbortError"
          ? "The assistant took too long to respond. Please try again."
          : "The assistant is temporarily unavailable. Please use the free estimate form or call/text (773) 573-5152.",
      }, 500);
    }
  },
};

function buildSystemPrompt(env) {
  const estimateUrl = env.ESTIMATE_URL || "https://go.govdirect.org/free-estimate.html";

  return `You are the website assistant for Go Direct Home Services.

Business voice:
- Reliable, friendly, straightforward, helpful, and detail-oriented.
- Use plain language and concise answers.
- Keep most replies under 120 words.
- Ask only one useful follow-up question at a time.

Services:
- Furniture assembly
- TV mounting
- Basic appliance installation and standard appliance setup
- Door repairs and adjustments
- Shelf, closet rod, hook, curtain rod, blind, drape, and window-treatment installation
- Cable management and minor cable repairs
- General home repairs, small household projects, and home maintenance

Service areas include Cook County, Chicago Heights, Cicero, Calumet City, Oak Lawn, South Holland, Gary, Hammond, and nearby Northwest Indiana communities.

Primary goal:
Help visitors understand whether the business may handle their project, then direct qualified visitors to request a free estimate at ${estimateUrl}.

Rules:
- Never claim licensed electrical, plumbing, HVAC, gas, structural, or permit-required work unless specifically confirmed by the business.
- Use the phrases basic appliance installation, standard appliance setup, or replacement appliance installation.
- Never promise same-day service, exact availability, an exact price, or a guaranteed completion time.
- Explain that pricing depends on project details, location, materials, access, and photos.
- Photos are helpful but not required.
- Do not request Social Security numbers, payment-card information, passwords, door codes, or other sensitive information.
- Do not invent licenses, insurance, warranties, promotions, reviews, prices, or service details.
- When the visitor is ready, direct them to the free estimate form or tell them to call/text (773) 573-5152.
- For active leaks, gas odors, exposed live wiring, fire, structural hazards, or other emergencies, advise contacting emergency services or an appropriately licensed professional.`;
}

function normalizeHistory(value) {
  if (!Array.isArray(value)) return [];

  return value
    .slice(-MAX_HISTORY_MESSAGES)
    .map((item) => ({
      role: item?.role === "assistant" ? "assistant" : "user",
      content: clean(item?.content, 2000),
    }))
    .filter((item) => item.content);
}

function clean(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = String(env.ALLOWED_ORIGINS || "https://go.govdirect.org")
    .split(",")
    .map((item) => item.trim().replace(/\/$/, ""))
    .filter(Boolean);
  const normalizedOrigin = origin.replace(/\/$/, "");
  const allowOrigin = allowed.includes("*")
    ? origin || "*"
    : allowed.includes(normalizedOrigin)
      ? origin
      : allowed[0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
}

function json(request, env, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(request, env),
    },
  });
}
