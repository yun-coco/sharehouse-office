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
-- 인증이 아직 없어 owner_id로 쓸 실제 auth.users row를 지정해야 한다.
--
-- 원래 계획은 개발 전용 auth.users row(placeholder 계정)를 새로 만들어
-- 그 소유로 house를 만드는 것이었으나, Supabase 마이그레이션은
-- 일반 DB 롤(권한) 컨텍스트로 실행되어 auth.users에 대한 직접 INSERT
-- 권한이 없고(및/또는 auth 스키마의 트리거·컬럼 구성이 버전에 따라
-- 달라 값 불일치가 날 수 있어) 마이그레이션 내 INSERT가 위험하다고
-- 판단했다. 사전 조율된 방침에 따라 대안 1(대시보드/Admin API로 이미
-- 존재하는 실제 auth 유저의 id를 owner_id로 사용)을 적용한다.
--
-- 이 프로젝트의 Supabase 프로젝트(ref: ypnrxlejodwpbofudkhk)에는 이미
-- 구글 로그인으로 생성된 실제 유저가 하나 존재한다
-- (email: yunjeong.dev.2173@gmail.com). 그 유저의 id를 개발용 시드
-- house의 owner_id로 사용해 FK 참조 무결성을 유지한다.
--
-- service role key로 RLS를 우회하는 개발 단계에서는 owner_id가 실제
-- 로그인 유저와 다르더라도 당장 문제되지 않지만, 여기서는 실제 유저의
-- id를 써서 향후 로그인 연동 시에도 바로 맞아떨어지게 한다.
-- 이 시드는 로그인이 정식으로 붙는 시점에 별도 작업으로 재검토/제거된다.
-- ─────────────────────────────────────────────

insert into houses (id, owner_id, name)
values (
  '00000000-0000-0000-0000-000000000001',
  '214f2a29-a992-4010-84a4-1f1850e13da6',
  '개발용 하우스'
)
on conflict (id) do nothing;
