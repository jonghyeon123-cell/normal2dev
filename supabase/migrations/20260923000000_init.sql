-- Normal2Dev 초기 스키마
-- Supabase 대시보드 > SQL Editor 에 붙여 넣고 Run 하면 돼요. 여러 번 실행해도 안전해요.

create extension if not exists vector with schema extensions;

-- 용어 사전 (data/terms/*.json 과 같은 구조)
create table if not exists public.terms (
  id text primary key,
  term text not null,
  term_en text not null,
  category text not null,
  subcategory text not null,
  definition text not null,
  analogy text not null,
  prompt_phrase text not null,
  related text[] not null default '{}',
  confusable text,
  updated_at timestamptz not null default now()
);

-- 검색용 벡터: 용어 하나당 이름(term), 일상 표현(alias) 여러 개, 설명(definition)을 각각 저장
create table if not exists public.term_vectors (
  id bigint generated always as identity primary key,
  term_id text not null references public.terms (id) on delete cascade,
  kind text not null check (kind in ('term', 'alias', 'definition')),
  content text not null,
  embedding extensions.vector(1024) not null,
  unique (term_id, kind, content)
);

create index if not exists term_vectors_embedding_idx
  on public.term_vectors using hnsw (embedding extensions.vector_cosine_ops);

-- 검색 기록: 유사도가 낮았던 입력을 모아 사전을 보강하는 데 사용
create table if not exists public.search_logs (
  id bigint generated always as identity primary key,
  query text not null,
  top_term_id text,
  top_similarity real,
  created_at timestamptz not null default now()
);

-- 사용자가 결과에서 고른 새 표현. 검토 후 사전에 반영
create table if not exists public.alias_suggestions (
  id bigint generated always as identity primary key,
  phrase text not null,
  term_id text not null references public.terms (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

-- 입력 벡터와 가장 가까운 용어를 찾는다. 같은 용어의 여러 벡터 중 가장 높은 유사도만 남긴다.
create or replace function public.match_terms(
  query_embedding extensions.vector(1024),
  match_count int default 5,
  candidate_count int default 60
)
returns table (term_id text, similarity double precision, matched_content text, matched_kind text)
language sql
stable
set search_path = public, extensions
as $$
  with candidates as (
    select tv.term_id, tv.content, tv.kind,
           1 - (tv.embedding <=> query_embedding) as similarity
    from public.term_vectors tv
    order by tv.embedding <=> query_embedding
    limit candidate_count
  ),
  best as (
    select distinct on (c.term_id) c.term_id, c.similarity, c.content, c.kind
    from candidates c
    order by c.term_id, c.similarity desc
  )
  select b.term_id, b.similarity, b.content, b.kind
  from best b
  order by b.similarity desc
  limit match_count;
$$;

-- RLS: 용어 정보는 누구나 읽기만 가능, 쓰기는 서버(secret key)만 가능
alter table public.terms enable row level security;
alter table public.term_vectors enable row level security;
alter table public.search_logs enable row level security;
alter table public.alias_suggestions enable row level security;

drop policy if exists "terms are readable by everyone" on public.terms;
create policy "terms are readable by everyone" on public.terms
  for select to anon, authenticated using (true);

drop policy if exists "term vectors are readable by everyone" on public.term_vectors;
create policy "term vectors are readable by everyone" on public.term_vectors
  for select to anon, authenticated using (true);

-- search_logs, alias_suggestions 는 공개 정책이 없어서 서버만 접근할 수 있어요.

grant select on public.terms, public.term_vectors to anon, authenticated;
grant all on public.terms, public.term_vectors, public.search_logs, public.alias_suggestions to service_role;
grant execute on function public.match_terms(extensions.vector, int, int) to anon, authenticated, service_role;
