import { describe, it, expect } from "vitest";
import { validateTenantInput } from "./validation";

describe("validateTenantInput", () => {
  it("모든 필드가 유효하면 ok: true를 반환한다", () => {
    const result = validateTenantInput({
      name: "김철수",
      moveInDate: "2026-03-01",
      moveOutDate: "2026-09-30",
      memo: null,
    });
    expect(result).toEqual({ ok: true });
  });

  it("이름이 비어있으면 name 에러를 반환한다", () => {
    const result = validateTenantInput({
      name: "  ",
      moveInDate: "2026-03-01",
      moveOutDate: "2026-09-30",
      memo: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.name).toBeDefined();
    }
  });

  it("입실일이 비어있으면 moveInDate 에러를 반환한다", () => {
    const result = validateTenantInput({
      name: "김철수",
      moveInDate: "",
      moveOutDate: "2026-09-30",
      memo: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.moveInDate).toBeDefined();
    }
  });

  it("퇴실일이 비어있으면 moveOutDate 에러를 반환한다", () => {
    const result = validateTenantInput({
      name: "김철수",
      moveInDate: "2026-03-01",
      moveOutDate: "",
      memo: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.moveOutDate).toBeDefined();
    }
  });

  it("퇴실일이 입실일보다 이르면 moveOutDate 에러를 반환한다", () => {
    const result = validateTenantInput({
      name: "김철수",
      moveInDate: "2026-09-30",
      moveOutDate: "2026-03-01",
      memo: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.moveOutDate).toBeDefined();
    }
  });

  it("퇴실일이 입실일과 같으면 유효하다", () => {
    const result = validateTenantInput({
      name: "김철수",
      moveInDate: "2026-03-01",
      moveOutDate: "2026-03-01",
      memo: null,
    });
    expect(result).toEqual({ ok: true });
  });
});
