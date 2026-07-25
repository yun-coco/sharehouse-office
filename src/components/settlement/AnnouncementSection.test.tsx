import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnnouncementSection } from "./AnnouncementSection";

describe("AnnouncementSection", () => {
  it("mock 공지사항 3개를 렌더링한다", () => {
    render(<AnnouncementSection />);
    expect(screen.getByText("정산 결과 안내")).toBeInTheDocument();
    expect(screen.getByText("세탁기 필터 교체 안내")).toBeInTheDocument();
    expect(screen.getByText("분리수거 안내")).toBeInTheDocument();
  });

  it("'+ 추가' 클릭 시 제목/본문 입력 폼이 나타난다", async () => {
    render(<AnnouncementSection />);
    await userEvent.click(screen.getByRole("button", { name: "+ 추가" }));
    expect(screen.getByPlaceholderText("제목")).toBeInTheDocument();
  });

  it("제목 없이 저장 시도하면 경고가 뜨고 항목이 추가되지 않는다", async () => {
    render(<AnnouncementSection />);
    await userEvent.click(screen.getByRole("button", { name: "+ 추가" }));
    await userEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(await screen.findByText("제목을 입력해주세요")).toBeInTheDocument();
  });

  it("제목 없이 저장 시도하면 제목 입력 필드 테두리가 빨간색으로 바뀐다", async () => {
    render(<AnnouncementSection />);
    await userEvent.click(screen.getByRole("button", { name: "+ 추가" }));
    await userEvent.click(screen.getByRole("button", { name: "저장" }));
    await screen.findByText("제목을 입력해주세요");
    expect(screen.getByPlaceholderText("제목").className).toMatch(/border-\[#c0433a\]/);
  });

  it("제목을 입력하면 빨간 테두리가 사라진다", async () => {
    render(<AnnouncementSection />);
    await userEvent.click(screen.getByRole("button", { name: "+ 추가" }));
    await userEvent.click(screen.getByRole("button", { name: "저장" }));
    await screen.findByText("제목을 입력해주세요");
    await userEvent.type(screen.getByPlaceholderText("제목"), "새 공지");
    expect(screen.getByPlaceholderText("제목").className).not.toMatch(/border-\[#c0433a\]/);
  });

  it("제목/본문 입력 후 저장하면 리스트에 새 항목이 추가된다", async () => {
    render(<AnnouncementSection />);
    await userEvent.click(screen.getByRole("button", { name: "+ 추가" }));
    await userEvent.type(screen.getByPlaceholderText("제목"), "새 공지");
    await userEvent.type(screen.getByPlaceholderText("어떤 내용을 공지할까요?"), "본문 내용");
    await userEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(screen.getByText("새 공지")).toBeInTheDocument();
  });

  it("삭제 아이콘 클릭 → 확인 모달에서 삭제 확정하면 항목이 사라진다", async () => {
    render(<AnnouncementSection />);
    const deleteButtons = screen.getAllByRole("button", { name: "공지사항 삭제" });
    await userEvent.click(deleteButtons[0]);
    await userEvent.click(screen.getByRole("button", { name: "삭제" }));
    expect(screen.queryByText("정산 결과 안내")).not.toBeInTheDocument();
  });

  it("삭제 확정 후 실행취소 토스트가 뜨고, 실행취소하면 항목이 복원된다", async () => {
    render(<AnnouncementSection />);
    const deleteButtons = screen.getAllByRole("button", { name: "공지사항 삭제" });
    await userEvent.click(deleteButtons[0]);
    await userEvent.click(screen.getByRole("button", { name: "삭제" }));
    expect(screen.queryByText("정산 결과 안내")).not.toBeInTheDocument();

    expect(await screen.findByText(/공지사항.*삭제했어요/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("link", { name: "실행취소" }));
    expect(screen.getByText("정산 결과 안내")).toBeInTheDocument();
  });

  it("공지사항 본문 텍스트에 3줄 말줄임(line-clamp) 스타일이 적용된다", () => {
    render(<AnnouncementSection />);
    const bodyText = screen.getByText("이번 달 정산 결과는 7월 25일 이후에 게시될 예정이에요.");
    expect(bodyText.className).toMatch(/line-clamp-3/);
  });

  it("드래그 중인 항목이 다른 행 위로 올라오면 해당 행 상단에 초록색 드롭 인디케이터가 표시된다", () => {
    render(<AnnouncementSection />);
    const firstRow = screen.getByTestId("announcement-row-ann-1");
    const secondRow = screen.getByTestId("announcement-row-ann-2");

    fireEvent.dragStart(firstRow);
    fireEvent.dragOver(secondRow);

    expect(secondRow.className).toMatch(/border-t-\[#2f6f52\]/);
  });

  it("드래그 중인 항목이 목록 끝 드롭존 위로 올라오면 드롭존에 초록색 인디케이터가 표시된다", () => {
    render(<AnnouncementSection />);
    const firstRow = screen.getByTestId("announcement-row-ann-1");
    const endDropZone = screen.getByTestId("announcement-end-drop-zone");

    fireEvent.dragStart(firstRow);
    fireEvent.dragOver(endDropZone);

    expect(endDropZone.className).toMatch(/border-t-\[#2f6f52\]/);
  });

  it("첫 항목을 드래그해서 목록 끝 드롭존에 놓으면 마지막으로 이동한다", () => {
    render(<AnnouncementSection />);
    const firstRow = screen.getByTestId("announcement-row-ann-1");
    const endDropZone = screen.getByTestId("announcement-end-drop-zone");

    fireEvent.dragStart(firstRow);
    fireEvent.dragOver(endDropZone);
    fireEvent.drop(endDropZone);

    const titles = screen.getAllByText(/정산 결과 안내|세탁기 필터 교체 안내|분리수거 안내/).map((el) => el.textContent);
    expect(titles).toEqual(["세탁기 필터 교체 안내", "분리수거 안내", "정산 결과 안내"]);
  });

  it("한 공지사항을 편집 중일 때 다른 공지사항 수정을 시도하면 경고가 뜬다", async () => {
    render(<AnnouncementSection />);
    const editButtons = screen.getAllByRole("button", { name: "공지사항 수정" });
    await userEvent.click(editButtons[0]);
    await userEvent.click(editButtons[1]);
    expect(await screen.findByText("작성중인 공지사항이 있어요!")).toBeInTheDocument();
  });

  it("공지사항 편집 중 다른 공지사항 수정 시도로 경고 모달이 뜨면, 편집 중인 항목의 '취소'/'저장' 아이콘 버튼과 모달의 취소/확인 버튼이 각각 유일하게 조회된다", async () => {
    render(<AnnouncementSection />);
    const editButtons = screen.getAllByRole("button", { name: "공지사항 수정" });
    await userEvent.click(editButtons[0]);
    await userEvent.click(editButtons[1]);
    expect(await screen.findByText("작성중인 공지사항이 있어요!")).toBeInTheDocument();

    // 편집 중인 항목의 인라인 저장/취소 아이콘 버튼이 모달과 함께 여전히 렌더링되어 있어야 한다.
    expect(screen.getAllByRole("button", { name: "저장" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "취소" })).toHaveLength(1);

    // 모달의 확인/취소 버튼은 인라인 편집 폼의 버튼과 접근성 이름이 겹치지 않아야 한다.
    expect(screen.getByRole("button", { name: "확인" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "편집 경고 확인 취소" })).toBeInTheDocument();
  });
});
