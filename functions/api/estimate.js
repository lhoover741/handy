const MAX_PHOTOS = 5;
const MAX_PHOTO_SIZE = 8 * 1024 * 1024;
const OWNER_PHONE = "+17735735152";

const SERVICES = new Set([
  "Furniture assembly",
  "TV mounting",
  "Basic appliance installation",
  "Door repair or adjustment",
  "Cable repair or cable management",
  "Shelf, rod, or hook installation",
  "Blinds or window treatment installation",
  "Home maintenance",
  "Other small home repair",
]);

export async function onRequestOptions({ request, env }) {
  return new Response(null, { status: 204, headers: corsHeaders(request, env) });
}

export async function onRequestGet({ request, env }) {
  return json(request, env, {
    ok: true,
    service: env.BUSINESS_NAME || "Go Direct Home Services",
    endpoint: "/api/estimate",
    bindings: {
      d1: Boolean(env.DB),
      r2: Boolean(env.PHOTOS),
      resend: Boolean(env.RESEND_API_KEY && env.ESTIMATE_NOTIFY_TO && env.ESTIMATE_NOTIFY_FROM),
      twilio: Boolean(env.TWILIO_SID && env.TWILIO_TOKEN && env.TWILIO_FROM),
    },
  });
}

export async function onRequestPost({ request, env }) {
  try {
    const contentType = request.headers.get("content-type") || "";
    const submission = contentType.includes("multipart/form-data")
      ? await parseMultipartSubmission(request, env)
      : await request.json();

    if (submission.website) {
      return json(request, env, { ok: true, message: "Thanks. Your request was received." });
    }

    const normalized = normalizeSubmission(submission, request);
    const errors = validateSubmission(normalized);

    if (errors.length) {
      return json(request, env, { ok: false, message: errors.join(" ") }, 400);
    }

    const delivery = {
      d1: "not_configured",
      email: "not_configured",
      sms_customer: "not_configured",
      sms_owner: "not_configured",
    };

    if (env.DB) {
      try {
        await saveToD1(env, normalized);
        delivery.d1 = "saved";
      } catch (error) {
        delivery.d1 = "failed";
        console.error("D1 save failed", error);
      }
    }

    if (env.RESEND_API_KEY && env.ESTIMATE_NOTIFY_TO && env.ESTIMATE_NOTIFY_FROM) {
      try {
        await sendEmailNotification(env, normalized);
        delivery.email = "sent";
      } catch (error) {
        delivery.email = "failed";
        console.error("Email notification failed", error);
      }
    }

    if (env.TWILIO_SID && env.TWILIO_TOKEN && env.TWILIO_FROM) {
      const customerPhone = normalizePhone(normalized.phone);

      if (customerPhone) {
        try {
          await sendSms(env, customerPhone, buildCustomerSms(normalized));
          delivery.sms_customer = "sent";
        } catch (error) {
          delivery.sms_customer = "failed";
          console.error("Customer SMS failed", error);
        }
      } else {
        delivery.sms_customer = "invalid_phone";
      }

      try {
        await sendSms(env, OWNER_PHONE, buildOwnerSms(normalized));
        delivery.sms_owner = "sent";
      } catch (error) {
        delivery.sms_owner = "failed";
        console.error("Owner SMS failed", error);
      }
    }

    const savedOrSent = delivery.d1 === "saved" || delivery.email === "sent" || delivery.sms_customer === "sent" || delivery.sms_owner === "sent";

    if (!savedOrSent) {
      return json(request, env, {
        ok: false,
        message: buildSetupMessage(delivery),
        delivery,
      }, 500);
    }

    return json(request, env, {
      ok: true,
      message: `Thanks, ${normalized.name}. Your free estimate request was sent successfully.`,
      delivery,
    });
  } catch (error) {
    console.error("Estimate form error", error);
    return json(request, env, {
      ok: false,
      message: "The request reached the form backend, but the backend hit an unexpected error. Check the Cloudflare Pages Function logs for the exact issue.",
    }, 500);
  }
}

async function parseMultipartSubmission(request, env) {
  const form = await request.formData();
  const data = {};
  const photos = [];

  for (const [key, value] of form.entries()) {
    if (value instanceof File) {
      if (key !== "photos" || !value.name || value.size === 0) continue;
      if (photos.length >= MAX_PHOTOS) continue;
      if (value.size > MAX_PHOTO_SIZE) throw new Error(`Photo ${value.name} is too large. Keep each image under 8 MB.`);

      const photoInfo = { name: value.name, size: value.size, type: value.type || "application/octet-stream", stored: false };

      if (env.PHOTOS) {
        try {
          const keyName = buildPhotoKey(value.name);
          await env.PHOTOS.put(keyName, value.stream(), {
            httpMetadata: { contentType: value.type || "application/octet-stream" },
            customMetadata: { originalName: value.name },
          });
          photoInfo.key = keyName;
          photoInfo.stored = true;
        } catch (error) {
          photoInfo.error = "Photo storage failed.";
          console.error("R2 photo upload failed", error);
        }
      }

      photos.push(photoInfo);
      continue;
    }

    data[key] = String(value || "").trim();
  }

  data.photos = photos;
  return data;
}

