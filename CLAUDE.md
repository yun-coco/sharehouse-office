# 쉐어하우스 정산 관리 어드민

PRD: `sharehouse_office_PRD.md` (Downloads 폴더, 프로젝트 루트로 복사되지 않음 — 필요 시 참조)

## 도메인 용어집

이 프로젝트에서 아래 용어는 코드/스키마/UI 전반에서 통일해서 사용한다. 새 테이블/컬럼/함수를 만들기 전에 먼저 이 표에 해당 개념이 있는지 확인하고, 없으면 이 표에 먼저 추가한 뒤 구현한다.

| 용어 (한글) | 코드상 이름 | 의미 / 주의사항 |
|---|---|---|
| 관리비 | `maintenance_fee` | 가스비/전기세/수도세/인터넷/공용물품 등 매달 발생하는 공용 지출. `expense`(지출)는 너무 광범위한 이름이라 사용하지 않는다 — 향후 매출 관리 등 다른 종류의 지출/수입 기능이 추가될 수 있으므로 "관리비"임을 명확히 한다. 테이블: `maintenance_fee_items` |
| 정산월 | `settlement_period` | "2026년 7월 정산" 같은 월 단위 정산 묶음 자체를 가리키는 개념. 게시 여부(`is_published`)는 이 개념의 여러 속성 중 하나일 뿐이므로, 테이블명에 "status"/"publish" 등 속성 이름을 넣지 않는다. 테이블: `settlement_periods` |
| 게시 | `publish` / `is_published` | 운영자가 "게시(Publish)" 버튼을 눌러 해당 정산월을 화면 3(공개 조회 화면)에 노출시키는 행위/상태 |
| 지점 | `branch` | 현재는 1개 지점만 운영하지만 향후 다지점 확장 예정. 모든 운영 데이터 테이블은 `branch_id` 컬럼을 갖는다 (PRD 5장 Out of Scope 참고) |
| 입주자 | `tenant` | 방을 계약해 거주하는 사람. 테이블: `tenants` |
| 이용일수 | (계산값, 컬럼 아님) | 해당 월의 날짜 범위와 입주자 계약기간의 교집합 일수 |

## Supabase 새 테이블 체크리스트

`public` 스키마에 새 테이블을 추가할 때마다 아래 3가지를 빠짐없이 마이그레이션에 포함한다 (하나라도 빠지면 RLS를 만들어도 실제로는 막히거나 뚫린다):

1. **`branch_id`** 컬럼 (`uuid not null references branches(id) default '00000000-0000-0000-0000-000000000001'`) — 운영 데이터 테이블(설정용 테이블 제외)이라면 필수
2. **RLS 활성화 + 정책** (`alter table ... enable row level security`, 이후 `authenticated`/`anon` 정책)
3. **GRANT** — 이 프로젝트는 Supabase CLI의 `auto_expose_new_tables`가 꺼져 있어(`supabase/config.toml`), RLS 정책만 만들면 `anon`/`authenticated` 모두 `42501 permission denied`로 막힌다. 반드시 `grant select on <table> to anon` (필요한 테이블만), `grant select, insert, update, delete on <table> to authenticated`를 함께 마이그레이션해야 한다. 이미 원격에 배포된 예시: `supabase/migrations/20260724054208_grant_data_api_roles.sql`

의도적으로 `alter default privileges`(신규 테이블에 자동으로 grant가 걸리는 설정)를 쓰지 않는다 — 매번 명시적으로 grant를 적어야, "깜빡하고 넣은 새 테이블이 자동으로 anon에 공개되는" 사고를 막을 수 있다.

## 알려진 잔여 리스크 (의도된 트레이드오프)

- **`updated_at` 컬럼에 자동 갱신 트리거가 없다.** `tenants`/`maintenance_fee_items`/`announcements` 모두 `default now()`로 insert 시점만 채워지고, update 시 자동으로 갱신되지 않는다. 화면 구현 시 update 쿼리에서 `updated_at: new Date()`를 직접 세팅하거나, 필요해지면 트리거 마이그레이션을 추가한다.
- **영수증 이미지(`receipts` 버킷)는 public이라 URL만 알면 인증 없이 접근 가능하다.** `maintenance_fee_items`의 RLS가 "어떤 정산월이 게시됐는지" 목록 자체는 막아주지만, 이미 알고 있는 이미지 경로(UUID 기반이라 추측은 어려움)에 직접 접근하는 것은 막지 않는다. 화면 1(운영자)과 화면 3(공개 조회) 양쪽에서 이미지가 보여야 한다는 요구사항 때문에 의도적으로 선택한 트레이드오프다. 보안 요구가 높아지면 private 버킷 + signed URL 방식으로 전환을 검토한다.

## 참고

- 계산 로직(일할계산 등)은 PRD의 "계산 로직" 섹션이 유일한 출처. 반올림은 항목 합산 시점에 1회만 수행.
- 코드 컨벤션은 [토스 Frontend Fundamentals](https://frontend-fundamentals.com/code-quality/) 참고.
