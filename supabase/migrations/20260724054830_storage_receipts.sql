-- 영수증 이미지 저장용 Storage 버킷.
-- Public 버킷으로 두어 화면 1(운영자)과 화면 3(공개 조회, 게시된 월만) 양쪽에서
-- 이미지를 조회할 수 있게 한다. maintenance_fee_items(구 expense_items) RLS로 이미
-- 게시 여부를 걸러둔 상태이므로, 버킷 조회 권한은 public으로 열어도 안전하다.
-- 업로드/수정/삭제는 인증된 사용자만 허용한다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

-- 업로드/수정/삭제는 인증된 사용자만
create policy "receipts_insert_authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'receipts');

create policy "receipts_update_authenticated"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'receipts');

create policy "receipts_delete_authenticated"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'receipts');

-- 조회는 public 버킷이므로 별도 정책 불필요 (public read는 버킷 설정으로 처리됨)
