# Supabase 연결 및 데이터베이스 기반 구축 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Claude Design으로 만든 화면 UI를 Supabase에 연결하기 전에, 실제 Supabase 프로젝트를 생성하고 PRD의 데이터 모델·RLS 정책·Storage·Google OAuth를 구축해 "연결 가능한 백엔드" 상태를 만든다.

**Architecture:** Supabase(Postgres + Auth + Storage) 단일 프로젝트. 테이블은 PRD 3개 화면(정산 대시보드/입주자 관리/조회 화면)의 데이터를 지원하도록 설계하고, RLS로 "운영자만 쓰기, 게시된 월만 익명 읽기"를 DB 레벨에서 강제한다. 마이그레이션은 SQL 파일로 버전 관리해 `supabase/migrations/`에 커밋한다.

**Tech Stack:** Supabase CLI, Postgres, Supabase Auth(Google OAuth), Supabase Storage. 이미 설치된 `@supabase/ssr`, `src/lib/supabase/*` 클라이언트를 그대로 사용.

## Global Constraints

- 지점(branch) 확장을 대비해 모든 운영 데이터 테이블에 `branch_id` 컬럼을 포함하되, 이번 버전 UI/로직은 단일 지점 고정값만 사용한다 (PRD 5장, Out of Scope).
- 사용자 계정 확장(총무 등 권한 분리)을 대비해 `users` 개념을 Auth와 분리된 도메인 테이블로 두지 않고, 이번 버전은 Supabase Auth의 `auth.users`만 사용한다 (PRD 5장). 단, RLS 정책에서 "인증된 사용자 = 운영자"로 단순 취급한다.
- 금액 계산은 반올림 없이 정밀 계산 후 항목 합산 시점에만 1회 반올림한다 (PRD 계산 로직 3~7). 이 계획에서는 계산 로직을 구현하지 않지만, 이 요구사항을 만족할 수 있도록 금액 컬럼은 `numeric` 타입으로 정의한다 (float 금지 — 부동소수점 오차로 원 단위 반올림이 부정확해짐).
- 날짜는 모두 `date` 타입 (시간 없음). PRD의 모든 기간은 일 단위로만 다뤄진다.
- 영수증 이미지는 화면 1(운영자, 인증 필요)과 화면 3(공개 조회, 게시된 월만) 양쪽에서 보여야 한다 (사용자 확인 사항).
- RLS는 이번 계획에 필수 포함 (사용자 확인 사항) — anon key가 브라우저에 노출되는 구조이므로 RLS 없이는 테이블 전체가 사실상 공개된다.

---

### Task 1: Supabase 프로젝트 생성 및 CLI 연결

**Files:**
- Create: `supabase/config.toml` (Supabase CLI가 생성)
- Modify: `.env.local`, `.env.local.example`

**Interfaces:**
- Consumes: 없음 (최초 셋업)
- Produces: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 환경변수. 이후 모든 태스크가 이 프로젝트를 대상으로 함.

- [ ] **Step 1: Supabase CLI 설치 확인**

Run: `pnpm dlx supabase --version`
Expected: 버전 번호 출력 (없으면 `pnpm add -D supabase` 후 재실행)

- [ ] **Step 2: Supabase 대시보드에서 프로젝트 생성**

https://supabase.com/dashboard 에서 새 프로젝트 생성 (리전: 서울 `ap-northeast-2` 권장, DB 비밀번호는 password manager에 저장).

- [ ] **Step 3: 로컬 프로젝트와 원격 Supabase 프로젝트 연결**

Run: `pnpm dlx supabase login`
Run: `pnpm dlx supabase init` (프로젝트 루트에서, `supabase/` 폴더 생성됨)
Run: `pnpm dlx supabase link --project-ref <project-ref>` (project-ref는 대시보드 URL 또는 Settings > General에서 확인)

- [ ] **Step 4: 환경변수 채우기**

대시보드 Settings > API에서 Project URL과 anon public key를 확인해 `.env.local`에 입력:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

- [ ] **Step 5: 연결 확인**

