export type Tenant = {
  id: string;
  houseId: string;
  name: string;
  moveInDate: string; // ISO date string, 예: "2026-03-01"
  moveOutDate: string; // ISO date string
  memo: string | null;
  createdAt: string;
  deletedAt: string | null;
};

export type TenantInput = {
  name: string;
  moveInDate: string;
  moveOutDate: string;
  memo: string | null;
};
