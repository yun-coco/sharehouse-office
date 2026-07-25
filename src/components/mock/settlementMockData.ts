export type MaintenanceFeeCategory = "가스비" | "전기세" | "수도세" | "인터넷" | "공용물품";

export type ReceiptState = "uploaded" | "error" | "none";

export interface MaintenanceFeeItem {
  id: string;
  category: MaintenanceFeeCategory;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string | null;
  amount: number;
  memo: string;
  receiptState: ReceiptState;
}

export interface TenantFeeRow {
  id: string;
  name: string;
  start: string; // 'YYYY-MM-DD'
  end: string; // 'YYYY-MM-DD'
  days: number;
  fee: number; // 최종 관리비 (이미 계산된 mock 값)
}

export interface Announcement {
  id: string;
  title: string;
  text: string;
}

export const SINGLE_INSTANCE_CATEGORIES: MaintenanceFeeCategory[] = [
  "가스비",
  "전기세",
  "수도세",
  "인터넷",
];

export const CATEGORY_META: Record<MaintenanceFeeCategory, { bg: string; color: string }> = {
  가스비: { bg: "#fdece3", color: "#9a5b2e" },
  전기세: { bg: "#fef6da", color: "#8a6f10" },
  수도세: { bg: "#e2eef6", color: "#2f6690" },
  인터넷: { bg: "#ece7f6", color: "#5b4a91" },
  공용물품: { bg: "#eaf2ee", color: "#3d6b55" },
};

export const mockAnnouncements: Announcement[] = [
  {
    id: "ann-1",
    title: "정산 결과 안내",
    text: "이번 달 정산 결과는 7월 25일 이후에 게시될 예정이에요.",
  },
  {
    id: "ann-2",
    title: "세탁기 필터 교체 안내",
    text: "공용 세탁기 필터를 새로 교체했어요. 사용 후 꼭 전원을 꺼주세요!",
  },
  {
    id: "ann-3",
    title: "분리수거 안내",
    text: "분리수거는 매주 화요일, 금요일 저녁 8시에 진행돼요.",
  },
];

export const mockExpenses: MaintenanceFeeItem[] = [
  {
    id: "exp-1",
    category: "가스비",
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    amount: 68000,
    memo: "7월 도시가스 고지서",
    receiptState: "uploaded",
  },
  {
    id: "exp-2",
    category: "전기세",
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    amount: 92000,
    memo: "",
    receiptState: "error",
  },
  {
    id: "exp-3",
    category: "수도세",
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    amount: 41000,
    memo: "",
    receiptState: "uploaded",
  },
  {
    id: "exp-4",
    category: "인터넷",
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    amount: 39000,
    memo: "KT 인터넷+TV",
    receiptState: "uploaded",
  },
  {
    id: "exp-5",
    category: "공용물품",
    startDate: "2026-07-08",
    endDate: "2026-07-08",
    amount: 23400,
    memo: "주방세제, 휴지",
    receiptState: "uploaded",
  },
];

export const mockTenantFees: TenantFeeRow[] = [
  { id: "tenant-1", name: "김민준", start: "2026-07-01", end: "2026-07-31", days: 31, fee: 65467 },
  { id: "tenant-2", name: "이서연", start: "2026-07-01", end: "2026-07-18", days: 18, fee: 38017 },
  { id: "tenant-3", name: "박지훈", start: "2026-07-12", end: "2026-07-31", days: 20, fee: 42233 },
];

export function formatWon(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const [, month, day] = dateStr.split("-");
  return `${Number(month)}/${Number(day)}`;
}
