import { Download } from "lucide-react";
import { mockTenantFees, formatWon, formatDate } from "@/components/mock/settlementMockData";

interface TenantFeeTableProps {
  empty?: boolean;
}

/** 입주자별 관리비 표. 읽기 전용(편집/삭제 없음). 계산 로직은 이번 범위 밖 — mock 최종값만 표시. */
export function TenantFeeTable({ empty = false }: TenantFeeTableProps) {
  const rows = empty ? [] : mockTenantFees;

  const table = (
    <>
      <table className="hidden w-full border-collapse text-[13px] md:table">
        <thead>
          <tr className="border-b border-[#edece9] text-[#9b9a97]">
            <th className="p-2 text-center font-semibold">이름</th>
            <th className="p-2 text-center font-semibold">시작일</th>
            <th className="p-2 text-center font-semibold">종료일</th>
            <th className="p-2 text-center font-semibold">이용일수</th>
            <th className="p-2 text-center font-semibold">관리비</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id} className="border-b border-[#f1f1ef]">
              <td className="p-2.5 text-center font-bold text-[#1a1a1a]">{t.name}</td>
              <td className="p-2.5 text-center text-[#37352f]">{formatDate(t.start)}</td>
              <td className="p-2.5 text-center text-[#37352f]">{formatDate(t.end)}</td>
              <td className="p-2.5 text-center text-[#37352f]">{t.days}일</td>
              <td className="p-2.5 text-right font-bold text-[#1a1a1a]">{formatWon(t.fee)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-col md:hidden">
        {rows.map((t) => (
          <div key={t.id} className="border-b border-[#f1f1ef] py-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#2f6f52]">{t.name}</span>
              <span className="text-sm font-extrabold text-[#1a1a1a]">{formatWon(t.fee)}</span>
            </div>
            <div className="mt-1 text-xs text-[#6b6b62]">
              {formatDate(t.start)} ~ {formatDate(t.end)} · {t.days}일 이용
            </div>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <div className="text-xl font-bold whitespace-nowrap text-[#1a1a1a]">🧾 입주자별 관리비</div>
        <button
          type="button"
          className="inline-flex min-h-[44px] items-center gap-1 border-none bg-transparent text-[11px] text-[#b3b2ab] underline"
        >
          <Download width={16} height={16} />
          이미지 저장
        </button>
      </div>

      {empty ? (
        <div className="relative">
          <div className="pointer-events-none opacity-55 blur-[3px] select-none">{table}</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-lg border border-[#e3e1db] bg-[rgba(255,255,255,0.92)] px-6 py-3 text-[13px] font-semibold whitespace-nowrap text-[#6b6b62] shadow-[0_6px_20px_rgba(0,0,0,0.08)]">
              정산할 입주자가 없어요
            </div>
          </div>
        </div>
      ) : (
        table
      )}
    </div>
  );
}
