# 쉐어하우스 정산 관리 어드민

쉐어하우스 운영자가 매달 발생하는 공용 관리비 지출을 입력하면 입주자별 정산 금액을 자동으로 계산해주는 관리 도구입니다.

## Tech Stack

- Frontend: Next.js (App Router)
- Backend: Supabase (Postgres + Auth, Google OAuth)
- Hosting: Vercel
- 스타일: Tailwind CSS

## Getting Started

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 환경 변수 설정

`.env.local.example`을 참고해 `.env.local`에 Supabase 프로젝트 URL/anon key를 입력합니다.

```bash
cp .env.local.example .env.local
```

### 3. 개발 서버 실행

```bash
pnpm dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인할 수 있습니다.

## 주요 명령어

- `pnpm dev` - 개발 서버 실행
- `pnpm build` - 프로덕션 빌드
- `pnpm start` - 프로덕션 서버 실행
- `pnpm lint` - ESLint 검사
- `pnpm format` - Prettier 포맷팅

## 프로젝트 구조

- `src/app` - 화면(라우트) 단위 폴더 구조
- `src/lib/supabase` - Supabase 클라이언트 (browser/server/middleware)
- `src/proxy.ts` - Supabase 세션 갱신 (Next.js 16 미들웨어 컨벤션)

## 참고 문서

- [PRD](../sharehouse_office_PRD.md)
