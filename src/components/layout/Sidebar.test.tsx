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

  it("variant='overlay'는 배경이 어둡게 dimmed 처리되고 너비가 50%다 (모바일 드로어)", () => {
    render(<Sidebar open={true} onToggle={() => {}} variant="overlay" />);
    const backdrop = screen.getByTestId("sidebar-backdrop");
    expect(backdrop.className).toMatch(/bg-\[rgba\(20,22,18,0\.45\)\]/);
    const drawer = screen.getByTestId("sidebar-drawer");
    expect(drawer.className).toMatch(/w-1\/2/);
  });

  it("variant='tablet'이고 open=false면 렌더링하지 않는다", () => {
    render(<Sidebar open={false} onToggle={() => {}} variant="tablet" />);
    expect(screen.queryByText("관리비 정산")).not.toBeInTheDocument();
  });

  it("variant='tablet'은 배경이 투명하고(dimmed 아님) 너비가 230px 고정이다", () => {
    render(<Sidebar open={true} onToggle={() => {}} variant="tablet" />);
    const backdrop = screen.getByTestId("sidebar-backdrop");
    expect(backdrop.className).toMatch(/bg-transparent/);
    expect(backdrop.className).not.toMatch(/rgba/);
    const drawer = screen.getByTestId("sidebar-drawer");
    expect(drawer.className).toMatch(/w-\[230px\]/);
  });

  it("variant='tablet'이고 open=true면 투명 백드롭 클릭 시 onToggle이 호출된다", async () => {
    const onToggle = vi.fn();
    render(<Sidebar open={true} onToggle={onToggle} variant="tablet" />);
    await userEvent.click(screen.getByTestId("sidebar-backdrop"));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("햄버거 버튼 클릭 시 onToggle이 호출된다", async () => {
    const onToggle = vi.fn();
    render(<Sidebar open={true} onToggle={onToggle} variant="desktop" />);
    await userEvent.click(screen.getByRole("button", { name: /사이드바/ }));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("variant='desktop'이고 open=false면 사이드바 본문은 사라지고 플로팅 햄버거 버튼만 남는다", async () => {
    const onToggle = vi.fn();
    render(<Sidebar open={false} onToggle={onToggle} variant="desktop" />);
    expect(screen.queryByText("관리비 정산")).not.toBeInTheDocument();
    expect(screen.queryByText("입주자 관리")).not.toBeInTheDocument();
    const toggleButton = screen.getByRole("button", { name: "사이드바 열기" });
    expect(toggleButton).toBeInTheDocument();
    await userEvent.click(toggleButton);
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("variant='tablet'이고 open=false면 사이드바 본문은 사라지고 플로팅 햄버거 버튼만 남는다", () => {
    render(<Sidebar open={false} onToggle={() => {}} variant="tablet" />);
    expect(screen.queryByText("관리비 정산")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "사이드바 열기" })).toBeInTheDocument();
  });

  it("variant='overlay'(모바일)이고 open=false여도 플로팅 햄버거가 렌더링된다", () => {
    render(<Sidebar open={false} onToggle={() => {}} variant="overlay" />);
    expect(screen.getByRole("button", { name: "사이드바 열기" })).toBeInTheDocument();
  });
});
