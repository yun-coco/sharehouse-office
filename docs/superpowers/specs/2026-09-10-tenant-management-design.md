# 설계: 입주자 관리 페이지

- 작성일: 2026-09-10
- 관련 PRD: `docs/sharehouse-office-prd.md` 4.1.2 (입주자 관리, `/tenants`)
- 관련 목업/디자인: `docs/mockups/settlement-dashboard.html`, `docs/DESIGN.md` (Notion 기반)
- 브랜치: `feature/tenant-management`

## 1. 배경

PRD 4.1.2는 입주자 관리 화면(`/tenants`)의 요구사항(FR-006~008)만 정의하고 있고, 실제 라우팅·인증·앱 셸은 아직 구현되어 있지 않다. 현재 저장소에는 Next.js 스캐폴드, Supabase client/server 헬퍼, DB 마이그레이션(`houses`, `tenants`, `settlement_periods`, `maintenance_fee_items`)만 존재하며 로그인 화면이나 실제 페이지는 없다. 이 설계는 입주자 관리 페이지를 만들기 위해 필요한 최소한의 주변 인프라(로그인, house 진입점, 앱 셸)까지 포함한다.

## 2. 범위

### 포함
- `/login` — Google OAuth 로그인
- 인증 가드 (미들웨어에서 미로그인 시 `/login`으로 리다이렉트)
- `/houses` — house 목록/생성 진입점 (없으면 생성 유도, 1개면 자동 이동)
- `/houses/:houseId/tenants` — 입주자 목록 조회(FR-008: 가나다순), 추가(FR-006), 수정(FR-007), 삭제
- 앱 셸(사이드바 + 상단바) — 목업 패턴 재사용
- shadcn/ui 도입 (Sheet, AlertDialog, Table, Button, Input, Label, Sonner)

### 범위 외
- 계약기간 수정과 확정된 정산월의 충돌 검증 (PRD Open Question) — 정산 대시보드가 없어 검증 근거가 없음. 다음 사이클로 이월.
- 정산 대시보드(`/settlements/:year-:month`) 자체 구현
- house 소유자 외 추가 권한 체계 (RLS가 `owner_id` 기준으로 이미 처리)

## 3. 라우팅 & 인증

```
/login                          - Google OAuth 로그인 버튼
/houses                         - house 목록/생성 (0개: 생성 폼, 1개: 자동 리다이렉트, N개: 목록)
/houses/[houseId]/tenants       - 입주자 관리 (이번 작업의 핵심)
```

- `src/proxy.ts`(미들웨어)에 인증 가드 추가: 세션 없으면 `/login`으로 리다이렉트, `/login` 자체는 예외
- 로그인 성공 후 `/houses`로 이동
- `/houses/:houseId/tenants` 접근 시 해당 house가 로그인한 유저 소유인지는 Supabase RLS가 검증 (애플리케이션 레벨 추가 체크 불필요)

## 4. 앱 셸

`docs/mockups/settlement-dashboard.html`의 구조를 그대로 재사용:
- 다크 사이드바(`#21201e`), 로고, 네브 그룹("정산 대시보드" — 이번 범위에서는 비활성 placeholder 링크, "입주자 관리" — active)
- 상단바: 페이지 타이틀 + 우측 "입주자 추가" 프라이머리 버튼
- 메인 컨텐츠 영역은 warm off-white 캔버스(`--canvas-soft`)

Next.js 레이아웃 구조:
```
src/app/houses/[houseId]/layout.tsx   - 사이드바 + 상단바 셸
src/app/houses/[houseId]/tenants/page.tsx
```

## 5. 입주자 목록

- 서버 컴포넌트에서 Supabase 조회, `order('name')`으로 가나다순 정렬 (FR-008)
- `.panel` 스타일 카드 안에 테이블: 이름 / 입실일 / 퇴실일(진행중이면 "거주 중" 배지) / 액션(수정·삭제 버튼)
- 입주자가 없으면 empty state 카드 표시

## 6. 추가/수정 — Sheet

- shadcn `Sheet`, 화면 우측에서 슬라이드 — 목록을 가리지 않기 위해 다이얼로그 대신 채택 (사용자 결정)
- 필드: 이름(text, required), 입실일(date, required), 퇴실일(date, optional — 비우면 현재 거주 중)
- 클라이언트 유효성: 퇴실일이 있으면 입실일 이상이어야 함 (DB 제약 `tenants_move_out_after_move_in`과 동일 규칙을 사전에 체크해 UX 개선)
- 저장 흐름: Server Action 호출 → 성공 시 시트 닫고 목록 리프레시(`revalidatePath`) + `sonner` 토스트 알림 → 실패 시 시트 내부에 에러 메시지 표시, 시트는 열린 채 유지

## 7. 삭제 — AlertDialog

- 행의 삭제 버튼 클릭 → shadcn `AlertDialog`로 "정말 삭제하시겠습니까?" 확인
- 확인 시 hard delete (되돌리기 없음, 오입력 정정 목적)
- 성공 시 토스트 알림 + 목록 리프레시

## 8. 데이터 레이어

`src/app/houses/[houseId]/tenants/actions.ts`에 Server Actions:
- `createTenant(houseId, { name, moveInDate, moveOutDate })`
- `updateTenant(tenantId, { name, moveInDate, moveOutDate })`
- `deleteTenant(tenantId)`

각 액션은:
1. Supabase 서버 클라이언트로 요청 (RLS가 house 소유권 검증)
2. 성공/실패 결과를 반환 (throw 대신 `{ ok: true }` / `{ ok: false, error }` 형태로 시트가 에러를 표시할 수 있게)
3. 성공 시 `revalidatePath('/houses/[houseId]/tenants')`

## 9. UI 컴포넌트 라이브러리

- `npx shadcn@latest init`으로 초기화
- 추가 컴포넌트: `sheet`, `alert-dialog`, `table`, `button`, `input`, `label`, `sonner`
- Tailwind 테마 토큰을 `docs/DESIGN.md`의 Notion 기반 팔레트(warm off-white 캔버스, 단일 블루 프라이머리, 12px 라운드 카드, hairline 보더)에 맞게 조정

## 10. 테스트 관점

- Server Action 단위: 이름 필수, 퇴실일 ≥ 입실일 검증, 삭제 후 목록에서 제거되는지
- RLS로 인해 다른 house의 tenant에 접근 시 실패하는지 (수동/통합 테스트)
- UI: 추가/수정/삭제 각각의 정상 흐름 + 유효성 에러 흐름을 브라우저에서 확인