Run: `pnpm dev`
Expected: 콘솔에 Supabase 관련 에러 없이 서버 기동 (Task 진행 전 이미 확인된 no-env fallback 동작과 별개로, 실제 프로젝트 URL로도 500이 나지 않아야 함)

- [ ] **Step 6: Commit**

```bash
git add .env.local.example supabase/config.toml .gitignore
git commit -m "chore: Supabase 프로젝트 연결 및 CLI 설정"
```

(`.env.local`은 gitignore 대상이라 스테이징되지 않음을 `git status`로 재확인할 것)

---

### Task 2: 핵심 테이블 스키마 마이그레이션 작성

**Files:**
- Create: `supabase/migrations/0001_initial_schema.sql`

**Interfaces:**
- Consumes: Task 1의 연결된 Supabase 프로젝트
- Produces: 테이블 `tenants`, `expense_items`, `announcements`, `settlement_periods`. 이후 모든 RLS/Storage/애플리케이션 코드가 이 스키마를 전제로 함.

- [ ] **Step 1: 마이그레이션 파일 생성**

Run: `pnpm dlx supabase migration new initial_schema`
Expected: `supabase/migrations/<timestamp>_initial_schema.sql` 빈 파일 생성

- [ ] **Step 2: 스키마 SQL 작성**

`supabase/migrations/<timestamp>_initial_schema.sql`:

```sql
-- 지점 확장 대비: 이번 버전은 단일 지점 고정 UUID만 사용
create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  name text not null default '기본 지점',
  created_at timestamptz not null default now()
);

insert into branches (id, name)
values ('00000000-0000-0000-0000-000000000001', '기본 지점')
on conflict (id) do nothing;

-- 정산월 단위. 게시(publish) 상태를 이 테이블이 관리한다.
create table if not exists settlement_periods (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branches(id) default '00000000-0000-0000-0000-000000000001',
  year int not null,
  month int not null check (month between 1 and 12),
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (branch_id, year, month)
);

-- 입주자. 계약기간이 정산 대상 포함 여부를 결정한다 (PRD 화면 2).
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branches(id) default '00000000-0000-0000-0000-000000000001',
  name text not null,
  room text not null,
  contract_start date not null,
  contract_end date not null,
  monthly_fee numeric(12, 2) not null,
  discount_reason text,
  discount_amount numeric(12, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contract_end_after_start check (contract_end >= contract_start)
);

-- 항목 종류: 가스비/전기세/수도세/인터넷은 월 1건, 공용물품은 다건 허용 (PRD 화면 1)
create type expense_category as enum ('gas', 'electricity', 'water', 'internet', 'supplies');

create table if not exists expense_items (
  id uuid primary key default gen_random_uuid(),
  settlement_period_id uuid not null references settlement_periods(id) on delete cascade,
  category expense_category not null,
  start_date date not null,
  end_date date, -- 공용물품은 구매일만 있고 종료일 없음 (PRD 계산 로직 1)
  amount numeric(12, 2) not null,
  memo text,
  receipt_image_path text, -- Storage 버킷 내 경로
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 월 1건 성격 항목(가스비/전기세/수도세/인터넷) 중복 입력 방지 (PRD 화면 1)
create unique index if not exists expense_items_one_per_period_category
  on expense_items (settlement_period_id, category)
  where category <> 'supplies';

-- 공지사항. display_order로 드래그 정렬 순서 관리 (PRD 화면 1 섹션 0)
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branches(id) default '00000000-0000-0000-0000-000000000001',
  title text not null,
  body text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expense_items_settlement_period_id_idx
  on expense_items (settlement_period_id);

create index if not exists announcements_branch_display_order_idx
  on announcements (branch_id, display_order);
```

- [ ] **Step 3: 로컬 DB에 적용해 문법 검증**

Run: `pnpm dlx supabase db reset` (로컬 Supabase가 Docker로 뜬 상태여야 함. 없으면 `pnpm dlx supabase start` 먼저 실행)
Expected: 에러 없이 마이그레이션 적용 완료 메시지

- [ ] **Step 4: 원격 프로젝트에 배포**

