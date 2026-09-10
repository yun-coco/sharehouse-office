# 입주자 관리 페이지 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/houses/:houseId/tenants` 페이지에서 입주자를 조회(가나다순)·추가·수정·삭제(실행취소 가능)할 수 있게 한다. 인증은 이번 범위에서 다루지 않고, 개발용 고정 house로 동작을 확인한다.

**Architecture:** Next.js App Router (서버 컴포넌트로 목록 조회 + Server Actions로 CRUD) + Supabase(Postgres, RLS) + shadcn/ui(Sheet, Table, Sonner). 인증이 없는 개발 단계이므로 service role key를 쓰는 별도 Supabase client로 RLS를 우회하고, 로그인이 붙는 시점에 이 client를 걷어내고 일반 client로 전환한다(이번 계획 범위 밖).

**Tech Stack:** Next.js 16 / React 19 / TypeScript / Tailwind v4 / shadcn/ui / Supabase(`@supabase/supabase-js`, `@supabase/ssr`) / Vitest

**Spec:** `docs/superpowers/specs/2026-09-10-tenant-management-design.md`

## Global Constraints

- 도메인 용어집(`AGENTS.md`) 준수: `house`, `tenant`, `settlement_period` 등 지정된 영문 네이밍만 사용. `branch`라는 이름은 절대 쓰지 않음.
- 입주자 목록은 이름 가나다순 정렬 (FR-008).
- 퇴실일(`move_out_date`)은 필수값 — DB 레벨(`not null`)과 UI 레벨(Sheet required) 모두 적용.
- 삭제는 hard delete가 아니라 soft delete(`deleted_at`)로 구현하고, 토스트에 실행취소 버튼을 제공한다.
- 인증/`/houses` 진입점은 이번 계획의 범위 밖. 개발 중에는 시드 마이그레이션으로 만든 고정 `houseId`를 사용한다.
- Service role key는 절대 클라이언트(브라우저) 코드에 노출하지 않고, 서버 전용 모듈에서만 사용한다.
- 커밋 메시지 등 커뮤니케이션은 한국어로 작성 (기존 커밋 컨벤션 참고).

---

## 파일 구조 개요

```
supabase/migrations/
  20260910010000_tenant_management_schema_updates.sql   - move_out_date not null, memo, deleted_at, 개발용 시드 house
src/lib/supabase/
  service-role.ts                       - 개발용 service role client (RLS 우회, 서버 전용)
src/lib/tenants/
  types.ts                              - Tenant, TenantInput 등 공용 타입
  queries.ts                            - 목록 조회(서버 컴포넌트용), 정렬/soft-delete 필터 포함
  queries.test.ts                       - queries.ts 단위 테스트
  validation.ts                         - 이름/입실일/퇴실일 검증 로직 (Server Action과 클라이언트 폼이 공유)
  validation.test.ts                    - validation.ts 단위 테스트
src/app/houses/[houseId]/
  layout.tsx                            - 사이드바 + 상단바 앱 셸
  tenants/
    page.tsx                            - 목록 페이지 (서버 컴포넌트)
    actions.ts                          - createTenant/updateTenant/deleteTenant/undoDeleteTenant Server Actions
    actions.test.ts                     - actions.ts 단위 테스트
    tenant-table.tsx                    - 목록 테이블(클라이언트 컴포넌트, 예시 데이터 프리뷰 포함)
    tenant-sheet.tsx                    - 추가/수정 Sheet(클라이언트 컴포넌트)
    delete-tenant-button.tsx            - 삭제 버튼 + 실행취소 토스트 트리거(클라이언트 컴포넌트)
src/components/ui/                      - shadcn 컴포넌트들 (init 시 자동 생성)
components.json                         - shadcn 설정 (init 시 자동 생성)
vitest.config.ts                        - Vitest 설정
```

---

## Task 1: Vitest 도입

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: 없음
- Produces: `npm run test` 커맨드, 이후 태스크가 `*.test.ts` 파일을 이 설정으로 실행

- [ ] **Step 1: Vitest 설치**

```bash
npm install -D vitest @vitejs/plugin-react
```

- [ ] **Step 2: `vitest.config.ts` 작성**

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 3: `package.json`의 `scripts`에 `test` 추가**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "test": "vitest run"
  }
}
```

- [ ] **Step 4: 샘플 테스트로 설정 동작 확인**

`src/lib/sanity.test.ts` (임시 파일, 확인 후 삭제):

```typescript
import { describe, it, expect } from "vitest";

