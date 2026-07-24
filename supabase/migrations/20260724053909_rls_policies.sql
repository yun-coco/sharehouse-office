alter table branches enable row level security;
alter table settlement_periods enable row level security;
alter table tenants enable row level security;
alter table maintenance_fee_items enable row level security;
alter table announcements enable row level security;

-- branches: 인증된 사용자만 조회 (설정용 테이블, 공개 노출 불필요)
create policy "branches_select_authenticated"
  on branches for select
  to authenticated
  using (true);

-- settlement_periods: 운영자는 전체 CRUD, 익명은 게시된 행만 조회
create policy "settlement_periods_all_authenticated"
  on settlement_periods for all
  to authenticated
  using (true)
  with check (true);

create policy "settlement_periods_select_published_anon"
  on settlement_periods for select
  to anon
  using (is_published = true);

-- tenants: 운영자만 전체 CRUD. 익명 접근 없음 (PRD 화면 2는 로그인 필수)
create policy "tenants_all_authenticated"
  on tenants for all
  to authenticated
  using (true)
  with check (true);

-- maintenance_fee_items: 운영자만 CRUD. 익명은 "게시된 정산월"에 속한 항목만 조회 가능
-- (화면 3에서 영수증 이미지를 보여줘야 하므로 익명 SELECT 허용, 단 게시 여부로 제한)
create policy "maintenance_fee_items_all_authenticated"
  on maintenance_fee_items for all
  to authenticated
  using (true)
  with check (true);

create policy "maintenance_fee_items_select_published_anon"
  on maintenance_fee_items for select
  to anon
  using (
    exists (
      select 1 from settlement_periods sp
      where sp.id = maintenance_fee_items.settlement_period_id
        and sp.is_published = true
    )
  );

-- announcements: 운영자만 CRUD, 익명은 전체 조회 가능
-- (공지사항은 특정 정산월에 종속되지 않는 목록이라 게시 여부와 무관하게 노출 — PRD 화면 3 UI 요소)
create policy "announcements_all_authenticated"
  on announcements for all
  to authenticated
  using (true)
  with check (true);

create policy "announcements_select_anon"
  on announcements for select
  to anon
  using (true);
