import { describe, expect, it, vi, afterEach } from "vitest";
import { askQuestion } from "../api";

describe("askQuestion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the parsed response on success", async () => {
    const mockResponse = {
      answer: "Metformin is first-line therapy [1].",
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
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
    );

    const result = await askQuestion("What is first-line therapy for type 2 diabetes?");

    expect(result).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/chat"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("throws when the response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    await expect(askQuestion("anything")).rejects.toThrow("500");
  });
});
