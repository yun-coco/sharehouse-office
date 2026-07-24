-- 이 프로젝트의 Supabase CLI 설정(config.toml [api] `auto_expose_new_tables` 미설정 상태,
-- "new cloud default")에서는 public 스키마의 신규 테이블이 anon/authenticated 롤에
-- 자동으로 GRANT되지 않는다.
--
-- RLS 정책(USING/WITH CHECK)은 "이미 테이블 접근 권한(GRANT)이 있는 롤"의 행을 필터링할 뿐,
-- 접근 권한 자체를 부여하지는 않는다. 이 GRANT가 없으면 0002_rls_policies.sql에서 만든 정책과
-- 무관하게 PostgREST 요청이 모두 42501 permission denied로 막힌다
-- (원격 배포 후 anon key로 REST API를 호출해 실제로 이 문제를 확인함).
--
-- TRUNCATE/REFERENCES/TRIGGER 등은 애플리케이션 롤에 불필요하므로 부여하지 않는다.
grant select, insert, update, delete on branches to authenticated;

grant select, insert, update, delete on settlement_periods to authenticated;
grant select on settlement_periods to anon;

grant select, insert, update, delete on tenants to authenticated;

grant select, insert, update, delete on maintenance_fee_items to authenticated;
grant select on maintenance_fee_items to anon;

grant select, insert, update, delete on announcements to authenticated;
grant select on announcements to anon;
