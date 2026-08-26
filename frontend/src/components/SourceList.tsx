"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Source } from "@/lib/types";
import { ChevronIcon, ExternalLinkIcon } from "./icons";

export function SourceList({ sources }: { sources: Source[] }) {
  const [open, setOpen] = useState(false);
  if (sources.length === 0) return null;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium transition-colors"
        style={{ color: "var(--muted)" }}
      >
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex"
        >
          <ChevronIcon className="h-3.5 w-3.5" />
        </motion.span>
        {sources.length} source{sources.length > 1 ? "s" : ""}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="mt-2 flex flex-col gap-2 overflow-hidden"
          >
            {sources.map((source, i) => (
              <li
                key={source.pmid}
                className="group rounded-xl border p-3 transition-colors"
                style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
              >
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-1.5 text-sm font-medium hover:underline"
                >
                  <span
                    className="mt-0.5 shrink-0 text-xs font-semibold"
                    style={{ color: "var(--accent-a)" }}
                  >
                    [{i + 1}]
                  </span>
                  <span className="flex-1">{source.title}</span>
                  <ExternalLinkIcon className="mt-1 h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
                </a>
                <div
                  className="mt-2 flex items-center gap-2 text-xs"
                  style={{ color: "var(--muted)" }}
                >
                  <span>
                    {source.journal}
                    {source.year ? ` (${source.year})` : ""}
                  </span>
                  <span
                    className="ml-auto flex items-center gap-1.5 shrink-0"
                    title={`${Math.round(source.similarity * 100)}% similarity match`}
                  >
                    <span
                      className="h-1 w-10 overflow-hidden rounded-full"
                      style={{ background: "var(--border)" }}
                    >
                      <span
                        className="block h-full rounded-full accent-gradient"
                        style={{ width: `${Math.round(source.similarity * 100)}%` }}
                      />
                    </span>
                    {Math.round(source.similarity * 100)}%
                  </span>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
