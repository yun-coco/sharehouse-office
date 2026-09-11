"use client";

import { useState, type ReactElement } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/ui/atoms/sheet";
import { Button } from "@/ui/atoms/button";
import { Input } from "@/ui/atoms/input";
import { Label } from "@/ui/atoms/label";
import { Textarea } from "@/ui/atoms/textarea";
import { createTenant, updateTenant } from "../../api/actions";
import type { Tenant, TenantInput } from "../../type/tenant";

type Props =
  | { mode: "create"; houseId: string; trigger: React.ReactNode }
  | { mode: "edit"; tenant: Tenant; trigger: React.ReactNode };

export function TenantSheet(props: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const initial: TenantInput =
    props.mode === "edit"
      ? {
          name: props.tenant.name,
          moveInDate: props.tenant.moveInDate,
          moveOutDate: props.tenant.moveOutDate,
          memo: props.tenant.memo,
        }
      : { name: "", moveInDate: "", moveOutDate: "", memo: null };

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setErrors({});

    const input: TenantInput = {
      name: String(formData.get("name") ?? ""),
      moveInDate: String(formData.get("moveInDate") ?? ""),
      moveOutDate: String(formData.get("moveOutDate") ?? ""),
      memo: String(formData.get("memo") ?? "") || null,
    };

    const result =
      props.mode === "create"
        ? await createTenant(props.houseId, input)
        : await updateTenant(props.tenant.id, input);

    setPending(false);

    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    toast.success(
      props.mode === "create"
        ? `${input.name}님을 추가했습니다.`
        : `${input.name}님 정보를 수정했습니다.`,
    );
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={props.trigger as ReactElement} />
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {props.mode === "create" ? "입주자 추가" : "입주자 정보 수정"}
          </SheetTitle>
        </SheetHeader>
        <form
          action={handleSubmit}
          className="flex flex-col gap-4 px-4 pb-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">이름</Label>
            <Input id="name" name="name" defaultValue={initial.name} required />
            {errors.name && (
              <p className="text-xs text-red-600">{errors.name}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="moveInDate">입실일</Label>
            <Input
              id="moveInDate"
              name="moveInDate"
              type="date"
              defaultValue={initial.moveInDate}
              required
            />
            {errors.moveInDate && (
              <p className="text-xs text-red-600">{errors.moveInDate}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="moveOutDate">퇴실일</Label>
            <Input
              id="moveOutDate"
              name="moveOutDate"
              type="date"
              defaultValue={initial.moveOutDate}
              required
            />
            {errors.moveOutDate && (
              <p className="text-xs text-red-600">{errors.moveOutDate}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="memo">메모</Label>
            <Textarea id="memo" name="memo" defaultValue={initial.memo ?? ""} />
          </div>

          {errors.form && (
            <p className="text-xs text-red-600">{errors.form}</p>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? "저장 중..." : "저장"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
