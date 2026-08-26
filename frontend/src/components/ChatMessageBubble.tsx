import { motion } from "motion/react";
import type { ChatMessage } from "@/lib/types";
import { SourceList } from "./SourceList";
import { AnswerText } from "./AnswerText";
import { LogoMark } from "./icons";

export function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`flex items-end gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full accent-gradient text-white"
          aria-hidden
        >
          <LogoMark className="h-4 w-4" />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-3xl px-4 py-3 shadow-sm ${
          isUser ? "rounded-br-lg" : "rounded-bl-lg border"
        }`}
        style={
          isUser
            ? { background: "var(--user-bubble)", color: "var(--user-bubble-fg)" }
            : { background: "var(--surface)", borderColor: "var(--border)" }
        }
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.content}</p>
        ) : (
          <AnswerText text={message.content} />
        )}
        {!isUser && message.sources && <SourceList sources={message.sources} />}
      </div>
    </motion.div>
  );
}
