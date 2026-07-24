import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Page from "./page";

describe("SettlementPage", () => {
  it("헤더/공지사항/관리비/입주자 섹션을 모두 렌더링한다", async () => {
    const ui = await Page({ params: Promise.resolve({ yearMonth: "2026-07" }) });
    render(ui);
    expect(screen.getAllByText("관리비 정산").length).toBeGreaterThan(0);
    expect(screen.getByText("📌 공지사항")).toBeInTheDocument();
    expect(screen.getByText("💵 이번달 관리비")).toBeInTheDocument();
    expect(screen.getByText("🧾 입주자별 관리비")).toBeInTheDocument();
  });
});
