import type { ChatResponse } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Free-tier hosts (Render) can take a while to wake from a cold start, but a
// bare fetch() has no built-in timeout - if the connection stalls (mid
// redeploy, a dropped connection, etc.) it hangs forever with no error and
// no way for the UI to recover except a page refresh. Bound it explicitly.
const REQUEST_TIMEOUT_MS = 45_000;

export async function askQuestion(question: string): Promise<ChatResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(
        "The backend took too long to respond. It may be waking up from a free-tier " +
          "cold start — try again in a moment."
      );
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

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
