# Google OAuth 설정 기록

- Supabase 프로젝트: `ypnrxlejodwpbofudkhk`
- 승인된 리디렉션 URI (Google Cloud Console):
  - `https://ypnrxlejodwpbofudkhk.supabase.co/auth/v1/callback`
  - `http://localhost:3000/auth/callback` (로컬 개발용)
- Supabase Site URL: `http://localhost:3000` (배포 시 Vercel 프로덕션 URL로 갱신 필요)
- Client ID/Secret은 Supabase 대시보드(Authentication > Providers > Google)에만 저장, 이 문서에는 기록하지 않음
- 연결 확인: `GET /auth/v1/authorize?provider=google` → 302, `Location` 헤더가 `accounts.google.com`으로 향하고 `redirect_uri`가 등록된 콜백 URL과 일치함을 확인 (2026-07-24)

## 참고

- 로그인 콜백 라우트(`/auth/callback`)는 아직 앱 코드에 구현되지 않음 — 다음 계획(화면 구현)에서 Supabase Auth 세션 교환 핸들러로 작성 예정
- Vercel 배포 시 Google Cloud Console의 승인된 리디렉션 URI에 프로덕션 도메인 콜백도 추가해야 함
