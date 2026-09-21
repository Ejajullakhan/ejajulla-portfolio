import { afterEach, describe, expect, it, vi } from "vitest";
import { processContactRequest } from "../../server/contact";
import { validateContactPayload } from "../../shared/contact";

const headers = (id: string) => ({ "x-forwarded-for": id });

const validPayload = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "I would love to discuss a new digital world.",
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("contact API contract", () => {
  it("validates required fields and rejects malformed email addresses", () => {
    expect(validateContactPayload({ name: "A", email: "not-an-email", message: "short" }).error).toBeTruthy();
    expect(validateContactPayload(validPayload).data).toEqual(validPayload);
  });

  it("silently accepts the honeypot path without sending", async () => {
    const result = await processContactRequest("POST", { ...validPayload, website: "bot" }, headers("honeypot-test"));
    expect(result.status).toBe(202);
    expect(result.body).toEqual({ ok: true });
  });

  it("returns success when Resend accepts the notification", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
    const result = await processContactRequest("POST", validPayload, headers("success-test"));
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ ok: true });
  });

  it("returns a clean retryable error when Resend is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 500 })));
    const result = await processContactRequest("POST", validPayload, headers("provider-error-test"));
    expect(result.status).toBe(502);
    expect(result.body).toEqual({ ok: false, error: "The message could not be delivered right now." });
  });
});
