import "server-only";

// 앞 모델이 붐비거나(503) 실패하면 다음 모델로 한 번 더 시도한다. GEMINI_MODEL 로 첫 모델을 바꿀 수 있다.
const MODELS = [process.env.GEMINI_MODEL || "gemini-3.5-flash-lite", "gemini-flash-lite-latest"];
const TIMEOUT_MS = 12_000;

type GenerateResponse = {
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
};

async function callModel(model: string, system: string, user: string, responseSchema: object): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      // 정해진 JSON 형식으로만 답하게 해서 항목이 빠지거나 늘어나지 않게 한다.
      generationConfig: { temperature: 0.2, responseMimeType: "application/json", responseSchema },
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Gemini ${model} failed: HTTP ${res.status}`);

  const body = (await res.json()) as GenerateResponse;
  const text = body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
  if (!text) throw new Error(`Gemini ${model} returned no text (${body.candidates?.[0]?.finishReason ?? "unknown"})`);
  return JSON.parse(text);
}

/**
 * 지시문(system)과 요청(user)으로 responseSchema 형식의 JSON 을 만든다.
 * 결과는 validate 로 검사하고, 모든 모델이 실패하면 마지막 오류를 던진다.
 */
export async function generateJson<T>(
  system: string,
  user: string,
  responseSchema: object,
  validate: (value: unknown) => T,
): Promise<T> {
  let lastError: unknown;
  for (const model of [...new Set(MODELS)]) {
    try {
      return validate(await callModel(model, system, user, responseSchema));
    } catch (e) {
      lastError = e;
      console.error("[gemini]", e instanceof Error ? e.message : e);
    }
  }
  throw lastError;
}
