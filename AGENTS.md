<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## 도구 호출

한글 등 비ASCII 문자열을 도구 호출 파라미터에 넣을 때는 리터럴 UTF-8로 그대로 쓴다.
`\uXXXX` 유니코드 이스케이프로 바꿔 쓰지 않는다.

## 프로젝트: 쉐어하우스 관리사무소

PRD: `docs/sharehouse-office-prd.md`

## 도메인 용어집

코드/스키마/API에서 아래 한글 용어는 반드시 지정된 영문 네이밍으로 쓴다. 새로운 도메인 개념을 코드에 반영하기 전에는 먼저 이 표에 추가할 용어를 사용자와 확인한다.

| 한글 용어    | 영문 네이밍                         | 비고                                                                                   |
| ------------ | ----------------------------------- | -------------------------------------------------------------------------------------- |
| 지점(하우스) | `house`                             | `branch`는 git branch와 이름이 겹쳐 코드/커밋/리뷰에서 혼동되므로 사용 금지. PRD 4.1.0 |
| 입주자       | `tenant`                            | PRD 4.1.2                                                                              |
| 관리비       | `maintenance_fee`                   | `expense`처럼 광범위한 이름 금지 (매출 등 다른 지출 개념과 혼동 방지)                  |
| 정산(행위)   | `settlement`                        | PRD 4.1.1, `/maintenance-fee-settlements/:year-:month`                                 |
| 정산월       | `maintenance_fee_settlement_period` | 예: 2026-09                                                                            |
| 게시         | `publish` / `is_published`          | "확정(finalize)" 개념 폐기, PRD 4.1.1. 입주자에게 정보 공개 여부만 나타내며, 게시 후에도 모든 데이터 수정 가능 |
