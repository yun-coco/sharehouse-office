# 관리비 정산 화면 이식 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `docs/superpowers/specs/2026-07-24-settlement-screen-import-design.md`에 정의된 관리비 정산 화면(공지사항 + 이번달 관리비 + 입주자별 관리비)을, 데스크톱/태블릿/모바일 반응형을 포함한 정적 마크업(하드코딩 mock data, Supabase 미연동)으로 Next.js + Tailwind CSS에 이식한다.

**Architecture:** `src/app/(admin)/settlements/[yearMonth]/page.tsx`를 서버 컴포넌트로 두고, 편집/삭제/드래그/모달/캘린더처럼 상호작용이 필요한 부분만 `"use client"` 컴포넌트로 분리한다. 반응형은 별도 페이지가 아니라 Tailwind breakpoint(`md:`, `lg:`)로 하나의 트리에서 처리한다. 상태는 각 client 컴포넌트의 로컬 `useState`로 시뮬레이션한다(전역 상태 관리 라이브러리 없음).

**Tech Stack:** Next.js 16 (App Router) / React 19 / Tailwind CSS v4 (`@theme` CSS 기반, `tailwind.config.ts` 없음) / lucide-react / vitest + @testing-library/react (신규 도입)

## Global Constraints

- 코드 컨벤션: camelCase 변수명, 함수에 간단한 JSDoc(자명하지 않은 것만), console.log 대신 로거 불필요 시 미사용 — 이 작업은 클라이언트 UI라 로깅 자체가 불필요하면 추가하지 않는다.
- CLAUDE.md 아이콘 규칙: 수정=`pencil`(#6b6b62, 16-17px), 삭제=`trash-2`(#e0483c, 16-17px), 저장=`check`(#6b6b62, 18px), 취소=`x`(#6b6b62, 18px). 모든 아이콘 버튼은 44×44px 터치 타깃, 배경/테두리 없음. 이모지/유니코드 글리프 대신 전부 Lucide 아이콘 사용 — 단, 디자인에 남아있는 미리보기 전용 이모지(📌📊🏠 등 섹션 타이틀 접두사)는 텍스트 콘텐츠이므로 예외.
- CLAUDE.md 테이블 인라인 편집 규칙: 조회/수정 모드 동일 배치 유지, `table-layout:fixed`+각 th에 width% 직접 지정(`colgroup`/`col` 미사용), 날짜 필드는 `<input type="date">` 대신 버튼+팝오버 캘린더 컴포넌트 하나로 통일, 한 번에 하나의 행만 편집 가능(위반 시 경고 다이얼로그), 드래그는 항상 `draggable=true`+핸들러 내부에서 편집 중 여부 체크, "+ 추가"는 모달 없이 마지막 행을 바로 편집 모드로, 모든 입력 필드에 placeholder, 드래그 드롭존은 첫 행 위/마지막 행 아래에도 존재.
- CLAUDE.md 반응형 일관성 규칙: 데스크톱/태블릿과 모바일은 같은 화면의 다른 표현 — 타이틀 영역 요소 배치, 구조적 차이는 서로 맞춘다. 햄버거 메뉴 아이콘 위치는 사이드바 열림/닫힘과 무관하게 픽셀 단위로 동일.
- CLAUDE.md 타이포그래피 규칙: 조회/수정 모드 폰트 크기 동일, 모바일 카드도 본문/폼 12px·캡션 11px 스케일(캘린더 팝오버 내부만 11-15px 예외).
- 정산 계산 로직(일할계산), Supabase 연동, 실제 인증/OAuth, html-to-image 실제 캡처, 실제 영수증 업로드는 이번 범위 밖 — 화면/상호작용만 재현.
- 디자인 파일 전용 미리보기 컨트롤(데스크톱/태블릿/모바일 전환 탭, "상태 미리보기" 드롭다운, "로그인 상태 미리보기" 토글)은 구현하지 않는다. 그 컨트롤이 보여주는 각 상태 화면(empty state, 로그인 게이트, 게시 전/후, 발송 완료 등)은 구현 대상이다.
- 사이드바 "입주자 관리" 링크, 헤더 "입주자용 페이지로 이동" 링크, 로그인 게이트의 "Google로 로그인" 버튼은 UI로만 존재하고 클릭 동작 없음(href="#" 또는 no-op).

---

## 파일 구조 개요

```
src/
  components/
    ui/
      IconButton.tsx          # Task 2
      Toast.tsx                # Task 8
      Modal.tsx                 # Task 3 (공용 확인 모달 shell)
    layout/
      Sidebar.tsx                # Task 4
      SettlementHeader.tsx        # Task 5
      LoginGate.tsx                 # Task 6
    settlement/
      DateRangePopover.tsx           # Task 7
      AnnouncementSection.tsx         # Task 9
      ExpenseTable.tsx                  # Task 10
      TenantFeeTable.tsx                  # Task 11
    mock/
      settlementMockData.ts                # Task 1
  app/
    (admin)/
      layout.tsx                             # Task 12
      settlements/
        [yearMonth]/
          page.tsx                            # Task 12
  test/
    setup.ts                                    # Task 1
vitest.config.ts                                  # Task 1
```

각 컴포넌트는 위 순서로 아래→위 의존성(mock data → 원자 컴포넌트 → 섹션 컴포넌트 → 페이지)으로 만든다. Task 2~8은 서로 독립적으로 병렬 가능하지만, 순서대로 진행하면 뒤 Task에서 앞서 만든 컴포넌트를 바로 재사용할 수 있다.

---

### Task 1: 프로젝트 셋업 — vitest + Testing Library + mock 데이터 타입

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/components/mock/settlementMockData.ts`
- Test: `src/components/mock/settlementMockData.test.ts`

**Interfaces:**
- Produces: `MaintenanceFeeCategory` 타입(`'가스비'|'전기세'|'수도세'|'인터넷'|'공용물품'`), `MaintenanceFeeItem` 인터페이스, `TenantFeeRow` 인터페이스, `Announcement` 인터페이스, `CATEGORY_META`(카테고리별 태그 배경/텍스트 색상 맵), `SINGLE_INSTANCE_CATEGORIES`(월 1건 카테고리 목록), `mockAnnouncements`, `mockExpenses`, `mockTenantFees`, `formatWon(n: number): string`, `formatDate(d: string | null): string` — 이후 모든 Task가 이 타입/함수/mock을 import해서 사용한다.

- [ ] **Step 1: 패키지 설치**

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
pnpm add lucide-react
```

- [ ] **Step 2: vitest 설정 작성**

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

`@vitejs/plugin-react`가 devDependencies에 없으면 추가 설치:

```bash
pnpm add -D @vitejs/plugin-react
```

`src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

`package.json`의 `scripts`에 추가:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: mock 데이터 파일 작성**

`src/components/mock/settlementMockData.ts`:

```ts
export type MaintenanceFeeCategory = "가스비" | "전기세" | "수도세" | "인터넷" | "공용물품";

export type ReceiptState = "uploaded" | "error" | "none";

export interface MaintenanceFeeItem {
  id: string;
  category: MaintenanceFeeCategory;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string | null;
  amount: number;
  memo: string;
  receiptState: ReceiptState;
}

export interface TenantFeeRow {
  id: string;
  name: string;
  start: string; // 'YYYY-MM-DD'
  end: string; // 'YYYY-MM-DD'
  days: number;
  fee: number; // 최종 관리비 (이미 계산된 mock 값)
}

export interface Announcement {
  id: string;
  title: string;
  text: string;
}

export const SINGLE_INSTANCE_CATEGORIES: MaintenanceFeeCategory[] = [
  "가스비",
  "전기세",
  "수도세",
  "인터넷",
];

export const CATEGORY_META: Record<MaintenanceFeeCategory, { bg: string; color: string }> = {
  가스비: { bg: "#fdece3", color: "#9a5b2e" },
  전기세: { bg: "#fef6da", color: "#8a6f10" },
  수도세: { bg: "#e2eef6", color: "#2f6690" },
  인터넷: { bg: "#ece7f6", color: "#5b4a91" },
  공용물품: { bg: "#eaf2ee", color: "#3d6b55" },
};

export const mockAnnouncements: Announcement[] = [
  {
    id: "ann-1",
    title: "정산 결과 안내",
    text: "이번 달 정산 결과는 7월 25일 이후에 게시될 예정이에요.",
  },
  {
    id: "ann-2",
    title: "세탁기 필터 교체 안내",
    text: "공용 세탁기 필터를 새로 교체했어요. 사용 후 꼭 전원을 꺼주세요!",
  },
  {
    id: "ann-3",
    title: "분리수거 안내",
    text: "분리수거는 매주 화요일, 금요일 저녁 8시에 진행돼요.",
  },
];

export const mockExpenses: MaintenanceFeeItem[] = [
  {
    id: "exp-1",
    category: "가스비",
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    amount: 68000,
    memo: "7월 도시가스 고지서",
    receiptState: "uploaded",
  },
  {
    id: "exp-2",
    category: "전기세",
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    amount: 92000,
    memo: "",
    receiptState: "error",
  },
  {
    id: "exp-3",
    category: "수도세",
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    amount: 41000,
    memo: "",
    receiptState: "uploaded",
  },
  {
    id: "exp-4",
    category: "인터넷",
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    amount: 39000,
    memo: "KT 인터넷+TV",
    receiptState: "uploaded",
  },
  {
    id: "exp-5",
    category: "공용물품",
    startDate: "2026-07-08",
    endDate: "2026-07-08",
    amount: 23400,
    memo: "주방세제, 휴지",
    receiptState: "uploaded",
  },
];

export const mockTenantFees: TenantFeeRow[] = [
  { id: "tenant-1", name: "김민준", start: "2026-07-01", end: "2026-07-31", days: 31, fee: 65467 },
  { id: "tenant-2", name: "이서연", start: "2026-07-01", end: "2026-07-18", days: 18, fee: 38017 },
  { id: "tenant-3", name: "박지훈", start: "2026-07-12", end: "2026-07-31", days: 20, fee: 42233 },
];

export function formatWon(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const [, month, day] = dateStr.split("-");
  return `${Number(month)}/${Number(day)}`;
}
```

**참고**: `mockTenantFees`의 `fee` 값은 디자인 파일의 `calcTenantFees` 로직(PRD 4장과 동일한 일할계산)을 실제로 이 세 입주자·다섯 관리비 항목에 대입해 계산한 근사값이다. 이번 작업은 계산 로직 자체를 구현하지 않으므로 정확한 원 단위 일치보다 "그럴듯한 정산액이 표시된다"가 중요하다 — 화면 검증 시 합계나 자릿수가 이상하지 않은지만 확인한다.

- [ ] **Step 4: mock 데이터 유틸 테스트 작성**

`src/components/mock/settlementMockData.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { formatWon, formatDate, mockExpenses, mockTenantFees } from "./settlementMockData";

describe("formatWon", () => {
  it("천단위 콤마와 '원'을 붙인다", () => {
    expect(formatWon(92000)).toBe("92,000원");
  });

  it("0원도 정상 표기한다", () => {
    expect(formatWon(0)).toBe("0원");
  });
});

describe("formatDate", () => {
  it("YYYY-MM-DD를 M/D로 변환한다", () => {
    expect(formatDate("2026-07-01")).toBe("7/1");
  });

  it("null이면 '-'를 반환한다", () => {
    expect(formatDate(null)).toBe("-");
  });
});

describe("mock 데이터 무결성", () => {
  it("관리비 항목 mock은 5개다", () => {
    expect(mockExpenses).toHaveLength(5);
  });

  it("입주자 mock은 3명이고 각 fee는 0보다 크다", () => {
    expect(mockTenantFees).toHaveLength(3);
    mockTenantFees.forEach((t) => expect(t.fee).toBeGreaterThan(0));
  });
});
```

- [ ] **Step 5: 테스트 실행 확인**

Run: `pnpm test`
Expected: PASS (6 tests)

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts src/test/setup.ts src/components/mock/
git commit -m "test: vitest+Testing Library 도입, 정산 화면 mock 데이터 추가"
```

---

### Task 2: IconButton 공용 컴포넌트

**Files:**
- Create: `src/components/ui/IconButton.tsx`
- Test: `src/components/ui/IconButton.test.tsx`

**Interfaces:**
- Consumes: `lucide-react`의 아이콘 컴포넌트 타입(`LucideIcon`)
- Produces: `IconButton` 컴포넌트 — `{ icon: LucideIcon; label: string; onClick?: () => void; variant?: 'neutral' | 'danger'; size?: number }` props. 이후 모든 편집/삭제/저장/취소 버튼이 이 컴포넌트를 사용한다.

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pencil } from "lucide-react";
import { IconButton } from "./IconButton";

