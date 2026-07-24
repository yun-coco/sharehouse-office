# 관리비 정산 화면 이식 — Design Spec

**출처:** Claude Design 프로젝트 "쉐어하우스 사무소 Design System" (projectId: `fc931420-d4b4-487a-99fb-8739e0b0175a`), `ui_kits/admin-dashboard/SettlementScreen.jsx` 및 그 의존 컴포넌트.

**목표:** Claude Design에서 만든 관리비 정산(Maintenance Fee Settlement) 화면과 그 의존 컴포넌트를, 이 Next.js 프로젝트에 Tailwind CSS 기반으로 이식한다. 디자인은 원본과 픽셀 단위로 동일해야 한다.

## 범위

- **포함:** 관리비 정산 화면(`SettlementScreen`)과 그 의존 컴포넌트 전체 — `AppShell`, `Sidebar`, `PageHeader`, `HamburgerButton`, `SectionTitle`, `ListRow`, `Button`, `IconButton`, `Icon`, `Input`.
- **제외:** 공지사항(`NoticeScreen`), 방 관리/입주자 관리 화면(디자인 시스템에도 아직 미구현), `ConfirmDialog`/`WarningDialog`/`Toast`/`EmptyState` (공지사항 화면 전용이라 정산 화면에서 쓰이지 않음).
- **제외 (별도 작업):** Supabase 데이터 연동. 정산 화면의 목업 데이터(5개 방, `101호 김서연 128,400원 완료` 등)는 하드코딩된 상태로 그대로 이식한다.

## 아키텍처

### 스타일링: Tailwind CSS 전량 재작성 + 토큰 매핑

원본 컴포넌트는 inline style + CSS 커스텀 프로퍼티(`tokens/colors.css`, `spacing.css`, `typography.css`)로 작성되어 있다. 이를 Tailwind 클래스로 재작성하되, `tailwind.config.ts`의 `theme.extend`에 원본 토큰 값을 1:1로 등록해 임의의 Tailwind 기본값이 아닌 디자인 시스템 고유 값을 그대로 참조하게 한다.

**매핑 대상 (원본 → Tailwind config):**

| 원본 토큰 파일 | Tailwind 카테고리 | 비고 |
|---|---|---|
| `tokens/colors.css` (green-50~900, gray-50~900, red-500~700, semantic 컬러) | `theme.extend.colors` | `--btn-*-bg` 등 semantic 이름도 그대로 유지 |
| `tokens/spacing.css` (`--space-1`~`--space-10`) | `theme.extend.spacing` | 숫자 키 유지 (`space-3` → Tailwind `3`은 이미 다른 값이므로 커스텀 키 사용, 예: `p-3` 대신 매핑 후 재검증) |
| `tokens/spacing.css` (radius, shadow) | `borderRadius`, `boxShadow` | `--radius-pill`은 매핑하되 실사용 없음(원본에도 unused) |
| `tokens/typography.css` (`--text-*`, `--weight-*`) | `fontSize`, `fontWeight` | `Noto Sans KR` → `fontFamily.sans` |
| `--touch-target`(44px), `--sidebar-width`(230px), `--sidebar-width-mobile`(50vw) | `spacing` 커스텀 키 | 컴포넌트 전용 상수 |
| `--duration-fast/base`, `--ease-standard` | `transitionDuration`, `transitionTimingFunction` | |

값 충돌 방지: Tailwind 기본 스케일과 숫자가 겹치더라도(`gap-3`=0.75rem=12px vs `--space-3`=12px) 반드시 config에 명시적으로 등록해 우연한 일치에 의존하지 않는다.

### 아이콘

원본은 CDN Lucide(`unpkg.com/lucide`, `data-lucide` attribute + `lucide.createIcons()`)를 사용한다. Next.js에서는 `lucide-react` npm 패키지로 대체하고, `Icon` 컴포넌트가 아이콘 이름 문자열로 `lucide-react`의 컴포넌트를 동적으로 찾아 렌더링하도록 한다. 같은 아이콘셋이므로 시각적 차이 없음.

### 파일 구조

```
src/
  components/
    ui/
      Button.tsx
      IconButton.tsx
      Icon.tsx
      Input.tsx
    layout/
      Sidebar.tsx
      PageHeader.tsx
      HamburgerButton.tsx
      SectionTitle.tsx
      AppShell.tsx
    data/
      ListRow.tsx
  app/
    (admin)/
      layout.tsx        # AppShell 적용, sidebar tier(desktop/tablet/mobile) 반응형 상태 관리
      settlement/
        page.tsx          # 관리비 정산 화면, ROOMS 목업 데이터 포함
  tailwind.config.ts       # 토큰 매핑
```

`(admin)` 라우트 그룹을 쓰는 이유: 향후 공지사항/방 관리/입주자 관리 화면도 같은 셸을 공유하게 되므로, 이 그룹 밖의 화면(로그인, 공개 조회용 화면3)과 구분해둔다.

### 타입 변환

각 컴포넌트에 `interface XxxProps`를 정의하고 `.jsx` → `.tsx`로 변환한다. 예:

```ts
interface ListRowColumn {
  key: string;
  value: string;
  flex?: number;
  secondary?: boolean;
  wrap?: boolean;
}
interface ListRowProps {
  columns: ListRowColumn[];
  editing?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  editFields?: Record<string, string>;
  onEditFieldChange?: (key: string, value: string) => void;
}
```

### 데이터

`SettlementScreen`의 5행 목업 데이터를 그대로 하드코딩 유지. 정렬/필터/실제 정산 계산 로직은 포함하지 않는다 — PRD의 "계산 로직" 섹션(`docs/sharehouse_office_PRD.md`)과 Supabase 스키마(`maintenance_fee_items`, `tenants`, `settlement_periods`)를 연동하는 것은 이 작업의 범위 밖이며, 별도 계획으로 진행한다.

## 검증

컴포넌트 변환 후, Claude Design 원본(`ui_kits/admin-dashboard/index.html`을 브라우저에서 직접 열거나 캡처)과 이식된 화면을 나란히 비교해 spacing/color/font-size/hover-active 상태가 일치하는지 확인한다. 데스크톱/태블릿/모바일 3개 티어에서 sidebar 반응형 동작(in-flow / overlay-transparent / drawer-scrim)도 함께 검증한다.

## Out of Scope

- Supabase 실데이터 연동 (별도 계획)
- 공지사항 화면 및 그 전용 컴포넌트(ConfirmDialog, WarningDialog, Toast, EmptyState)
- 방 관리 / 입주자 관리 화면 (디자인 미완성)
- 인증/로그인 플로우와의 연결 (`(admin)` 그룹에 auth guard를 붙이는 것은 별도 작업)
