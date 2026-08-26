"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { askQuestion } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";
import { ChatMessageBubble } from "@/components/ChatMessageBubble";
import { ChatInput } from "@/components/ChatInput";
import { TypingIndicator } from "@/components/TypingIndicator";
import { ExampleChips } from "@/components/ExampleChips";
import { LogoMark, ShieldIcon } from "@/components/icons";

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

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
    <div className="flex flex-1 flex-col" style={{ background: "var(--background)" }}>
      <header
        className="sticky top-0 z-10 border-b px-6 py-3.5 backdrop-blur-md"
        style={{ borderColor: "var(--border)", background: "color-mix(in srgb, var(--background) 85%, transparent)" }}
      >
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl accent-gradient text-white">
            <LogoMark className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-[15px] font-semibold">ClinicalRAG</h1>
              <span
                className="status-dot h-1.5 w-1.5 rounded-full accent-gradient"
                aria-hidden
              />
            </div>
            <p className="truncate text-xs" style={{ color: "var(--muted)" }}>
              Grounded in real PubMed abstracts, with citations
            </p>
          </div>
        </div>
      </header>

      <main className="chat-scroll mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 overflow-y-auto px-6 py-8">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-1 flex-col items-center justify-center gap-6 text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl accent-gradient text-white shadow-lg">
              <LogoMark className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Ask a clinical question</h2>
              <p className="mx-auto mt-1.5 max-w-sm text-sm" style={{ color: "var(--muted)" }}>
                Answers come only from a real PubMed corpus, cited inline — or it tells you
                honestly when it doesn&apos;t know.
              </p>
            </div>
            <ExampleChips onPick={handleAsk} />
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((message, i) => (
            <ChatMessageBubble key={i} message={message} />
          ))}
        </AnimatePresence>

        {loading && <TypingIndicator />}

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border px-4 py-3 text-sm"
            style={{ borderColor: "#dc262633", background: "#dc262611", color: "#f87171" }}
          >
            {error}
          </motion.p>
        )}
        <div ref={bottomRef} />
      </main>

      <footer className="border-t px-6 py-4" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto w-full max-w-3xl">
          <ChatInput onSubmit={handleAsk} disabled={loading} />
          <p
            className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs"
            style={{ color: "var(--muted)" }}
          >
            <ShieldIcon className="h-3.5 w-3.5 shrink-0" />
            Educational demo only. Not medical advice — consult a healthcare professional.
          </p>
        </div>
      </footer>
    </div>
  );
}
