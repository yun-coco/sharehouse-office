import { createClient } from "@/lib/supabase/server";

export default async function SupabaseCheckPage() {
  const supabase = await createClient();

  const { data: branches, error: branchesError } = await supabase
    .from("branches")
    .select("id, name");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main style={{ padding: 24, fontFamily: "monospace" }}>
      <h1>Supabase 연결 확인</h1>
      <section>
        <h2>branches 테이블</h2>
        {branchesError ? (
          <pre style={{ color: "red" }}>{JSON.stringify(branchesError, null, 2)}</pre>
        ) : (
          <pre>{JSON.stringify(branches, null, 2)}</pre>
        )}
      </section>
      <section>
        <h2>현재 로그인 사용자</h2>
        <pre>{user ? JSON.stringify(user, null, 2) : "로그인 안 됨 (anon)"}</pre>
      </section>
    </main>
  );
}
