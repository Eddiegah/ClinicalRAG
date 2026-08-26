const CITATION_SPLIT = /(\[\d+\])/g;
const IS_CITATION = /^\[\d+\]$/;
const BOLD_SPLIT = /(\*\*[^*]+\*\*)/g;
const IS_BOLD = /^\*\*[^*]+\*\*$/;

function renderInline(text: string, keyPrefix: string) {
  return text.split(BOLD_SPLIT).flatMap((chunk, i) => {
    const key = `${keyPrefix}-b${i}`;
    if (IS_BOLD.test(chunk)) {
      return (
        <strong key={key} className="font-semibold">
          {renderCitations(chunk.slice(2, -2), key)}
        </strong>
      );
    }
    return renderCitations(chunk, key);
  });
}

function renderCitations(text: string, keyPrefix: string) {
  return text.split(CITATION_SPLIT).map((part, i) => {
    const key = `${keyPrefix}-c${i}`;
    if (IS_CITATION.test(part)) {
      return (
        <sup key={key}>
          <span
            className="mx-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold not-italic"
            style={{ background: "var(--accent-soft)", color: "var(--accent-a)" }}
          >
            {part.slice(1, -1)}
          </span>
        </sup>
      );
    }
    return <span key={key}>{part}</span>;
  });
}

function isBulletLine(line: string) {
  return /^[*-]\s+/.test(line);
}

export function AnswerText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);

  return (
    <div className="flex flex-col gap-2.5 text-[15px] leading-relaxed">
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n").filter((l) => l.trim() !== "");
        const isList = lines.length > 0 && lines.every(isBulletLine);

        if (isList) {
          return (
            <ul key={blockIndex} className="ml-4 list-disc space-y-1">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>
                  {renderInline(line.replace(/^[*-]\s+/, ""), `${blockIndex}-${lineIndex}`)}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={blockIndex} className="whitespace-pre-wrap">
            {renderInline(block, `${blockIndex}`)}
          </p>
        );
      })}
    </div>
  );
}
