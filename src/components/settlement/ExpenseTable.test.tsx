import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExpenseTable } from "./ExpenseTable";

describe("ExpenseTable", () => {
  it("mock 관리비 5건과 합계를 렌더링한다", () => {
    render(<ExpenseTable />);
    expect(screen.getAllByText("전기세").length).toBeGreaterThan(0);
    expect(screen.getAllByText("263,400원").length).toBeGreaterThan(0);
  });

  it("업로드 실패 항목은 '업로드 실패' 텍스트를 보여준다", () => {
    render(<ExpenseTable />);
    expect(screen.getAllByText("업로드 실패").length).toBeGreaterThan(0);
  });

  it("'+ 추가' 클릭 시 이미 입력된 월 1건 카테고리는 선택 불가로 표시된다", async () => {
    render(<ExpenseTable />);
    await userEvent.click(screen.getAllByRole("button", { name: "+ 추가" })[0]);
    const select = screen.getAllByRole("combobox")[0];
    const gasOption = Array.from(select.querySelectorAll("option")).find((o) =>
      o.textContent?.includes("가스비"),
    );
    expect(gasOption?.textContent).toContain("입력됨");
    expect((gasOption as HTMLOptionElement).disabled).toBe(true);
  });

  it("금액 없이 저장하면 경고가 뜨고 항목이 추가되지 않는다", async () => {
    render(<ExpenseTable />);
    const before = screen.getAllByRole("row").length;
    await userEvent.click(screen.getAllByRole("button", { name: "+ 추가" })[0]);
    const categorySelect = screen.getAllByRole("combobox")[0];
    await userEvent.selectOptions(categorySelect, "공용물품");
    await userEvent.click(screen.getAllByRole("button", { name: "저장" })[0]);
    expect(await screen.findByText("금액을 입력해주세요")).toBeInTheDocument();
    expect(screen.getAllByRole("row").length).toBe(before);
  });

  it("행 삭제 확인 시 실행취소 토스트가 뜨고, 실행취소하면 복원된다", async () => {
    render(<ExpenseTable />);
    await userEvent.click(screen.getAllByRole("button", { name: "관리비 항목 삭제" })[0]);
    await userEvent.click(screen.getByRole("button", { name: "삭제" }));
    expect(await screen.findByText(/행을 삭제했어요/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("link", { name: "실행취소" }));
    expect(screen.getAllByText("가스비").length).toBeGreaterThan(0);
  });

  it("'📎 첨부됨' 클릭 시 영수증 미리보기 모달이 뜬다", async () => {
    render(<ExpenseTable />);
    await userEvent.click(screen.getAllByText("📎 첨부됨")[0]);
    expect(screen.getByText("가스비 영수증")).toBeInTheDocument();
  });

  it("한 행을 편집 중일 때 다른 행 수정을 시도하면 경고가 뜨고 편집 대상이 바뀌지 않는다", async () => {
    render(<ExpenseTable />);
    const editButtons = screen.getAllByRole("button", { name: "관리비 항목 수정" });
    await userEvent.click(editButtons[0]);
    await userEvent.click(editButtons[1]);
    expect(await screen.findByText("작성중인 행이 있어요!")).toBeInTheDocument();
  });
});
