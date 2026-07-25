import { AnnouncementSection } from "@/components/settlement/AnnouncementSection";
import { ExpenseTable } from "@/components/settlement/ExpenseTable";
import { TenantFeeTable } from "@/components/settlement/TenantFeeTable";
import { SettlementPageShell } from "@/components/layout/SettlementPageShell";

function monthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-").map(Number);
  return `${year}년 ${month}월`;
}

/** 관리비 정산 화면. 이번 이식은 정적 마크업 + mock 데이터이며 Supabase 미연동. */
export default async function SettlementPage({
  params,
}: {
  params: Promise<{ yearMonth: string }>;
}) {
  const { yearMonth } = await params;

  return (
    <SettlementPageShell monthLabel={monthLabel(yearMonth)}>
      <div className="flex flex-col gap-[18px] px-[25px] pb-8">
        <AnnouncementSection />
        <ExpenseTable />
        <TenantFeeTable />
      </div>
    </SettlementPageShell>
  );
}