describe("vitest setup", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `npm run test`
Expected: PASS (1 test)

그 다음 `src/lib/sanity.test.ts` 삭제.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "chore: Vitest 테스트 러너 도입"
```

---

## Task 2: DB 마이그레이션 — move_out_date not null, memo, deleted_at, 개발용 시드 house

**Files:**
- Create: `supabase/migrations/20260910010000_tenant_management_schema_updates.sql`

**Interfaces:**
- Consumes: 없음 (기존 `tenants`, `houses` 테이블 스키마 참고)
- Produces: `tenants.memo (text, nullable)`, `tenants.deleted_at (timestamptz, nullable)`, `tenants.move_out_date (not null)`. 개발용 고정 house id `00000000-0000-0000-0000-000000000001`

**주의:** `tenants.move_out_date`를 `not null`로 바꾸려면 기존 row가 있다면 먼저 값을 채워야 한다. 현재 이 프로젝트는 실사용 데이터가 없는 초기 단계이므로 단순히 컬럼 제약만 바꾼다. 만약 운영 데이터가 이미 있다면 이 스텝 전에 백필이 필요하지만, 이번 프로젝트는 아직 배포 전이므로 해당하지 않는다.

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- 입주자 관리 페이지를 위한 스키마 변경
-- - move_out_date를 필수값으로 변경 (설계 문서 결정)
-- - memo(메모), deleted_at(soft delete) 컬럼 추가
-- - 인증 미구현 상태에서 개발/테스트용으로 사용할 고정 house 시드

alter table tenants
  alter column move_out_date set not null;

alter table tenants
  add column memo text;

alter table tenants
  add column deleted_at timestamptz;

create index tenants_house_id_deleted_at_idx
  on tenants using btree (house_id, deleted_at);

-- ─────────────────────────────────────────────
-- 개발용 시드 데이터
-- 인증이 아직 없어 owner_id로 쓸 실제 auth.users row가 없으므로,
-- 개발 전용 auth.users row를 하나 만들고 그 소유로 house를 만든다.
-- 이 시드는 로그인이 붙는 시점에 별도 작업으로 제거된다.
-- ─────────────────────────────────────────────

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values (
  '00000000-0000-0000-0000-0000000000aa',
  'authenticated',
  'authenticated',
  'dev-placeholder@sharehouse-office.local',
  '',
  now(),
  now(),
  now(),
  '{"provider":"dev","providers":["dev"]}',
  '{}'
)
on conflict (id) do nothing;

insert into houses (id, owner_id, name)
values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-0000000000aa',
  '개발용 하우스'
)
on conflict (id) do nothing;
```

- [ ] **Step 2: 원격 DB에 마이그레이션 적용**

Run: `npx supabase db push`
Expected: `20260910010000_tenant_management_schema_updates.sql` 적용 성공 메시지, 에러 없음

- [ ] **Step 3: 적용 확인**

Run:
```bash
npx supabase db push --dry-run
```
Expected: "Remote database is up to date" (또는 pending migration 없음을 나타내는 메시지)

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260910010000_tenant_management_schema_updates.sql
git commit -m "feat: 퇴실일 필수화, 메모/soft-delete 컬럼 추가 및 개발용 시드 house 생성"
```

---

## Task 3: shadcn/ui 도입

**Files:**
- Create: `components.json`, `src/components/ui/*` (shadcn init/add가 생성)
- Modify: `src/app/globals.css`, `package.json`

**Interfaces:**
- Consumes: 없음
- Produces: `src/components/ui/{button,input,label,textarea,table,sheet,sonner}.tsx` — 이후 태스크에서 그대로 import

- [ ] **Step 1: shadcn 초기화**

```bash
npx shadcn@latest init
```

프롬프트 응답: TypeScript 사용(Yes), 스타일은 New York 대신 기본값 사용, base color는 Neutral(가장 무채색에 가까운 옵션 — 이후 Notion 톤은 CSS 변수로 직접 덮어씀), CSS 변수 사용(Yes).

- [ ] **Step 2: 필요한 컴포넌트 추가**

```bash
npx shadcn@latest add button input label textarea table sheet sonner
```

- [ ] **Step 3: `src/app/globals.css`에 Notion 기반 팔레트 토큰 반영**

`docs/DESIGN.md`의 색상 토큰을 shadcn이 생성한 `@theme`/`:root` 변수에 매핑한다. `src/app/globals.css`를 열어 `:root` 블록에 다음 값을 반영(shadcn init이 만든 기존 변수명은 유지하고 값만 교체):

```css
:root {
  --background: #f6f5f4; /* canvas-soft */
  --foreground: #1a1a1a; /* ink */
  --card: #ffffff; /* surface */
  --card-foreground: #1a1a1a;
  --primary: #0075de;
  --primary-foreground: #ffffff;
  --border: #e6e6e6; /* hairline */
  --radius: 0.75rem; /* 12px, rounded.lg */
}
```

(정확한 변수 목록은 shadcn init 결과물에 따라 달라질 수 있으므로, init 후 실제 생성된 변수명을 확인하고 대응하는 값으로 채운다.)

- [ ] **Step 4: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공, 타입 에러 없음

- [ ] **Step 5: Commit**

```bash
git add components.json src/components/ui src/app/globals.css package.json package-lock.json
git commit -m "feat: shadcn/ui 도입 및 Notion 기반 팔레트 토큰 적용"
```

---

## Task 4: 개발용 Service Role Supabase Client

**Files:**
- Create: `src/lib/supabase/service-role.ts`
- Modify: `.env.local.example`, `.env.local`

**Interfaces:**
- Consumes: `process.env.SUPABASE_SERVICE_ROLE_KEY`, `process.env.NEXT_PUBLIC_SUPABASE_URL`
- Produces: `createServiceRoleClient(): SupabaseClient` — 이후 Task 5, 7에서 목록 조회/Server Action이 이 client를 사용

- [ ] **Step 1: `.env.local.example`에 키 추가**

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

- [ ] **Step 2: `.env.local`에 실제 service role key 값 채우기**

Supabase 대시보드 (Project Settings > API > service_role secret)에서 값을 가져와 `.env.local`에 직접 입력한다. 이 파일은 `.gitignore`에 이미 포함되어 있어 커밋되지 않는다.

- [ ] **Step 3: `src/lib/supabase/service-role.ts` 작성**

```typescript
import { createClient } from "@supabase/supabase-js";

/**
 * 인증이 아직 없는 개발 단계에서 RLS를 우회하기 위한 전용 클라이언트.
 * 서버 전용 모듈이며, 절대 브라우저로 전달되어서는 안 된다.
 * 로그인이 붙는 시점에 이 파일과 사용처를 제거하고 일반 서버 클라이언트로 전환한다.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY 또는 NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** 개발 단계에서 사용하는 고정 house id (로그인 붙으면 제거) */
export const DEV_HOUSE_ID = "00000000-0000-0000-0000-000000000001";
```

- [ ] **Step 4: 파일이 서버에서만 import되는지 확인**

`src/lib/supabase/service-role.ts` 최상단에 Next.js가 클라이언트 번들에 포함시키지 않도록 보장하는 장치는 없으므로, 이후 태스크에서 이 파일을 **서버 컴포넌트/Server Action에서만** import하도록 주의한다 (별도 코드 스텝 없음, 리뷰 시 확인 포인트).

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase/service-role.ts .env.local.example
git commit -m "feat: 개발용 service role Supabase client 추가"
```

