import { processContactRequest } from "../server/contact";

type VercelRequest = {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body || "{}");
    } catch {
      res.status(400).json({ ok: false, error: "Please send valid form data." });
      return;
    }
  }
  const result = await processContactRequest(req.method, (body ?? {}) as Record<string, unknown>, req.headers);
  res.status(result.status).json(result.body);
}
