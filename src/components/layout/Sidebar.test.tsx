import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
  it("'관리비 정산' 활성 메뉴와 '입주자 관리' 링크를 렌더링한다", () => {
    render(<Sidebar open={true} onToggle={() => {}} variant="desktop" />);
    expect(screen.getByText("관리비 정산")).toBeInTheDocument();
    expect(screen.getByText("입주자 관리")).toBeInTheDocument();
  });

  it("variant='overlay'이고 open=false면 렌더링하지 않는다", () => {
    render(<Sidebar open={false} onToggle={() => {}} variant="overlay" />);
    expect(screen.queryByText("관리비 정산")).not.toBeInTheDocument();
  });

  it("variant='overlay'이고 open=true면 백드롭 클릭 시 onToggle이 호출된다", async () => {
    const onToggle = vi.fn();
    render(<Sidebar open={true} onToggle={onToggle} variant="overlay" />);
    await userEvent.click(screen.getByTestId("sidebar-backdrop"));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("햄버거 버튼 클릭 시 onToggle이 호출된다", async () => {
    const onToggle = vi.fn();
    render(<Sidebar open={true} onToggle={onToggle} variant="desktop" />);
    await userEvent.click(screen.getByRole("button", { name: /메뉴/ }));
    expect(onToggle).toHaveBeenCalledOnce();
  });
});
