import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { Tenant } from "../type/tenant";

type TenantRow = {
  id: string;
  house_id: string;
  name: string;
  move_in_date: string;
  move_out_date: string;
  memo: string | null;
  created_at: string;
  deleted_at: string | null;
};

function toTenant(row: TenantRow): Tenant {
  return {
    id: row.id,
    houseId: row.house_id,
    name: row.name,
    moveInDate: row.move_in_date,
    moveOutDate: row.move_out_date,
    memo: row.memo,
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
  };
}

export async function listTenants(houseId: string): Promise<Tenant[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("id, house_id, name, move_in_date, move_out_date, memo, created_at, deleted_at")
    .eq("house_id", houseId)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`입주자 목록 조회 실패: ${error.message}`);
  }

  return (data ?? []).map(toTenant);
}
