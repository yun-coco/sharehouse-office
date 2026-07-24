import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TenantFeeTable } from "./TenantFeeTable";

describe("TenantFeeTable", () => {
  it("mock 입주자 3명과 이용일수/관리비를 렌더링한다", () => {
    render(<TenantFeeTable />);
    expect(screen.getAllByText("김민준").length).toBeGreaterThan(0);
    expect(screen.getAllByText("31일").length).toBeGreaterThan(0);
  });

  it("empty=true이면 '정산할 입주자가 없어요' 안내를 보여준다", () => {
    render(<TenantFeeTable empty />);
    expect(screen.getByText("정산할 입주자가 없어요")).toBeInTheDocument();
  });

  it("empty=false(기본값)이면 안내 문구가 없다", () => {
    render(<TenantFeeTable />);
    expect(screen.queryByText("정산할 입주자가 없어요")).not.toBeInTheDocument();
  });
});
