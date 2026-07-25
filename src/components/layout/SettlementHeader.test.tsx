import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettlementHeader } from "./SettlementHeader";

describe("SettlementHeader", () => {
  it("초기 상태에서 '게시하기 전' 배지와 비활성 발송 버튼을 보여준다", () => {
    render(<SettlementHeader monthLabel="2026년 7월" onMenuToggle={() => {}} />);
    expect(screen.getByText("게시하기 전")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "정산 결과 발송" })).toBeDisabled();
  });

  it("게시 전 발송 버튼 클릭 시 '게시 후 발송할 수 있습니다' 안내가 뜬다", async () => {
    render(<SettlementHeader monthLabel="2026년 7월" onMenuToggle={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: "정산 결과 발송" }));
    expect(await screen.findByText("게시 후 발송할 수 있습니다")).toBeInTheDocument();
  });

  it("게시 버튼 클릭 → 확인 모달에서 확인 누르면 '게시 중' 상태로 바뀐다", async () => {
    render(<SettlementHeader monthLabel="2026년 7월" onMenuToggle={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: "게시하기 전" }));
    await userEvent.click(screen.getByRole("button", { name: "게시하기" }));
    expect(screen.getByText("게시 중")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "정산 결과 발송" })).not.toBeDisabled();
  });

  it("게시 후 발송 확인 모달에서 확인하면 '발송 완료'로 바뀐다", async () => {
    render(<SettlementHeader monthLabel="2026년 7월" onMenuToggle={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: "게시하기 전" }));
    await userEvent.click(screen.getByRole("button", { name: "게시하기" }));
    await userEvent.click(screen.getByRole("button", { name: "정산 결과 발송" }));
    await userEvent.click(screen.getByRole("button", { name: "발송하기" }));
    expect(screen.getByText("✓ 발송 완료")).toBeInTheDocument();
  });

  it("발송 확인 모달에 프로토타입 안내 문구가 포함된다", async () => {
    render(<SettlementHeader monthLabel="2026년 7월" onMenuToggle={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: "게시하기 전" }));
    await userEvent.click(screen.getByRole("button", { name: "게시하기" }));
    await userEvent.click(screen.getByRole("button", { name: "정산 결과 발송" }));
    expect(
      screen.getByText(/이 프로토타입에서는 실제 발송 대신 화면으로만 보여드려요/),
    ).toBeInTheDocument();
  });

  it("월 선택 드롭다운에 2026년 5월~9월 옵션이 모두 존재한다", () => {
    render(<SettlementHeader monthLabel="2026년 7월" onMenuToggle={() => {}} />);
    const select = screen.getByRole("combobox");
    const optionLabels = Array.from(select.querySelectorAll("option")).map((o) => o.textContent);
    expect(optionLabels).toEqual([
      "2026년 5월",
      "2026년 6월",
      "2026년 7월",
      "2026년 8월",
      "2026년 9월",
    ]);
  });

  it("모바일 화면에서는 '더 보기' 버튼을 눌러 입주자용 페이지 이동/게시/발송 액션 메뉴를 연다", async () => {
    render(<SettlementHeader monthLabel="2026년 7월" onMenuToggle={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: "더 보기" }));
    expect(screen.getAllByText("입주자용 페이지로 이동").length).toBeGreaterThan(0);
    expect(screen.getAllByText("게시하기 전").length).toBeGreaterThan(1);
    expect(screen.getAllByText("정산 결과 발송").length).toBeGreaterThan(1);
  });

  it("더 보기 메뉴에서 게시 액션을 클릭하면 메뉴가 닫히고 게시 확인 모달이 뜬다", async () => {
    render(<SettlementHeader monthLabel="2026년 7월" onMenuToggle={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: "더 보기" }));
    const publishItemsBeforeClose = screen.getAllByText("게시하기 전");
    expect(publishItemsBeforeClose.length).toBeGreaterThan(1);
    await userEvent.click(publishItemsBeforeClose[publishItemsBeforeClose.length - 1]);
    expect(screen.getByRole("button", { name: "게시하기" })).toBeInTheDocument();
    // 메뉴가 닫혔으므로 "게시하기 전" 텍스트는 데스크톱 게시 버튼 1개만 남는다.
    expect(screen.getAllByText("게시하기 전")).toHaveLength(1);
  });
});
