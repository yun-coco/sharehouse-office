import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoginGate } from "./LoginGate";

describe("LoginGate", () => {
  it("visible=false면 렌더링하지 않는다", () => {
    render(<LoginGate visible={false} />);
    expect(screen.queryByText("로그인이 필요해요")).not.toBeInTheDocument();
  });

  it("visible=true면 로그인 안내와 Google 로그인 버튼을 보여준다", () => {
    render(<LoginGate visible={true} />);
    expect(screen.getByText("로그인이 필요해요")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Google로 로그인" })).toBeInTheDocument();
  });
});
