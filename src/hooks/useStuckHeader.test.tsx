import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useRef } from "react";
import { useStuckHeader } from "./useStuckHeader";

function TestHarness() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const stuck = useStuckHeader(scrollRef, headerRef);

  return (
    <div ref={scrollRef} onScroll={() => {}} style={{ height: "200px", overflowY: "auto" }} data-testid="scroll-container">
      <div style={{ height: "100px" }} data-testid="spacer" />
      <div ref={headerRef} data-testid="header">
        {stuck ? "stuck" : "not-stuck"}
      </div>
      <div style={{ height: "1000px" }} />
    </div>
  );
}

describe("useStuckHeader", () => {
  it("스크롤하지 않은 초기 상태에서는 stuck이 false다", () => {
    render(<TestHarness />);
    expect(screen.getByTestId("header")).toHaveTextContent("not-stuck");
  });

  it("스크롤 컨테이너를 스크롤하면 handleScroll 트리거로 stuck 여부가 재계산된다", () => {
    render(<TestHarness />);
    const container = screen.getByTestId("scroll-container");

    // jsdom은 실제 레이아웃 계산을 하지 않으므로 getBoundingClientRect를 목킹해
    // "헤더가 컨테이너 상단에 붙은" 상태를 시뮬레이션한다.
    container.getBoundingClientRect = () =>
      ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => {} }) as DOMRect;
    screen.getByTestId("header").getBoundingClientRect = () =>
      ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => {} }) as DOMRect;
    Object.defineProperty(container, "scrollTop", { value: 50, configurable: true });

    fireEvent.scroll(container);
    expect(screen.getByTestId("header")).toHaveTextContent("stuck");
  });

  it("scrollTop이 0이면 헤더 위치가 같아도 stuck이 아니다 (원본의 scrollTop > 0.5 조건)", () => {
    render(<TestHarness />);
    const container = screen.getByTestId("scroll-container");
    container.getBoundingClientRect = () =>
      ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => {} }) as DOMRect;
    screen.getByTestId("header").getBoundingClientRect = () =>
      ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => {} }) as DOMRect;
    Object.defineProperty(container, "scrollTop", { value: 0, configurable: true });

    fireEvent.scroll(container);
    expect(screen.getByTestId("header")).toHaveTextContent("not-stuck");
  });
});
