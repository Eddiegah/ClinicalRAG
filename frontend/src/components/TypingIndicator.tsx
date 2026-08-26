import { motion } from "motion/react";
import { LogoMark } from "./icons";

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-end gap-2.5"
    >
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full accent-gradient text-white"
        aria-hidden
      >
        <LogoMark className="h-4 w-4" />
      </div>
      <div
        className="flex items-center gap-1 rounded-3xl rounded-bl-lg border px-4 py-3.5"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="typing-dot h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--muted)", animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </motion.div>
  );
}
