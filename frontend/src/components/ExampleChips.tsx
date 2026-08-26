"use client";

import { motion } from "motion/react";

const EXAMPLES = [
  "What are first-line treatments for type 2 diabetes?",
  "What causes migraines?",
  "How is chronic kidney disease diagnosed?",
  "What is the treatment for zorblatt fever?",
];

export function ExampleChips({ onPick }: { onPick: (question: string) => void }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {EXAMPLES.map((example, i) => (
        <motion.button
          key={example}
          type="button"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.06 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onPick(example)}
          className="rounded-full border px-3.5 py-2 text-left text-sm transition-colors"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          {example}
        </motion.button>
      ))}
    </div>
  );
}
