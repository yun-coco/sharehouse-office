import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("open=false면 렌더링되지 않는다", () => {
    render(
      <Modal
        open={false}
        title="삭제할까요?"
        description="설명"
        confirmLabel="삭제"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.queryByText("삭제할까요?")).not.toBeInTheDocument();
  });

  it("open=true면 title/description을 렌더링한다", () => {
    render(
      <Modal
        open={true}
        title="삭제할까요?"
        description="이 항목이 삭제돼요."
        confirmLabel="삭제"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText("삭제할까요?")).toBeInTheDocument();
    expect(screen.getByText("이 항목이 삭제돼요.")).toBeInTheDocument();
  });

  it("확인 버튼 클릭 시 onConfirm이 호출된다", async () => {
    const onConfirm = vi.fn();
    render(
      <Modal
        open={true}
        title="t"
        description="d"
        confirmLabel="삭제"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "삭제" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("취소 버튼 클릭 시 onCancel이 호출된다", async () => {
    const onCancel = vi.fn();
    render(
      <Modal
        open={true}
        title="t"
        description="d"
        confirmLabel="삭제"
        onConfirm={() => {}}
        onCancel={onCancel}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
