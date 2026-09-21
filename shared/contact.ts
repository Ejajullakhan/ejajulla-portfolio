import type { IncomingHttpHeaders } from "http";

export type ContactPayload = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  website?: unknown;
};

export type SanitizedContact = {
  name: string;
  email: string;
  message: string;
};

const EMAIL_PATTERN = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 5000;

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/[<>]/g, "").replace(/\u0000/g, "").trim().slice(0, maxLength)
    : "";
}

export function validateContactPayload(payload: ContactPayload): { data?: SanitizedContact; error?: string; spam?: boolean } {
  if (typeof payload.website === "string" && payload.website.trim()) return { spam: true };

  const name = cleanText(payload.name, MAX_NAME_LENGTH);
  const email = cleanText(payload.email, MAX_EMAIL_LENGTH).toLowerCase();
  const message = cleanText(payload.message, MAX_MESSAGE_LENGTH);

  if (name.length < 2) return { error: "Please enter your name." };
  if (!EMAIL_PATTERN.test(email)) return { error: "Please enter a valid email address." };
  if (message.length < 10) return { error: "Please add a little more detail to your message." };

  return { data: { name, email, message } };
}

const recentSubmissions = new Map<string, number[]>();
const RATE_WINDOW_MS = 60 * 60 * 1000;
const MAX_SUBMISSIONS_PER_WINDOW = 5;
const MIN_SUBMISSION_GAP_MS = 15 * 1000;

export function isRateLimited(identity: string) {
  const now = Date.now();
  const recent = (recentSubmissions.get(identity) ?? []).filter((timestamp) => now - timestamp < RATE_WINDOW_MS);
  const last = recent[recent.length - 1] ?? 0;
  if (now - last < MIN_SUBMISSION_GAP_MS || recent.length >= MAX_SUBMISSIONS_PER_WINDOW) {
    recentSubmissions.set(identity, recent);
    return true;
  }
  recent.push(now);
  recentSubmissions.set(identity, recent);
  return false;
}

export function getClientIdentity(headers: IncomingHttpHeaders) {
  const forwarded = headers["x-forwarded-for"];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0];
  return value?.trim() || headers["x-real-ip"]?.toString() || "unknown";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

export function buildContactEmail(data: SanitizedContact, receivedAt = new Date()) {
  const received = receivedAt.toISOString();
  const safeName = escapeHtml(data.name);
  const safeEmail = escapeHtml(data.email);
  const safeMessage = escapeHtml(data.message).replace(/\n/g, "<br />");
  const text = [
    "New message from Ejajulla Khan Portfolio",
    "",
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Message: ${data.message}`,
    `Received: ${received}`,
  ].join("\n");
  const html = `<!doctype html><html><body style="margin:0;background:#080812;color:#f8f7ff;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#080812;padding:32px 16px"><tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;border:1px solid #2a3040;background:#111526"><tr><td style="padding:28px 30px;border-bottom:1px solid #2a3040"><div style="font-size:11px;letter-spacing:3px;color:#73f7ff;text-transform:uppercase">EJAJULLA KHAN</div><h1 style="margin:16px 0 0;font-size:26px;line-height:1.2;color:#ffffff">New message from Ejajulla Khan Portfolio</h1></td></tr><tr><td style="padding:28px 30px"><p style="margin:0 0 14px;color:#a9b2c5;font-size:12px;text-transform:uppercase;letter-spacing:1px">Name</p><p style="margin:0 0 24px;font-size:16px;color:#ffffff">${safeName}</p><p style="margin:0 0 14px;color:#a9b2c5;font-size:12px;text-transform:uppercase;letter-spacing:1px">Email</p><p style="margin:0 0 24px;font-size:16px;color:#ffffff">${safeEmail}</p><p style="margin:0 0 14px;color:#a9b2c5;font-size:12px;text-transform:uppercase;letter-spacing:1px">Message</p><p style="margin:0 0 24px;font-size:16px;line-height:1.65;color:#ffffff">${safeMessage}</p><p style="margin:0;color:#758097;font-size:12px">Received: ${received}</p></td></tr></table></td></tr></table></body></html>`;
  return { text, html, received };
}

export async function sendContactEmail(data: SanitizedContact) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.CONTACT_EMAIL;
  if (!apiKey || !from || !to) {
    return { ok: false as const, status: 503, error: "Contact email is not configured yet." };
  }

  const email = buildContactEmail(data);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: [data.email],
      subject: `New portfolio message from ${data.name}`,
      text: email.text,
      html: email.html,
    }),
  });

  if (!response.ok) {
    return { ok: false as const, status: 502, error: "The message could not be delivered right now." };
  }
  return { ok: true as const, received: email.received };
}
