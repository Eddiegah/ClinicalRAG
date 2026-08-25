export interface Source {
  pmid: string;
  title: string;
  url: string;
  journal: string;
  year: string;
  similarity: number;
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}