---

## Task 5: Tenant 타입 및 검증 로직

**Files:**
- Create: `src/lib/tenants/types.ts`
- Create: `src/lib/tenants/validation.ts`
- Test: `src/lib/tenants/validation.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `type Tenant = { id: string; houseId: string; name: string; moveInDate: string; moveOutDate: string; memo: string | null; createdAt: string; deletedAt: string | null }`
  - `type TenantInput = { name: string; moveInDate: string; moveOutDate: string; memo: string | null }`
  - `type ValidationResult = { ok: true } | { ok: false; errors: Partial<Record<keyof TenantInput, string>> }`
  - `function validateTenantInput(input: TenantInput): ValidationResult`

- [ ] **Step 1: `src/lib/tenants/types.ts` 작성**

```typescript
export type Tenant = {
  id: string;
  houseId: string;
  name: string;
  moveInDate: string; // ISO date string, 예: "2026-03-01"
  moveOutDate: string; // ISO date string
  memo: string | null;
  createdAt: string;
  deletedAt: string | null;
};

export type TenantInput = {
  name: string;
  moveInDate: string;
  moveOutDate: string;
  memo: string | null;
};
```

- [ ] **Step 2: 실패하는 테스트 작성 (`validation.test.ts`)**

```typescript
import { describe, it, expect } from "vitest";
import { validateTenantInput } from "./validation";

describe("validateTenantInput", () => {
  it("모든 필드가 유효하면 ok: true를 반환한다", () => {
    const result = validateTenantInput({
      name: "김철수",
      moveInDate: "2026-03-01",
      moveOutDate: "2026-09-30",
      memo: null,
    });
    expect(result).toEqual({ ok: true });
  });

  it("이름이 비어있으면 name 에러를 반환한다", () => {
    const result = validateTenantInput({
      name: "  ",
      moveInDate: "2026-03-01",
      moveOutDate: "2026-09-30",
      memo: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.name).toBeDefined();
    }
  });

  it("입실일이 비어있으면 moveInDate 에러를 반환한다", () => {
    const result = validateTenantInput({
      name: "김철수",
      moveInDate: "",
      moveOutDate: "2026-09-30",
      memo: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.moveInDate).toBeDefined();
    }
  });

  it("퇴실일이 비어있으면 moveOutDate 에러를 반환한다", () => {
    const result = validateTenantInput({
      name: "김철수",
      moveInDate: "2026-03-01",
      moveOutDate: "",
      memo: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.moveOutDate).toBeDefined();
    }
  });

  it("퇴실일이 입실일보다 이르면 moveOutDate 에러를 반환한다", () => {
    const result = validateTenantInput({
      name: "김철수",
      moveInDate: "2026-09-30",
      moveOutDate: "2026-03-01",
      memo: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.moveOutDate).toBeDefined();
    }
  });

  it("퇴실일이 입실일과 같으면 유효하다", () => {
    const result = validateTenantInput({
      name: "김철수",
      moveInDate: "2026-03-01",
      moveOutDate: "2026-03-01",
      memo: null,
    });
    expect(result).toEqual({ ok: true });
  });
});
```

- [ ] **Step 3: 테스트 실행해서 실패 확인**

Run: `npm run test -- validation.test.ts`
Expected: FAIL ("validateTenantInput" is not defined, 또는 모듈을 찾을 수 없음)

- [ ] **Step 4: `src/lib/tenants/validation.ts` 구현**

```typescript
import type { TenantInput } from "./types";

type ValidationResult =
  | { ok: true }
  | { ok: false; errors: Partial<Record<keyof TenantInput, string>> };

export function validateTenantInput(input: TenantInput): ValidationResult {
  const errors: Partial<Record<keyof TenantInput, string>> = {};

  if (input.name.trim().length === 0) {
    errors.name = "이름을 입력해주세요.";
  }

  if (input.moveInDate.trim().length === 0) {
    errors.moveInDate = "입실일을 입력해주세요.";
  }

  if (input.moveOutDate.trim().length === 0) {
    errors.moveOutDate = "퇴실일을 입력해주세요.";
  } else if (
    input.moveInDate.trim().length > 0 &&
    input.moveOutDate < input.moveInDate
  ) {
    errors.moveOutDate = "퇴실일은 입실일 이후여야 합니다.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true };
}
```

- [ ] **Step 5: 테스트 실행해서 통과 확인**

Run: `npm run test -- validation.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 6: Commit**

```bash
git add src/lib/tenants/types.ts src/lib/tenants/validation.ts src/lib/tenants/validation.test.ts
git commit -m "feat: 입주자 입력값 검증 로직 추가"
```

---

## Task 6: 목록 조회 함수

**Files:**
- Create: `src/lib/tenants/queries.ts`
- Test: `src/lib/tenants/queries.test.ts`

**Interfaces:**
- Consumes: `createServiceRoleClient()` (Task 4), `DEV_HOUSE_ID` (Task 4), `Tenant` (Task 5)
- Produces: `async function listTenants(houseId: string): Promise<Tenant[]>` — 가나다순 정렬, `deleted_at is null`인 것만. Task 8(page.tsx)에서 사용

**주의:** `queries.test.ts`는 실제 원격 Supabase에 접근하는 통합 테스트다. 로컬에 DB 서버가 없으므로, `.env.local`의 자격증명을 사용해 원격 개발 DB에 직접 붙는다. 테스트 실행 전/후 생성한 row는 반드시 정리한다.

- [ ] **Step 1: 실패하는 테스트 작성**

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createServiceRoleClient, DEV_HOUSE_ID } from "@/lib/supabase/service-role";
import { listTenants } from "./queries";

