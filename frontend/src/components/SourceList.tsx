import type { Source } from "@/lib/types";

export function SourceList({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return null;

  return (
    <details className="mt-2 text-sm">
      <summary className="cursor-pointer select-none text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
        {sources.length} source{sources.length > 1 ? "s" : ""}
      </summary>
      <ul className="mt-2 flex flex-col gap-2">
        {sources.map((source, i) => (
          <li
            key={source.pmid}
            className="rounded-md border border-zinc-200 p-2 dark:border-zinc-700"
          >
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
            >
              [{i + 1}] {source.title}
            </a>
            <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <span>
                {source.journal}
                {source.year ? ` (${source.year})` : ""}
              </span>
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">
                {Math.round(source.similarity * 100)}% match
              </span>
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
}
