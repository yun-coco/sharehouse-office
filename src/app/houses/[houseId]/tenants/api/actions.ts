"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/api/supabase/service-role";
import { validateTenantInput } from "../util/validation";
import type { TenantInput } from "../type/tenant";

export type ActionResult =
  | { ok: true; tenantId?: string }
  | { ok: false; errors: Record<string, string> };

/** TenantInput을 DB 컬럼 형태로 변환한다. */
function toDbInput(input: TenantInput) {
  return {
    name: input.name.trim(),
    move_in_date: input.moveInDate,
    move_out_date: input.moveOutDate,
    memo: input.memo?.trim() || null,
  };
}

/** 새 입주자를 생성한다. */
export async function createTenant(
  houseId: string,
  input: TenantInput,
): Promise<ActionResult> {
  const validation = validateTenantInput(input);
  if (!validation.ok) {
    return { ok: false, errors: validation.errors };
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("tenants")
    .insert({ house_id: houseId, ...toDbInput(input) })
    .select("id")
    .single();

  if (error) {
    return { ok: false, errors: { form: error.message } };
  }

  revalidatePath(`/houses/${houseId}/tenants`);
  return { ok: true, tenantId: data.id };
}

/** 기존 입주자 정보를 수정한다. */
export async function updateTenant(
  tenantId: string,
  input: TenantInput,
): Promise<ActionResult> {
  const validation = validateTenantInput(input);
  if (!validation.ok) {
    return { ok: false, errors: validation.errors };
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("tenants")
    .update(toDbInput(input))
    .eq("id", tenantId)
    .select("house_id")
    .single();

  if (error) {
    return {
      ok: false,
      errors: {
        form:
          error.code === "PGRST116"
            ? "해당 입주자를 찾을 수 없습니다."
            : error.message,
      },
    };
  }

  revalidatePath(`/houses/${data.house_id}/tenants`);
  return { ok: true, tenantId };
}

/** 입주자를 soft-delete 처리한다 (deleted_at 설정). */
export async function deleteTenant(tenantId: string): Promise<ActionResult> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("tenants")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", tenantId)
    .select("house_id")
    .single();

  if (error) {
    return {
      ok: false,
      errors: {
        form:
          error.code === "PGRST116"
            ? "해당 입주자를 찾을 수 없습니다."
            : error.message,
      },
    };
  }

  revalidatePath(`/houses/${data.house_id}/tenants`);
  return { ok: true, tenantId };
}

/** soft-delete된 입주자를 복원한다 (deleted_at 해제). */
export async function undoDeleteTenant(tenantId: string): Promise<ActionResult> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("tenants")
    .update({ deleted_at: null })
    .eq("id", tenantId)
    .select("house_id")
    .single();

  if (error) {
    return {
      ok: false,
      errors: {
        form:
          error.code === "PGRST116"
            ? "해당 입주자를 찾을 수 없습니다."
            : error.message,
      },
    };
  }

  revalidatePath(`/houses/${data.house_id}/tenants`);
  return { ok: true, tenantId };
}
