import "server-only";
import { EMBEDDING_MODEL, RERANK_MODEL } from "@/lib/search/config";

const API_BASE = "https://api.voyageai.com/v1";
const TIMEOUT_MS = 10_000;

async function callVoyage<T>(path: string, body: unknown): Promise<T> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error("VOYAGE_API_KEY is not set");

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Voyage ${path} failed: HTTP ${res.status}`);
  return (await res.json()) as T;
}

export async function embedQueries(texts: string[]): Promise<number[][]> {
  const body = await callVoyage<{ data: { embedding: number[] }[] }>("/embeddings", {
    input: texts,
    model: EMBEDDING_MODEL,
    input_type: "query",
  });
  return body.data.map((d) => d.embedding);
}

/** documents 를 query 와의 관련도 순으로 정렬해 상위 topK 개의 { index, score } 를 돌려준다. */
export async function rerank(query: string, documents: string[], topK: number) {
  const body = await callVoyage<{ data: { index: number; relevance_score: number }[] }>("/rerank", {
    query,
    documents,
    model: RERANK_MODEL,
    top_k: topK,
  });
  return body.data.map((d) => ({ index: d.index, score: d.relevance_score }));
}
