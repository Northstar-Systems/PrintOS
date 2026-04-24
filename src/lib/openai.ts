/**
 * Shared OpenAI API client config.
 */

const OPENAI_KEY = process.env.OPENAI_API_KEY ?? "";

export async function openaiChat(
  messages: Array<{ role: string; content: unknown }>,
  opts?: { model?: string; maxTokens?: number; timeout?: number }
): Promise<string> {
  const model = opts?.model ?? "gpt-4o-mini";
  const maxTokens = opts?.maxTokens ?? 1000;
  const timeout = opts?.timeout ?? 30000;

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
    signal: AbortSignal.timeout(timeout),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(`OpenAI error: ${err.error?.message || resp.status}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}

export function extractJSON(raw: string): Record<string, unknown> | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}