Run: `pnpm dlx supabase db push`
Expected: "Applying migration ... " 후 성공 메시지, 대시보드 Table Editor에서 5개 테이블 확인 가능

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations
git commit -m "feat: 정산/입주자/지출항목/공지사항 스키마 마이그레이션 추가"
```

---

### Task 3: RLS 정책 작성 — 운영자 쓰기 / 게시된 월만 공개 읽기

**Files:**
- Create: `supabase/migrations/0002_rls_policies.sql`

**Interfaces:**
- Consumes: Task 2의 테이블 스키마
- Produces: 각 테이블의 RLS 정책. 이후 애플리케이션 코드는 이 정책을 우회할 수 없고, service_role key 없이는 정책을 어길 수 없음이 보장됨.

- [ ] **Step 1: 마이그레이션 파일 생성**

Run: `pnpm dlx supabase migration new rls_policies`

- [ ] **Step 2: RLS 활성화 및 정책 SQL 작성**

`supabase/migrations/<timestamp>_rls_policies.sql`:

```sql
alter table branches enable row level security;
alter table settlement_periods enable row level security;
alter table tenants enable row level security;
alter table expense_items enable row level security;
alter table announcements enable row level security;

-- branches: 인증된 사용자만 조회 (설정용 테이블, 공개 노출 불필요)
create policy "branches_select_authenticated"
  on branches for select
  to authenticated
  using (true);

-- settlement_periods: 운영자는 전체 CRUD, 익명은 게시된 행만 조회
create policy "settlement_periods_all_authenticated"
  on settlement_periods for all
  to authenticated
  using (true)
  with check (true);

create policy "settlement_periods_select_published_anon"
  on settlement_periods for select
  to anon
  using (is_published = true);

-- tenants: 운영자만 전체 CRUD. 익명 접근 없음 (PRD 화면 2는 로그인 필수)
create policy "tenants_all_authenticated"
  on tenants for all
  to authenticated
  using (true)
  with check (true);

-- expense_items: 운영자만 CRUD. 익명은 "게시된 정산월"에 속한 항목만 조회 가능
-- (화면 3에서 영수증 이미지를 보여줘야 하므로 익명 SELECT 허용, 단 게시 여부로 제한)
create policy "expense_items_all_authenticated"
  on expense_items for all
  to authenticated
  using (true)
  with check (true);

create policy "expense_items_select_published_anon"
  on expense_items for select
  to anon
  using (
    exists (
      select 1 from settlement_periods sp
      where sp.id = expense_items.settlement_period_id
        and sp.is_published = true
    )
  );

-- announcements: 운영자만 CRUD, 익명은 전체 조회 가능
-- (공지사항은 특정 정산월에 종속되지 않는 목록이라 게시 여부와 무관하게 노출 — PRD 화면 3 UI 요소)
create policy "announcements_all_authenticated"
  on announcements for all
  to authenticated
  using (true)
  with check (true);

create policy "announcements_select_anon"
  on announcements for select
  to anon
  using (true);
```

- [ ] **Step 3: 로컬에서 정책 검증**

Run: `pnpm dlx supabase db reset`
Expected: 에러 없이 적용

Run (Supabase Studio SQL Editor, 로컬 `http://localhost:54323`):
```sql
-- anon 역할로 미게시 정산월 조회 시도 (0건이어야 정상)
set role anon;
select * from settlement_periods where is_published = false;
reset role;
```
Expected: 0 rows

- [ ] **Step 4: 원격 배포**

