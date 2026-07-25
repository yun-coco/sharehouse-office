import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateRangePopover } from "./DateRangePopover";

describe("DateRangePopover", () => {
  it("value가 없으면 placeholder를 버튼 라벨로 보여준다", () => {
    render(
      <DateRangePopover value={null} onChange={() => {}} placeholder="시작일 선택" anchor="left" />,
    );
    expect(screen.getByRole("button", { name: "시작일 선택" })).toBeInTheDocument();
  });

  it("value가 있으면 YYYY.MM.DD 형식으로 보여준다", () => {
    render(
      <DateRangePopover
        value="2026-07-15"
        onChange={() => {}}
        placeholder="시작일 선택"
        anchor="left"
      />,
    );
    expect(screen.getByRole("button", { name: "2026.07.15" })).toBeInTheDocument();
  });

  it("value가 없으면 placeholder 색상(연한 회색)을 사용한다", () => {
    render(
      <DateRangePopover value={null} onChange={() => {}} placeholder="시작일 선택" anchor="left" />,
    );
    expect(screen.getByRole("button", { name: "시작일 선택" }).className).toMatch(/text-\[#a8a89c\]/);
  });

  it("value가 있으면 진한 텍스트 색상을 사용한다", () => {
    render(
      <DateRangePopover
        value="2026-07-15"
        onChange={() => {}}
        placeholder="시작일 선택"
        anchor="left"
      />,
    );
    expect(screen.getByRole("button", { name: "2026.07.15" }).className).toMatch(/text-\[#1a1a1a\]/);
  });

  it("버튼 클릭 시 캘린더 팝오버가 열린다", async () => {
    render(
      <DateRangePopover value={null} onChange={() => {}} placeholder="시작일 선택" anchor="left" />,
    );
    await userEvent.click(screen.getByRole("button", { name: "시작일 선택" }));
    expect(screen.getByText("일")).toBeInTheDocument(); // 요일 헤더
  });

  it("날짜 셀 클릭 시 onChange가 선택한 날짜로 호출된다", async () => {
    const onChange = vi.fn();
    render(
      <DateRangePopover value="2026-07-01" onChange={onChange} placeholder="시작일 선택" anchor="left" />,
    );
    await userEvent.click(screen.getByRole("button", { name: "2026.07.01" }));
    await userEvent.click(screen.getByText("15"));
    expect(onChange).toHaveBeenCalledWith("2026-07-15");
  });

  it("allowClear=true이면 '제거하기' 버튼이 있고 클릭 시 onClear가 호출된다", async () => {
    const onClear = vi.fn();
    render(
      <DateRangePopover
        value="2026-07-15"
        onChange={() => {}}
        placeholder="종료일 선택"
        anchor="right"
        allowClear
        onClear={onClear}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "2026.07.15" }));
    await userEvent.click(screen.getByRole("button", { name: "제거하기" }));
    expect(onClear).toHaveBeenCalledOnce();
  });
});
