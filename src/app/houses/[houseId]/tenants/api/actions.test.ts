import { describe, it, expect, afterEach, vi } from "vitest";
import { createServiceRoleClient, DEV_HOUSE_ID } from "@/lib/supabase/service-role";
import { createTenant, updateTenant, deleteTenant, undoDeleteTenant } from "./actions";

// Vitest에는 Next.js의 요청 스코프(static generation store)가 없어
// actions.ts가 호출하는 revalidatePath가 그대로 실행되면 invariant 에러가 난다.
// 실제 앱 실행(Server Function 컨텍스트) 중에는 문제없이 동작하므로 테스트에서만 no-op으로 대체한다.
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("tenant server actions", () => {
  const createdIds: string[] = [];

  afterEach(async () => {
    const supabase = createServiceRoleClient();
    if (createdIds.length > 0) {
      await supabase.from("tenants").delete().in("id", createdIds);
      createdIds.length = 0;
    }
  });

  it("createTenant는 유효한 입력으로 입주자를 생성한다", async () => {
    const result = await createTenant(DEV_HOUSE_ID, {
      name: "테스트입주자",
      moveInDate: "2026-01-01",
      moveOutDate: "2026-12-31",
      memo: null,
    });
    expect(result.ok).toBe(true);
    if (result.ok && result.tenantId) {
      createdIds.push(result.tenantId);
    }
  });

  it("createTenant는 이름이 비어있으면 에러를 반환한다", async () => {
    const result = await createTenant(DEV_HOUSE_ID, {
      name: "",
      moveInDate: "2026-01-01",
      moveOutDate: "2026-12-31",
      memo: null,
    });
    expect(result.ok).toBe(false);
  });

  it("updateTenant는 기존 입주자 정보를 수정한다", async () => {
    const createResult = await createTenant(DEV_HOUSE_ID, {
      name: "수정전",
      moveInDate: "2026-01-01",
      moveOutDate: "2026-12-31",
      memo: null,
    });
    if (!createResult.ok || !createResult.tenantId) throw new Error("생성 실패");
    createdIds.push(createResult.tenantId);

    const updateResult = await updateTenant(createResult.tenantId, {
      name: "수정후",
      moveInDate: "2026-01-01",
      moveOutDate: "2026-12-31",
      memo: "메모 추가",
    });
    expect(updateResult.ok).toBe(true);

    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from("tenants")
      .select("name, memo")
      .eq("id", createResult.tenantId)
      .single();
    expect(data?.name).toBe("수정후");
    expect(data?.memo).toBe("메모 추가");
  });

  it("deleteTenant는 deleted_at을 설정하고, undoDeleteTenant는 되돌린다", async () => {
    const createResult = await createTenant(DEV_HOUSE_ID, {
      name: "삭제테스트",
      moveInDate: "2026-01-01",
      moveOutDate: "2026-12-31",
      memo: null,
    });
    if (!createResult.ok || !createResult.tenantId) throw new Error("생성 실패");
    createdIds.push(createResult.tenantId);

    const deleteResult = await deleteTenant(createResult.tenantId);
    expect(deleteResult.ok).toBe(true);

    const supabase = createServiceRoleClient();
    const afterDelete = await supabase
      .from("tenants")
      .select("deleted_at")
      .eq("id", createResult.tenantId)
      .single();
    expect(afterDelete.data?.deleted_at).not.toBeNull();

    const undoResult = await undoDeleteTenant(createResult.tenantId);
    expect(undoResult.ok).toBe(true);

    const afterUndo = await supabase
      .from("tenants")
      .select("deleted_at")
      .eq("id", createResult.tenantId)
      .single();
    expect(afterUndo.data?.deleted_at).toBeNull();
  });

  it("updateTenant는 존재하지 않는 입주자 id에 대해 한국어 에러 메시지를 반환한다", async () => {
    const result = await updateTenant("00000000-0000-0000-0000-000000000999", {
      name: "없는사람",
      moveInDate: "2026-01-01",
      moveOutDate: "2026-12-31",
      memo: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.form).toBe("해당 입주자를 찾을 수 없습니다.");
    }
  });
});
