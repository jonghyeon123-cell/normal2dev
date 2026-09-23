# Normal2Dev

평소 말투로 원하는 기능을 설명하면 관련 개발 용어를 찾아 설명해 주고, 개발자식 프롬프트로 조립해 주는 웹사이트예요.

> 입력: "버튼 누르면 작은 창 뜨고, 저장되면 잠깐 알려줘"
> 추천 용어: 모달(Modal), 토스트(Toast)

## 기술 스택

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL + pgvector)
- Voyage AI (임베딩, 리랭크)
- Vercel (배포)

## 로컬 실행

1. 의존성 설치

   ```bash
   npm install
   ```

2. 환경변수 설정: `.env.example`을 복사해서 `.env.local`을 만들고 값을 채워요.

   | 변수 | 설명 |
   |---|---|
   | `VOYAGE_API_KEY` | Voyage AI API 키 (서버 전용) |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 주소 |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase 공개 키 |
   | `SUPABASE_SECRET_KEY` | Supabase 서버 전용 키 (인덱싱 스크립트용) |

3. 개발 서버 실행 후 http://localhost:3000 접속

   ```bash
   npm run dev
   ```

## 스크립트

| 명령어 | 설명 |
|---|---|
| `npm run index-terms` | 용어 사전을 DB 에 저장하고 임베딩해요. 바뀐 문장만 다시 임베딩해요 |
| `npm run search-test -- "문장"` | 벡터 검색 결과를 확인해요 |

DB 구조는 `supabase/migrations/` 의 SQL 을 Supabase SQL Editor 에서 실행해서 만들어요.

## 검색 API

`POST /api/search`

```json
{ "query": "버튼 누르면 작은 창 뜨고, 저장되면 잠깐 알려줘" }
```

1. 문장을 의미 단위 조각으로 나눠요 (최대 5개)
2. 조각마다 Voyage 임베딩 → pgvector 로 후보 15개 검색
3. Voyage rerank 로 다시 순위를 매겨 상위 3개를 골라요
4. 점수에 따라 `matched`(0.70 이상), `uncertain`(0.55 이상), `not_found` 로 나눠요

rerank 가 실패하면 벡터 유사도 순서로 대신 응답해요(`rankedBy: "vector"`). 같은 조각은 1시간 동안 캐시하고, IP 당 1분에 20회로 요청을 제한해요.

| 오류 코드 | 상태 | 뜻 |
|---|---|---|
| `INVALID_INPUT` | 400 | 빈 문장, 300자 초과, 잘못된 형식 |
| `RATE_LIMITED` | 429 | 요청이 너무 많음 (`Retry-After` 헤더 참고) |
| `EMBEDDING_FAILED` | 502 | Voyage 임베딩 실패 |
| `SEARCH_FAILED` | 500 | DB 검색 실패 |

## 폴더 구조

```
app/            화면과 API 라우트
components/ui/  shadcn/ui 컴포넌트
lib/            공통 함수
data/terms/     용어 사전 (분야별 JSON)
```

## 용어 사전

`data/terms/`에 분야별로 나뉘어 있어요. 용어 하나는 다음 항목을 가져요.

| 항목 | 설명 |
|---|---|
| `term`, `term_en` | 용어 이름 (한국어, 영어) |
| `definition` | 입문자용 설명 |
| `analogy` | 일상 비유 |
| `prompt_phrase` | 개발자식 프롬프트 예시 |
| `aliases` | 일반인이 쓸 법한 표현들 (검색에 사용) |
| `related` | 관련 용어 id |
| `confusable` | 헷갈리기 쉬운 용어와의 차이 |
