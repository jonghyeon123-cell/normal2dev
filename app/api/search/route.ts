import { after, type NextRequest } from "next/server";
import { z } from "zod";
import {
  CANDIDATE_RERANK_SCORE,
  CANDIDATE_SIMILARITY,
  CONFIDENT_RERANK_SCORE,
  CONFIDENT_SIMILARITY,
  MAX_QUERY_LENGTH,
  RERANK_CANDIDATES,
  RESULTS_PER_CHUNK,
} from "@/lib/search/config";
import { splitPhrases } from "@/lib/search/split";
import type { ApiError, ChunkResult, ChunkStatus, MatchKind, SearchResponse, Term } from "@/lib/search/types";
import { clientIp, createRateLimiter } from "@/lib/server/rate-limit";
import { supabaseAdmin } from "@/lib/server/supabase";
import { createTtlCache } from "@/lib/server/ttl-cache";
import { embedQueries, rerank } from "@/lib/server/voyage";

const bodySchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, "검색할 문장을 입력해 주세요.")
    .max(MAX_QUERY_LENGTH, `${MAX_QUERY_LENGTH}자 이하로 입력해 주세요.`),
});

type Match = { term_id: string; similarity: number; matched_content: string; matched_kind: MatchKind };

const TERM_COLUMNS =
  "id, term, term_en, category, subcategory, definition, analogy, prompt_phrase, prompt_points, related, confusable";

// IP 당 1분에 20회
const checkRateLimit = createRateLimiter(20);

// 같은 조각은 1시간 동안 다시 계산하지 않는다 (Voyage 크레딧 절약).
const chunkCache = createTtlCache<ChunkResult>(1000, 60 * 60 * 1000);

class UpstreamError extends Error {}

function errorResponse(status: number, code: string, message: string, headers?: HeadersInit) {
  return Response.json({ error: { code, message } } satisfies ApiError, { status, headers });
}

function statusOf(topScore: number | undefined, confident: number, candidate: number): ChunkStatus {
  if (topScore === undefined || topScore < candidate) return "not_found";
  return topScore >= confident ? "matched" : "uncertain";
}

// rerank 모델이 읽을 용어 설명. 이름, 정의, 일상 표현을 함께 준다.
function rerankDocument(term: Term, aliases: string[]) {
  return `${term.term} (${term.term_en}): ${term.definition} 이렇게도 말해요: ${aliases.join(", ")}`;
}

async function searchChunks(texts: string[]): Promise<ChunkResult[]> {
  let vectors: number[][];
  try {
    vectors = await embedQueries(texts);
  } catch (e) {
    throw new UpstreamError(String(e));
  }

  const matchesPerChunk = await Promise.all(
    vectors.map(async (vector) => {
      const { data, error } = await supabaseAdmin.rpc("match_terms", {
        query_embedding: vector,
        match_count: RERANK_CANDIDATES,
      });
      if (error) throw error;
      return data as Match[];
    }),
  );

  const termIds = [...new Set(matchesPerChunk.flat().map((m) => m.term_id))];
  const [termsRes, aliasesRes] = await Promise.all([
    supabaseAdmin.from("terms").select(TERM_COLUMNS).in("id", termIds),
    supabaseAdmin.from("term_vectors").select("term_id, content").eq("kind", "alias").in("term_id", termIds),
  ]);
  if (termsRes.error) throw termsRes.error;
  if (aliasesRes.error) throw aliasesRes.error;

  const termById = new Map((termsRes.data as Term[]).map((t) => [t.id, t]));
  const aliasesById = new Map<string, string[]>();
  for (const row of aliasesRes.data)
    aliasesById.set(row.term_id, [...(aliasesById.get(row.term_id) ?? []), row.content]);

  return Promise.all(
    texts.map(async (text, i): Promise<ChunkResult> => {
      const matches = matchesPerChunk[i].filter((m) => termById.has(m.term_id));
      const toResult = (m: Match, score: number) => ({
        term: termById.get(m.term_id)!,
        score,
        matchedBy: { kind: m.matched_kind, content: m.matched_content },
      });

      try {
        const docs = matches.map((m) => rerankDocument(termById.get(m.term_id)!, aliasesById.get(m.term_id) ?? []));
        const ranked = await rerank(text, docs, RESULTS_PER_CHUNK);
        return {
          text,
          rankedBy: "rerank",
          status: statusOf(ranked[0]?.score, CONFIDENT_RERANK_SCORE, CANDIDATE_RERANK_SCORE),
          results: ranked
            .filter((r) => r.score >= CANDIDATE_RERANK_SCORE)
            .map((r) => toResult(matches[r.index], r.score)),
        };
      } catch (e) {
        // rerank 가 실패해도 검색이 멈추지 않도록 벡터 유사도 순서로 대신 응답한다.
        console.error("[search] rerank failed, falling back to vector order:", e);
        const top = matches.slice(0, RESULTS_PER_CHUNK);
        return {
          text,
          rankedBy: "vector",
          status: statusOf(top[0]?.similarity, CONFIDENT_SIMILARITY, CANDIDATE_SIMILARITY),
          results: top.filter((m) => m.similarity >= CANDIDATE_SIMILARITY).map((m) => toResult(m, m.similarity)),
        };
      }
    }),
  );
}

export async function POST(request: NextRequest) {
  const limit = checkRateLimit(clientIp(request));
  if (!limit.ok) {
    return errorResponse(429, "RATE_LIMITED", "요청이 너무 많아요. 잠시 후 다시 시도해 주세요.", {
      "Retry-After": String(limit.retryAfterSeconds),
    });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const isLengthIssue = issue?.code === "too_small" || issue?.code === "too_big";
    return errorResponse(400, "INVALID_INPUT", isLengthIssue ? issue.message : "요청 형식이 올바르지 않아요.");
  }

  const { query } = parsed.data;
  const texts = splitPhrases(query);

  try {
    const byText = new Map<string, ChunkResult>();
    for (const t of texts) {
      const cached = chunkCache.get(t);
      if (cached) byText.set(t, cached);
    }
    const uncached = [...new Set(texts.filter((t) => !byText.has(t)))];
    if (uncached.length) {
      for (const r of await searchChunks(uncached)) {
        byText.set(r.text, r);
        // 벡터로 대신 응답한 결과는 캐시하지 않는다 (rerank 가 복구되면 다시 계산하도록).
        if (r.rankedBy === "rerank") chunkCache.set(r.text, r);
      }
    }
    const chunks = texts.map((t) => byText.get(t)!);

    // 응답을 보낸 뒤 검색 기록 저장. 점수가 낮았던 입력은 사전 보강 재료가 된다.
    after(async () => {
      const { error } = await supabaseAdmin.from("search_logs").insert(
        chunks.map((c) => ({
          query: c.text,
          top_term_id: c.results[0]?.term.id ?? null,
          top_similarity: c.results[0]?.score ?? null,
        })),
      );
      if (error) console.error("[search] failed to save search log:", error.message);
    });

    return Response.json({ query, chunks } satisfies SearchResponse);
  } catch (e) {
    if (e instanceof UpstreamError) {
      console.error("[search] embedding failed:", e.message);
      return errorResponse(502, "EMBEDDING_FAILED", "검색 서비스에 잠시 문제가 있어요. 잠시 후 다시 시도해 주세요.");
    }
    console.error("[search] search failed:", e);
    return errorResponse(500, "SEARCH_FAILED", "검색 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.");
  }
}
