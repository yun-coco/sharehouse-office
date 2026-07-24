import { describe, it, expect } from "vitest";
import { formatWon, formatDate, mockExpenses, mockTenantFees } from "./settlementMockData";

describe("formatWon", () => {
  it("천단위 콤마와 '원'을 붙인다", () => {
    expect(formatWon(92000)).toBe("92,000원");
  });

  it("0원도 정상 표기한다", () => {
    expect(formatWon(0)).toBe("0원");
  });
});

describe("formatDate", () => {
  it("YYYY-MM-DD를 M/D로 변환한다", () => {
    expect(formatDate("2026-07-01")).toBe("7/1");
  });

  it("null이면 '-'를 반환한다", () => {
    expect(formatDate(null)).toBe("-");
  });
});

describe("mock 데이터 무결성", () => {
  it("관리비 항목 mock은 5개다", () => {
    expect(mockExpenses).toHaveLength(5);
  });

  it("입주자 mock은 3명이고 각 fee는 0보다 크다", () => {
    expect(mockTenantFees).toHaveLength(3);
    mockTenantFees.forEach((t) => expect(t.fee).toBeGreaterThan(0));
  });
});
