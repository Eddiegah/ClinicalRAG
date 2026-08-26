"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { motion } from "motion/react";
import { SendIcon } from "./icons";

export function ChatInput({
  onSubmit,
  disabled,
}: {
  onSubmit: (question: string) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function resize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue("");
    requestAnimationFrame(resize);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 rounded-3xl border p-2 pl-4 shadow-sm transition-shadow focus-within:shadow-md"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          resize();
        }}
        onKeyDown={handleKeyDown}
        placeholder="Ask a clinical question…"
        rows={1}
        disabled={disabled}
        className="max-h-40 flex-1 resize-none bg-transparent py-2 text-[15px] leading-relaxed outline-none placeholder:opacity-50 disabled:opacity-50"
      />
      <motion.button
        type="submit"
        disabled={disabled || !value.trim()}
        whileHover={{ scale: disabled || !value.trim() ? 1 : 1.05 }}
        whileTap={{ scale: disabled || !value.trim() ? 1 : 0.95 }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full accent-gradient text-white transition-opacity disabled:opacity-30"
        aria-label="Send question"
      >
        <SendIcon className="h-4 w-4" />
      </motion.button>
    </form>
  );
}
