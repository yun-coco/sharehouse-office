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

  it("헤더의 메뉴 토글과 사이드바의 메뉴 토글이 서로 다른 접근성 이름을 갖는다", async () => {
    const ui = await Page({ params: Promise.resolve({ yearMonth: "2026-07" }) });
    render(ui);
    // 초기 상태(sidebarOpen=false)에서 헤더 햄버거 버튼은 "사이드바 메뉴 열기",
    // Sidebar 자체 토글 버튼(desktop/tablet/overlay 세 variant가 모두 DOM에 존재하며
    // CSS breakpoint로 노출을 제어하므로, 닫힌 상태의 플로팅 햄버거도 3개 존재)은
    // "사이드바 열기"로 헤더 버튼과 이름이 겹치지 않아야 한다.
    expect(screen.getByRole("button", { name: "사이드바 메뉴 열기" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "사이드바 열기" }).length).toBeGreaterThan(0);
  });
});
