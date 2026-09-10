-- 네이밍 변경: "정산 대시보드" → "관리비 정산"
-- settlement_period(정산월) 관련 테이블/컬럼/제약/인덱스 이름을
-- maintenance_fee_settlement_period 네이밍으로 통일한다.
--
-- 배경: .superpowers/naming-change/brief.md
-- - settlement_periods 테이블 → maintenance_fee_settlement_periods
-- - maintenance_fee_items.settlement_period_id 컬럼 → maintenance_fee_settlement_period_id
-- - 위 테이블/컬럼에 종속된 제약(constraint)·인덱스 이름도 함께 rename
--
-- 주의: settlement(정산 행위 자체, is_finalized 등)는 이번 변경 대상이 아니다.
-- tenants/houses 테이블 및 관련 마이그레이션은 건드리지 않는다.
--
-- 적용 전 원격 DB(pg_constraint, pg_indexes, pg_policies)를 조회해 실제
-- 존재하는 이름을 확인했다 (아래 이름은 추정이 아니라 조회 결과 기준):
--   settlement_periods_pkey (PK)
--   settlement_periods_house_id_fkey (FK -> houses)
--   settlement_periods_house_year_month_unique (UNIQUE, 동일 이름의 backing index 포함)
--   settlement_periods_year_month_format (CHECK)
--   settlement_periods_house_id_idx (INDEX)
--   maintenance_fee_items_pkey (PK)
--   maintenance_fee_items_settlement_period_id_fkey (FK -> settlement_periods)
--   maintenance_fee_items_settlement_period_id_idx (INDEX)
--   maintenance_fee_items_period_valid (CHECK, 컬럼명과 무관 - rename 불필요)
--   maintenance_fee_items_amount_check (CHECK, 컬럼명과 무관 - rename 불필요)
--
-- RLS 정책("Owners can manage settlement periods in their own houses" 등)은
-- 테이블 rename 시 정책 자체의 이름 변경 없이 자동으로 새 테이블명을 따라간다
-- (Postgres는 정책을 테이블 OID로 연결하므로 rename 후에도 그대로 유효).

-- ─────────────────────────────────────────────
-- 1. 테이블 rename
-- ─────────────────────────────────────────────
alter table settlement_periods rename to maintenance_fee_settlement_periods;

-- ─────────────────────────────────────────────
-- 2. 컬럼 rename
-- ─────────────────────────────────────────────
alter table maintenance_fee_items
  rename column settlement_period_id to maintenance_fee_settlement_period_id;

-- ─────────────────────────────────────────────
-- 3. 제약(constraint) rename
--    (unique 제약은 rename constraint로 처리하면 backing index도 함께 rename됨)
-- ─────────────────────────────────────────────
alter table maintenance_fee_settlement_periods
  rename constraint settlement_periods_pkey to maintenance_fee_settlement_periods_pkey;

alter table maintenance_fee_settlement_periods
  rename constraint settlement_periods_house_id_fkey to maintenance_fee_settlement_periods_house_id_fkey;

alter table maintenance_fee_settlement_periods
  rename constraint settlement_periods_house_year_month_unique to maintenance_fee_settlement_periods_house_year_month_unique;

alter table maintenance_fee_settlement_periods
  rename constraint settlement_periods_year_month_format to maintenance_fee_settlement_periods_year_month_format;

alter table maintenance_fee_items
  rename constraint maintenance_fee_items_settlement_period_id_fkey to maintenance_fee_items_maintenance_fee_settlement_period_id_fkey;

-- ─────────────────────────────────────────────
-- 4. 인덱스 rename (제약에 종속되지 않는 순수 인덱스만 별도 처리)
-- ─────────────────────────────────────────────
alter index settlement_periods_house_id_idx rename to maintenance_fee_settlement_periods_house_id_idx;
alter index maintenance_fee_items_settlement_period_id_idx rename to maintenance_fee_items_maintenance_fee_settlement_period_id_idx;
