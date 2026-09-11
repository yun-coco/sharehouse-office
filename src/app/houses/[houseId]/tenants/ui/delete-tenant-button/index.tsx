"use client";

import { toast } from "sonner";
import { Button } from "@/ui/atoms/button";
import { deleteTenant, undoDeleteTenant } from "../../api/actions";
import type { Tenant } from "../../type/tenant";

export function DeleteTenantButton({ tenant }: { tenant: Tenant }) {
  async function handleDelete() {
    const result = await deleteTenant(tenant.id);

    if (!result.ok) {
      toast.error(`삭제에 실패했습니다: ${result.errors.form ?? "알 수 없는 오류"}`);
      return;
    }

    toast(`${tenant.name}님을 삭제했습니다.`, {
      action: {
        label: "실행취소",
        onClick: async () => {
          const undoResult = await undoDeleteTenant(tenant.id);
          if (undoResult.ok) {
            toast.success(`${tenant.name}님을 복원했습니다.`);
          } else {
            toast.error("복원에 실패했습니다.");
          }
        },
      },
      duration: 5000,
    });
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleDelete}>
      삭제
    </Button>
  );
}