describe("IconButton", () => {
  it("클릭하면 onClick이 호출된다", async () => {
    const onClick = vi.fn();
    render(<IconButton icon={Pencil} label="수정" onClick={onClick} />);
    await userEvent.click(screen.getByRole("button", { name: "수정" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("44x44 터치 타깃 클래스를 갖는다", () => {
    render(<IconButton icon={Pencil} label="수정" onClick={() => {}} />);
    const button = screen.getByRole("button", { name: "수정" });
    expect(button.className).toMatch(/min-w-\[44px\]/);
    expect(button.className).toMatch(/min-h-\[44px\]/);
  });

  it("variant='danger'면 레드 색상 클래스를 갖는다", () => {
    render(<IconButton icon={Pencil} label="삭제" onClick={() => {}} variant="danger" />);
    const button = screen.getByRole("button", { name: "삭제" });
    expect(button.className).toMatch(/text-\[#e0483c\]/);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test src/components/ui/IconButton.test.tsx`
Expected: FAIL (Cannot find module './IconButton')

- [ ] **Step 3: 최소 구현 작성**

```tsx
import type { LucideIcon } from "lucide-react";

interface IconButtonProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  variant?: "neutral" | "danger";
  size?: number;
}

/** CLAUDE.md 아이콘 규칙: 44x44 터치 타깃, 배경/테두리 없음. */
export function IconButton({ icon: Icon, label, onClick, variant = "neutral", size = 17 }: IconButtonProps) {
  const colorClass = variant === "danger" ? "text-[#e0483c]" : "text-[#6b6b62]";
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center border-none bg-transparent ${colorClass} cursor-pointer`}
    >
      <Icon width={size} height={size} />
    </button>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test src/components/ui/IconButton.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/IconButton.tsx src/components/ui/IconButton.test.tsx
git commit -m "feat: IconButton 공용 컴포넌트 추가"
```

---

### Task 3: Modal 공용 확인 다이얼로그 shell

**Files:**
- Create: `src/components/ui/Modal.tsx`
- Test: `src/components/ui/Modal.test.tsx`

**Interfaces:**
- Produces: `Modal` 컴포넌트 — `{ open: boolean; title: string; description: string; confirmLabel: string; cancelLabel?: string; onConfirm: () => void; onCancel: () => void; danger?: boolean }`. 게시/발송/삭제 확인 모달, "작성중인 행이 있어요" 알림 모두 이 컴포넌트를 재사용한다.

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("open=false면 렌더링되지 않는다", () => {
    render(
      <Modal
        open={false}
        title="삭제할까요?"
        description="설명"
        confirmLabel="삭제"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.queryByText("삭제할까요?")).not.toBeInTheDocument();
  });

  it("open=true면 title/description을 렌더링한다", () => {
    render(
      <Modal
        open={true}
        title="삭제할까요?"
        description="이 항목이 삭제돼요."
        confirmLabel="삭제"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText("삭제할까요?")).toBeInTheDocument();
    expect(screen.getByText("이 항목이 삭제돼요.")).toBeInTheDocument();
  });

  it("확인 버튼 클릭 시 onConfirm이 호출된다", async () => {
    const onConfirm = vi.fn();
    render(
      <Modal
        open={true}
        title="t"
        description="d"
        confirmLabel="삭제"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "삭제" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("취소 버튼 클릭 시 onCancel이 호출된다", async () => {
    const onCancel = vi.fn();
    render(
      <Modal
        open={true}
        title="t"
        description="d"
        confirmLabel="삭제"
        onConfirm={() => {}}
        onCancel={onCancel}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test src/components/ui/Modal.test.tsx`
Expected: FAIL (Cannot find module './Modal')

- [ ] **Step 3: 최소 구현 작성**

```tsx
interface ModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function Modal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "취소",
  onConfirm,
  onCancel,
  danger = false,
}: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(20,22,18,0.45)]">
      <div className="w-[340px] rounded-xl bg-white p-7 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        <div className="mb-2 text-base font-bold text-[#1a1a1a]">{title}</div>
        <div className="mb-5 text-[13px] leading-relaxed text-[#6b6b62]">{description}</div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-md border border-[#e3e1db] bg-white px-4 py-2 text-[13px] text-[#37352f]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`cursor-pointer rounded-md border-none px-4 py-2 text-[13px] font-semibold text-white ${
              danger ? "bg-[#c0433a]" : "bg-[#2f6f52]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test src/components/ui/Modal.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Modal.tsx src/components/ui/Modal.test.tsx
git commit -m "feat: Modal 공용 확인 다이얼로그 추가"
```

---

### Task 4: Sidebar 레이아웃 컴포넌트

**Files:**
- Create: `src/components/layout/Sidebar.tsx`
- Test: `src/components/layout/Sidebar.test.tsx`

**Interfaces:**
- Produces: `Sidebar` 컴포넌트 — `{ open: boolean; onToggle: () => void; variant: 'desktop' | 'overlay' }`. `variant='desktop'`이면 in-flow(항상 보임, lg 이상), `variant='overlay'`이면 태블릿/모바일에서 드로어+백드롭으로 렌더링.

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
  it("'관리비 정산' 활성 메뉴와 '입주자 관리' 링크를 렌더링한다", () => {
    render(<Sidebar open={true} onToggle={() => {}} variant="desktop" />);
    expect(screen.getByText("관리비 정산")).toBeInTheDocument();
    expect(screen.getByText("입주자 관리")).toBeInTheDocument();
  });

  it("variant='overlay'이고 open=false면 렌더링하지 않는다", () => {
    render(<Sidebar open={false} onToggle={() => {}} variant="overlay" />);
    expect(screen.queryByText("관리비 정산")).not.toBeInTheDocument();
  });

  it("variant='overlay'이고 open=true면 백드롭 클릭 시 onToggle이 호출된다", async () => {
    const onToggle = vi.fn();
    render(<Sidebar open={true} onToggle={onToggle} variant="overlay" />);
    await userEvent.click(screen.getByTestId("sidebar-backdrop"));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("햄버거 버튼 클릭 시 onToggle이 호출된다", async () => {
    const onToggle = vi.fn();
    render(<Sidebar open={true} onToggle={onToggle} variant="desktop" />);
    await userEvent.click(screen.getByRole("button", { name: /메뉴/ }));
    expect(onToggle).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test src/components/layout/Sidebar.test.tsx`
Expected: FAIL (Cannot find module './Sidebar')

- [ ] **Step 3: 최소 구현 작성**

```tsx
interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  variant: "desktop" | "overlay";
}

/** 사이드바. "입주자 관리" 링크는 UI로만 존재하고 클릭 동작 없음(이번 이식 범위 밖 화면). */
export function Sidebar({ open, onToggle, variant }: SidebarProps) {
  const toggleLabel = open ? "메뉴 닫기" : "메뉴 열기";

  const content = (
    <div className="flex h-full w-[230px] flex-shrink-0 flex-col gap-0.5 bg-[#fbfbfa] px-3.5 pt-3 pb-6">
      <div className="mb-2.5 flex items-center px-2.5">
        <button
          type="button"
          aria-label={toggleLabel}
          onClick={onToggle}
          className="-ml-3.5 flex min-h-[44px] min-w-[44px] items-center justify-center border-none bg-transparent text-2xl text-[#6b6b62]"
        >
          ☰
        </button>
      </div>
      <div className="mb-4 flex items-center gap-2 px-2.5 font-bold text-[#1a1a1a]">
        <span className="h-[18px] w-[18px] flex-shrink-0 rounded-[5px] bg-[#2f6f52]" />
        <span className="text-lg">하운 쉐어하우스</span>
      </div>
      <div className="flex items-center gap-2 rounded-md bg-[#eaf2ee] px-2.5 py-2 font-bold text-[#2f6f52]">
        <span className="w-[18px] flex-shrink-0 text-center">📊</span>
        관리비 정산
      </div>
      <a
        href="#"
        className="flex items-center gap-2 rounded-md px-2.5 py-2 font-medium text-[#6b6b62] no-underline"
      >
        <span className="w-[18px] flex-shrink-0 text-center">🏠</span>
        입주자 관리
      </a>
    </div>
  );

  if (variant === "desktop") {
    return <div className="hidden border-r border-[#edece9] lg:block">{content}</div>;
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 bg-[rgba(20,22,18,0.45)]" data-testid="sidebar-backdrop" onClick={onToggle}>
      <div
        className="h-full shadow-[2px_0_16px_rgba(0,0,0,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test src/components/layout/Sidebar.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Sidebar.tsx src/components/layout/Sidebar.test.tsx
git commit -m "feat: Sidebar 레이아웃 컴포넌트 추가 (데스크톱 in-flow / 태블릿·모바일 드로어)"
```

---

### Task 5: SettlementHeader (타이틀 + 월 선택 + 게시/발송 버튼)

**Files:**
- Create: `src/components/layout/SettlementHeader.tsx`
- Test: `src/components/layout/SettlementHeader.test.tsx`

**Interfaces:**
- Consumes: 없음 (자체 로컬 state로 게시/발송/월 선택 시뮬레이션)
- Produces: `SettlementHeader` 컴포넌트 — `{ monthLabel: string; onMenuToggle: () => void }` props. 내부에서 `published`(boolean), `sent`(boolean), `showPublishConfirm`, `showSendModal`, `sendTooltip` 상태를 관리한다. 게시 전에는 발송 버튼이 비활성(hover 시 툴팁 "게시 후 발송할 수 있습니다"), 게시 확인/발송 확인은 Task 3의 `Modal`을 재사용한다.

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettlementHeader } from "./SettlementHeader";

describe("SettlementHeader", () => {
  it("초기 상태에서 '게시하기 전' 배지와 비활성 발송 버튼을 보여준다", () => {
    render(<SettlementHeader monthLabel="2026년 7월" onMenuToggle={() => {}} />);
    expect(screen.getByText("게시하기 전")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "정산 결과 발송" })).toBeDisabled();
  });

  it("게시 전 발송 버튼 클릭 시 '게시 후 발송할 수 있습니다' 안내가 뜬다", async () => {
    render(<SettlementHeader monthLabel="2026년 7월" onMenuToggle={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: "정산 결과 발송" }));
    expect(await screen.findByText("게시 후 발송할 수 있습니다")).toBeInTheDocument();
  });

  it("게시 버튼 클릭 → 확인 모달에서 확인 누르면 '게시 중' 상태로 바뀐다", async () => {
    render(<SettlementHeader monthLabel="2026년 7월" onMenuToggle={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: "게시하기 전" }));
    await userEvent.click(screen.getByRole("button", { name: "게시하기" }));
    expect(screen.getByText("게시 중")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "정산 결과 발송" })).not.toBeDisabled();
  });

  it("게시 후 발송 확인 모달에서 확인하면 '발송 완료'로 바뀐다", async () => {
    render(<SettlementHeader monthLabel="2026년 7월" onMenuToggle={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: "게시하기 전" }));
    await userEvent.click(screen.getByRole("button", { name: "게시하기" }));
    await userEvent.click(screen.getByRole("button", { name: "정산 결과 발송" }));
    await userEvent.click(screen.getByRole("button", { name: "발송하기" }));
    expect(screen.getByText("✓ 발송 완료")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test src/components/layout/SettlementHeader.test.tsx`
Expected: FAIL (Cannot find module './SettlementHeader')

- [ ] **Step 3: 최소 구현 작성**

```tsx
"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface SettlementHeaderProps {
  monthLabel: string;
  onMenuToggle: () => void;
}

/** 정산월 헤더: 게시/발송 상태는 이 컴포넌트 로컬 state로만 시뮬레이션한다(Supabase 미연동). */
export function SettlementHeader({ monthLabel, onMenuToggle }: SettlementHeaderProps) {
  const [published, setPublished] = useState(false);
  const [sent, setSent] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendHint, setSendHint] = useState(false);

  const handleSendClick = () => {
    if (!published) {
      setSendHint(true);
      setTimeout(() => setSendHint(false), 1100);
      return;
    }
    setShowSendModal(true);
  };

  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-[#e3e1db] bg-white px-6 py-4 lg:px-6">
      <button
        type="button"
        aria-label="메뉴 열기"
        onClick={onMenuToggle}
        className="flex min-h-[44px] min-w-[44px] items-center justify-center border-none bg-transparent text-2xl text-[#6b6b62] lg:hidden"
      >
        ☰
      </button>
      <div className="text-2xl font-bold whitespace-nowrap text-[#1a1a1a]">관리비 정산</div>
      <select
        defaultValue={monthLabel}
        className="h-[35px] rounded-md border border-[#e3e1db] bg-white px-3 text-[13px] font-semibold text-[#1a1a1a]"
      >
        <option>{monthLabel}</option>
      </select>
      <div className="flex-1" />
      <a
        href="#"
        className="inline-flex h-[35px] items-center gap-1 rounded-md border border-[#d8d5cc] px-4 text-[13px] font-semibold text-[#37352f] no-underline"
      >
        입주자용 페이지로 이동
        <ExternalLink width={13} height={13} />
      </a>
      <button
        type="button"
        onClick={() => setShowPublishConfirm(true)}
        className={`inline-flex h-[35px] cursor-pointer items-center gap-1.5 rounded-md border-none px-4 text-[13px] font-bold ${
          published ? "bg-[#eaf2ee] text-[#2f6f52]" : "bg-[#2f6f52] text-white"
        }`}
      >
        {published ? "게시 중" : "게시하기 전"}
      </button>
      <div className="relative">
        <button
          type="button"
          disabled={!published}
          onClick={handleSendClick}
          onMouseEnter={() => !published && setSendHint(true)}
          onMouseLeave={() => setSendHint(false)}
          className={`h-[35px] rounded-md border-none px-4 text-[13px] font-bold whitespace-nowrap ${
            published
              ? sent
                ? "cursor-pointer bg-[#eaf2ee] text-[#2f6f52]"
                : "cursor-pointer bg-[#1a1a1a] text-white"
              : "cursor-not-allowed bg-[#e2e0d8] text-[#a8a89c]"
          }`}
        >
          {sent ? "✓ 발송 완료" : "정산 결과 발송"}
        </button>
        {sendHint && (
          <div className="absolute top-[calc(100%+6px)] right-0 z-20 rounded-md bg-[#1c231f] px-2.5 py-1.5 text-xs whitespace-nowrap text-white">
            게시 후 발송할 수 있습니다
          </div>
        )}
      </div>

      <Modal
        open={showPublishConfirm}
        title={published ? "게시를 취소할까요?" : "관리비 정산을 게시할까요?"}
        description={
          published
            ? "입주자용 페이지에서 이번 달 정산 결과가 더 이상 보이지 않아요."
            : "입주자용 페이지에 이번 달 관리비 정산 결과가 공개돼요."
        }
        confirmLabel={published ? "게시 취소하기" : "게시하기"}
        onConfirm={() => {
          setPublished((p) => !p);
          setShowPublishConfirm(false);
        }}
        onCancel={() => setShowPublishConfirm(false)}
      />

      <Modal
        open={showSendModal}
        title="정산 결과를 발송할까요?"
        description="입주자들에게 이번 달 관리비 정산 결과 알림이 발송돼요."
        confirmLabel="발송하기"
        onConfirm={() => {
          setSent(true);
          setShowSendModal(false);
        }}
        onCancel={() => setShowSendModal(false)}
      />
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test src/components/layout/SettlementHeader.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/SettlementHeader.tsx src/components/layout/SettlementHeader.test.tsx
git commit -m "feat: SettlementHeader 컴포넌트 추가 (게시/발송 상태 토글)"
```

---

### Task 6: LoginGate 컴포넌트

**Files:**
- Create: `src/components/layout/LoginGate.tsx`
- Test: `src/components/layout/LoginGate.test.tsx`

**Interfaces:**
- Produces: `LoginGate` 컴포넌트 — `{ visible: boolean }` props. `visible=true`일 때 풀스크린 오버레이로 로그인 안내 문구와 "Google로 로그인" 버튼(클릭 동작 없음)을 렌더링. 페이지 컴포넌트(Task 12)에서 기본값 `visible={false}`로 사용해 다른 화면들을 바로 확인할 수 있게 한다.

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoginGate } from "./LoginGate";

describe("LoginGate", () => {
  it("visible=false면 렌더링하지 않는다", () => {
    render(<LoginGate visible={false} />);
    expect(screen.queryByText("로그인이 필요해요")).not.toBeInTheDocument();
  });

  it("visible=true면 로그인 안내와 Google 로그인 버튼을 보여준다", () => {
    render(<LoginGate visible={true} />);
    expect(screen.getByText("로그인이 필요해요")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Google로 로그인" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test src/components/layout/LoginGate.test.tsx`
Expected: FAIL (Cannot find module './LoginGate')

- [ ] **Step 3: 최소 구현 작성**

```tsx
interface LoginGateProps {
  visible: boolean;
}

/** 로그인 게이트 화면. 실제 인증/OAuth는 이번 범위 밖 — 버튼 클릭 동작 없음. */
export function LoginGate({ visible }: LoginGateProps) {
  if (!visible) return null;
  return (
    <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center gap-3.5 bg-white p-10 text-center">
      <div className="h-10 w-10 rounded-[10px] bg-[#2f6f52]" />
      <div className="text-lg font-bold text-[#1a1a1a]">로그인이 필요해요</div>
      <div className="text-[13px] leading-relaxed text-[#6b6b62]">
        이 페이지는 구글 로그인 후에 이용할 수 있어요.
        <br />
        로그인하면 원래 보려던 페이지로 이동해요.
      </div>
      <button
        type="button"
        className="cursor-pointer rounded-lg border border-[#d8d5cc] bg-white px-5 py-2.5 text-[13.5px] font-semibold text-[#37352f]"
      >
        Google로 로그인
      </button>
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test src/components/layout/LoginGate.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/LoginGate.tsx src/components/layout/LoginGate.test.tsx
git commit -m "feat: LoginGate 화면 컴포넌트 추가"
```

---

### Task 7: DateRangePopover (버튼+팝오버 캘린더)

**Files:**
- Create: `src/components/settlement/DateRangePopover.tsx`
- Test: `src/components/settlement/DateRangePopover.test.tsx`

**Interfaces:**
- Produces: `DateRangePopover` 컴포넌트 — `{ value: string | null; onChange: (date: string) => void; placeholder: string; anchor: 'left' | 'right'; allowClear?: boolean; onClear?: () => void }`. CLAUDE.md 규칙에 따라 시작일은 `anchor='left'`, 종료일은 `anchor='right'`로 앵커링. Task 10(`ExpenseTable`)에서 재사용.

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateRangePopover } from "./DateRangePopover";

describe("DateRangePopover", () => {
  it("value가 없으면 placeholder를 버튼 라벨로 보여준다", () => {
    render(
      <DateRangePopover value={null} onChange={() => {}} placeholder="시작일 선택" anchor="left" />,
    );
    expect(screen.getByRole("button", { name: "시작일 선택" })).toBeInTheDocument();
  });

  it("value가 있으면 YYYY.MM.DD 형식으로 보여준다", () => {
    render(
      <DateRangePopover
        value="2026-07-15"
        onChange={() => {}}
        placeholder="시작일 선택"
        anchor="left"
      />,
    );
    expect(screen.getByRole("button", { name: "2026.07.15" })).toBeInTheDocument();
  });

  it("버튼 클릭 시 캘린더 팝오버가 열린다", async () => {
    render(
      <DateRangePopover value={null} onChange={() => {}} placeholder="시작일 선택" anchor="left" />,
    );
    await userEvent.click(screen.getByRole("button", { name: "시작일 선택" }));
    expect(screen.getByText("일")).toBeInTheDocument(); // 요일 헤더
  });

  it("날짜 셀 클릭 시 onChange가 선택한 날짜로 호출된다", async () => {
    const onChange = vi.fn();
    render(
      <DateRangePopover value="2026-07-01" onChange={onChange} placeholder="시작일 선택" anchor="left" />,
    );
    await userEvent.click(screen.getByRole("button", { name: "2026.07.01" }));
    await userEvent.click(screen.getByText("15"));
    expect(onChange).toHaveBeenCalledWith("2026-07-15");
  });

  it("allowClear=true이면 '제거하기' 버튼이 있고 클릭 시 onClear가 호출된다", async () => {
    const onClear = vi.fn();
    render(
      <DateRangePopover
        value="2026-07-15"
        onChange={() => {}}
        placeholder="종료일 선택"
        anchor="right"
        allowClear
        onClear={onClear}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "2026.07.15" }));
    await userEvent.click(screen.getByRole("button", { name: "제거하기" }));
    expect(onClear).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test src/components/settlement/DateRangePopover.test.tsx`
Expected: FAIL (Cannot find module './DateRangePopover')

- [ ] **Step 3: 최소 구현 작성**

```tsx
"use client";

import { useState } from "react";

interface DateRangePopoverProps {
  value: string | null;
  onChange: (date: string) => void;
  placeholder: string;
  anchor: "left" | "right";
  allowClear?: boolean;
  onClear?: () => void;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * 버튼+팝오버 캘린더. CLAUDE.md 규칙: 날짜 범위 입력은 항상 이 컴포넌트로 통일,
 * 팝오버는 트리거 기준 left:0(시작일)/right:0(종료일)로 앵커링해 가장자리 잘림 방지.
 */
export function DateRangePopover({
  value,
  onChange,
  placeholder,
  anchor,
  allowClear = false,
  onClear,
}: DateRangePopoverProps) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => (value ?? new Date().toISOString().slice(0, 10)).slice(0, 7));

  const label = value ? value.replaceAll("-", ".") : placeholder;
  const [year, month] = viewMonth.split("-").map(Number);
  const firstDow = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells: { day: number; dateStr: string | null }[] = [];
  for (let i = 0; i < firstDow; i++) cells.push({ day: 0, dateStr: null });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, dateStr: `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
  }

  const anchorClass = anchor === "left" ? "left-0" : "right-0";

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="h-[30px] cursor-pointer rounded-md border border-[#e3e1db] bg-white px-2 text-center text-[13px] text-[#1a1a1a]"
      >
        {label}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[150]" onClick={() => setOpen(false)} />
          <div
            className={`absolute top-[34px] ${anchorClass} z-[200] w-[236px] rounded-2xl bg-white p-4 text-left shadow-[0_20px_50px_rgba(0,0,0,0.25)]`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[15px] font-bold text-[#1a1a1a]">
                {year}년 {month}월
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label="이전 달"
                  onClick={() => {
                    const d = new Date(year, month - 2, 1);
                    setViewMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
                  }}
                  className="cursor-pointer border-none bg-transparent text-[#37352f]"
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label="다음 달"
                  onClick={() => {
                    const d = new Date(year, month, 1);
                    setViewMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
                  }}
                  className="cursor-pointer border-none bg-transparent text-[#37352f]"
                >
                  ↓
                </button>
              </div>
            </div>
            <div className="mb-1 grid grid-cols-7 gap-0.5">
              {WEEKDAYS.map((wd) => (
                <div key={wd} className="py-0.5 text-center text-[11px] font-semibold text-[#a8a89c]">
                  {wd}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((c, i) =>
                c.dateStr ? (
                  <button
                    key={c.dateStr}
                    type="button"
                    onClick={() => {
                      onChange(c.dateStr!);
                      setOpen(false);
                    }}
                    className={`rounded-lg py-1.5 text-center text-[12.5px] ${
                      c.dateStr === value ? "bg-[#2f6f52] font-bold text-white" : "cursor-pointer text-[#37352f]"
                    }`}
                  >
                    {c.day}
                  </button>
                ) : (
                  <div key={`empty-${i}`} />
                ),
              )}
            </div>
            {allowClear && (
              <div className="mt-2.5 border-t border-[#edece9] pt-2.5 text-center">
                <button
                  type="button"
                  onClick={() => {
                    onClear?.();
                    setOpen(false);
                  }}
                  className="cursor-pointer border-none bg-transparent text-[12.5px] text-[#9b9a97] underline"
                >
                  제거하기
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test src/components/settlement/DateRangePopover.test.tsx`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/settlement/DateRangePopover.tsx src/components/settlement/DateRangePopover.test.tsx
git commit -m "feat: DateRangePopover 날짜 범위 선택 컴포넌트 추가"
```

---

### Task 8: Toast 컴포넌트

**Files:**
- Create: `src/components/ui/Toast.tsx`
- Test: `src/components/ui/Toast.test.tsx`

**Interfaces:**
- Produces: `Toast` 컴포넌트 — `{ message: string; variant: 'warning' | 'info' }`. `ToastStack` 컴포넌트 — `{ toasts: { id: string; message: string; variant: 'warning' | 'info' }[] }`, 상단 중앙 고정 스택 렌더링. Task 9/10에서 유효성 검증 실패·업로드 실패 안내에 사용.

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Toast, ToastStack } from "./Toast";

describe("Toast", () => {
  it("warning variant는 레드 배경 클래스를 갖는다", () => {
    render(<Toast message="카테고리를 선택해주세요" variant="warning" />);
    const el = screen.getByText("카테고리를 선택해주세요");
    expect(el.className).toMatch(/bg-\[#c0433a\]/);
  });

  it("info variant는 다크 배경 클래스를 갖는다", () => {
    render(<Toast message="이미지로 저장했어요" variant="info" />);
    const el = screen.getByText("이미지로 저장했어요");
    expect(el.className).toMatch(/bg-\[#1c231f\]/);
  });
});

describe("ToastStack", () => {
  it("여러 토스트를 순서대로 렌더링한다", () => {
    render(
      <ToastStack
        toasts={[
          { id: "1", message: "첫번째", variant: "warning" },
          { id: "2", message: "두번째", variant: "info" },
        ]}
      />,
    );
    expect(screen.getByText("첫번째")).toBeInTheDocument();
    expect(screen.getByText("두번째")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test src/components/ui/Toast.test.tsx`
Expected: FAIL (Cannot find module './Toast')

- [ ] **Step 3: 최소 구현 작성**

```tsx
interface ToastProps {
  message: string;
  variant: "warning" | "info";
}

export function Toast({ message, variant }: ToastProps) {
  const bgClass = variant === "warning" ? "bg-[#c0433a]" : "bg-[#1c231f]";
  return (
    <div className={`rounded-lg ${bgClass} px-5 py-3 text-[13px] whitespace-nowrap text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)]`}>
      {message}
    </div>
  );
}

interface ToastStackProps {
  toasts: { id: string; message: string; variant: "warning" | "info" }[];
}

export function ToastStack({ toasts }: ToastStackProps) {
  return (
    <div className="fixed top-6 left-1/2 z-[1200] flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} variant={t.variant} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test src/components/ui/Toast.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Toast.tsx src/components/ui/Toast.test.tsx
git commit -m "feat: Toast/ToastStack 컴포넌트 추가"
```

---

### Task 9: AnnouncementSection (공지사항 — 드래그 정렬, 편집/삭제/추가)

**Files:**
- Create: `src/components/settlement/AnnouncementSection.tsx`
- Test: `src/components/settlement/AnnouncementSection.test.tsx`

**Interfaces:**
- Consumes: `Announcement` 타입, `mockAnnouncements`(Task 1), `IconButton`(Task 2), `Modal`(Task 3)
- Produces: `AnnouncementSection` 컴포넌트 — props 없음(내부에서 `mockAnnouncements`로 초기화). 드래그 정렬은 시각적 순서 변경만 구현(실제 저장 API 없음).

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnnouncementSection } from "./AnnouncementSection";

describe("AnnouncementSection", () => {
  it("mock 공지사항 3개를 렌더링한다", () => {
    render(<AnnouncementSection />);
    expect(screen.getByText("정산 결과 안내")).toBeInTheDocument();
    expect(screen.getByText("세탁기 필터 교체 안내")).toBeInTheDocument();
    expect(screen.getByText("분리수거 안내")).toBeInTheDocument();
  });

  it("'+ 추가' 클릭 시 제목/본문 입력 폼이 나타난다", async () => {
    render(<AnnouncementSection />);
    await userEvent.click(screen.getByRole("button", { name: "+ 추가" }));
    expect(screen.getByPlaceholderText("제목")).toBeInTheDocument();
  });

  it("제목 없이 저장 시도하면 경고가 뜨고 항목이 추가되지 않는다", async () => {
    render(<AnnouncementSection />);
    await userEvent.click(screen.getByRole("button", { name: "+ 추가" }));
    await userEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(await screen.findByText("제목을 입력해주세요")).toBeInTheDocument();
  });

  it("제목/본문 입력 후 저장하면 리스트에 새 항목이 추가된다", async () => {
    render(<AnnouncementSection />);
    await userEvent.click(screen.getByRole("button", { name: "+ 추가" }));
    await userEvent.type(screen.getByPlaceholderText("제목"), "새 공지");
    await userEvent.type(screen.getByPlaceholderText("어떤 내용을 공지할까요?"), "본문 내용");
    await userEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(screen.getByText("새 공지")).toBeInTheDocument();
  });

  it("삭제 아이콘 클릭 → 확인 모달에서 삭제 확정하면 항목이 사라진다", async () => {
    render(<AnnouncementSection />);
    const deleteButtons = screen.getAllByRole("button", { name: "삭제" });
    await userEvent.click(deleteButtons[0]);
    await userEvent.click(screen.getByRole("button", { name: "삭제", exact: true }));
    expect(screen.queryByText("정산 결과 안내")).not.toBeInTheDocument();
  });
});
```

**참고**: 마지막 테스트에서 "삭제" 버튼이 IconButton(리스트 행)과 Modal 확인 버튼 둘 다에 존재해 이름이 겹칠 수 있다 — 구현 시 `IconButton`의 `label`을 "공지사항 삭제"처럼 더 구체적으로 지정하거나, 테스트에서 `within()`으로 범위를 좁힌다. 아래 구현에서는 `label="삭제"`를 유지하되 테스트를 `getAllByRole` 인덱스 접근 후 모달 쪽은 `screen.getByRole('button', {name: '삭제'})`가 모달 열림 이후엔 유일해지도록(리스트가 아직 안 지워졌으므로 모달 쪽 버튼과 구분되게) `within(screen.getByRole('dialog'))`를 쓰지 않는 대신, `Modal`에 `role="dialog"`를 추가하지 않았으므로 구현체에서 IconButton label을 `"공지사항 삭제"`로 명확히 짓는다. 최소 구현에 이를 반영한다.

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test src/components/settlement/AnnouncementSection.test.tsx`
Expected: FAIL (Cannot find module './AnnouncementSection')

- [ ] **Step 3: 최소 구현 작성**

```tsx
"use client";

import { useState } from "react";
import { Pencil, Trash2, Check, X, GripVertical } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { Modal } from "@/components/ui/Modal";
import { ToastStack } from "@/components/ui/Toast";
import { mockAnnouncements, type Announcement } from "@/components/mock/settlementMockData";

/** 공지사항 섹션: 드래그 정렬(시각적 순서 변경만), 편집/삭제/추가 UI. Supabase 미연동. */
export function AnnouncementSection() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncements);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [warning, setWarning] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const showWarning = (msg: string) => {
    setWarning(msg);
    setTimeout(() => setWarning(null), 1500);
  };

  const openAdd = () => {
    setAdding(true);
    setEditingId(null);
    setTitle("");
    setText("");
  };

  const startEdit = (a: Announcement) => {
    setEditingId(a.id);
    setAdding(false);
    setTitle(a.title);
    setText(a.text);
  };

  const closeForm = () => {
    setAdding(false);
    setEditingId(null);
  };

  const save = () => {
    if (!title.trim()) {
      showWarning("제목을 입력해주세요");
      return;
    }
    if (!text.trim()) return;
    if (editingId) {
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === editingId ? { ...a, title: title.trim(), text: text.trim() } : a)),
      );
    } else {
      setAnnouncements((prev) => [...prev, { id: `ann-${Date.now()}`, title: title.trim(), text: text.trim() }]);
    }
    closeForm();
  };

  const requestDelete = (id: string) => setPendingDeleteId(id);
  const confirmDelete = () => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== pendingDeleteId));
    setPendingDeleteId(null);
  };

  const reorder = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    setAnnouncements((prev) => {
      const arr = [...prev];
      const from = arr.findIndex((a) => a.id === dragId);
      const to = arr.findIndex((a) => a.id === targetId);
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return arr;
    });
    setDragId(null);
  };

  const pendingDeleteItem = announcements.find((a) => a.id === pendingDeleteId);

  return (
    <div className="border-b border-[#edece9] pb-6">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="text-xl font-bold whitespace-nowrap text-[#1a1a1a]">📌 공지사항</div>
          <div className="text-[11px] whitespace-nowrap text-[#b3b2ab]">드래그해서 순서를 바꿔보세요</div>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="cursor-pointer rounded-md border border-[#cfe4da] bg-white px-4 py-2 text-[13px] font-bold text-[#2f6f52]"
        >
          + 추가
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {announcements.map((a) => (
          <div
            key={a.id}
            draggable
            onDragStart={() => setDragId(a.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => reorder(a.id)}
            className="flex items-center gap-2.5 rounded-2xl bg-[#fdf3e2] p-3.5 px-4"
          >
            {editingId === a.id ? (
              <div className="flex flex-1 items-start gap-2.5">
                <div className="flex flex-1 flex-col gap-1.5">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="제목"
                    className="h-8 rounded-md border border-[#e3e1db] bg-white px-2.5 text-[15px] font-bold"
                  />
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="어떤 내용을 공지할까요?"
                    rows={2}
                    className="rounded-md border border-[#e3e1db] bg-white px-2.5 py-1.5 text-[13px]"
                  />
                </div>
                <IconButton icon={Check} label="저장" onClick={save} />
                <IconButton icon={X} label="취소" onClick={closeForm} />
              </div>
            ) : (
              <>
                <span className="text-[13px] text-[#c7ab7a]" aria-hidden>
                  <GripVertical width={16} height={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-[#1a1a1a]">{a.title}</div>
                  <div className="mt-1 text-[13px] leading-relaxed text-[#5c5646]">{a.text}</div>
                </div>
                <IconButton icon={Pencil} label="공지사항 수정" onClick={() => startEdit(a)} />
                <IconButton icon={Trash2} label="공지사항 삭제" variant="danger" onClick={() => requestDelete(a.id)} />
              </>
            )}
          </div>
        ))}

        {adding && (
          <div className="flex flex-col gap-2 rounded-2xl border border-[#e3e1db] bg-[#fafaf8] p-3.5 px-4">
            <div className="flex items-start gap-2.5">
              <div className="flex flex-1 flex-col gap-1.5">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="제목"
                  className="h-8 rounded-md border border-[#e3e1db] bg-white px-2.5 text-[15px] font-bold"
                />
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="어떤 내용을 공지할까요?"
                  rows={2}
                  className="rounded-md border border-[#e3e1db] bg-white px-2.5 py-1.5 text-[13px]"
                />
              </div>
              <IconButton icon={Check} label="저장" onClick={save} />
              <IconButton icon={X} label="취소" onClick={closeForm} />
            </div>
          </div>
        )}
      </div>

      <Modal
        open={pendingDeleteId !== null}
        title="공지사항을 삭제할까요?"
        description={`'${pendingDeleteItem?.text.slice(0, 10) ?? ""}${(pendingDeleteItem?.text.length ?? 0) > 10 ? "..." : ""}' 공지사항이 삭제돼요.`}
        confirmLabel="삭제"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
        danger
      />

      {warning && <ToastStack toasts={[{ id: "warn", message: warning, variant: "warning" }]} />}
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

테스트 중 "저장" 버튼 이름 충돌(공지 편집의 IconButton label="저장" vs 없음)이나 "삭제" 버튼 충돌(리스트의 `공지사항 삭제` vs 모달의 `삭제`)이 없는지 실행 결과로 확인한다.

Run: `pnpm test src/components/settlement/AnnouncementSection.test.tsx`
Expected: PASS (5 tests) — 만약 label 충돌로 실패하면 Step 1의 테스트에서 `screen.getAllByRole("button", { name: "삭제" })`를 `screen.getAllByRole("button", { name: "공지사항 삭제" })`로, 마지막 확인 클릭은 `screen.getByRole("button", { name: "삭제", exact: true })`로 정확히 구분되게 수정한다.

- [ ] **Step 5: Commit**

```bash
git add src/components/settlement/AnnouncementSection.tsx src/components/settlement/AnnouncementSection.test.tsx
git commit -m "feat: AnnouncementSection 공지사항 섹션 추가 (드래그 정렬, 편집/삭제/추가)"
```

---

### Task 10: ExpenseTable (이번달 관리비 — 편집/삭제/추가, empty state, 영수증 상태)

**Files:**
- Create: `src/components/settlement/ExpenseTable.tsx`
- Test: `src/components/settlement/ExpenseTable.test.tsx`

**Interfaces:**
- Consumes: `MaintenanceFeeItem`, `mockExpenses`, `CATEGORY_META`, `SINGLE_INSTANCE_CATEGORIES`, `formatWon`, `formatDate`(Task 1), `IconButton`(Task 2), `Modal`(Task 3), `DateRangePopover`(Task 7), `ToastStack`(Task 8)
- Produces: `ExpenseTable` 컴포넌트 — props 없음(내부에서 `mockExpenses`로 초기화). 데스크톱은 `<table>`, 모바일은 카드 리스트로 반응형 전환(같은 컴포넌트 내 `md:hidden`/`hidden md:block` 분기).

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExpenseTable } from "./ExpenseTable";

describe("ExpenseTable", () => {
  it("mock 관리비 5건과 합계를 렌더링한다", () => {
    render(<ExpenseTable />);
    expect(screen.getAllByText("전기세").length).toBeGreaterThan(0);
    expect(screen.getAllByText("263,400원").length).toBeGreaterThan(0);
  });

  it("업로드 실패 항목은 '업로드 실패' 텍스트를 보여준다", () => {
    render(<ExpenseTable />);
    expect(screen.getAllByText("업로드 실패").length).toBeGreaterThan(0);
  });

  it("'+ 추가' 클릭 시 이미 입력된 월 1건 카테고리는 선택 불가로 표시된다", async () => {
    render(<ExpenseTable />);
    await userEvent.click(screen.getAllByRole("button", { name: "+ 추가" })[0]);
    const select = screen.getAllByRole("combobox")[0];
    const gasOption = Array.from(select.querySelectorAll("option")).find((o) =>
      o.textContent?.includes("가스비"),
    );
    expect(gasOption?.textContent).toContain("입력됨");
    expect((gasOption as HTMLOptionElement).disabled).toBe(true);
  });

  it("금액 없이 저장하면 경고가 뜨고 항목이 추가되지 않는다", async () => {
    render(<ExpenseTable />);
    const before = screen.getAllByRole("row").length;
    await userEvent.click(screen.getAllByRole("button", { name: "+ 추가" })[0]);
    const categorySelect = screen.getAllByRole("combobox")[0];
    await userEvent.selectOptions(categorySelect, "공용물품");
    await userEvent.click(screen.getAllByRole("button", { name: "저장" })[0]);
    expect(await screen.findByText("금액을 입력해주세요")).toBeInTheDocument();
    expect(screen.getAllByRole("row").length).toBe(before);
  });

  it("행 삭제 확인 시 실행취소 토스트가 뜨고, 실행취소하면 복원된다", async () => {
    render(<ExpenseTable />);
    await userEvent.click(screen.getAllByRole("button", { name: "관리비 항목 삭제" })[0]);
    await userEvent.click(screen.getByRole("button", { name: "삭제", exact: true }));
    expect(await screen.findByText(/행을 삭제했어요/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("link", { name: "실행취소" }));
    expect(screen.getAllByText("가스비").length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test src/components/settlement/ExpenseTable.test.tsx`
Expected: FAIL (Cannot find module './ExpenseTable')

- [ ] **Step 3: 최소 구현 작성**

```tsx
"use client";

import { useState } from "react";
import { Pencil, Trash2, Check, X, Download } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { Modal } from "@/components/ui/Modal";
import { ToastStack } from "@/components/ui/Toast";
import { DateRangePopover } from "@/components/settlement/DateRangePopover";
import {
  mockExpenses,
  CATEGORY_META,
  SINGLE_INSTANCE_CATEGORIES,
  formatWon,
  formatDate,
  type MaintenanceFeeItem,
  type MaintenanceFeeCategory,
  type ReceiptState,
} from "@/components/mock/settlementMockData";

const ALL_CATEGORIES: MaintenanceFeeCategory[] = ["가스비", "전기세", "수도세", "인터넷", "공용물품"];

interface DraftExpense {
  category: MaintenanceFeeCategory | "";
  startDate: string;
  endDate: string;
  amount: string;
  memo: string;
  receiptState: ReceiptState;
}

const EMPTY_DRAFT: DraftExpense = { category: "", startDate: "", endDate: "", amount: "", memo: "", receiptState: "none" };

/** 이번달 관리비 표. 데스크톱은 테이블, 모바일은 카드 리스트로 반응형 전환. Supabase 미연동, mock 데이터로 시뮬레이션. */
export function ExpenseTable() {
  const [expenses, setExpenses] = useState<MaintenanceFeeItem[]>(mockExpenses);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftExpense>(EMPTY_DRAFT);
  const [warning, setWarning] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [undoToast, setUndoToast] = useState<{ item: MaintenanceFeeItem; index: number; message: string } | null>(null);

  const showWarning = (msg: string) => {
    setWarning(msg);
    setTimeout(() => setWarning(null), 1500);
  };

  const usedCategories = new Set(expenses.filter((e) => e.id !== editingId).map((e) => e.category));

  const openAdd = () => {
    setShowForm(true);
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
  };

  const startEdit = (item: MaintenanceFeeItem) => {
    setShowForm(true);
    setEditingId(item.id);
    setDraft({
      category: item.category,
      startDate: item.startDate,
      endDate: item.endDate ?? "",
      amount: String(item.amount),
      memo: item.memo,
      receiptState: item.receiptState,
    });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const save = () => {
    if (!draft.category) {
      showWarning("카테고리를 선택해주세요");
      return;
    }
    if (!draft.startDate) {
      showWarning("시작일(구매일)을 입력해주세요");
      return;
    }
    if (!draft.amount || Number(draft.amount) <= 0) {
      showWarning("금액을 입력해주세요");
      return;
    }
    if (draft.endDate && draft.endDate < draft.startDate) {
      showWarning("종료일은 시작일보다 빠를 수 없어요");
      return;
    }
    const payload: MaintenanceFeeItem = {
      id: editingId ?? `exp-${Date.now()}`,
      category: draft.category,
      startDate: draft.startDate,
      endDate: draft.endDate || null,
      amount: Number(draft.amount),
      memo: draft.memo,
      receiptState: draft.receiptState,
    };
    setExpenses((prev) => (editingId ? prev.map((e) => (e.id === editingId ? payload : e)) : [...prev, payload]));
    closeForm();
  };

  const toggleReceipt = () => {
    const next: ReceiptState = draft.receiptState === "none" ? "error" : draft.receiptState === "error" ? "uploaded" : "none";
    if (next === "error") showWarning("이미지를 업로드할 수 없습니다 (용량/형식 확인)");
    setDraft((d) => ({ ...d, receiptState: next }));
  };

  const requestDelete = (id: string) => setPendingDeleteId(id);
  const confirmDelete = () => {
    const idx = expenses.findIndex((e) => e.id === pendingDeleteId);
    const item = expenses[idx];
    setExpenses((prev) => prev.filter((e) => e.id !== pendingDeleteId));
    setPendingDeleteId(null);
    setUndoToast({ item, index: idx, message: `이번달 관리비 테이블에서 '${item.category}' 행을 삭제했어요.` });
    setTimeout(() => setUndoToast(null), 3000);
  };
  const undoDelete = () => {
    if (!undoToast) return;
    setExpenses((prev) => {
      const arr = [...prev];
      arr.splice(undoToast.index, 0, undoToast.item);
      return arr;
    });
    setUndoToast(null);
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const pendingDeleteItem = expenses.find((e) => e.id === pendingDeleteId);

  const categorySelect = (
    <select
      value={draft.category}
      onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value as MaintenanceFeeCategory }))}
      className="h-[30px] rounded-md border border-[#e3e1db] px-2 text-[13px]"
    >
      <option value="">항목 선택</option>
      {ALL_CATEGORIES.map((c) => {
        const disabled = SINGLE_INSTANCE_CATEGORIES.includes(c) && usedCategories.has(c) && draft.category !== c;
        const usedLabel = SINGLE_INSTANCE_CATEGORIES.includes(c) && usedCategories.has(c) ? " (입력됨)" : "";
        return (
          <option key={c} value={c} disabled={disabled}>
            {c + usedLabel}
          </option>
        );
      })}
    </select>
  );

  const editRow = (
    <>
      {categorySelect}
      <DateRangePopover
        value={draft.startDate || null}
        onChange={(d) => setDraft((s) => ({ ...s, startDate: d }))}
        placeholder="시작일 선택"
        anchor="left"
      />
      <DateRangePopover
        value={draft.endDate || null}
        onChange={(d) => setDraft((s) => ({ ...s, endDate: d }))}
        placeholder="종료일 선택"
        anchor="right"
        allowClear
        onClear={() => setDraft((s) => ({ ...s, endDate: "" }))}
      />
      <input
        type="text"
        inputMode="numeric"
        placeholder="금액"
        value={draft.amount ? Number(draft.amount).toLocaleString("ko-KR") : ""}
        onChange={(e) => setDraft((s) => ({ ...s, amount: e.target.value.replace(/[^0-9]/g, "") }))}
        className="h-[30px] w-[92px] rounded-md border border-[#e3e1db] px-2 text-right text-[13px]"
      />
      <textarea
        placeholder="메모"
        value={draft.memo}
        onChange={(e) => setDraft((s) => ({ ...s, memo: e.target.value }))}
        rows={1}
        className="h-[30px] flex-1 rounded-md border border-[#e3e1db] px-1.5 text-[13px]"
      />
      <button
        type="button"
        onClick={toggleReceipt}
        className={`h-[30px] cursor-pointer rounded-md border border-[#e3e1db] bg-white px-2 text-[13px] ${
          draft.receiptState === "error" ? "text-[#c0433a]" : "text-[#37352f]"
        }`}
      >
        {draft.receiptState === "uploaded" ? "변경하기" : draft.receiptState === "error" ? "업로드 실패" : "첨부하기"}
      </button>
      <IconButton icon={Check} label="저장" onClick={save} />
      <IconButton icon={X} label="취소" onClick={closeForm} />
    </>
  );

  return (
    <div className="border-b border-[#edece9] pb-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-xl font-bold whitespace-nowrap text-[#1a1a1a]">💵 이번달 관리비</div>
          <button
            type="button"
            className="inline-flex min-h-[44px] items-center gap-1 border-none bg-transparent text-[11px] text-[#b3b2ab] underline"
          >
            <Download width={16} height={16} />
            이미지 저장
          </button>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="cursor-pointer rounded-md border border-[#cfe4da] bg-white px-4 py-2 text-[13px] font-bold text-[#2f6f52]"
        >
          + 추가
        </button>
      </div>

      {expenses.length === 0 && !showForm ? (
        <div className="rounded-lg border border-[#e3e1db] bg-[rgba(255,255,255,0.92)] px-6 py-3 text-center text-[13px] font-semibold text-[#6b6b62] shadow-[0_6px_20px_rgba(0,0,0,0.08)]">
          아직 입력된 관리비 항목이 없어요
        </div>
      ) : (
        <>
          <table className="hidden w-full table-fixed border-collapse text-[13px] md:table">
            <thead>
              <tr className="border-b border-[#edece9] text-[#9b9a97]">
                <th style={{ width: "14%" }} className="p-2 text-center font-semibold">항목</th>
                <th style={{ width: "16%" }} className="p-2 text-center font-semibold">시작일/구매일</th>
                <th style={{ width: "16%" }} className="p-2 text-center font-semibold">종료일</th>
                <th style={{ width: "14%" }} className="p-2 text-center font-semibold">금액</th>
                <th style={{ width: "22%" }} className="p-2 text-center font-semibold">메모</th>
                <th style={{ width: "12%" }} className="p-2 text-center font-semibold">영수증</th>
                <th style={{ width: "6%" }} className="p-2 text-center font-semibold" />
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) =>
                editingId === e.id ? (
                  <tr key={e.id} className="border-b border-[#f1f1ef] bg-[#fafaf8]">
                    <td colSpan={7} className="p-1.5">
                      <div className="flex items-center gap-1.5">{editRow}</div>
                    </td>
                  </tr>
                ) : (
                  <tr key={e.id} className="border-b border-[#f1f1ef]">
                    <td className="p-2.5 text-center">
                      <span
                        className="rounded-md px-2.5 py-1 text-[13px] font-semibold"
                        style={{ background: CATEGORY_META[e.category].bg, color: CATEGORY_META[e.category].color }}
                      >
                        {e.category}
                      </span>
                    </td>
                    <td className="p-2.5 text-center text-[#37352f]">{formatDate(e.startDate)}</td>
                    <td className="p-2.5 text-center text-[#37352f]">{formatDate(e.endDate)}</td>
                    <td className="p-2.5 text-right font-semibold text-[#1a1a1a]">{formatWon(e.amount)}</td>
                    <td className="p-2.5 text-left text-[#6b6b62]">{e.memo || "-"}</td>
                    <td className="p-2.5 text-center">
                      {e.receiptState === "uploaded" && <span className="cursor-pointer text-[#2f6f52] underline">📎 첨부됨</span>}
                      {e.receiptState === "error" && <span className="text-[#c0433a]">업로드 실패</span>}
                      {e.receiptState === "none" && <span className="text-[#a8a89c]">-</span>}
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <IconButton icon={Pencil} label="관리비 항목 수정" onClick={() => startEdit(e)} />
                        <IconButton icon={Trash2} label="관리비 항목 삭제" variant="danger" onClick={() => requestDelete(e.id)} />
                      </div>
                    </td>
                  </tr>
                ),
              )}
              {showForm && !editingId && (
                <tr className="border-b border-[#f1f1ef] bg-[#fafaf8]">
                  <td colSpan={7} className="p-1.5">
                    <div className="flex items-center gap-1.5">{editRow}</div>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="p-3 text-center font-bold text-[#1a1a1a]">합계</td>
                <td className="p-3 text-right font-extrabold text-[#2f6f52]">{formatWon(total)}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>

          <div className="flex flex-col md:hidden">
            {expenses.map((e) => (
              <div key={e.id} className="border-b border-[#f1f1ef] py-2.5">
                {editingId === e.id ? (
                  <div className="flex flex-col gap-2">{editRow}</div>
                ) : (
                  <>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="rounded-md px-2.5 py-1 text-[11.5px] font-semibold"
                          style={{ background: CATEGORY_META[e.category].bg, color: CATEGORY_META[e.category].color }}
                        >
                          {e.category}
                        </span>
                        <span className="text-xs whitespace-nowrap text-[#9b9a97]">
                          {formatDate(e.startDate)}
                          {e.endDate ? ` ~ ${formatDate(e.endDate)}` : ""}
                        </span>
                      </div>
                      <span className="text-sm font-extrabold text-[#1a1a1a]">{formatWon(e.amount)}</span>
                    </div>
                    {e.memo && <div className="text-xs text-[#6b6b62]">{e.memo}</div>}
                    <div className="mt-2 flex items-baseline justify-between">
                      <span>
                        {e.receiptState === "uploaded" && <span className="text-xs text-[#2f6f52] underline">📎 첨부됨</span>}
                        {e.receiptState === "error" && <span className="text-[11.5px] text-[#c0433a]">업로드 실패</span>}
                        {e.receiptState === "none" && <span className="text-[11.5px] text-[#a8a89c]">영수증 없음</span>}
                      </span>
                      <span className="inline-flex items-center gap-0.5">
                        <IconButton icon={Pencil} label="관리비 항목 수정" onClick={() => startEdit(e)} />
                        <IconButton icon={Trash2} label="관리비 항목 삭제" variant="danger" onClick={() => requestDelete(e.id)} />
                      </span>
                    </div>
                  </>
                )}
              </div>
            ))}
            {showForm && !editingId && <div className="flex flex-col gap-2 bg-[#fafaf8] py-2.5">{editRow}</div>}
            <div className="mt-2.5 flex justify-between pt-2.5">
              <span className="font-bold text-[#1a1a1a]">합계</span>
              <span className="font-extrabold text-[#2f6f52]">{formatWon(total)}</span>
            </div>
          </div>
        </>
      )}

      <Modal
        open={pendingDeleteId !== null}
        title="지출 항목을 삭제할까요?"
        description={`'${pendingDeleteItem?.category ?? ""}' 항목이 이번달 관리비 지출 내역에서 삭제돼요.`}
        confirmLabel="삭제"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
        danger
      />

      {warning && <ToastStack toasts={[{ id: "warn", message: warning, variant: "warning" }]} />}

      {undoToast && (
        <div className="fixed bottom-6 left-1/2 z-[999] -translate-x-1/2">
          <div className="flex items-center gap-2.5 rounded-lg bg-[#1c231f] px-5 py-3 text-[13px] whitespace-nowrap text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)]">
            <span>{undoToast.message}</span>
            <a
              href="javascript:void(0)"
              onClick={undoDelete}
              className="font-bold text-[#8fd4b0] underline"
            >
              실행취소
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test src/components/settlement/ExpenseTable.test.tsx`
Expected: PASS (5 tests). 테이블과 모바일 카드 뷰가 동시에 DOM에 존재하므로 `getAllByText`/`getAllByRole`로 검증하는 패턴을 테스트가 이미 따르고 있는지 확인 — 실패하면 해당 부분을 `getAllBy*`로 수정한다.

- [ ] **Step 5: Commit**

```bash
git add src/components/settlement/ExpenseTable.tsx src/components/settlement/ExpenseTable.test.tsx
git commit -m "feat: ExpenseTable 이번달 관리비 섹션 추가 (편집/삭제/추가, 반응형)"
```

---

### Task 11: TenantFeeTable (입주자별 관리비 — 읽기 전용, empty state)

**Files:**
- Create: `src/components/settlement/TenantFeeTable.tsx`
- Test: `src/components/settlement/TenantFeeTable.test.tsx`

**Interfaces:**
- Consumes: `TenantFeeRow`, `mockTenantFees`, `formatWon`, `formatDate`(Task 1)
- Produces: `TenantFeeTable` 컴포넌트 — `{ empty?: boolean }` props(기본 `false`; `true`면 blur된 표 위에 "정산할 입주자가 없어요" 오버레이 — PRD 화면1 예외처리 재현). 읽기 전용(편집/삭제 없음).

- [ ] **Step 1: 실패하는 테스트 작성**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TenantFeeTable } from "./TenantFeeTable";

describe("TenantFeeTable", () => {
  it("mock 입주자 3명과 이용일수/관리비를 렌더링한다", () => {
    render(<TenantFeeTable />);
    expect(screen.getAllByText("김민준").length).toBeGreaterThan(0);
    expect(screen.getAllByText("31일").length).toBeGreaterThan(0);
  });

  it("empty=true이면 '정산할 입주자가 없어요' 안내를 보여준다", () => {
    render(<TenantFeeTable empty />);
    expect(screen.getByText("정산할 입주자가 없어요")).toBeInTheDocument();
  });

  it("empty=false(기본값)이면 안내 문구가 없다", () => {
    render(<TenantFeeTable />);
    expect(screen.queryByText("정산할 입주자가 없어요")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test src/components/settlement/TenantFeeTable.test.tsx`
Expected: FAIL (Cannot find module './TenantFeeTable')

- [ ] **Step 3: 최소 구현 작성**

```tsx
import { Download } from "lucide-react";
import { mockTenantFees, formatWon, formatDate } from "@/components/mock/settlementMockData";

interface TenantFeeTableProps {
  empty?: boolean;
}

/** 입주자별 관리비 표. 읽기 전용(편집/삭제 없음). 계산 로직은 이번 범위 밖 — mock 최종값만 표시. */
export function TenantFeeTable({ empty = false }: TenantFeeTableProps) {
  const rows = empty ? [] : mockTenantFees;

  const table = (
    <>
      <table className="hidden w-full border-collapse text-[13px] md:table">
        <thead>
          <tr className="border-b border-[#edece9] text-[#9b9a97]">
            <th className="p-2 text-center font-semibold">이름</th>
            <th className="p-2 text-center font-semibold">시작일</th>
            <th className="p-2 text-center font-semibold">종료일</th>
            <th className="p-2 text-center font-semibold">이용일수</th>
            <th className="p-2 text-center font-semibold">관리비</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id} className="border-b border-[#f1f1ef]">
              <td className="p-2.5 text-center font-bold text-[#1a1a1a]">{t.name}</td>
              <td className="p-2.5 text-center text-[#37352f]">{formatDate(t.start)}</td>
              <td className="p-2.5 text-center text-[#37352f]">{formatDate(t.end)}</td>
              <td className="p-2.5 text-center text-[#37352f]">{t.days}일</td>
              <td className="p-2.5 text-right font-bold text-[#1a1a1a]">{formatWon(t.fee)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-col md:hidden">
        {rows.map((t) => (
          <div key={t.id} className="border-b border-[#f1f1ef] py-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#2f6f52]">{t.name}</span>
              <span className="text-sm font-extrabold text-[#1a1a1a]">{formatWon(t.fee)}</span>
            </div>
            <div className="mt-1 text-xs text-[#6b6b62]">
              {formatDate(t.start)} ~ {formatDate(t.end)} · {t.days}일 이용
            </div>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <div className="text-xl font-bold whitespace-nowrap text-[#1a1a1a]">🧾 입주자별 관리비</div>
        <button
          type="button"
          className="inline-flex min-h-[44px] items-center gap-1 border-none bg-transparent text-[11px] text-[#b3b2ab] underline"
        >
          <Download width={16} height={16} />
          이미지 저장
        </button>
      </div>

      {empty ? (
        <div className="relative">
          <div className="pointer-events-none opacity-55 blur-[3px] select-none">{table}</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-lg border border-[#e3e1db] bg-[rgba(255,255,255,0.92)] px-6 py-3 text-[13px] font-semibold whitespace-nowrap text-[#6b6b62] shadow-[0_6px_20px_rgba(0,0,0,0.08)]">
              정산할 입주자가 없어요
            </div>
          </div>
        </div>
      ) : (
        table
      )}
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test src/components/settlement/TenantFeeTable.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/settlement/TenantFeeTable.tsx src/components/settlement/TenantFeeTable.test.tsx
git commit -m "feat: TenantFeeTable 입주자별 관리비 섹션 추가 (읽기 전용, empty state)"
```

---

### Task 12: 페이지 조립 — `/settlements/[yearMonth]`

**Files:**
- Create: `src/app/(admin)/layout.tsx`
- Create: `src/app/(admin)/settlements/[yearMonth]/page.tsx`
- Modify: `src/app/globals.css` (Noto Sans KR 폰트 import 및 배경색 추가)
- Test: `src/app/(admin)/settlements/[yearMonth]/page.test.tsx`

**Interfaces:**
- Consumes: `Sidebar`(Task 4), `SettlementHeader`(Task 5), `LoginGate`(Task 6), `AnnouncementSection`(Task 9), `ExpenseTable`(Task 10), `TenantFeeTable`(Task 11)
- Produces: 최종 페이지. 이 Task가 끝나면 `pnpm dev`로 `/settlements/2026-07` 접속 시 전체 화면이 렌더링된다.

- [ ] **Step 1: 실패하는 테스트 작성**

`page.tsx`는 async 서버 컴포넌트다. `page.tsx`가 default export하는 함수를 직접 호출해 반환된 React 엘리먼트를 렌더링하는 방식으로 테스트한다 — 이 패턴은 실제 서버/클라이언트 경계를 넘지 않고(단순히 async 함수를 await해서 나온 React 엘리먼트 트리를 렌더링하는 것) 이 페이지가 `next/headers`, `cookies()` 등 Server Component 전용 API를 쓰지 않는 한 vitest+jsdom에서 정상 동작한다. 이 페이지는 그런 API를 쓰지 않으므로(mock 데이터만 사용) 문제 없이 동작해야 한다.

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Page from "./page";

describe("SettlementPage", () => {
  it("헤더/공지사항/관리비/입주자 섹션을 모두 렌더링한다", async () => {
    const ui = await Page({ params: Promise.resolve({ yearMonth: "2026-07" }) });
    render(ui);
    expect(screen.getByText("관리비 정산")).toBeInTheDocument();
    expect(screen.getByText("📌 공지사항")).toBeInTheDocument();
    expect(screen.getByText("💵 이번달 관리비")).toBeInTheDocument();
    expect(screen.getByText("🧾 입주자별 관리비")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test src/app/\(admin\)/settlements/\[yearMonth\]/page.test.tsx`
Expected: FAIL (Cannot find module './page')

**만약 Step 4에서 이 패턴이 실패한다면** (예: "Objects are not valid as a React child" 류의 async component 직접 렌더링 오류): `page.tsx`의 async 함수 본문을 그대로 동기 함수로 두되 `params`를 이미 resolve된 객체로 받는 내부 헬퍼로 분리하지 말고, 대신 `SettlementPageShell`과 그 자식들을 감싸는 부분만 별도 client 컴포넌트로 이미 분리되어 있으므로(`SettlementPageShell`), 이 테스트를 `page.tsx`가 아니라 `SettlementPageShell`에 mock 섹션 children을 넘겨 렌더링하는 형태로 바꾼다. 이 경우 아래처럼 수정한다:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SettlementPageShell } from "@/components/layout/SettlementPageShell";
import { AnnouncementSection } from "@/components/settlement/AnnouncementSection";
import { ExpenseTable } from "@/components/settlement/ExpenseTable";
import { TenantFeeTable } from "@/components/settlement/TenantFeeTable";

describe("SettlementPage shell composition", () => {
  it("헤더/공지사항/관리비/입주자 섹션을 모두 렌더링한다", () => {
    render(
      <SettlementPageShell monthLabel="2026년 7월">
        <AnnouncementSection />
        <ExpenseTable />
        <TenantFeeTable />
      </SettlementPageShell>,
    );
    expect(screen.getByText("관리비 정산")).toBeInTheDocument();
    expect(screen.getByText("📌 공지사항")).toBeInTheDocument();
    expect(screen.getByText("💵 이번달 관리비")).toBeInTheDocument();
    expect(screen.getByText("🧾 입주자별 관리비")).toBeInTheDocument();
  });
});
```

이 대안은 `src/components/layout/SettlementPageShell.test.tsx`에 두고, `page.tsx` 자체는 (Next.js 빌드 성공 여부로만 검증되는) 얇은 조립 레이어로 남긴다.

- [ ] **Step 3: 최소 구현 작성**

`src/app/(admin)/layout.tsx`:

```tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#f3f2ee]">{children}</div>;
}
```

`src/app/(admin)/settlements/[yearMonth]/page.tsx`:

```tsx
import { AnnouncementSection } from "@/components/settlement/AnnouncementSection";
import { ExpenseTable } from "@/components/settlement/ExpenseTable";
import { TenantFeeTable } from "@/components/settlement/TenantFeeTable";
import { SettlementPageShell } from "@/components/layout/SettlementPageShell";

function monthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-").map(Number);
  return `${year}년 ${month}월`;
}

/** 관리비 정산 화면. 이번 이식은 정적 마크업 + mock 데이터이며 Supabase 미연동. */
export default async function SettlementPage({
  params,
}: {
  params: Promise<{ yearMonth: string }>;
}) {
  const { yearMonth } = await params;

  return (
    <SettlementPageShell monthLabel={monthLabel(yearMonth)}>
      <div className="flex flex-col gap-7 px-6 py-6">
        <AnnouncementSection />
        <ExpenseTable />
        <TenantFeeTable />
      </div>
    </SettlementPageShell>
  );
}
```

`SettlementHeader`가 햄버거 토글 상태를 갖고 `Sidebar`와 `LoginGate`를 함께 배치해야 하므로, 이를 묶는 client 컴포넌트 `SettlementPageShell`을 추가한다:

`src/components/layout/SettlementPageShell.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { SettlementHeader } from "@/components/layout/SettlementHeader";
import { LoginGate } from "@/components/layout/LoginGate";

interface SettlementPageShellProps {
  monthLabel: string;
  children: React.ReactNode;
}

export function SettlementPageShell({ monthLabel, children }: SettlementPageShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen">
      <LoginGate visible={false} />
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen((o) => !o)} variant="desktop" />
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen((o) => !o)} variant="overlay" />
      <div className="flex min-w-0 flex-1 flex-col bg-white">
        <SettlementHeader monthLabel={monthLabel} onMenuToggle={() => setSidebarOpen((o) => !o)} />
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
```

`src/app/globals.css`에 Noto Sans KR 추가:

```css
@import "tailwindcss";
@import url("https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap");

:root {
  --background: #f3f2ee;
  --foreground: #1a1a1a;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Malgun Gothic", "Apple SD Gothic Neo", sans-serif;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test src/app`
Expected: PASS (1 test)

- [ ] **Step 5: 빌드 및 린트 확인**

```bash
pnpm lint
pnpm build
```

Expected: 둘 다 에러 없이 통과.

- [ ] **Step 6: 브라우저로 실제 렌더링 확인**

```bash
pnpm dev
```

`http://localhost:3000/settlements/2026-07` 접속 후 확인:
- 데스크톱 너비(1280px 이상)에서 사이드바 상시 노출, 헤더/공지사항/관리비 표/입주자 표가 순서대로 보이는지
- 브라우저 창을 좁혀 모바일 너비(390px)로 줄였을 때 사이드바가 사라지고 햄버거 버튼이 나타나며, 표가 카드형으로 전환되는지
- "+ 추가" 클릭 시 인라인 편집 행이 나타나는지, 게시/발송 버튼 흐름이 동작하는지
- Claude Design 원본(`https://claude.ai/design/p/c5769f2e-9bea-48c1-9d53-4afe499a9c85?file=Maintenance+Fee+Settlement.dc.html`)과 나란히 놓고 레이아웃/색상/타이포그래피 비교

이 단계는 자동화된 어설션이 없으므로, 스펙의 "검증" 섹션 항목을 육안으로 하나씩 체크하고 결과를 기록한다.

- [ ] **Step 7: Commit**

```bash
git add src/app/\(admin\) src/components/layout/SettlementPageShell.tsx src/app/globals.css
git commit -m "feat: 관리비 정산 페이지 조립 (/settlements/[yearMonth])"
```

---

### Task 13: 영수증 미리보기 모달 + 편집 중 이탈 방지 경고

디자인 파일의 JS 로직(`openReceiptPreview`/`closeReceiptPreview`, `showUnsavedExpenseAlert`/`showUnsavedAnnouncementAlert`)에 있는 두 상호작용을 Task 9(`AnnouncementSection`)와 Task 10(`ExpenseTable`)에 추가한다. 새 파일을 만들지 않고 기존 두 컴포넌트를 확장한다.

**Files:**
- Modify: `src/components/settlement/ExpenseTable.tsx`, `src/components/settlement/ExpenseTable.test.tsx`
- Modify: `src/components/settlement/AnnouncementSection.tsx`, `src/components/settlement/AnnouncementSection.test.tsx`

**Interfaces:**
- Consumes: `Modal`(Task 3)
- Produces: 없음(외부에서 참조하는 새 export 없음) — 두 컴포넌트 내부 동작만 추가.

- [ ] **Step 1: 실패하는 테스트 추가 (ExpenseTable — 영수증 미리보기)**

`src/components/settlement/ExpenseTable.test.tsx`에 추가:

```tsx
it("'📎 첨부됨' 클릭 시 영수증 미리보기 모달이 뜬다", async () => {
  render(<ExpenseTable />);
  await userEvent.click(screen.getAllByText("📎 첨부됨")[0]);
  expect(screen.getByText("가스비 영수증")).toBeInTheDocument();
});
```

- [ ] **Step 2: 실패하는 테스트 추가 (ExpenseTable — 편집 중 이탈 방지)**

```tsx
it("한 행을 편집 중일 때 다른 행 수정을 시도하면 경고가 뜨고 편집 대상이 바뀌지 않는다", async () => {
  render(<ExpenseTable />);
  const editButtons = screen.getAllByRole("button", { name: "관리비 항목 수정" });
  await userEvent.click(editButtons[0]);
  await userEvent.click(editButtons[1]);
  expect(await screen.findByText("작성중인 행이 있어요!")).toBeInTheDocument();
});
```

- [ ] **Step 3: 실패하는 테스트 추가 (AnnouncementSection — 편집 중 이탈 방지)**

`src/components/settlement/AnnouncementSection.test.tsx`에 추가:

```tsx
it("한 공지사항을 편집 중일 때 다른 공지사항 수정을 시도하면 경고가 뜬다", async () => {
  render(<AnnouncementSection />);
  const editButtons = screen.getAllByRole("button", { name: "공지사항 수정" });
  await userEvent.click(editButtons[0]);
  await userEvent.click(editButtons[1]);
  expect(await screen.findByText("작성중인 공지사항이 있어요!")).toBeInTheDocument();
});
```

- [ ] **Step 4: 테스트 실패 확인**

Run: `pnpm test src/components/settlement/ExpenseTable.test.tsx src/components/settlement/AnnouncementSection.test.tsx`
Expected: 새로 추가한 3개 테스트 FAIL (기능 미구현), 기존 테스트는 PASS 유지.

- [ ] **Step 5: `ExpenseTable`에 영수증 미리보기 + 이탈 방지 추가**

`ExpenseTable.tsx`에서 state 선언부에 추가:

```tsx
const [previewCategory, setPreviewCategory] = useState<string | null>(null);
const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
```

`openAdd`, `startEdit`을 아래처럼 수정(다른 행이 이미 편집 중이면 경고):

```tsx
const openAdd = () => {
  if (showForm) {
    setShowUnsavedAlert(true);
    return;
  }
  setShowForm(true);
  setEditingId(null);
  setDraft(EMPTY_DRAFT);
};

const startEdit = (item: MaintenanceFeeItem) => {
  if (showForm && editingId !== item.id) {
    setShowUnsavedAlert(true);
    return;
  }
  setShowForm(true);
  setEditingId(item.id);
  setDraft({
    category: item.category,
    startDate: item.startDate,
    endDate: item.endDate ?? "",
    amount: String(item.amount),
    memo: item.memo,
    receiptState: item.receiptState,
  });
};
```

영수증 "📎 첨부됨" 렌더링 부분(데스크톱 테이블 셀과 모바일 카드 양쪽)을 클릭 가능하게 수정:

```tsx
{e.receiptState === "uploaded" && (
  <span
    onClick={() => setPreviewCategory(e.category)}
    className="cursor-pointer text-[#2f6f52] underline"
  >
    📎 첨부됨
  </span>
)}
```

컴포넌트 return의 마지막(기존 `undoToast` 블록 다음)에 모달 두 개 추가:

```tsx
<Modal
  open={previewCategory !== null}
  title={`${previewCategory ?? ""} 영수증`}
  description=""
  confirmLabel="닫기"
  onConfirm={() => setPreviewCategory(null)}
  onCancel={() => setPreviewCategory(null)}
/>

<Modal
  open={showUnsavedAlert}
  title="작성중인 행이 있어요!"
  description="저장 혹은 취소 후 다음 작업을 진행해주세요."
  confirmLabel="확인"
  onConfirm={() => setShowUnsavedAlert(false)}
  onCancel={() => setShowUnsavedAlert(false)}
/>
```

`description=""`인 모달은 빈 문단만 렌더링되어 시각적으로 어색하므로, `Modal`의 `description` prop을 옵셔널로 바꾸고(Task 3에서 이미 정의한 `Modal`을 이 Task에서 아래처럼 수정) 빈 값이면 렌더링하지 않는다:

`src/components/ui/Modal.tsx`에서:

```tsx
interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}
```

및 JSX에서:

```tsx
{description && <div className="mb-5 text-[13px] leading-relaxed text-[#6b6b62]">{description}</div>}
```

영수증 미리보기 모달에는 실제 이미지를 이번 범위에서 굳이 넣지 않는다(실제 업로드 로직이 Out of Scope이므로) — 제목만으로 "미리보기가 열렸다"는 것을 확인 가능하다.

- [ ] **Step 6: `AnnouncementSection`에 이탈 방지 추가**

`AnnouncementSection.tsx`에서 `openAdd`, `startEdit`을 아래처럼 수정:

```tsx
const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);

const openAdd = () => {
  if (adding || editingId) {
    setShowUnsavedAlert(true);
    return;
  }
  setAdding(true);
  setEditingId(null);
  setTitle("");
  setText("");
};

const startEdit = (a: Announcement) => {
  if ((adding || editingId) && editingId !== a.id) {
    setShowUnsavedAlert(true);
    return;
  }
  setEditingId(a.id);
  setAdding(false);
  setTitle(a.title);
  setText(a.text);
};
```

return 마지막에 추가:

```tsx
<Modal
  open={showUnsavedAlert}
  title="작성중인 공지사항이 있어요!"
  description="저장 혹은 취소 후 다음 작업을 진행해주세요."
  confirmLabel="확인"
  onConfirm={() => setShowUnsavedAlert(false)}
  onCancel={() => setShowUnsavedAlert(false)}
/>
```

- [ ] **Step 7: 테스트 통과 확인**

Run: `pnpm test src/components/settlement/ExpenseTable.test.tsx src/components/settlement/AnnouncementSection.test.tsx src/components/ui/Modal.test.tsx`
Expected: PASS 전체(기존 테스트 포함, `Modal.test.tsx`는 `description` optional 변경 후에도 기존 4개 테스트 그대로 통과해야 한다).

- [ ] **Step 8: 전체 테스트 스위트 재확인**

Run: `pnpm test`
Expected: 모든 테스트 PASS (Task 1~13 누적).

- [ ] **Step 9: Commit**

```bash
git add src/components/settlement/ExpenseTable.tsx src/components/settlement/ExpenseTable.test.tsx \
        src/components/settlement/AnnouncementSection.tsx src/components/settlement/AnnouncementSection.test.tsx \
        src/components/ui/Modal.tsx
git commit -m "feat: 영수증 미리보기 모달과 편집 중 이탈 방지 경고 추가"
```

---

## Self-Review 체크리스트 (계획 작성자용, 참고)

- **스펙 커버리지**: 헤더(Task 5) / 공지사항(Task 9, 13) / 이번달 관리비(Task 10, 13) / 입주자별 관리비(Task 11) / 사이드바(Task 4) / 로그인 게이트(Task 6) / 반응형(Task 10, 11에 md: 분기 포함) / 날짜 팝오버(Task 7) / 삭제·실행취소·경고 토스트(Task 9, 10) / 영수증 미리보기·편집 중 이탈 방지(Task 13) — 스펙의 모든 섹션에 대응하는 Task가 있다.
- **Out of Scope 확인**: Supabase 연동, 일할계산 로직, 실제 인증, html-to-image 실제 캡처, 화면2/3, 미리보기 전용 컨트롤 — 어느 Task에도 포함하지 않았다.
- **타입 일관성**: `MaintenanceFeeItem`/`TenantFeeRow`/`Announcement`(Task 1)를 Task 9~11, 13이 동일한 이름/필드로 import해서 쓴다. `Modal`의 `description`은 Task 3에서 required였다가 Task 13에서 optional로 변경됨 — Task 3의 기존 4개 테스트는 모두 `description` 값을 전달하므로 이 변경으로 깨지지 않는다.
