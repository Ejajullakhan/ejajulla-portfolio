import { describe, expect, it } from "vitest";

describe("Resend environment configuration", () => {
  it("accepts the configured API key on a read-only endpoint", async () => {
    const apiKey = process.env.RESEND_API_KEY;
    expect(apiKey, "RESEND_API_KEY must be configured for this test").toBeTruthy();

    const response = await fetch("https://api.resend.com/domains?limit=1", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    expect(response.status, "Resend rejected the configured API key").toBe(200);
  }, 15_000);
});
