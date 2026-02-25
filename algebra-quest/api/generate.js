const ALLOWED_MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS_LIMIT = 1200;
const MAX_MESSAGES = 8;
const MAX_TEXT_LENGTH = 4000;

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return false;
  }

  return messages.every((message) => {
    if (!message || typeof message !== "object") {
      return false;
    }

    if (!["user", "assistant"].includes(message.role)) {
      return false;
    }

    if (!isNonEmptyString(message.content) || message.content.length > MAX_TEXT_LENGTH) {
      return false;
    }

    return true;
  });
}

function getValidatedPayload(body) {
  if (!body || typeof body !== "object") {
    return { error: "Request body must be a JSON object" };
  }

  const system = typeof body.system === "string" ? body.system.trim() : "";
  const messages = body.messages;

  if (!isNonEmptyString(system)) {
    return { error: "system prompt is required" };
  }

  if (system.length > MAX_TEXT_LENGTH) {
    return { error: `system prompt exceeds ${MAX_TEXT_LENGTH} characters` };
  }

  if (!isValidMessages(messages)) {
    return { error: "messages must be a non-empty array of valid chat messages" };
  }

  const requestedMaxTokens = Number.parseInt(body.max_tokens, 10);
  const safeMaxTokens = Number.isFinite(requestedMaxTokens) && requestedMaxTokens > 0
    ? Math.min(requestedMaxTokens, MAX_TOKENS_LIMIT)
    : 800;

  return {
    payload: {
      model: ALLOWED_MODEL,
      max_tokens: safeMaxTokens,
      system,
      messages,
    },
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  const { payload, error } = getValidatedPayload(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Failed to generate problem" });
  }
}
