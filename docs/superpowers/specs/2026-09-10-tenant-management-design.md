# 설계: 입주자 관리 페이지

- 작성일: 2026-09-10
- 관련 PRD: `docs/sharehouse-office-prd.md` 4.1.2 (입주자 관리, `/tenants`)
- 관련 목업/디자인: `docs/mockups/settlement-dashboard.html`, `docs/DESIGN.md` (Notion 기반)
- 브랜치: `feature/tenant-management`

## 1. 배경

PRD 4.1.2는 입주자 관리 화면(`/tenants`)의 요구사항(FR-006~008)만 정의하고 있고, 실제 라우팅·앱 셸은 아직 구현되어 있지 않다. 현재 저장소에는 Next.js 스캐폴드, Supabase client/server 헬퍼, DB 마이그레이션(`houses`, `tenants`, `settlement_periods`, `maintenance_fee_items`)만 존재하며 실제 페이지는 없다. 로그인은 기능 구현이 모두 끝난 뒤 마지막에 붙이기로 했으므로(사용자 결정), 이 설계에서는 인증을 다루지 않고 `houseId`를 임시로 고정해 페이지 자체에 집중한다.

## 2. 범위

### 포함
- `/houses/:houseId/tenants` — 입주자 목록 조회(FR-008: 가나다순), 추가(FR-006), 수정(FR-007), 삭제(실행취소 가능)
- 앱 셸(사이드바 + 상단바) — 목업 패턴 재사용
- shadcn/ui 도입 (Sheet, Table, Button, Input, Label, Textarea, Sonner)
- 입주자 목록 "메모" 컬럼
- 빈 목록일 때 예시 데이터 미리보기
- `move_out_date`를 필수값으로 바꾸는 DB 마이그레이션

### 범위 외
- 로그인/인증 가드 — 기능 구현 완료 후 마지막 단계에서 별도로 붙인다 (사용자 결정). 이번 작업에서는 `houseId`를 시드 데이터의 고정값으로 사용
- `/houses` house 목록/생성 진입점 — 로그인과 함께 다음 단계로 이월
- 계약기간 수정과 확정된 정산월의 충돌 검증 (PRD Open Question) — 정산 대시보드가 없어 검증 근거가 없음. 다음 사이클로 이월.
- 정산 대시보드(`/settlements/:year-:month`) 자체 구현
- house 소유자 외 추가 권한 체계 (RLS가 `owner_id` 기준으로 이미 처리, 로그인 붙을 때 유효해짐)

## 3. 라우팅

```
/houses/[houseId]/tenants       - 입주자 관리 (이번 작업의 핵심)
```

- 이번 범위에서는 인증 가드가 없으므로, 시드 마이그레이션으로 만든 고정 house 하나를 사용해 `houseId`를 결정한다 (예: 로컬 개발 환경에서 첫 번째 house를 조회하거나, `.env`에 개발용 `DEFAULT_HOUSE_ID`를 둔다)
- 로그인이 붙는 시점에 `/login`, 인증 가드, `/houses` 진입점을 별도 작업으로 추가하고, 이 페이지는 그대로 재사용한다

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
- `.panel` 스타일 카드 안에 테이블: 이름 / 입실일 / 퇴실일 / 메모 / 액션(수정·삭제 버튼)
- 입주자가 없으면 empty state 카드 대신, **예시 데이터(더미 행 2~3개)를 실제 테이블 형태로 미리보기 표시** — 실제 데이터가 아님을 나타내는 옅은 처리(예: opacity, "예시 데이터입니다" 안내 캡션)를 곁들여, 사용자가 데이터를 입력했을 때 화면이 어떻게 보일지 미리 감을 잡을 수 있게 한다. 예시 행은 클릭/수정/삭제 불가능한 순수 프리뷰

## 6. 추가/수정 — Sheet

- shadcn `Sheet`, 화면 우측에서 슬라이드 — 목록을 가리지 않기 위해 다이얼로그 대신 채택 (사용자 결정)
- 필드: 이름(text, required), 입실일(date, required), 퇴실일(date, **required**), 메모(textarea, optional)
  - 퇴실일은 필수값이다. 아직 퇴실 예정이 확정되지 않은 입주자도 예상 퇴실일을 입력하고, 나중에 계약이 바뀌면 수정 시트에서 갱신한다.
