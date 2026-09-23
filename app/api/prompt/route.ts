import type { NextRequest } from "next/server";
import { z } from "zod";
import { MAX_PROMPT_CHUNKS, type PromptResponse } from "@/lib/prompt/api-types";
import { termLabel } from "@/lib/prompt/build";
import { MAX_QUERY_LENGTH } from "@/lib/search/config";
import type { ApiError } from "@/lib/search/types";
import { generateJson } from "@/lib/server/gemini";
import { clientIp, createRateLimiter } from "@/lib/server/rate-limit";
import { createTtlCache } from "@/lib/server/ttl-cache";
import { getTerm } from "@/lib/terms/data";

// 조각 하나를 결과 한 문장으로 번역하게 해서, 없는 기능을 지어내거나 조각을 빠뜨리지 않게 한다.
const SYSTEM_INSTRUCTION = `너는 비개발자가 평소 말투로 적은 요청 조각을, AI 코딩 도구에 보낼 개발 요청 문장으로 하나씩 번역하는 번역기야.

규칙:
- 조각마다 정확히 한 문장으로 번역해서, 조각 순서대로 items 배열에 넣어.
- 각 문장에는 그 조각에 있는 내용만 담아. 조각에 없는 기능, 위치, 개수, 시간 같은 세부 사항을 지어내지 마.
- 조각의 조건과 동작("버튼 누르면", "저장되면", "로그인한 사람만" 등)은 반드시 남겨.
- 용어가 주어지면 그 용어를 주어진 표기 그대로("모달(Modal)") 넣어. 용어가 없으면 뜻을 살려 개발자가 이해하기 쉬운 말로 바꿔.
- 모든 문장은 "해 주세요."처럼 띄어 쓴 존댓말과 마침표로 끝내.

예시:
조각:
1. "버튼 누르면 아래로 메뉴가 쭉 나오게" → 드롭다운 메뉴(Dropdown Menu)
2. "휴대폰에서도 잘 보이게" → 반응형 웹(Responsive Web Design)
3. "반짝이게 해줘" → (맞는 용어 없음)
items:
1. 버튼을 누르면 아래로 드롭다운 메뉴(Dropdown Menu)가 펼쳐지게 해 주세요.
2. 휴대폰에서도 화면이 잘 보이도록 반응형 웹(Responsive Web Design)을 적용해 주세요.
3. 요소가 반짝이는 효과를 넣어 주세요.`;

const bodySchema = z.object({
  query: z.string().trim().min(1).max(MAX_QUERY_LENGTH),
  chunks: z
    .array(z.object({ text: z.string().trim().min(1).max(MAX_QUERY_LENGTH), termId: z.string().max(80).nullable() }))
    .min(1)
    .max(MAX_PROMPT_CHUNKS),
});

// IP 당 1분에 15회 (Gemini 무료 한도 보호)
const checkRateLimit = createRateLimiter(15);
// 같은 요청은 1시간 동안 다시 만들지 않는다.
const promptCache = createTtlCache<string[]>(500, 60 * 60 * 1000);

function errorResponse(status: number, code: string, message: string, headers?: HeadersInit) {
  return Response.json({ error: { code, message } } satisfies ApiError, { status, headers });
}

function userMessage({ query, chunks }: z.infer<typeof bodySchema>) {
  const lines = chunks.map((chunk, i) => {
    // 용어 이름은 브라우저가 보낸 글이 아니라 사전에서 직접 가져온다.
    const term = chunk.termId ? getTerm(chunk.termId) : undefined;
    return `${i + 1}. "${chunk.text}" → ${term ? termLabel(term) : "(맞는 용어 없음)"}`;
  });
  return [`원래 문장: ${query}`, "", "조각:", ...lines].join("\n");
}

export async function POST(request: NextRequest) {
  const limit = checkRateLimit(clientIp(request));
  if (!limit.ok) {
    return errorResponse(429, "RATE_LIMITED", "요청이 너무 많아요. 잠시 후 다시 시도해 주세요.", {
      "Retry-After": String(limit.retryAfterSeconds),
    });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse(400, "INVALID_INPUT", "요청 형식이 올바르지 않아요.");

  const count = parsed.data.chunks.length;
  const cacheKey = JSON.stringify(parsed.data);
  const cached = promptCache.get(cacheKey);
  if (cached) return Response.json({ items: cached } satisfies PromptResponse);

  try {
    const items = await generateJson(
      SYSTEM_INSTRUCTION,
      userMessage(parsed.data),
      {
        type: "OBJECT",
        properties: { items: { type: "ARRAY", items: { type: "STRING" }, minItems: count, maxItems: count } },
        required: ["items"],
      },
      (value) => {
        const result = z.object({ items: z.array(z.string().trim().min(1)).length(count) }).parse(value);
        return result.items;
      },
    );
    promptCache.set(cacheKey, items);
    return Response.json({ items } satisfies PromptResponse);
  } catch {
    return errorResponse(502, "AI_UNAVAILABLE", "AI가 잠시 응답하지 않아요.");
  }
}
