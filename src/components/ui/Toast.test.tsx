import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Toast, ToastStack } from "./Toast";

describe("Toast", () => {
  it("warning variant는 레드 배경 클래스를 갖는다", () => {
    render(<Toast message="카테고리를 선택해주세요" variant="warning" />);
    const el = screen.getByText("카테고리를 선택해주세요");
    expect(el.className).toMatch(/bg-\[#c0433a\]/);
  });

  it("info variant는 다크 배경 클래스를 갖는다", () => {
    render(<Toast message="이미지로 저장했어요" variant="info" />);
    const el = screen.getByText("이미지로 저장했어요");
    expect(el.className).toMatch(/bg-\[#1c231f\]/);
  });
});

describe("ToastStack", () => {
  it("여러 토스트를 순서대로 렌더링한다", () => {
    render(
      <ToastStack
        toasts={[
          { id: "1", message: "첫번째", variant: "warning" },
          { id: "2", message: "두번째", variant: "info" },
        ]}
      />,
    );
    expect(screen.getByText("첫번째")).toBeInTheDocument();
    expect(screen.getByText("두번째")).toBeInTheDocument();
  });
});
