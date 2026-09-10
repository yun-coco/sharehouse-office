<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 프로젝트: 쉐어하우스 관리사무소

PRD: `docs/sharehouse-office-prd.md`

## 도메인 용어집

코드/스키마/API에서 아래 한글 용어는 반드시 지정된 영문 네이밍으로 쓴다. 새로운 도메인 개념을 코드에 반영하기 전에는 먼저 이 표에 추가할 용어를 사용자와 확인한다.

| 한글 용어   | 영문 네이밍       | 비고                                   |
| ----------- | ------------------ | -------------------------------------- |
| 지점(하우스) | `house`            | `branch`는 git branch와 이름이 겹쳐 코드/커밋/리뷰에서 혼동되므로 사용 금지. PRD 4.1.0 |
| 입주자      | `tenant`            | PRD 4.1.2                              |
| 관리비      | `maintenance_fee`   | `expense`처럼 광범위한 이름 금지 (매출 등 다른 지출 개념과 혼동 방지) |
| 정산(행위)  | `settlement`        | PRD 4.1.1, `/maintenance-fee-settlements/:year-:month` |
| 정산월      | `maintenance_fee_settlement_period` | 예: 2026-09              |
