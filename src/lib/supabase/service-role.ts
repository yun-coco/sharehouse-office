import { createClient } from "@supabase/supabase-js";

/**
 * 인증이 아직 없는 개발 단계에서 RLS를 우회하기 위한 전용 클라이언트.
 * 서버 전용 모듈이며, 절대 브라우저로 전달되어서는 안 된다.
 * 로그인이 붙는 시점에 이 파일과 사용처를 제거하고 일반 서버 클라이언트로 전환한다.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY 또는 NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** 개발 단계에서 사용하는 고정 house id (로그인 붙으면 제거) */
export const DEV_HOUSE_ID = "00000000-0000-0000-0000-000000000001";