function normalizeSubmission(input, request) {
  const headers = request.headers;
  return {
    name: clean(input.name, 120),
    phone: clean(input.phone, 80),
    email: clean(input.email, 160),
    area: clean(input.area, 200),
    service: clean(input.service, 120),
    preferred: clean(input.preferred, 160),
    description: clean(input.description, 3000),
    pageUrl: clean(input.pageUrl, 500),
    submittedAt: clean(input.submittedAt, 80) || new Date().toISOString(),
    website: clean(input.website, 200),
    photos: Array.isArray(input.photos) ? input.photos.slice(0, MAX_PHOTOS) : [],
    ip: headers.get("CF-Connecting-IP") || "",
    userAgent: clean(headers.get("User-Agent") || "", 300),
  };
}

function validateSubmission(data) {
  const errors = [];
  if (!data.name) errors.push("Name is required.");
  if (!data.phone) errors.push("Phone number is required.");
  if (!data.service) errors.push("Please choose the type of service needed.");
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push("Please enter a valid email address.");
  if (data.service && !SERVICES.has(data.service)) errors.push("Please choose a listed service option.");
  return errors;
}

async function saveToD1(env, data) {
  await env.DB.prepare(`
    INSERT INTO estimate_requests (
      name, phone, email, area, service, preferred, description,
      page_url, photos_json, ip, user_agent, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.name,
    data.phone,
    data.email || null,
    data.area || null,
    data.service,
    data.preferred || null,
    data.description || null,
    data.pageUrl || null,
    JSON.stringify(data.photos || []),
    data.ip || null,
    data.userAgent || null,
    new Date().toISOString(),
  ).run();
}

async function sendEmailNotification(env, data) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.ESTIMATE_NOTIFY_FROM,
      to: [env.ESTIMATE_NOTIFY_TO],
      reply_to: data.email || undefined,
      subject: `New estimate request: ${data.service}`,
      text: buildEmailText(env, data),
    }),
  });

  if (!response.ok) throw new Error(`Resend API error: ${await response.text()}`);
}

async function sendSms(env, to, body) {
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_SID}/Messages.json`, {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa(`${env.TWILIO_SID}:${env.TWILIO_TOKEN}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ From: env.TWILIO_FROM, To: to, Body: body }),
  });

  if (!response.ok) throw new Error(`Twilio API error: ${await response.text()}`);
}

function buildCustomerSms(data) {
  return `Hi ${data.name}, this is Go Direct Home Services. We received your ${data.service} request and will follow up shortly. If urgent, call or text (773) 573-5152.`;
}

function buildOwnerSms(data) {
  return `New Go Direct estimate request\nName: ${data.name}\nPhone: ${data.phone}\nService: ${data.service}\nArea: ${data.area || "Not provided"}`;
}

function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return "";
}

function buildSetupMessage(delivery) {
  if (delivery.d1 === "failed" || delivery.email === "failed" || delivery.sms_customer === "failed" || delivery.sms_owner === "failed") {
    return "The form backend is live, but one or more delivery methods failed. Check the Cloudflare Pages Function logs.";
  }
  return "The form backend is live, but storage, email, and SMS delivery are not configured yet.";
}

function buildEmailText(env, data) {
  const businessName = env.BUSINESS_NAME || "Go Direct Home Services";
  const photos = (data.photos || []).length
    ? data.photos.map((photo) => `- ${photo.name} (${photo.stored ? `stored: ${photo.key}` : photo.error || "not stored"})`).join("\n")
    : "No photos uploaded.";

  return `${businessName} received a new free estimate request.\n\n` +
    `Name: ${data.name}\n` +
    `Phone: ${data.phone}\n` +
    `Email: ${data.email || "Not provided"}\n` +
    `Service area/address: ${data.area || "Not provided"}\n` +
    `Service needed: ${data.service}\n` +
    `Preferred date/time: ${data.preferred || "Not provided"}\n\n` +
    `Project description:\n${data.description || "Not provided"}\n\n` +
    `Photos:\n${photos}\n\n` +
    `Page URL: ${data.pageUrl || "Not provided"}\n` +
    `Submitted at: ${data.submittedAt}\n` +
    `IP: ${data.ip || "Unknown"}\n`;
}

function buildPhotoKey(filename) {
  const safeName = filename.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "photo";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const random = crypto.randomUUID();
  return `estimate-photos/${stamp}-${random}-${safeName}`;
}

function clean(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "*";
  const allowed = String(env.ALLOWED_ORIGINS || "*").split(",").map((item) => item.trim()).filter(Boolean);
  const allowOrigin = allowed.includes("*") || allowed.includes(origin) ? origin : allowed[0] || "*";
  return { "Access-Control-Allow-Origin": allowOrigin, "Access-Control-Allow-Methods": "POST, OPTIONS, GET", "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin" };
}

function json(request, env, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(request, env) },
  });
}
