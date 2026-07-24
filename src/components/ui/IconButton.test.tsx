import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pencil } from "lucide-react";
import { IconButton } from "./IconButton";

describe("IconButton", () => {
  it("클릭하면 onClick이 호출된다", async () => {
    const onClick = vi.fn();
    render(<IconButton icon={Pencil} label="수정" onClick={onClick} />);
    await userEvent.click(screen.getByRole("button", { name: "수정" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("44x44 터치 타깃 클래스를 갖는다", () => {
    render(<IconButton icon={Pencil} label="수정" onClick={() => {}} />);
    const button = screen.getByRole("button", { name: "수정" });
    expect(button.className).toMatch(/min-w-\[44px\]/);
    expect(button.className).toMatch(/min-h-\[44px\]/);
  });

  it("variant='danger'면 레드 색상 클래스를 갖는다", () => {
    render(<IconButton icon={Pencil} label="삭제" onClick={() => {}} variant="danger" />);
    const button = screen.getByRole("button", { name: "삭제" });
    expect(button.className).toMatch(/text-\[#e0483c\]/);
  });
});
