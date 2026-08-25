import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatMessageBubble } from "../ChatMessageBubble";

describe("ChatMessageBubble", () => {
  it("renders assistant message content and sources", () => {
    render(
      <ChatMessageBubble
        message={{
          role: "assistant",
          content: "Metformin is first-line therapy [1].",
          sources: [
            {
              pmid: "12345678",
              title: "Metformin as first-line therapy",
              url: "https://pubmed.ncbi.nlm.nih.gov/12345678/",
              journal: "Diabetes Care",
              year: "2023",
              similarity: 0.82,
            },
          ],
        }}
      />
    );

    expect(screen.getByText(/Metformin is first-line therapy/)).toBeInTheDocument();
    expect(screen.getByText("1 source")).toBeInTheDocument();
    expect(screen.getByText(/Metformin as first-line therapy/)).toBeInTheDocument();
  });

  it("renders a user message without a sources section", () => {
    render(<ChatMessageBubble message={{ role: "user", content: "Hello" }} />);

    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.queryByText(/source/)).not.toBeInTheDocument();
  });
});
