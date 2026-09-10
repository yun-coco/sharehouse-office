"use client";

import type { Tenant } from "@/lib/tenants/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TenantSheet } from "./tenant-sheet";
import { DeleteTenantButton } from "./delete-tenant-button";
import { Button } from "@/components/ui/button";

const SAMPLE_TENANTS: Tenant[] = [
  {
    id: "sample-1",
    houseId: "",
    name: "김민준",
    moveInDate: "2026-03-01",
    moveOutDate: "2026-09-30",
    memo: "장기 계약, 조용한 방 선호",
    createdAt: "",
    deletedAt: null,
  },
  {
    id: "sample-2",
    houseId: "",
    name: "이서연",
    moveInDate: "2026-05-15",
    moveOutDate: "2026-11-14",
    memo: null,
    createdAt: "",
    deletedAt: null,
  },
  {
    id: "sample-3",
    houseId: "",
    name: "박도윤",
    moveInDate: "2026-01-10",
    moveOutDate: "2026-07-09",
    memo: "반려동물 동반",
    createdAt: "",
    deletedAt: null,
  },
];

/** ISO 날짜 문자열("2026-03-01")을 "2026.03.01" 형식으로 변환한다. */
function formatDate(iso: string) {
  return iso.replaceAll("-", ".");
}

export function TenantTable({
  tenants,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Task 11(삭제 버튼)에서 사용 예정
  houseId,
}: {
  tenants: Tenant[];
  houseId: string;
}) {
  const isEmpty = tenants.length === 0;
  const rows = isEmpty ? SAMPLE_TENANTS : tenants;

  return (
    <div className="overflow-hidden rounded-xl border border-[#e6e6e6] bg-white">
      {isEmpty && (
        <p className="border-b border-[#e6e6e6] bg-[#f6f5f4] px-5 py-2.5 text-xs text-[#a39e98]">
          아직 등록된 입주자가 없습니다. 아래는 예시 데이터입니다 — 입주자를 추가하면 이렇게 표시됩니다.
        </p>
      )}
      <Table className="text-[13.5px]">
        <TableHeader>
          <TableRow className="border-b-0 bg-[#f6f5f4] text-left text-[11px] font-semibold uppercase tracking-wide text-[#a39e98] hover:bg-[#f6f5f4]">
            <TableHead className="h-auto px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#a39e98]">
              이름
            </TableHead>
            <TableHead className="h-auto px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#a39e98]">
              입실일
            </TableHead>
            <TableHead className="h-auto px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#a39e98]">
              퇴실일
            </TableHead>
            <TableHead className="h-auto px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#a39e98]">
              메모
            </TableHead>
            <TableHead className="h-auto px-5 py-2.5" />
          </TableRow>
        </TableHeader>
        <TableBody className={isEmpty ? "opacity-50" : undefined}>
          {rows.map((tenant) => (
            <TableRow
              key={tenant.id}
              className="border-t border-[#e6e6e6] hover:bg-transparent"
            >
              <TableCell className="px-5 py-3 font-semibold text-[#1a1a1a]">
                {tenant.name}
              </TableCell>
              <TableCell className="px-5 py-3 text-[#31302e]">
                {formatDate(tenant.moveInDate)}
              </TableCell>
              <TableCell className="px-5 py-3 text-[#31302e]">
                {formatDate(tenant.moveOutDate)}
              </TableCell>
              <TableCell className="px-5 py-3 whitespace-normal text-[#615d59]">
                {tenant.memo ?? "-"}
              </TableCell>
              <TableCell className="px-5 py-3 text-right">
                {!isEmpty && (
                  <div className="flex justify-end gap-2">
                    <TenantSheet
                      mode="edit"
                      tenant={tenant}
                      trigger={
                        <Button variant="ghost" size="sm">
                          수정
                        </Button>
                      }
                    />
                    <DeleteTenantButton tenant={tenant} />
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
