import { describe, it, expect, afterEach } from "vitest";
import { createServiceRoleClient, DEV_HOUSE_ID } from "@/api/supabase/service-role";
import { listTenants } from "./queries";

describe("listTenants", () => {
  const createdIds: string[] = [];

  afterEach(async () => {
    const supabase = createServiceRoleClient();
    if (createdIds.length > 0) {
      await supabase.from("tenants").delete().in("id", createdIds);
      createdIds.length = 0;
    }
  });

  it("이름 가나다순으로 정렬되어 반환된다", async () => {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from("tenants")
      .insert([
        { house_id: DEV_HOUSE_ID, name: "홍길동", move_in_date: "2026-01-01", move_out_date: "2026-12-31" },
        { house_id: DEV_HOUSE_ID, name: "김철수", move_in_date: "2026-01-01", move_out_date: "2026-12-31" },
      ])
      .select("id");
    createdIds.push(...(data ?? []).map((row) => row.id));

    const tenants = await listTenants(DEV_HOUSE_ID);
    const names = tenants.map((t) => t.name);
    const kimIndex = names.indexOf("김철수");
    const hongIndex = names.indexOf("홍길동");
    expect(kimIndex).toBeLessThan(hongIndex);
  });

  it("삭제된(deleted_at이 있는) 입주자는 제외된다", async () => {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from("tenants")
      .insert({
        house_id: DEV_HOUSE_ID,
        name: "삭제됨테스트",
        move_in_date: "2026-01-01",
        move_out_date: "2026-12-31",
        deleted_at: new Date().toISOString(),
      })
      .select("id");
    createdIds.push(...(data ?? []).map((row) => row.id));

    const tenants = await listTenants(DEV_HOUSE_ID);
    expect(tenants.some((t) => t.name === "삭제됨테스트")).toBe(false);
  });
});
