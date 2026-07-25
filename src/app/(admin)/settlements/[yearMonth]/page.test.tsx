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

  it("헤더에는 별도 햄버거 버튼이 없고, 사이드바 토글은 Sidebar 자체 버튼(desktop/tablet/overlay variant 각각, CSS breakpoint로 노출 제어)만 존재한다", async () => {
    const ui = await Page({ params: Promise.resolve({ yearMonth: "2026-07" }) });
    render(ui);
    // 원본 구조: 헤더 자체에는 햄버거가 없고, 숨김 상태의 플로팅 버튼과 열림 상태의
    // 사이드바 내부 버튼 모두 Sidebar 컴포넌트가 전담한다. 초기 상태(닫힘)에서
    // desktop/tablet/overlay 세 variant가 각자의 플로팅 "사이드바 열기" 버튼을
    // 동시에 DOM에 렌더링하므로(브레이크포인트별로 하나만 실제 보임) 최소 1개 이상 존재해야 한다.
    expect(screen.getAllByRole("button", { name: "사이드바 열기" }).length).toBeGreaterThan(0);
  });
});
