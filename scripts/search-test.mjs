// 검색이 잘 되는지 확인하는 스크립트
// 실행: npm run search-test               (기본 예시 문장들)
//      npm run search-test -- "검색할 문장"
import { createClient } from "@supabase/supabase-js";
import { embed } from "./voyage.mjs";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

const DEFAULT_QUERIES = [
  "작은 창 뜨는 거",
  "저장 끝나면 살짝 메시지 보여줘",
  "뿅 하고 나오는 거",
  "휴대폰에서도 안 깨지게",
  "로그인 안 한 사람은 못 들어오게",
  "사진이 찌그러져",
  "새로고침해도 안 사라지게",
  "글 지우면 댓글도 같이 없어지게",
];

const queries = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_QUERIES;
const { vectors, tokens } = await embed(queries, "query");

for (const [i, q] of queries.entries()) {
  const { data, error } = await supabase.rpc("match_terms", { query_embedding: vectors[i], match_count: 3 });
  if (error) throw error;
  const { data: terms } = await supabase.from("terms").select("id, term").in("id", data.map((d) => d.term_id));
  const name = Object.fromEntries(terms.map((t) => [t.id, t.term]));
  console.log(`\n"${q}"`);
  for (const d of data) {
    console.log(`  ${d.similarity.toFixed(3)}  ${name[d.term_id]}  ← [${d.matched_kind}] ${d.matched_content.slice(0, 40)}`);
  }
}
console.log(`\n(Voyage 사용 토큰 ${tokens}개)`);
