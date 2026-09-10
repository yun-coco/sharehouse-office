import { listTenants } from "@/lib/tenants/queries";
import { TenantTable } from "./tenant-table";

export default async function TenantsPage({
  params,
}: {
  params: Promise<{ houseId: string }>;
}) {
  const { houseId } = await params;
  const tenants = await listTenants(houseId);

  return (
    <div className="flex flex-col gap-6 px-8 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold tracking-tight text-[#1a1a1a]">
          입주자 관리
        </h1>
        {/* Task 11에서 "입주자 추가" 버튼 연결 */}
      </div>
      <TenantTable tenants={tenants} houseId={houseId} />
    </div>
  );
}
