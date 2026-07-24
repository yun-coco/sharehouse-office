-- 지점 확장 대비: 이번 버전은 단일 지점 고정 UUID만 사용
create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  name text not null default '기본 지점',
  created_at timestamptz not null default now()
);

insert into branches (id, name)
values ('00000000-0000-0000-0000-000000000001', '기본 지점')
on conflict (id) do nothing;

-- 정산월 단위. 게시(publish) 상태를 이 테이블이 관리한다.
create table if not exists settlement_periods (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branches(id) default '00000000-0000-0000-0000-000000000001',
  year int not null,
  month int not null check (month between 1 and 12),
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (branch_id, year, month)
);

-- 입주자. 계약기간이 정산 대상 포함 여부를 결정한다 (PRD 화면 2).
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branches(id) default '00000000-0000-0000-0000-000000000001',
  name text not null,
  room text not null,
  contract_start date not null,
  contract_end date not null,
  monthly_fee numeric(12, 2) not null,
  discount_reason text,
  discount_amount numeric(12, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contract_end_after_start check (contract_end >= contract_start)
);

-- 항목 종류: 가스비/전기세/수도세/인터넷은 월 1건, 공용물품은 다건 허용 (PRD 화면 1)
create type expense_category as enum ('gas', 'electricity', 'water', 'internet', 'supplies');

create table if not exists expense_items (
  id uuid primary key default gen_random_uuid(),
  settlement_period_id uuid not null references settlement_periods(id) on delete cascade,
  category expense_category not null,
  start_date date not null,
  end_date date, -- 공용물품은 구매일만 있고 종료일 없음 (PRD 계산 로직 1)
  amount numeric(12, 2) not null,
  memo text,
  receipt_image_path text, -- Storage 버킷 내 경로
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 월 1건 성격 항목(가스비/전기세/수도세/인터넷) 중복 입력 방지 (PRD 화면 1)
create unique index if not exists expense_items_one_per_period_category
  on expense_items (settlement_period_id, category)
  where category <> 'supplies';

-- 공지사항. display_order로 드래그 정렬 순서 관리 (PRD 화면 1 섹션 0)
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branches(id) default '00000000-0000-0000-0000-000000000001',
  title text not null,
  body text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expense_items_settlement_period_id_idx
  on expense_items (settlement_period_id);

create index if not exists announcements_branch_display_order_idx
  on announcements (branch_id, display_order);
