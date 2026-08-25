import type { ChatResponse } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function askQuestion(question: string): Promise<ChatResponse> {
  const response = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    let detail: string | undefined;
    try {
      detail = (await response.json())?.detail;
    } catch {
      // response body wasn't JSON — fall back to the generic message below
    }
    throw new Error(detail ?? `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<ChatResponse>;
}
