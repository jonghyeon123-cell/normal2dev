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