- 클라이언트 유효성: 이름 비어있지 않음, 퇴실일이 입실일 이상이어야 함 (DB 제약 `tenants_move_out_after_move_in`과 동일 규칙을 사전에 체크해 UX 개선)
- 저장 흐름: Server Action 호출 → 성공 시 시트 닫고 목록 리프레시(`revalidatePath`) + `sonner` 토스트 알림 → 실패 시 시트 내부에 에러 메시지 표시, 시트는 열린 채 유지

## 7. 삭제 — 실행취소 가능한 토스트

- Google 캘린더의 일정 삭제 패턴을 따른다: 행의 삭제 버튼 클릭 시 확인 다이얼로그 없이 **즉시 삭제를 실행**하고, 하단에 `sonner` 토스트("OO님을 삭제했습니다")를 띄우며 토스트 끝에 "실행취소" 액션 버튼을 둔다
- 삭제는 soft delete로 구현한다: `tenants.deleted_at`에 타임스탬프만 기록하고 실제 row는 지우지 않음. 목록 조회는 항상 `deleted_at is null` 조건을 포함한다
- 실행취소를 누르면 같은 row의 `deleted_at`을 `null`로 되돌린다 (id, 메모 등 모든 값이 그대로 보존됨)
- 토스트가 일정 시간(예: 5초) 후 사라지면 실행취소 버튼도 사라짐 — 이후에는 데이터가 화면에 다시 노출되지 않는 것으로 삭제가 최종 확정된 것으로 간주 (row 자체는 soft-deleted 상태로 남아있음, 하드 삭제/정리는 이번 범위 밖)
- 구현: `deleteTenant(tenantId)`가 `deleted_at = now()`로 업데이트, `undoDeleteTenant(tenantId)`가 `deleted_at = null`로 되돌림

## 8. 데이터 레이어

### DB 마이그레이션 (추가)
기존 `tenants` 테이블에 대한 변경:
- `move_out_date`를 `not null`로 변경 (필수값 결정에 따름) — 기존 제약 `tenants_move_out_after_move_in`은 유지
- `memo text` 컬럼 추가 (nullable — 메모는 선택 입력)
- `deleted_at timestamptz` 컬럼 추가 (nullable, 기본값 없음 — soft delete)
- 기존 RLS 정책은 `house_id` 기준이라 변경 불필요. 목록 조회 쿼리에서 `deleted_at is null` 조건을 추가로 건다

### Server Actions
`src/app/houses/[houseId]/tenants/actions.ts`:
- `createTenant(houseId, { name, moveInDate, moveOutDate, memo })`
- `updateTenant(tenantId, { name, moveInDate, moveOutDate, memo })`
- `deleteTenant(tenantId)` — `deleted_at = now()` 업데이트
- `undoDeleteTenant(tenantId)` — `deleted_at = null` 업데이트

각 액션은:
1. Supabase 서버 클라이언트로 요청 (RLS가 house 소유권 검증)
2. 성공/실패 결과를 반환 (throw 대신 `{ ok: true }` / `{ ok: false, error }` 형태로 시트가 에러를 표시할 수 있게)
3. 성공 시 `revalidatePath('/houses/[houseId]/tenants')`

## 9. UI 컴포넌트 라이브러리

- `npx shadcn@latest init`으로 초기화
- 추가 컴포넌트: `sheet`, `table`, `button`, `input`, `label`, `textarea`, `sonner`
- Tailwind 테마 토큰을 `docs/DESIGN.md`의 Notion 기반 팔레트(warm off-white 캔버스, 단일 블루 프라이머리, 12px 라운드 카드, hairline 보더)에 맞게 조정

## 10. 테스트 관점

- Server Action 단위: 이름 필수, 입실일·퇴실일 필수, 퇴실일 ≥ 입실일 검증, 삭제 시 soft delete 처리, 실행취소 시 복원되는지
- 목록 조회가 `deleted_at is null`인 행만 반환하는지
- RLS로 인해 다른 house의 tenant에 접근 시 실패하는지 (수동/통합 테스트)
- UI: 추가/수정/삭제(+실행취소)·빈 목록 예시 데이터 프리뷰 각각의 정상 흐름 + 유효성 에러 흐름을 브라우저에서 확인
