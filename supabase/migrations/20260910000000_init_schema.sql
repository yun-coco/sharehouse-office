-- 쉐어하우스 관리사무소 초기 스키마
-- 도메인 용어집: docs/../CLAUDE.md 참고 (house/tenant/maintenance_fee/settlement_period)
--
-- 범위: 지점(houses), 입주자(tenants), 정산월(settlement_periods),
--       관리비 항목(maintenance_fee_items)
-- 범위 외 (다음 사이클): house_members, 세분화된 권한 체계

-- ─────────────────────────────────────────────
-- houses: 지점 (owner가 여러 개 소유 가능)
-- ─────────────────────────────────────────────
create table houses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index houses_owner_id_idx on houses using btree (owner_id);

alter table houses enable row level security;

create policy "Owners can manage their own houses"
on houses for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

-- ─────────────────────────────────────────────
-- tenants: 입주자 (PRD 4.1.2)
-- ─────────────────────────────────────────────
create table tenants (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references houses (id) on delete cascade,
  name text not null,
  move_in_date date not null,
  move_out_date date,
  created_at timestamptz not null default now(),

  constraint tenants_move_out_after_move_in
    check (move_out_date is null or move_out_date >= move_in_date)
);

create index tenants_house_id_idx on tenants using btree (house_id);

alter table tenants enable row level security;

create policy "Owners can manage tenants in their own houses"
on tenants for all
to authenticated
using (
  house_id in (select id from houses where owner_id = (select auth.uid()))
)
with check (
  house_id in (select id from houses where owner_id = (select auth.uid()))
);

-- ─────────────────────────────────────────────
-- settlement_periods: 정산월 (PRD 4.1.1)
-- ─────────────────────────────────────────────
create table settlement_periods (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references houses (id) on delete cascade,
  year_month text not null, -- 예: '2026-09'
  is_finalized boolean not null default false,
  created_at timestamptz not null default now(),

  constraint settlement_periods_year_month_format
    check (year_month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  constraint settlement_periods_house_year_month_unique
    unique (house_id, year_month)
);

create index settlement_periods_house_id_idx on settlement_periods using btree (house_id);

alter table settlement_periods enable row level security;

create policy "Owners can manage settlement periods in their own houses"
on settlement_periods for all
to authenticated
using (
  house_id in (select id from houses where owner_id = (select auth.uid()))
)
with check (
  house_id in (select id from houses where owner_id = (select auth.uid()))
);

-- ─────────────────────────────────────────────
-- maintenance_fee_items: 관리비 항목 (가스비·전기세·수도세 등)
-- ─────────────────────────────────────────────
create table maintenance_fee_items (
  id uuid primary key default gen_random_uuid(),
  settlement_period_id uuid not null references settlement_periods (id) on delete cascade,
  name text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  period_start date not null,
  period_end date not null,
  created_at timestamptz not null default now(),

  constraint maintenance_fee_items_period_valid
    check (period_end >= period_start)
);

create index maintenance_fee_items_settlement_period_id_idx
  on maintenance_fee_items using btree (settlement_period_id);

alter table maintenance_fee_items enable row level security;

create policy "Owners can manage fee items in their own houses' settlements"
on maintenance_fee_items for all
to authenticated
using (
  settlement_period_id in (
    select sp.id
    from settlement_periods sp
    join houses h on h.id = sp.house_id
    where h.owner_id = (select auth.uid())
  )
)
with check (
  settlement_period_id in (
    select sp.id
    from settlement_periods sp
    join houses h on h.id = sp.house_id
    where h.owner_id = (select auth.uid())
  )
);
