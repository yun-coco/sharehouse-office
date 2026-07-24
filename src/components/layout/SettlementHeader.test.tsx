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
});
