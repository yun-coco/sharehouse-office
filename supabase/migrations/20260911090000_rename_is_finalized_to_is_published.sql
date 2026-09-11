-- 개념 변경: "확정(finalize)" → "게시(publish)"
-- 관리비 정산은 잠금 개념의 "확정"이 아니라, 입주자에게 정보 공개 여부를 나타내는
-- "게시"로 재정의되었다. 게시 후에도 관리비 항목/입주자 데이터는 자유롭게 수정 가능하다.
--
-- 배경: docs/sharehouse-office-prd.md 4.1.1,
--       docs/superpowers/specs/2026-09-10-maintenance-fee-settlement-design.md

alter table maintenance_fee_settlement_periods
  rename column is_finalized to is_published;
