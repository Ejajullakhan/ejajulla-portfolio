import type { IncomingHttpHeaders } from "http";
import {
  getClientIdentity,
  isRateLimited,
  sendContactEmail,
  validateContactPayload,
  type ContactPayload,
} from "../shared/contact";

export async function processContactRequest(method: string | undefined, body: ContactPayload, headers: IncomingHttpHeaders) {
  if (method !== "POST") return { status: 405, body: { ok: false, error: "Method not allowed." } };

  const validation = validateContactPayload(body ?? {});
  if (validation.spam) return { status: 202, body: { ok: true } };
  if (validation.error || !validation.data) return { status: 400, body: { ok: false, error: validation.error ?? "Please check the form fields." } };

  const identity = getClientIdentity(headers);
  if (isRateLimited(identity)) return { status: 429, body: { ok: false, error: "Please wait a moment before sending another message." } };

  try {
    const result = await sendContactEmail(validation.data);
    if (!result.ok) return { status: result.status, body: { ok: false, error: result.error } };
    return { status: 200, body: { ok: true } };
  } catch {
    return { status: 502, body: { ok: false, error: "The message could not be delivered right now." } };
  }
}
