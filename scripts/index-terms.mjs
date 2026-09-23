// data/terms/*.json 을 Supabase 에 저장하고, 검색용 벡터를 만든다.
// 이미 저장된 문장은 다시 임베딩하지 않아서 사전을 고쳐도 바뀐 부분만 비용이 든다.
// 실행: npm run index-terms
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { embed } from "./voyage.mjs";

const TERMS_DIR = join(import.meta.dirname, "..", "data", "terms");

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

function loadTerms() {
  return readdirSync(TERMS_DIR)
    .filter((f) => f.endsWith(".json"))
    .flatMap((f) => JSON.parse(readFileSync(join(TERMS_DIR, f), "utf8")));
}

// 용어 하나에서 검색에 쓸 문장들을 뽑는다.
function vectorSources(t) {
  const aliases = [...new Set(t.aliases.map((a) => a.trim()).filter(Boolean))];
  return [
    { term_id: t.id, kind: "term", content: `${t.term} (${t.term_en})` },
    ...aliases.map((a) => ({ term_id: t.id, kind: "alias", content: a })),
    { term_id: t.id, kind: "definition", content: t.definition },
  ];
}

const key = (v) => `${v.term_id}\u0000${v.kind}\u0000${v.content}`;

async function fetchExistingVectors() {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("term_vectors")
      .select("id, term_id, kind, content")
      .range(from, from + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
}

async function main() {
  const terms = loadTerms();
  console.log(`용어 ${terms.length}개를 읽었어요.`);

  // 1. 용어 정보 저장 (있으면 갱신)
  const termRows = terms.map((t) => ({
    id: t.id,
    term: t.term,
    term_en: t.term_en,
    category: t.category,
    subcategory: t.subcategory,
    definition: t.definition,
    analogy: t.analogy,
    prompt_phrase: t.prompt_phrase,
    related: t.related,
    confusable: t.confusable,
    updated_at: new Date().toISOString(),
  }));
  const { error: termError } = await supabase.from("terms").upsert(termRows);
  if (termError) throw termError;

  // 사전에서 빠진 용어는 DB 에서도 지운다 (벡터는 cascade 로 함께 지워짐)
  const ids = new Set(terms.map((t) => t.id));
  const { data: dbTerms, error: listError } = await supabase.from("terms").select("id");
  if (listError) throw listError;
  const removedTerms = dbTerms.map((r) => r.id).filter((id) => !ids.has(id));
  if (removedTerms.length) {
    const { error } = await supabase.from("terms").delete().in("id", removedTerms);
    if (error) throw error;
  }
  console.log(`용어 저장 완료 (삭제된 용어 ${removedTerms.length}개)`);

  // 2. 벡터: 새 문장만 임베딩하고, 사전에서 사라진 문장은 지운다
  const wanted = terms.flatMap(vectorSources);
  const wantedKeys = new Set(wanted.map(key));
  const existing = await fetchExistingVectors();
  const existingKeys = new Set(existing.map(key));

  const stale = existing.filter((v) => !wantedKeys.has(key(v))).map((v) => v.id);
  for (let i = 0; i < stale.length; i += 500) {
    const { error } = await supabase.from("term_vectors").delete().in("id", stale.slice(i, i + 500));
    if (error) throw error;
  }

  const toEmbed = wanted.filter((v) => !existingKeys.has(key(v)));
  console.log(`벡터: 전체 ${wanted.length}개 중 새로 임베딩 ${toEmbed.length}개, 삭제 ${stale.length}개`);
  if (!toEmbed.length) return console.log("바뀐 내용이 없어요.");

  const { vectors, tokens } = await embed(toEmbed.map((v) => v.content), "document");
  const rows = toEmbed.map((v, i) => ({ ...v, embedding: vectors[i] }));
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await supabase.from("term_vectors").insert(rows.slice(i, i + 200));
    if (error) throw error;
  }
  console.log(`임베딩 저장 완료 (Voyage 사용 토큰 ${tokens.toLocaleString()}개)`);
}

main().catch((e) => {
  console.error("실패:", e.message ?? e);
  process.exit(1);
});
