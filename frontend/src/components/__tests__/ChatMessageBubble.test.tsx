import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ChatMessageBubble } from "../ChatMessageBubble";

describe("ChatMessageBubble", () => {
  it("renders assistant message content with a citation badge and expandable sources", () => {
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
    expect(screen.getByText("1")).toBeInTheDocument(); // the [1] citation badge

    const sourcesToggle = screen.getByText(/1 source/);
    expect(sourcesToggle).toBeInTheDocument();
    // Sources start collapsed - the title shouldn't be in the document yet.
    expect(screen.queryByText(/Metformin as first-line therapy/)).not.toBeInTheDocument();

    fireEvent.click(sourcesToggle);
    expect(screen.getByText(/Metformin as first-line therapy/)).toBeInTheDocument();
  });

  it("renders a user message without a sources section", () => {
    render(<ChatMessageBubble message={{ role: "user", content: "Hello" }} />);

    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.queryByText(/source/)).not.toBeInTheDocument();
  });
});
