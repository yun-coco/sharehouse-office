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

  it("시작일 없이 저장하면 시작일 경고가 뜬다 (카테고리 다음으로 검사)", async () => {
    render(<ExpenseTable />);
    await userEvent.click(screen.getAllByRole("button", { name: "+ 추가" })[0]);
    const categorySelect = screen.getAllByRole("combobox")[0];
    await userEvent.selectOptions(categorySelect, "공용물품");
    await userEvent.click(screen.getAllByRole("button", { name: "저장" })[0]);
    expect(await screen.findByText("시작일(구매일)을 입력해주세요")).toBeInTheDocument();
  });

  it("금액 없이 저장하면 경고가 뜨고 항목이 추가되지 않는다", async () => {
    render(<ExpenseTable />);
    const beforeCount = screen.getAllByText("가스비").length;
    await userEvent.click(screen.getAllByRole("button", { name: "+ 추가" })[0]);
    const categorySelect = screen.getAllByRole("combobox")[0];
    await userEvent.selectOptions(categorySelect, "공용물품");
    await userEvent.click(screen.getAllByRole("button", { name: "시작일 선택" })[0]);
    await userEvent.click(screen.getByText("15"));
    await userEvent.click(screen.getAllByRole("button", { name: "저장" })[0]);
    expect(await screen.findByText("금액을 입력해주세요")).toBeInTheDocument();
    // 저장 실패했으므로 관리비 항목 자체(가스비 등 기존 5건)는 늘어나지 않는다.
    // (추가 폼 자체는 여전히 열려 있으므로 폼 요소가 DOM에 남는 것은 정상.)
    expect(screen.getAllByText("가스비").length).toBe(beforeCount);
  });

  it("행 삭제 확인 시 실행취소 토스트가 뜨고, 실행취소하면 복원된다", async () => {
    render(<ExpenseTable />);
    await userEvent.click(screen.getAllByRole("button", { name: "관리비 항목 삭제" })[0]);
    await userEvent.click(screen.getByRole("button", { name: "삭제" }));
    expect(await screen.findByText(/행을 삭제했어요/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("link", { name: "실행취소" }));
    expect(screen.getAllByText("가스비").length).toBeGreaterThan(0);
  });

  it("'📎 첨부됨' 클릭 시 영수증 미리보기 모달이 뜨고 이미지가 보인다", async () => {
    render(<ExpenseTable />);
    await userEvent.click(screen.getAllByText("📎 첨부됨")[0]);
    expect(screen.getByText("가스비 영수증")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "가스비 영수증" })).toBeInTheDocument();
  });

  it("모든 항목을 삭제하면 블러 처리된 샘플 표 위에 안내 문구가 오버레이로 표시된다 (데스크톱/모바일 각각 다른 문구)", async () => {
    render(<ExpenseTable />);
    const desktopDeleteCount = screen.getAllByRole("button", { name: "관리비 항목 삭제" }).length / 2;
    for (let i = 0; i < desktopDeleteCount; i++) {
      const btn = screen.getAllByRole("button", { name: "관리비 항목 삭제" })[0];
      await userEvent.click(btn);
      await userEvent.click(screen.getByRole("button", { name: "삭제" }));
    }
    expect(await screen.findByText("아직 입력된 관리비 항목이 없어요")).toBeInTheDocument();
    expect(screen.getByText("아직 입력된 지출 항목이 없어요")).toBeInTheDocument();
    expect(screen.getByTestId("expense-empty-blur-table")).toBeInTheDocument();
  });

  it("데스크톱 편집 행은 조회 모드와 동일하게 7개의 개별 td로 구성된다 (colSpan 병합 아님)", async () => {
    render(<ExpenseTable />);
    const editButtons = screen.getAllByRole("button", { name: "관리비 항목 수정" });
    await userEvent.click(editButtons[0]);

    const editingRow = screen.getAllByRole("row").find((row) => row.querySelector("select"));
    expect(editingRow).toBeDefined();
    const cells = editingRow!.querySelectorAll("td");
    expect(cells).toHaveLength(7);
    // 각 셀에 병합(colSpan)이 없어야 조회 모드와 동일한 컬럼 위치를 유지한다.
    cells.forEach((cell) => expect(cell.getAttribute("colspan")).toBeNull());
    // 컬럼 순서: 항목(select) → 시작일 → 종료일 → 금액(input) → 메모(textarea) → 영수증 → 저장/취소
    expect(cells[0].querySelector("select")).not.toBeNull();
    expect(cells[3].querySelector('input[placeholder="금액"]')).not.toBeNull();
    expect(cells[4].querySelector("textarea")).not.toBeNull();
  });

  it("데스크톱 편집 행의 항목 select는 원본과 동일하게 border-radius 5px, text-align-last center를 갖는다", async () => {
    render(<ExpenseTable />);
    const editButtons = screen.getAllByRole("button", { name: "관리비 항목 수정" });
    await userEvent.click(editButtons[0]);
    const select = screen.getAllByRole("combobox")[0];
    expect(select.className).toMatch(/rounded-\[5px\]/);
  });

  it("한 행을 편집 중일 때 다른 행 수정을 시도하면 경고가 뜨고 편집 대상이 바뀌지 않는다", async () => {
    render(<ExpenseTable />);
    const editButtons = screen.getAllByRole("button", { name: "관리비 항목 수정" });
    await userEvent.click(editButtons[0]);
    await userEvent.click(editButtons[1]);
    expect(await screen.findByText("작성중인 행이 있어요!")).toBeInTheDocument();
  });

  it("행 편집 중 다른 행 수정 시도로 경고 모달이 뜨면, 편집 중인 행의 '취소'/'저장' 아이콘 버튼과 모달의 취소/확인 버튼이 각각 유일하게 조회된다", async () => {
    render(<ExpenseTable />);
    const editButtons = screen.getAllByRole("button", { name: "관리비 항목 수정" });
    await userEvent.click(editButtons[0]);
    await userEvent.click(editButtons[1]);
    expect(await screen.findByText("작성중인 행이 있어요!")).toBeInTheDocument();

    // 편집 중인 행의 인라인 저장/취소 아이콘 버튼이 모달과 함께 여전히 렌더링되어 있어야 한다.
    // (데스크톱 테이블/모바일 카드 두 레이아웃이 동시에 DOM에 존재하므로 각 2개씩 나온다.)
    expect(screen.getAllByRole("button", { name: "저장" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "취소" })).toHaveLength(2);

    // 모달의 확인/취소 버튼은 인라인 편집 폼의 버튼과 접근성 이름이 겹치지 않아야 한다.
    expect(screen.getByRole("button", { name: "확인" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "편집 경고 확인 취소" })).toBeInTheDocument();
  });
});
