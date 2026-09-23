-- 프롬프트 조립에 쓰는 용어별 구현 체크포인트
-- Supabase 대시보드 > SQL Editor 에 붙여 넣고 Run 하면 돼요. 여러 번 실행해도 안전해요.

alter table public.terms
  add column if not exists prompt_points text[] not null default '{}';