Run: `pnpm dlx supabase db push`
Expected: 성공 메시지

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations
git commit -m "feat: RLS 정책 추가 - 운영자 전체 권한, 게시된 정산월만 익명 조회"
```

---

### Task 4: Storage 버킷 설정 — 영수증 이미지

**Files:**
- Create: `supabase/migrations/0003_storage_receipts.sql`

**Interfaces:**
- Consumes: Task 3의 인증 구조
- Produces: `receipts` Storage 버킷과 정책. `expense_items.receipt_image_path`가 이 버킷 내 경로를 가리킴 (Task 2에서 이미 컬럼 정의됨).

- [ ] **Step 1: 마이그레이션 파일 생성**

Run: `pnpm dlx supabase migration new storage_receipts`

- [ ] **Step 2: 버킷 및 정책 SQL 작성**

사용자 확인에 따라 영수증 이미지는 화면 1(운영자)과 화면 3(공개 조회, 게시된 월만) 양쪽에서 보여야 한다. Public 버킷 + `expense_items` RLS로 이미 게시 여부를 걸러둔 상태이므로, 버킷은 public으로 두되 업로드/삭제는 인증된 사용자만 허용한다.

`supabase/migrations/<timestamp>_storage_receipts.sql`:

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

-- 업로드/수정/삭제는 인증된 사용자만
create policy "receipts_insert_authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'receipts');

create policy "receipts_update_authenticated"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'receipts');

create policy "receipts_delete_authenticated"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'receipts');

-- 조회는 public 버킷이므로 별도 정책 불필요 (public read는 버킷 설정으로 처리됨)
```

**참고 — 용량/형식 제한과 PRD 매핑:** `file_size_limit`(5MB)와 `allowed_mime_types`는 PRD의 "이미지를 업로드할 수 없습니다 (용량/형식 확인)" 에러 메시지가 실제로 트리거되는 서버 측 제약이다. 프론트엔드 업로드 코드는 이 제약을 넘는 실패를 잡아 해당 메시지로 매핑해야 한다 (다음 계획에서 구현).

- [ ] **Step 3: 로컬 검증**

Run: `pnpm dlx supabase db reset`
Expected: 에러 없이 적용, Storage Studio(`http://localhost:54323/project/default/storage/buckets`)에서 `receipts` 버킷 확인

- [ ] **Step 4: 원격 배포**

Run: `pnpm dlx supabase db push`
Expected: 성공 메시지, 대시보드 Storage에서 `receipts` 버킷 확인

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations
git commit -m "feat: 영수증 이미지 Storage 버킷 및 정책 추가"
```

---

### Task 5: Google OAuth 연결

**Files:**
- Modify: 없음 (Supabase 대시보드 + Google Cloud Console 설정, 코드 변경 없음)
- Create: `docs/superpowers/plans/google-oauth-setup-notes.md` (설정값 기록용, 시크릿 제외)

**Interfaces:**
- Consumes: Task 1의 Supabase 프로젝트
- Produces: `auth.users`에 Google 로그인 사용자가 채워짐. 다음 계획(화면 구현)의 로그인 플로우가 이 설정을 전제로 함.

- [ ] **Step 1: Google Cloud Console에서 OAuth 클라이언트 생성**

https://console.cloud.google.com/apis/credentials 에서:
1. 프로젝트 생성 또는 선택
2. "OAuth 동의 화면" 구성 (외부, 앱 이름/이메일 입력)
3. "사용자 인증 정보 만들기" > "OAuth 클라이언트 ID" > 애플리케이션 유형: 웹 애플리케이션
4. 승인된 리디렉션 URI에 다음 추가: `https://<project-ref>.supabase.co/auth/v1/callback`

- [ ] **Step 2: Supabase 대시보드에 Google Provider 등록**

Authentication > Providers > Google 에서 Enable 후, Step 1에서 발급받은 Client ID / Client Secret 입력, Save.

- [ ] **Step 3: 로컬 개발용 리디렉션 URL 추가**

Google Cloud Console의 승인된 리디렉션 URI에 로컬 개발용도 추가: `http://localhost:3000/auth/callback` (다음 계획에서 콜백 라우트를 이 경로로 구현할 예정임을 전제로 미리 등록)

Supabase 대시보드 Authentication > URL Configuration에서 Site URL을 `http://localhost:3000`으로 설정 (배포 시 Vercel 프로덕션 URL로 갱신 필요 — 다음 계획에서 다룸).

- [ ] **Step 4: 연결 확인**

Supabase 대시보드 Authentication > Providers > Google이 "Enabled" 상태인지 확인.
Run (터미널, curl로 authorize 엔드포인트가 리다이렉트를 반환하는지만 확인):
```bash
curl -s -o /dev/null -w "%{http_code}\n" "https://<project-ref>.supabase.co/auth/v1/authorize?provider=google"
```
Expected: `302` (Google 로그인 페이지로 리다이렉트)

