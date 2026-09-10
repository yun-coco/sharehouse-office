import type { TenantInput } from "./types";

export type ValidationResult =
  | { ok: true }
  | { ok: false; errors: Partial<Record<keyof TenantInput, string>> };

export function validateTenantInput(input: TenantInput): ValidationResult {
  const errors: Partial<Record<keyof TenantInput, string>> = {};

  if (input.name.trim().length === 0) {
    errors.name = "이름을 입력해주세요.";
  }

  if (input.moveInDate.trim().length === 0) {
    errors.moveInDate = "입실일을 입력해주세요.";
  }

  if (input.moveOutDate.trim().length === 0) {
    errors.moveOutDate = "퇴실일을 입력해주세요.";
  } else if (
    input.moveInDate.trim().length > 0 &&
    input.moveOutDate < input.moveInDate
  ) {
    errors.moveOutDate = "퇴실일은 입실일 이후여야 합니다.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true };
}