describe("listTenants", () => {
  const createdIds: string[] = [];

  afterEach(async () => {
    const supabase = createServiceRoleClient();
    if (createdIds.length > 0) {
      await supabase.from("tenants").delete().in("id", createdIds);
      createdIds.length = 0;
    }
  });

  it("이름 가나다순으로 정렬되어 반환된다", async () => {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from("tenants")
      .insert([
        { house_id: DEV_HOUSE_ID, name: "홍길동", move_in_date: "2026-01-01", move_out_date: "2026-12-31" },
        { house_id: DEV_HOUSE_ID, name: "김철수", move_in_date: "2026-01-01", move_out_date: "2026-12-31" },
      ])
      .select("id");
    createdIds.push(...(data ?? []).map((row) => row.id));

    const tenants = await listTenants(DEV_HOUSE_ID);
    const names = tenants.map((t) => t.name);
    const kimIndex = names.indexOf("김철수");
    const hongIndex = names.indexOf("홍길동");
    expect(kimIndex).toBeLessThan(hongIndex);
  });

  it("삭제된(deleted_at이 있는) 입주자는 제외된다", async () => {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from("tenants")
      .insert({
        house_id: DEV_HOUSE_ID,
        name: "삭제됨테스트",
        move_in_date: "2026-01-01",
        move_out_date: "2026-12-31",
        deleted_at: new Date().toISOString(),
      })
      .select("id");
    createdIds.push(...(data ?? []).map((row) => row.id));

    const tenants = await listTenants(DEV_HOUSE_ID);
    expect(tenants.some((t) => t.name === "삭제됨테스트")).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트 실행해서 실패 확인**

Run: `npm run test -- queries.test.ts`
Expected: FAIL (`listTenants` is not defined, 또는 모듈을 찾을 수 없음)

- [ ] **Step 3: `src/lib/tenants/queries.ts` 구현**

```typescript
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { Tenant } from "./types";

type TenantRow = {
  id: string;
  house_id: string;
  name: string;
  move_in_date: string;
  move_out_date: string;
  memo: string | null;
  created_at: string;
  deleted_at: string | null;
};

function toTenant(row: TenantRow): Tenant {
  return {
    id: row.id,
    houseId: row.house_id,
    name: row.name,
    moveInDate: row.move_in_date,
    moveOutDate: row.move_out_date,
    memo: row.memo,
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
  };
}

export async function listTenants(houseId: string): Promise<Tenant[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("id, house_id, name, move_in_date, move_out_date, memo, created_at, deleted_at")
    .eq("house_id", houseId)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`입주자 목록 조회 실패: ${error.message}`);
  }

  return (data ?? []).map(toTenant);
}
```

- [ ] **Step 4: 테스트 실행해서 통과 확인**

Run: `npm run test -- queries.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/tenants/queries.ts src/lib/tenants/queries.test.ts
git commit -m "feat: 입주자 목록 조회 함수 추가 (가나다순, soft-delete 필터)"
```

---

## Task 7: Server Actions — create / update / delete / undo

**Files:**
- Create: `src/app/houses/[houseId]/tenants/actions.ts`
- Test: `src/app/houses/[houseId]/tenants/actions.test.ts`

**Interfaces:**
- Consumes: `createServiceRoleClient()`, `DEV_HOUSE_ID` (Task 4), `validateTenantInput`, `TenantInput` (Task 5)
- Produces:
  - `type ActionResult = { ok: true; tenantId?: string } | { ok: false; errors: Record<string, string> }`
  - `async function createTenant(houseId: string, input: TenantInput): Promise<ActionResult>`
  - `async function updateTenant(tenantId: string, input: TenantInput): Promise<ActionResult>`
  - `async function deleteTenant(tenantId: string): Promise<ActionResult>`
  - `async function undoDeleteTenant(tenantId: string): Promise<ActionResult>`
  - Task 9(tenant-sheet.tsx), Task 10(delete-tenant-button.tsx)에서 이 함수들을 직접 호출

- [ ] **Step 1: 실패하는 테스트 작성**

```typescript
import { describe, it, expect, afterEach } from "vitest";
import { createServiceRoleClient, DEV_HOUSE_ID } from "@/lib/supabase/service-role";
import { createTenant, updateTenant, deleteTenant, undoDeleteTenant } from "./actions";

describe("tenant server actions", () => {
  const createdIds: string[] = [];

  afterEach(async () => {
    const supabase = createServiceRoleClient();
    if (createdIds.length > 0) {
      await supabase.from("tenants").delete().in("id", createdIds);
      createdIds.length = 0;
    }
  });

  it("createTenant는 유효한 입력으로 입주자를 생성한다", async () => {
    const result = await createTenant(DEV_HOUSE_ID, {
      name: "테스트입주자",
      moveInDate: "2026-01-01",
      moveOutDate: "2026-12-31",
      memo: null,
    });
    expect(result.ok).toBe(true);
    if (result.ok && result.tenantId) {
      createdIds.push(result.tenantId);
    }
  });

  it("createTenant는 이름이 비어있으면 에러를 반환한다", async () => {
    const result = await createTenant(DEV_HOUSE_ID, {
      name: "",
      moveInDate: "2026-01-01",
      moveOutDate: "2026-12-31",
      memo: null,
    });
    expect(result.ok).toBe(false);
  });

  it("updateTenant는 기존 입주자 정보를 수정한다", async () => {
    const createResult = await createTenant(DEV_HOUSE_ID, {
      name: "수정전",
      moveInDate: "2026-01-01",
      moveOutDate: "2026-12-31",
      memo: null,
    });
    if (!createResult.ok || !createResult.tenantId) throw new Error("생성 실패");
    createdIds.push(createResult.tenantId);

    const updateResult = await updateTenant(createResult.tenantId, {
      name: "수정후",
      moveInDate: "2026-01-01",
      moveOutDate: "2026-12-31",
      memo: "메모 추가",
    });
    expect(updateResult.ok).toBe(true);

    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from("tenants")
      .select("name, memo")
      .eq("id", createResult.tenantId)
      .single();
    expect(data?.name).toBe("수정후");
    expect(data?.memo).toBe("메모 추가");
  });

  it("deleteTenant는 deleted_at을 설정하고, undoDeleteTenant는 되돌린다", async () => {
    const createResult = await createTenant(DEV_HOUSE_ID, {
      name: "삭제테스트",
      moveInDate: "2026-01-01",
      moveOutDate: "2026-12-31",
      memo: null,
    });
    if (!createResult.ok || !createResult.tenantId) throw new Error("생성 실패");
    createdIds.push(createResult.tenantId);

    const deleteResult = await deleteTenant(createResult.tenantId);
    expect(deleteResult.ok).toBe(true);

    const supabase = createServiceRoleClient();
    const afterDelete = await supabase
      .from("tenants")
      .select("deleted_at")
      .eq("id", createResult.tenantId)
      .single();
    expect(afterDelete.data?.deleted_at).not.toBeNull();

    const undoResult = await undoDeleteTenant(createResult.tenantId);
    expect(undoResult.ok).toBe(true);

    const afterUndo = await supabase
      .from("tenants")
      .select("deleted_at")
      .eq("id", createResult.tenantId)
      .single();
    expect(afterUndo.data?.deleted_at).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트 실행해서 실패 확인**

Run: `npm run test -- actions.test.ts`
Expected: FAIL (모듈을 찾을 수 없음)

- [ ] **Step 3: `actions.ts` 구현**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { validateTenantInput } from "@/lib/tenants/validation";
import type { TenantInput } from "@/lib/tenants/types";

export type ActionResult =
  | { ok: true; tenantId?: string }
  | { ok: false; errors: Record<string, string> };

function toDbInput(input: TenantInput) {
  return {
    name: input.name.trim(),
    move_in_date: input.moveInDate,
    move_out_date: input.moveOutDate,
    memo: input.memo?.trim() || null,
  };
}

export async function createTenant(
  houseId: string,
  input: TenantInput,
): Promise<ActionResult> {
  const validation = validateTenantInput(input);
  if (!validation.ok) {
    return { ok: false, errors: validation.errors };
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("tenants")
    .insert({ house_id: houseId, ...toDbInput(input) })
    .select("id")
    .single();

  if (error) {
    return { ok: false, errors: { form: error.message } };
  }

  revalidatePath(`/houses/${houseId}/tenants`);
  return { ok: true, tenantId: data.id };
}

export async function updateTenant(
  tenantId: string,
  input: TenantInput,
): Promise<ActionResult> {
  const validation = validateTenantInput(input);
  if (!validation.ok) {
    return { ok: false, errors: validation.errors };
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("tenants")
    .update(toDbInput(input))
    .eq("id", tenantId)
    .select("house_id")
    .single();

  if (error) {
    return { ok: false, errors: { form: error.message } };
  }

  revalidatePath(`/houses/${data.house_id}/tenants`);
  return { ok: true, tenantId };
}

export async function deleteTenant(tenantId: string): Promise<ActionResult> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("tenants")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", tenantId)
    .select("house_id")
    .single();

  if (error) {
    return { ok: false, errors: { form: error.message } };
  }

  revalidatePath(`/houses/${data.house_id}/tenants`);
  return { ok: true, tenantId };
}

export async function undoDeleteTenant(tenantId: string): Promise<ActionResult> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("tenants")
    .update({ deleted_at: null })
    .eq("id", tenantId)
    .select("house_id")
    .single();

  if (error) {
    return { ok: false, errors: { form: error.message } };
  }

  revalidatePath(`/houses/${data.house_id}/tenants`);
  return { ok: true, tenantId };
}
```

- [ ] **Step 4: 테스트 실행해서 통과 확인**

Run: `npm run test -- actions.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/app/houses/[houseId]/tenants/actions.ts src/app/houses/[houseId]/tenants/actions.test.ts
git commit -m "feat: 입주자 CRUD Server Actions 추가 (soft-delete 포함)"
```

---

## Task 8: 앱 셸 레이아웃

**Files:**
- Create: `src/app/houses/[houseId]/layout.tsx`

**Interfaces:**
- Consumes: 없음 (정적 레이아웃)
- Produces: 사이드바 + 상단바를 감싸는 레이아웃. `children`을 메인 컨텐츠 영역에 렌더링. Task 9(page.tsx)가 이 레이아웃 하위에서 렌더링됨

- [ ] **Step 1: `docs/mockups/settlement-dashboard.html`의 사이드바 마크업 확인**

이미 브레인스토밍 단계에서 읽은 마크업(다크 사이드바 `#21201e`, `.brand`, `.nav-group`, `.nav-item`, `.sidebar-footer`)을 React 컴포넌트로 옮긴다. 목업 CSS는 Tailwind 유틸리티 클래스로 변환한다.

- [ ] **Step 2: `layout.tsx` 작성**

```tsx
import type { ReactNode } from "react";

export default function HouseLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-[248px_1fr]">
      <aside className="flex flex-col gap-7 bg-[#21201e] py-6 text-[#d8d5d0]">
        <div className="flex items-center gap-2.5 px-6">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-white">
            쉐
          </div>
          <span className="text-[15px] font-semibold text-white">
            쉐어하우스 오피스
          </span>
        </div>

        <nav className="flex flex-col">
          <span className="px-6 pb-2 text-[11px] font-semibold uppercase tracking-wide text-[#8a8781]">
            운영
          </span>
          <span className="mr-4 flex items-center gap-2.5 rounded-r-[5px] py-2.5 pl-6 text-sm font-medium text-[#8a8781]">
            정산 대시보드
          </span>
          <a
            href="#"
            className="flex items-center gap-2.5 rounded-l-[5px] bg-[#f6f5f4] py-2.5 pl-6 pr-3 text-sm font-medium text-[#1a1a1a]"
          >
            입주자 관리
          </a>
        </nav>

        <div className="mt-auto flex items-center gap-2.5 rounded-md bg-white/5 px-3 py-2.5">
          <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-[#62aef0] to-primary" />
          <div className="flex flex-col leading-tight">
            <span className="text-[13px] font-semibold text-white">운영자</span>
            <span className="text-xs text-[#8a8781]">개발 모드</span>
          </div>
        </div>
      </aside>

      <main className="flex flex-col bg-[#f6f5f4]">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: 빌드로 타입/JSX 오류 확인**

Run: `npm run build`
Expected: 빌드 성공 (아직 `page.tsx`가 없어서 이 라우트 자체는 404지만, 컴파일 에러는 없어야 함 — Task 9에서 `page.tsx`를 추가하면 라우트가 완성됨)

- [ ] **Step 4: Commit**

```bash
git add src/app/houses/[houseId]/layout.tsx
git commit -m "feat: 입주자 관리 페이지 앱 셸(사이드바) 추가"
```

---

## Task 9: 목록 페이지 (예시 데이터 프리뷰 포함)

**Files:**
- Create: `src/app/houses/[houseId]/tenants/page.tsx`
- Create: `src/app/houses/[houseId]/tenants/tenant-table.tsx`

**Interfaces:**
- Consumes: `listTenants(houseId)` (Task 6), `Tenant` (Task 5)
- Produces: `/houses/:houseId/tenants` 라우트. `<TenantTable tenants={tenants} houseId={houseId} />` — Task 10(delete-tenant-button), Task 11(tenant-sheet)이 이 안에서 렌더링됨

- [ ] **Step 1: 예시 데이터 상수 정의 및 `tenant-table.tsx` 작성**

```tsx
"use client";

import type { Tenant } from "@/lib/tenants/types";

const SAMPLE_TENANTS: Tenant[] = [
  {
    id: "sample-1",
    houseId: "",
    name: "김민준",
    moveInDate: "2026-03-01",
    moveOutDate: "2026-09-30",
    memo: "장기 계약, 조용한 방 선호",
    createdAt: "",
    deletedAt: null,
  },
  {
    id: "sample-2",
    houseId: "",
    name: "이서연",
    moveInDate: "2026-05-15",
    moveOutDate: "2026-11-14",
    memo: null,
    createdAt: "",
    deletedAt: null,
  },
  {
    id: "sample-3",
    houseId: "",
    name: "박도윤",
    moveInDate: "2026-01-10",
    moveOutDate: "2026-07-09",
    memo: "반려동물 동반",
    createdAt: "",
    deletedAt: null,
  },
];

function formatDate(iso: string) {
  return iso.replaceAll("-", ".");
}

export function TenantTable({
  tenants,
  houseId,
}: {
  tenants: Tenant[];
  houseId: string;
}) {
  const isEmpty = tenants.length === 0;
  const rows = isEmpty ? SAMPLE_TENANTS : tenants;

  return (
    <div className="overflow-hidden rounded-xl border border-[#e6e6e6] bg-white">
      {isEmpty && (
        <p className="border-b border-[#e6e6e6] bg-[#f6f5f4] px-5 py-2.5 text-xs text-[#a39e98]">
          아직 등록된 입주자가 없습니다. 아래는 예시 데이터입니다 — 입주자를 추가하면 이렇게 표시됩니다.
        </p>
      )}
      <table className="w-full text-[13.5px]">
        <thead>
          <tr className="bg-[#f6f5f4] text-left text-[11px] font-semibold uppercase tracking-wide text-[#a39e98]">
            <th className="px-5 py-2.5">이름</th>
            <th className="px-5 py-2.5">입실일</th>
            <th className="px-5 py-2.5">퇴실일</th>
            <th className="px-5 py-2.5">메모</th>
            <th className="px-5 py-2.5" />
          </tr>
        </thead>
        <tbody className={isEmpty ? "opacity-50" : undefined}>
          {rows.map((tenant) => (
            <tr key={tenant.id} className="border-t border-[#e6e6e6]">
              <td className="px-5 py-3 font-semibold text-[#1a1a1a]">
                {tenant.name}
              </td>
              <td className="px-5 py-3 text-[#31302e]">
                {formatDate(tenant.moveInDate)}
              </td>
              <td className="px-5 py-3 text-[#31302e]">
                {formatDate(tenant.moveOutDate)}
              </td>
              <td className="px-5 py-3 text-[#615d59]">
                {tenant.memo ?? "-"}
              </td>
              <td className="px-5 py-3 text-right">
                {!isEmpty && (
                  <div className="flex justify-end gap-2">
                    {/* Task 11에서 수정 버튼, Task 10에서 삭제 버튼 연결 */}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: `page.tsx` 작성**

```tsx
import { listTenants } from "@/lib/tenants/queries";
import { TenantTable } from "./tenant-table";

export default async function TenantsPage({
  params,
}: {
  params: Promise<{ houseId: string }>;
}) {
  const { houseId } = await params;
  const tenants = await listTenants(houseId);

  return (
    <div className="flex flex-col gap-6 px-8 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold tracking-tight text-[#1a1a1a]">
          입주자 관리
        </h1>
        {/* Task 11에서 "입주자 추가" 버튼 연결 */}
      </div>
      <TenantTable tenants={tenants} houseId={houseId} />
    </div>
  );
}
```

- [ ] **Step 3: 개발 서버로 확인**

Run: `npm run dev`
브라우저에서 `http://localhost:3000/houses/00000000-0000-0000-0000-000000000001/tenants` 접속.
Expected: DB에 입주자가 없으므로 예시 데이터 3건이 옅은 톤으로 표시되고, 안내 문구가 보인다.

- [ ] **Step 4: Commit**

```bash
git add src/app/houses/[houseId]/tenants/page.tsx src/app/houses/[houseId]/tenants/tenant-table.tsx
git commit -m "feat: 입주자 목록 페이지 및 예시 데이터 프리뷰 추가"
```

---

## Task 10: 추가/수정 Sheet

**Files:**
- Create: `src/app/houses/[houseId]/tenants/tenant-sheet.tsx`
- Modify: `src/app/houses/[houseId]/tenants/page.tsx`
- Modify: `src/app/houses/[houseId]/tenants/tenant-table.tsx`

**Interfaces:**
- Consumes: `createTenant`, `updateTenant` (Task 7), shadcn `Sheet`/`Input`/`Label`/`Textarea`/`Button` (Task 3), `toast` from `sonner`
- Produces: `<TenantSheet mode="create" houseId={houseId} trigger={...} />`, `<TenantSheet mode="edit" tenant={tenant} trigger={...} />` — Task 9의 페이지와 테이블에서 트리거로 사용

- [ ] **Step 1: `tenant-sheet.tsx` 작성**

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createTenant, updateTenant } from "./actions";
import type { Tenant, TenantInput } from "@/lib/tenants/types";

type Props =
  | { mode: "create"; houseId: string; trigger: React.ReactNode }
  | { mode: "edit"; tenant: Tenant; trigger: React.ReactNode };

export function TenantSheet(props: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const initial: TenantInput =
    props.mode === "edit"
      ? {
          name: props.tenant.name,
          moveInDate: props.tenant.moveInDate,
          moveOutDate: props.tenant.moveOutDate,
          memo: props.tenant.memo,
        }
      : { name: "", moveInDate: "", moveOutDate: "", memo: null };

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setErrors({});

    const input: TenantInput = {
      name: String(formData.get("name") ?? ""),
      moveInDate: String(formData.get("moveInDate") ?? ""),
      moveOutDate: String(formData.get("moveOutDate") ?? ""),
      memo: String(formData.get("memo") ?? "") || null,
    };

    const result =
      props.mode === "create"
        ? await createTenant(props.houseId, input)
        : await updateTenant(props.tenant.id, input);

    setPending(false);

    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    toast.success(
      props.mode === "create"
        ? `${input.name}님을 추가했습니다.`
        : `${input.name}님 정보를 수정했습니다.`,
    );
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{props.trigger}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {props.mode === "create" ? "입주자 추가" : "입주자 정보 수정"}
          </SheetTitle>
        </SheetHeader>
        <form
          action={handleSubmit}
          className="flex flex-col gap-4 px-4 pb-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">이름</Label>
            <Input id="name" name="name" defaultValue={initial.name} required />
            {errors.name && (
              <p className="text-xs text-red-600">{errors.name}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="moveInDate">입실일</Label>
            <Input
              id="moveInDate"
              name="moveInDate"
              type="date"
              defaultValue={initial.moveInDate}
              required
            />
            {errors.moveInDate && (
              <p className="text-xs text-red-600">{errors.moveInDate}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="moveOutDate">퇴실일</Label>
            <Input
              id="moveOutDate"
              name="moveOutDate"
              type="date"
              defaultValue={initial.moveOutDate}
              required
            />
            {errors.moveOutDate && (
              <p className="text-xs text-red-600">{errors.moveOutDate}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="memo">메모</Label>
            <Textarea id="memo" name="memo" defaultValue={initial.memo ?? ""} />
          </div>

          {errors.form && (
            <p className="text-xs text-red-600">{errors.form}</p>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? "저장 중..." : "저장"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: `page.tsx`에 "입주자 추가" 버튼 연결**

`src/app/houses/[houseId]/tenants/page.tsx`의 상단바 부분을 다음으로 교체:

```tsx
import { listTenants } from "@/lib/tenants/queries";
import { TenantTable } from "./tenant-table";
import { TenantSheet } from "./tenant-sheet";
import { Button } from "@/components/ui/button";

export default async function TenantsPage({
  params,
}: {
  params: Promise<{ houseId: string }>;
}) {
  const { houseId } = await params;
  const tenants = await listTenants(houseId);

  return (
    <div className="flex flex-col gap-6 px-8 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold tracking-tight text-[#1a1a1a]">
          입주자 관리
        </h1>
        <TenantSheet
          mode="create"
          houseId={houseId}
          trigger={<Button>입주자 추가</Button>}
        />
      </div>
      <TenantTable tenants={tenants} houseId={houseId} />
    </div>
  );
}
```

- [ ] **Step 3: `tenant-table.tsx`에 행별 수정 버튼 연결**

`tenant-table.tsx`의 액션 셀 부분을 다음으로 교체 (import 추가 및 `!isEmpty` 블록 수정):

```tsx
import { TenantSheet } from "./tenant-sheet";
import { Button } from "@/components/ui/button";
```

```tsx
<td className="px-5 py-3 text-right">
  {!isEmpty && (
    <div className="flex justify-end gap-2">
      <TenantSheet
        mode="edit"
        tenant={tenant}
        trigger={
          <Button variant="ghost" size="sm">
            수정
          </Button>
        }
      />
      {/* Task 11에서 삭제 버튼 연결 */}
    </div>
  )}
</td>
```

`SAMPLE_TENANTS` 배열의 각 항목 타입이 `Tenant`와 일치하는지 확인 (이미 Task 9에서 맞춰둠, 변경 불필요).

- [ ] **Step 4: 개발 서버로 수동 확인**

Run: `npm run dev`
1. `/houses/00000000-0000-0000-0000-000000000001/tenants`에서 "입주자 추가" 클릭 → Sheet가 우측에서 열리고 목록이 가려지지 않는지 확인
2. 이름만 비우고 저장 → "이름을 입력해주세요." 에러가 Sheet 안에 표시되는지 확인
3. 정상 값 입력 후 저장 → Sheet가 닫히고 토스트가 뜨고, 목록에 새 행이 추가되는지 확인 (예시 데이터가 사라지고 실제 데이터로 교체됨)
4. 방금 추가한 행의 "수정" 클릭 → 기존 값이 채워진 Sheet가 열리는지 확인, 메모를 추가하고 저장 → 목록에 메모가 반영되는지 확인

Expected: 위 4단계 모두 설계대로 동작

- [ ] **Step 5: Commit**

```bash
git add src/app/houses/[houseId]/tenants/tenant-sheet.tsx src/app/houses/[houseId]/tenants/page.tsx src/app/houses/[houseId]/tenants/tenant-table.tsx
git commit -m "feat: 입주자 추가/수정 Sheet 연결"
```

---

## Task 11: 삭제 + 실행취소 토스트

**Files:**
- Create: `src/app/houses/[houseId]/tenants/delete-tenant-button.tsx`
- Modify: `src/app/houses/[houseId]/tenants/tenant-table.tsx`

**Interfaces:**
- Consumes: `deleteTenant`, `undoDeleteTenant` (Task 7), `toast` from `sonner`
- Produces: `<DeleteTenantButton tenant={tenant} />` — Task 9의 테이블에서 사용, 이 태스크가 마지막 UI 조각

- [ ] **Step 1: `delete-tenant-button.tsx` 작성**

```tsx
"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteTenant, undoDeleteTenant } from "./actions";
import type { Tenant } from "@/lib/tenants/types";

export function DeleteTenantButton({ tenant }: { tenant: Tenant }) {
  async function handleDelete() {
    const result = await deleteTenant(tenant.id);

    if (!result.ok) {
      toast.error(`삭제에 실패했습니다: ${result.errors.form ?? "알 수 없는 오류"}`);
      return;
    }

    toast(`${tenant.name}님을 삭제했습니다.`, {
      action: {
        label: "실행취소",
        onClick: async () => {
          const undoResult = await undoDeleteTenant(tenant.id);
          if (undoResult.ok) {
            toast.success(`${tenant.name}님을 복원했습니다.`);
          } else {
            toast.error("복원에 실패했습니다.");
          }
        },
      },
      duration: 5000,
    });
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleDelete}>
      삭제
    </Button>
  );
}
```

- [ ] **Step 2: `tenant-table.tsx`에 삭제 버튼 연결**

`tenant-table.tsx`에 import 추가:

```tsx
import { DeleteTenantButton } from "./delete-tenant-button";
```

액션 셀의 주석 부분을 교체:

```tsx
<td className="px-5 py-3 text-right">
  {!isEmpty && (
    <div className="flex justify-end gap-2">
      <TenantSheet
        mode="edit"
        tenant={tenant}
        trigger={
          <Button variant="ghost" size="sm">
            수정
          </Button>
        }
      />
      <DeleteTenantButton tenant={tenant} />
    </div>
  )}
</td>
```

- [ ] **Step 3: 앱 레이아웃 최상위에 sonner `Toaster` 배치 확인**

`src/app/layout.tsx`에 shadcn `sonner` add 시 생성된 `Toaster` 컴포넌트가 아직 없다면 추가한다.

`src/app/layout.tsx` 수정:

```tsx
import { Toaster } from "@/components/ui/sonner";
```

`<body>` 태그 내부 최상단(children보다 앞이든 뒤든 무방)에:

```tsx
<Toaster />
```

- [ ] **Step 4: 개발 서버로 수동 확인**

Run: `npm run dev`
1. 목록에서 임의 행의 "삭제" 클릭 → 확인 다이얼로그 없이 즉시 목록에서 사라지고, 하단에 "OO님을 삭제했습니다." 토스트 + "실행취소" 버튼이 뜨는지 확인
2. 5초 이내에 "실행취소" 클릭 → 해당 입주자가 목록에 다시 나타나고 "복원했습니다" 토스트가 뜨는지 확인
3. 다시 삭제 후 5초 이상 기다렸다가 페이지를 새로고침 → 삭제된 입주자가 목록에 없는지 확인 (soft delete되어 DB에는 남아있지만 조회되지 않음)

Expected: 위 3단계 모두 설계대로 동작

- [ ] **Step 5: Commit**

```bash
git add src/app/houses/[houseId]/tenants/delete-tenant-button.tsx src/app/houses/[houseId]/tenants/tenant-table.tsx src/app/layout.tsx
git commit -m "feat: 입주자 삭제 및 실행취소 토스트 연결"
```

---

## Task 12: 전체 검증 및 린트/빌드 확인

**Files:**
- Modify: 없음 (검증 전용 태스크)

**Interfaces:**
- Consumes: 이전 모든 태스크의 결과물
- Produces: 없음 (최종 확인)

- [ ] **Step 1: 전체 테스트 실행**

Run: `npm run test`
Expected: 모든 테스트 PASS (validation, queries, actions)

- [ ] **Step 2: 린트 실행**

Run: `npm run lint`
Expected: 에러 없음 (경고는 확인 후 필요 시 수정)

- [ ] **Step 3: 빌드 실행**

Run: `npm run build`
Expected: 빌드 성공

- [ ] **Step 4: 브라우저로 전체 흐름 재확인**

`/houses/00000000-0000-0000-0000-000000000001/tenants`에서:
1. 예시 데이터 프리뷰 표시 확인 (테스트 데이터를 모두 지운 상태에서)
2. 추가 → 수정 → 삭제 → 실행취소 전체 흐름을 한 번씩 실행
3. 이름 가나다순 정렬이 유지되는지 확인 (예: "박", "김", "이" 순으로 추가해도 목록은 "김", "박", "이" 순으로 보이는지)

Expected: 설계 문서(`docs/superpowers/specs/2026-09-10-tenant-management-design.md`)의 모든 항목이 동작

- [ ] **Step 5: Commit (필요한 수정이 있었다면)**

```bash
git add -A
git commit -m "fix: 린트/빌드 이슈 정리"
```

(수정할 내용이 없다면 이 스텝은 생략)
