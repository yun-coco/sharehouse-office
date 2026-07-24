alter table expense_items
  add column branch_id uuid not null references branches(id) default '00000000-0000-0000-0000-000000000001';

create index if not exists expense_items_branch_id_idx
  on expense_items (branch_id);
