import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
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
    await userEvent.click(screen.getByRole("button", { name: "삭제", exact: true }));
    expect(screen.queryByText("정산 결과 안내")).not.toBeInTheDocument();
  });
});
