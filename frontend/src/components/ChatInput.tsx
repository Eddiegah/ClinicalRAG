"use client";

import { useState, type FormEvent } from "react";

export function ChatInput({
  onSubmit,
  disabled,
}: {
  onSubmit: (question: string) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ask a clinical question, e.g. What are first-line treatments for type 2 diabetes?"
        disabled={disabled}
        className="flex-1 rounded-full border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        Ask
      </button>
    </form>
  );
}
