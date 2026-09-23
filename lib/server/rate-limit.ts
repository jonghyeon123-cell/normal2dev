import "server-only";

// IP 별 요청 횟수 제한 (고정 윈도우).
// 서버 인스턴스마다 따로 세기 때문에 여러 인스턴스로 도는 배포 환경에서는 완벽하지 않다.
// 배포 단계에서 Upstash 같은 공용 저장소 기반으로 바꿀 예정.
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

const hits = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || entry.resetAt <= now) {
    if (hits.size > 10_000) {
      for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    }
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { ok: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { ok: true };
}
