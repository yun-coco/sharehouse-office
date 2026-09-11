import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@/api/supabase/service-role";

export default async function HousesIndexPage() {
  const supabase = createServiceRoleClient();
  const { data: house } = await supabase
    .from("houses")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (!house) {
    return (
      <div className="flex flex-1 items-center justify-center px-8 py-6">
        <p className="text-sm text-[#8a8781]">등록된 지점이 없습니다.</p>
      </div>
    );
  }

  redirect(`/houses/${house.id}/tenants`);
}
