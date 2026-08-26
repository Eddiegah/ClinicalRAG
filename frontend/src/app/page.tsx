"use client";

import { useState } from "react";
import { askQuestion } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";
import { ChatMessageBubble } from "@/components/ChatMessageBubble";
import { ChatInput } from "@/components/ChatInput";

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAsk(question: string) {
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);
    try {
      const result = await askQuestion(question);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.answer, sources: result.sources },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(
        `Something went wrong talking to the backend (${message}). Make sure it's running ` +
          "and, for real answers, that GEMINI_API_KEY is set in backend/.env."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          ClinicalRAG
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Answers are grounded in a local PubMed abstract corpus, with citations.
        </p>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 overflow-y-auto px-6 py-6">
        {messages.length === 0 && (
          <p className="mt-10 text-center text-sm text-zinc-400">
            Ask about a common clinical topic — diabetes, hypertension, asthma, and about
            15 others are covered. Ask something outside the corpus to see the refusal
            path in action.
          </p>
        )}
        {messages.map((message, i) => (
          <ChatMessageBubble key={i} message={message} />
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-zinc-100 px-4 py-3 text-sm text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              Thinking…
            </div>
          </div>
        )}
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </main>

      <footer className="border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <div className="mx-auto w-full max-w-2xl">
          <ChatInput onSubmit={handleAsk} disabled={loading} />
          <p className="mt-3 text-center text-xs text-zinc-400">
            Educational demo only. Not medical advice — consult a healthcare professional.
          </p>
        </div>
      </footer>
    </div>
  );
}
