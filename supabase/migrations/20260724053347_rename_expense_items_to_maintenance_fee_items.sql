-- expense_items는 이름이 너무 광범위하여(추후 매출 관리 등 다른 지출/수입 기능과 혼동 우려),
-- 이 테이블이 실제로 다루는 도메인 용어인 "관리비(maintenance fee)"로 명확히 리네임한다.
-- 테이블은 아직 비어있고(실 데이터 없음) 원격에 배포된 상태이므로, 기존 마이그레이션을 고치지 않고
-- rename 전용 마이그레이션으로 처리한다. FK/제약조건은 Postgres가 rename 시 자동으로 따라간다.

alter type expense_category rename to maintenance_fee_category;

alter table expense_items rename to maintenance_fee_items;

alter index expense_items_one_per_period_category rename to maintenance_fee_items_one_per_period_category;

alter index expense_items_settlement_period_id_idx rename to maintenance_fee_items_settlement_period_id_idx;

alter index expense_items_branch_id_idx rename to maintenance_fee_items_branch_id_idx;
