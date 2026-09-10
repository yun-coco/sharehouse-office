import { notFound } from "next/navigation";
import { listTenants } from "@/lib/tenants/queries";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { TenantTable } from "./tenant-table";
import { TenantSheet } from "./tenant-sheet";
import { Button } from "@/components/ui/button";

export default async function TenantsPage({
  params,
}: {
  params: Promise<{ houseId: string }>;
}) {
  const { houseId } = await params;

  const supabase = createServiceRoleClient();
  const { data: house } = await supabase
    .from("houses")
    .select("id")
    .eq("id", houseId)
    .maybeSingle();

  if (!house) {
    notFound();
  }

  const tenants = await listTenants(houseId);

  return (
    <div className="flex flex-col gap-6 px-8 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold tracking-tight text-[#1a1a1a]">
          입주자 관리
        </h1>
        <TenantSheet
          mode="create"
          houseId={houseId}
          trigger={<Button>입주자 추가</Button>}
        />
      </div>
      <TenantTable tenants={tenants} houseId={houseId} />
    </div>
  );
}
