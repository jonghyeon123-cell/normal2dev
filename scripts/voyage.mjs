// 스크립트 공용 Voyage 임베딩 호출
export const EMBEDDING_MODEL = "voyage-3.5";
export const EMBEDDING_DIM = 1024;

const BATCH_SIZE = 128;

export async function embed(texts, inputType) {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error("VOYAGE_API_KEY 가 없어요. .env.local 을 확인해 주세요.");

  const vectors = [];
  let tokens = 0;
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const res = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ input: batch, model: EMBEDDING_MODEL, input_type: inputType }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Voyage 요청 실패 (HTTP ${res.status}): ${body.detail ?? ""}`);
    for (const item of body.data) vectors.push(item.embedding);
    tokens += body.usage?.total_tokens ?? 0;
  }
  return { vectors, tokens };
}