- [ ] **Step 5: 설정 기록 및 Commit**

`docs/superpowers/plans/google-oauth-setup-notes.md`:

```markdown
# Google OAuth 설정 기록

- Google Cloud Console 프로젝트: <프로젝트명>
- 승인된 리디렉션 URI:
  - https://<project-ref>.supabase.co/auth/v1/callback
  - http://localhost:3000/auth/callback (로컬 개발용)
- Supabase Site URL: http://localhost:3000 (배포 시 갱신 필요)
- Client ID/Secret은 Supabase 대시보드에만 저장, 이 문서에는 기록하지 않음
```

```bash
git add docs/superpowers/plans/google-oauth-setup-notes.md
git commit -m "docs: Google OAuth 설정 기록"
```

---

### Task 6: 연결 검증용 스모크 테스트 페이지

**Files:**
- Create: `src/app/debug/supabase-check/page.tsx`
- Test: 브라우저 수동 확인 (자동화 테스트 없음 — DB/Auth 연결 자체를 눈으로 확인하는 목적)

**Interfaces:**
- Consumes: `src/lib/supabase/server.ts`의 `createClient()` (기존 파일, 이미 구현됨)
- Produces: `/debug/supabase-check` 라우트. 다음 계획에서 실제 화면 구현이 끝나면 이 디버그 페이지는 삭제한다.
  (원래 계획은 `_debug`였으나, Next.js App Router가 `_`로 시작하는 폴더를 라우팅에서 제외하는 사양 때문에 `debug`로 구현됨)

- [ ] **Step 1: 스모크 테스트 페이지 작성**

`src/app/debug/supabase-check/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";

export default async function SupabaseCheckPage() {
  const supabase = await createClient();

  const { data: branches, error: branchesError } = await supabase
    .from("branches")
    .select("id, name");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main style={{ padding: 24, fontFamily: "monospace" }}>
      <h1>Supabase 연결 확인</h1>
      <section>
        <h2>branches 테이블</h2>
        {branchesError ? (
          <pre style={{ color: "red" }}>{JSON.stringify(branchesError, null, 2)}</pre>
        ) : (
          <pre>{JSON.stringify(branches, null, 2)}</pre>
        )}
      </section>
      <section>
        <h2>현재 로그인 사용자</h2>
        <pre>{user ? JSON.stringify(user, null, 2) : "로그인 안 됨 (anon)"}</pre>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: 로그인 없이 접근해 anon 정책 확인**

Run: `pnpm dev`
브라우저에서 `http://localhost:3000/debug/supabase-check` 접속.
Expected: `branches` 섹션에 RLS 에러(anon은 `branches` select 정책이 없으므로 빈 배열 또는 permission denied) — Task 3에서 `branches`는 `authenticated`만 select 허용했으므로 anon 접속 시 빈 배열이 정상.

- [ ] **Step 3: Commit**

```bash
git add src/app/debug
git commit -m "chore: Supabase 연결 확인용 디버그 페이지 추가"
```

---

## Self-Review 결과

- **스펙 커버리지:** PRD 6장 Tech Stack(Supabase Postgres+Auth) → Task 1,5. PRD 4장 화면 1/2 데이터(공지사항/지출항목/입주자/정산월 게시상태) → Task 2. PRD 화면 1 진입조건(구글 로그인)·화면 3 진입조건(게시된 월만 익명 열람) → Task 3. PRD 화면 1 영수증 이미지 업로드 → Task 4. 계산 로직(PRD 계산 로직 1~7)은 이번 계획 범위 밖(다음 계획에서 순수 함수로 구현 — Global Constraints에 명시).
- **플레이스홀더 스캔:** 전체 SQL/커맨드 실제 값 포함, "TODO" 등 없음.
- **타입 일관성:** `expense_items.receipt_image_path` (Task 2) ↔ Storage 버킷 `receipts` (Task 4) 경로 참조 일치. `settlement_periods.is_published` (Task 2) ↔ RLS 정책의 `is_published = true` (Task 3) ↔ 디버그 페이지 없음(범위 밖) 일치 확인.
