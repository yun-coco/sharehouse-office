-- service_role의 PostgREST(REST API) 경유 접근 권한 부여
-- 순수 SQL 마이그레이션으로 테이블을 생성하면 anon/authenticated/service_role에
-- 자동으로 GRANT가 붙지 않는다. Task 4(service role client)와 Task 6/7
-- (목록조회/CRUD Server Action)이 Supabase JS client(REST API 경유)로
-- houses/tenants/settlement_periods/maintenance_fee_items 테이블에 접근하므로
-- 이 GRANT가 없으면 전부 42501 permission denied로 실패한다.
--
-- RLS는 이미 각 테이블에 활성화되어 있고 정책도 있지만, service_role은
-- Supabase에서 기본적으로 RLS를 우회하는 롤이다. 따라서 authenticated/anon에
-- 대한 GRANT는 이번 스코프에서는 다루지 않고(현재는 service_role만 REST로
-- 이 테이블에 접근), service_role에 대한 GRANT만 추가한다.

grant usage on schema public to service_role;
grant select, insert, update, delete on public.houses to service_role;
grant select, insert, update, delete on public.tenants to service_role;
grant select, insert, update, delete on public.settlement_periods to service_role;
grant select, insert, update, delete on public.maintenance_fee_items to service_role;
