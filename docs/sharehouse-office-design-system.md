# 쉐어하우스 사무소 Design System

## Context

쉐어하우스 사무소 is a shared-house (share house) management back-office — an internal admin tool operators use to manage notices, rooms, residents, and settlements. This design system was built from a detailed written specification of the product's interaction and layout rules, corroborated against the live 관리비 정산(Maintenance Fee Settlement) screen. It targets a dense, utility-first admin UI: a fixed sidebar + scrolling content shell, tight list rows, and a small, disciplined button system.

**Sources provided:** a plain-text set of product/UX notes (layout & structure, sidebar responsive behavior, section/scroll rules, table & list-row spacing, delete/edit flows, empty states, typography scale, the 4 button variants, and accessibility rules) plus the built 관리비 정산 screen as a reference implementation. No Figma link, GitHub repo, or slide deck was given.

## Components

- `forms/` — Button, IconButton, Icon (Lucide wrapper), Input, DatePickerPopover
- `navigation/` — Sidebar (+ HamburgerButton), PageHeader, SectionTitle, MonthFilterDropdown, MoreActionsMenu (mobile "⋮")
- `data/` — ListRow, ListCardMobile
- `feedback/` — ConfirmDialog, WarningDialog, Toast (stacked), EmptyState, Tooltip

## UI Kits

- `ui_kits/admin-dashboard/` — 공지사항(notices) screen: sidebar + list with full add/edit/delete/undo interaction, responsive sidebar demo, empty-state toggle.
- 관리비 정산(Maintenance Fee Settlement) screen: reference implementation for sticky section titles, list-row density, inline row-edit alignment, and the icon/button variant system in a real data-entry context.
- 관리비 조회(read-only public mirror of 관리비 정산): reference implementation for the Public Page tier — see Public Page Tier below.

## Foundations (guidelines/)

Color, type, spacing, radius/shadow, iconography, and wordmark specimen cards — see the Design System tab.

## Index

- `styles.css` — root stylesheet, imports everything under `tokens/`
- `tokens/colors.css`, `tokens/typography.css`, `tokens/spacing.css`
- `assets/` — none yet (no logo/imagery source was provided; see Iconography)
- `SKILL.md` — Claude Code-compatible skill wrapper

## Content Fundamentals

This is an internal admin tool, not a consumer/marketing surface — copy is written for the operator using the tool, terse and functional rather than warm or persuasive.

- **Address form:** notices and screen copy speak to residents in **~요체로 통일**된 어미를 사용한다 — 예: "없습니다" → "없어요", "이동합니다" → "이동해요", "저장되었습니다" → "저장됐어요". ~다/나/까체는 사용하지 않는다. 정중하되 딱딱하지 않은 톤을 유지하고, 첫인칭 "우리" 프레이밍이나 느낌표는 쓰지 않는다.
- **Button labels are noun phrases**, not verb phrases, per spec: "저장", "삭제", "정산 결과 발송" — not "저장하기" or "저장할게요".
- **No emoji anywhere** — this is a utility tool for staff, not a social/marketing product.
- **Dialogs are direct and specific**: confirmation copy names the exact consequence ("삭제한 공지는 목록에서 사라집니다") rather than a generic "정말 삭제하시겠습니까?". (다이얼로그 문구 자체는 스펙에 명시된 하십시오체를 유지하며, 위 ~요체 통일은 화면 본문/토스트/안내 카피에 적용된다.)
- **Empty states are instructional, not cute** — they tell the operator the next concrete action ("우측 상단 + 추가 버튼으로 첫 공지를 작성해보세요"), shown over blurred sample rows rather than an illustration.
- **Tooltip copy** is short, functional, ~요체 톤 유지 — 비활성 버튼 사유 설명("정산 기간이 아직 설정되지 않았어요" 등), 링크/버튼 용도 안내 등.
- Tone overall: efficient, precise, a little formal — closer to a facilities/property-management back office than a startup product.

## Visual Foundations

- **Color:** one brand hue — a mid-value green — used exclusively for the primary action, active nav state, ghost-button accents, and the focus ring. Neutrals are a cool, low-chroma gray ramp (surfaces/borders/text). Black is reserved for the `emphasis` button variant only (and the Tooltip surface, see Tooltip Component below), never for body text. No purple/blue gradients; no gradients at all — flat fills throughout.
- **Type:** single family (Noto Sans KR substitute, see Typography Substitution below) across all UI; weight does the differentiating work (regular body, bold titles), not a second display face. Sizes are fixed per breakpoint tier, not fluid/clamp:
  - Page title: desktop/tablet 25px → mobile 24px
  - Section title: desktop/tablet 20px → mobile 19px
  - Body/form buttons: desktop/tablet a single 13px value → mobile a single 12px value (no fluid range within a tier)
  - Captions/helper text: a flat 11px everywhere (10px is explicitly retired)
  - Tooltip text: 11.5–12px (its own small range, alongside the calendar popover's 11–15px range, as the two exceptions to the flat caption size)
  - The calendar popover is allowed its own 11–15px internal range.
- **Spacing:** tight, admin-density spacing — list rows use 3px top / 0px bottom padding at comfortable density on desktop/tablet (rows read as one continuous block, not padded cards). A 4px-based scale (`--space-1`…`--space-10`) covers everything else. Where a row must host inline edit controls (selects, date buttons, icon buttons), row padding is set so the row's rendered height matches its read-mode counterpart — driven by the 44×44px icon-button touch target already present in read mode, not by shrinking controls.
- **Backgrounds:** flat surface colors only — no photography, no illustration, no full-bleed imagery, no textures/patterns. This is a data-entry tool, not a marketing surface.
- **Corners & elevation:** modest radii (6/10/14px) — never pill-shaped except a dedicated `--radius-pill` token kept in reserve. Cards/dialogs get a soft `shadow-md`/`shadow-lg`; static content surfaces (list rows, page shell) are flat with hairline borders, no shadow — elevation is reserved for things that float above content (dialogs, toasts, popovers, tooltips, the tablet/mobile sidebar overlay).
- **Motion:** minimal and functional — a single `ease-standard` cubic-bezier and two durations (120ms fast / 200ms base) drive sidebar drawer slide-in, hover/press color transitions, and toast enter/fade. Tooltip is the one exception to "functional-only" transition — it appears **instantly** (no fade-in delay), matching its no-native-delay rationale; only its dismissal may use the fast (120ms) fade. No bounce, no scale-pop, no page-level fade choreography.
- **Hover/press states:** color-shift only — buttons darken one step on hover (green-500→600, black→gray-800) and darken again on press/active (→700); no lightening, no opacity dimming, no shrink-on-press.
- **Borders:** 1px hairlines in the neutral scale delineate rows, sidebar edge, and sticky-title bottom edge; borders are structural (separating regions), not decorative.
- **Overlays/blur:** no backdrop-blur is used anywhere. Overlay treatment is tier-specific — see Sidebar Behavior below; only the mobile drawer and modal dialogs use a dimmed scrim.
- **Focus:** a solid brand-green outline at the browser's default thickness — no custom glow/ring size, per accessibility notes.
- **Layout rules:** page title bar is `flex-shrink:0` and never scrolls; only the body scrolls. Section titles are `position:sticky` inside that scroll area with an opaque background, a bottom border, and symmetric/consistent top-bottom padding so content never shows through; the title text itself is `flex-shrink:0` + `white-space:nowrap` so it never wraps, even sharing a row with a helper caption. No horizontal scroll anywhere — content is responsive within the viewport. Mobile hides scrollbars visually (scrolling still works). Table/list column headers and values default to no-wrap as well, except designated long-text columns (which use ellipsis truncation rather than wrapping — see Table & List Layout below).

### Layout & Structure

- Two-pane shell: fixed-width sidebar + content — **공개 페이지 티어(Public Page Tier)는 예외**로, 사이드바가 전혀 없는 단일 컬럼 레이아웃을 쓴다. 자세한 내용은 Public Page Tier 섹션 참고.
- Sidebar width: 230px on desktop/tablet; the mobile drawer is 50% of viewport width.
- Page title area is fixed (`flex-shrink:0`); only the content body scrolls.
- No horizontal scroll anywhere — all content is responsive within the viewport.
- Scrollbars are visually hidden on mobile (scrolling still functions).
- Page title bar controls (dropdowns, buttons): **desktop/tablet 35px, mobile 30px** — see Common UI Specifications.

### Sidebar Behavior (distinct per tier)

- **Desktop:** in-flow, pushes content aside. No overlay, no dimming.
- **Tablet:** `position:absolute` overlay that floats above content (content width unchanged). Backdrop is transparent, not dimmed; clicking the transparent backdrop closes the sidebar.
- **Mobile:** drawer with a dimmed scrim; clicking the scrim closes the drawer.
- The hamburger icon stays in the same position regardless of sidebar state, at a 44×44px touch target.
- **예외 — Public Page Tier:** 로그인 여부와 무관하게 사이드바 자체가 렌더링되지 않는다(위 desktop/tablet/mobile 규칙 모두 미적용). 자세한 내용은 Public Page Tier 섹션 참고.

### Delete & Edit Flows

- Delete requires a confirmation dialog before removal, then an undoable toast after.
- **Confirm dialog trigger scope:** 단순 데이터 저장(save)·생성(create)·수정(edit 커밋)·페이지 이동(navigation)은 확인 다이얼로그 없이 즉시 실행된다. 그 외 모든 액션 — 삭제, 발송(정산 결과 발송 등), **게시(공지 게시 등)**, 편집 중인 행을 저장하지 않고 이탈 시도하는 경우 — 은 실행 전 반드시 확인 다이얼로그를 거친다. "게시" 버튼은 기존 스펙에 없던 항목으로, 이번에 이 규칙에 새로 포함됨.
- Attempting to add/edit another row while one row is already in edit mode triggers a warning dialog.
- Edit-mode field layout matches the read-mode element layout (same positions), and edit-mode row height matches read-mode row height — achieved by sizing inline edit controls (icon buttons especially) to the same 44×44px touch target already driving read-mode row height, not by adding/removing row padding.
- Fields/buttons within the same row share consistent height and font size.
- Multi-line text fields edited inline (e.g. notice text) size to their action buttons' height, not to a taller default textarea box.

### Responsive Principle

- Mobile differs from desktop/tablet in layout only — functionality is 100% identical across tiers (Public Page Tier's C/U/D removal is a distinct, deliberate exception documented separately — see Public Page Tier below, not a responsive-tier difference).

## Field & Input Patterns

- **날짜(기간) 입력:** 네이티브 `<input type=date>`는 사용하지 않고, 버튼(현재 날짜/기간 텍스트 표시) + 팝오버 캘린더 컴포넌트(`DatePickerPopover`)로 통일한다. 팝오버는 트리거 버튼 기준 `left:0` 또는 `right:0`으로 앵커링하며, 뷰포트 중앙 정렬은 하지 않는다.
- **필수 날짜 필드:** 종료일처럼 값이 필수인 날짜 필드에는 "제거하기"/"지우기" 옵션을 노출하지 않는다. 값 변경(다른 날짜 선택)만 가능하고, 빈 값 상태로 되돌릴 수 없다.
- **다건 인라인 편집(예: 할인 항목 추가/삭제):** 한 행 안에서 여러 항목을 추가·삭제하는 편집은 인라인으로 풀지 않고 모달로 분리한다. 트리거 버튼 라벨은 고정 텍스트가 아니라 현재 상태를 반영 — 예: 항목이 있으면 "2건", 없으면 "설정하기", 이미 설정된 값이 있으면 "변경하기".
- **인라인 편집 필드의 placeholder:** 모든 인라인 편집 필드는 항상 placeholder를 넣는다. 선택/필수 여부는 별도 라벨 텍스트("(선택)")보다 placeholder 문구로 구분한다 — 예: 선택 필드는 "선택 사항", 필수 필드는 실제 입력 예시.

## Table & List Layout

- 읽기모드와 수정모드의 열 배치·정렬(순서, 좌우 위치)은 항상 동일하게 유지한다.
- 값이 길어질 경우 줄바꿈하지 않고 ellipsis(말줄임표) 처리하며, 이때도 셀 내부 텍스트의 baseline 정렬은 흐트러지지 않도록 유지한다.
- 한 셀에 우선순위가 다른 텍스트 조각이 함께 들어가는 경우(예: "사유 + 금액") — 우선순위가 낮은 텍스트(사유 등)에만 ellipsis를 적용하고, 고정 텍스트(금액 등)는 줄바꿈 없이 항상 붙어 보이도록 `white-space:nowrap` + `flex-shrink:0`을 적용한다.
- 빈 값은 "-"나 "없음" 같은 placeholder 텍스트를 넣지 않고 셀 자체를 완전히 비운다(생략).

## Mobile Card Layout

데스크톱 테이블 행과 달리, 모바일 리스트 카드는 별도의 그룹핑 구조를 가진다:

- 이름/핵심 메타 정보는 한 줄로 배치.
- 금액/부가 정보는 세로 스택 박스로 묶음.
- 액션 버튼(수정/삭제 등)은 별도 박스로 묶어 카드 하단에 정렬.
- 상위 flex 컨테이너는 `align-items:stretch`로 자식 박스들의 높이를 통일하고, 각 콘텐츠 박스는 `flex-grow:1` + 내부는 `flex-direction:column`으로 배치한다.
- (Responsive Principle에 따라 기능은 데스크톱과 동일하며, 이 그룹핑은 레이아웃 차원의 차이임.)

## Toast

- 경고 토스트와 삭제-실행취소(undo) 토스트는 단일 상태값이 아니라 **배열(스택)**로 관리한다. 여러 액션이 연속으로 발생하면 토스트가 동시에 여러 개 쌓일 수 있어야 한다.
- 각 토스트는 고유 id, 개별 타이머, 개별 fade-in/out 애니메이션을 가진다 — 하나가 사라져도 나머지 토스트의 상태에는 영향을 주지 않는다.

## Tooltip Component

- 네이티브 `title` 속성(표시 지연 있음)은 사용하지 않고, 지연 없이 즉시 뜨는 자체 `Tooltip` 컴포넌트로 통일한다.
- **스타일:** 배경 `#1c231f`, 흰색 텍스트, 11.5–12px, 트리거 요소 기준 절대위치(보통 `top:100% + 6px`).
- **데스크톱/태블릿(마우스 입력):** `mouseenter`/`mouseleave`로 표시/숨김 상태를 제어. 지연 없이 즉시 표시.
- **모바일/터치 입력:** `mouseenter`가 없으므로, **탭하면 토글로 표시하고 다시 탭하면 닫히는 방식**으로 제어한다. 툴팁이 열린 상태에서 툴팁 바깥을 탭하면 닫히도록 한다.
- **적용 대상:** 비활성 상태 버튼의 사유 설명(아래 "비활성 버튼 툴팁 규칙" 참고), Public Page Tier의 "관리자 화면으로 돌아가기" 링크 용도 안내 등.

## Disabled Button Tooltip Rule

- 조건 미충족으로 **비활성화(disabled)된 액션 버튼**은 hover(모바일은 탭) 시 "왜 비활성 상태인지"를 설명하는 Tooltip을 노출한다 — 예: "정산 결과 발송" 버튼이 정산 기간 미설정 등의 이유로 비활성일 때.
- **활성 상태**의 버튼에는 이 툴팁이 뜨지 않는다 — 비활성 사유 설명 툴팁은 오직 비활성 상태에서만 존재한다.
- 이번에 "정산 결과 발송" 버튼에 적용된 패턴이며, 다른 조건부 비활성 액션 버튼(발송/게시 등)에도 동일하게 일반화해 적용할 수 있다.

## Image Save Button Pattern

- 섹션 타이틀 옆에 다운로드 아이콘 + "이미지 저장" 텍스트 라벨을 배치하며, 캡션 스타일(11px, `#b3b2ab`)을 적용한다 — 헤어라인 하단의 안내 캡션("드래그해서 순서를 바꿔보세요")과 동일한 톤/웨이트를 공유한다.
- 클릭 시 **현재 화면에 보이는 실제 UI를 캡처하지 않는다.** 화면 밖(off-screen)에 숨겨둔 캡처 전용 사본 DOM을 별도로 렌더링해 그 사본을 캡처한다.
- 캡처 전용 사본에는 **섹션/항목 제목은 포함**하되, **수정/삭제 열과 액션 버튼(아이콘 버튼 포함)은 제외**한다 — 저장되는 이미지가 순수한 데이터 뷰가 되도록 한다.

## Public Page Tier

관리자 전용 CRUD 화면과 UI/레이아웃이 100% 동일하되, **Create/Update/Delete만 제거된 읽기 전용 미러 화면** 패턴이다.

- **현재 적용 범위:** 우선 **관리비 조회** 페이지 한 곳에만 적용된다(관리비 정산 화면의 읽기 전용 미러). 다른 화면으로의 확장 여부는 아직 결정되지 않았다.
- **사이드바:** 로그인 여부와 무관하게 **항상 없음** — Sidebar Behavior의 desktop/tablet/mobile 규칙이 이 티어에는 전혀 적용되지 않는 예외다.
- **레이아웃:** 사이드바가 빠진 만큼 콘텐츠 영역이 전체 폭을 사용하는 단일 컬럼 셸이 되며, 그 외 페이지 타이틀 바 고정/본문만 스크롤/섹션 타이틀 sticky 등 나머지 Layout 규칙은 관리자 화면과 동일하게 유지된다.
- **액션 제거:** 수정/삭제 아이콘 버튼, 행 추가(+) 버튼, 발송/게시 등 모든 쓰기 액션이 UI에서 완전히 제거된다(비활성화 상태로 두는 것이 아니라 렌더링 자체를 하지 않음). 나머지 시각적 요소(열 배치, 타이포, 색상 등)는 관리자 화면과 동일하게 유지한다.
- **관리자 전환 링크:** 로그인한 관리자가 이 공개 페이지를 보고 있는 경우에만 "관리자 화면으로 돌아가기" 링크를 조건부로 노출한다. hover(모바일은 탭) 시 Tooltip으로 링크의 용도를 안내한다.

## Common UI Specifications

- 페이지 타이틀 섹션 내 드롭다운/버튼의 높이는 **데스크톱/태블릿 35px, 모바일 30px**로 티어별로 다르게 적용한다.
- 월 필터형 드롭다운("YYYY년 MM월" 형식)은 페이지 타이틀 바에 위치하며, 목록은 선택된 월 기준으로 필터링된다.
- 모바일 타이틀 바 우측에는 "⋮"(more-vertical) 아이콘 버튼을 두어, 페이지 이동·게시·발송 등 보조 액션들을 세로 드롭다운 메뉴로 묶을 수 있다.
- 공지/텍스트형 조회(read) 모드 콘텐츠는 최대 줄 수 제한 + ellipsis 처리가 가능하다(`-webkit-line-clamp` 사용).

## Iconography

No icon font, sprite, or SVG set was provided with the source material. This system uses **Lucide** (outline style, ~1.5–2px stroke, CDN-loaded: `unpkg.com/lucide`) as the closest open, CDN-available match for a clean utilitarian admin UI — flagged here as a substitution; swap for the real icon set if one exists. Usage:

- Icon-only actions (edit/delete/save/cancel/hamburger/more-vertical/download) always render inside a 44×44px `IconButton` touch target, per accessibility spec, regardless of the 16–22px glyph size inside.
- Icons are rendered via `<i data-lucide="name">` + `lucide.createIcons()` (see `components/forms/Icon.jsx`), called from the host component's mount/update lifecycle — never hand-drawn SVG, never emoji, never unicode glyph-as-icon.
- No emoji is used as iconography anywhere in this system.
- Two adjacent icon-only buttons in the same row-action group (e.g. edit+delete, or save+cancel) sit at half the row's normal element gap, grouped as their own sub-cluster — not spaced by the row's full inter-field gap.

### Icon Reference (as used in 관리비 정산)

| Purpose                         | Icon name       | Color                    | Glyph size | Touch target |
| ------------------------------- | --------------- | ------------------------ | ---------- | ------------ |
| Edit                            | `pencil`        | `#6b6b62` (neutral gray) | 16–17px    | 44×44px      |
| Delete                          | `trash-2`       | `#e0483c` (red)          | 16–17px    | 44×44px      |
| Save (inline row-edit confirm)  | `check`         | `#6b6b62`                | 18px       | 44×44px      |
| Cancel (inline row-edit cancel) | `x`             | `#6b6b62`                | 18px       | 44×44px      |
| More actions (mobile title bar) | `more-vertical` | `#6b6b62`                | 18px       | 44×44px      |
| Image save                      | `download`      | `#b3b2ab` (caption gray) | 14–15px    | 44×44px      |

Rules:

- Icon-only buttons always use a 44×44px touch target regardless of glyph size, with a transparent background and no border.
- Only delete-related icons are red; all others are neutral gray.
- No emoji, unicode glyphs, or hand-drawn SVGs — everything unifies on Lucide.

## Button Variants (4, confirmed)

- **Primary** — green fill + white text: the default primary action.
- **Secondary** — white fill + gray border: supporting actions.
- **Emphasis** — black fill + white text: exceptional emphasis actions (e.g. "정산 결과 발송"), permitted on other screens too; the exact criteria for when to reach for it are still undecided.
- **Ghost** — pale green border + white fill + green text: used consistently across all screens for "+추가"-type actions.
- Button labels are noun phrases, not verb phrases.
- Inline row-level save/cancel actions are the one exception to text-labeled buttons — they render as `check`/`x` icon buttons (see Icon Reference) rather than a Primary/Secondary pair, to stay compact within a data row.
- Any button variant can enter a **disabled** state; disabled buttons follow the Disabled Button Tooltip Rule above regardless of variant.

## Typography Substitution — please review

No font files were provided. This system uses **Noto Sans KR** (Google Fonts CDN) as a neutral, broadly-supported Korean/Latin substitute, loaded with the system font stack as fallback. If the product has a real brand typeface (or licensed files), please attach it and this system will be updated to use it instead.

## Logo / Brand Mark

No logo file was provided. Wherever a mark would normally appear (sidebar brand row, thumbnail, wordmark card), the brand name is set in type instead. Please attach a logo asset if one exists — this system will never fabricate one.

## Accessibility

- Focus outline: solid brand green, browser-default thickness — no custom glow/ring size.
- Icon-only buttons (edit/delete/save/cancel/hamburger/more-vertical/download): minimum 44×44px touch target.
- Tooltip content must also be reachable without hover where feasible (mobile tap-to-toggle already satisfies this); tooltip is supplementary explanation, not the sole carrier of required information.

## Open Questions

- Concrete criteria for when the Emphasis button variant should be used, beyond the 정산 결과 발송 example.
- Public Page Tier의 관리비 조회 외 다른 화면(공지사항 등) 확장 여부는 아직 미정.

## Intentional additions

No concrete source (codebase/Figma) defined a component inventory, so a standard admin-UI primitive set was authored from the written spec: Button, IconButton, Icon, Input, DatePickerPopover, Sidebar, PageHeader, SectionTitle, MonthFilterDropdown, MoreActionsMenu, ListRow, ListCardMobile, ConfirmDialog, WarningDialog, Toast, EmptyState, Tooltip. Each maps directly to a rule in the spec (e.g. WarningDialog exists solely for the "editing while another row is open" rule; MoreActionsMenu exists solely for the mobile "⋮" aggregation rule; Tooltip exists solely to replace native `title` delay and to explain disabled-button state and the Public Page Tier's admin-return link); none are speculative additions beyond what the spec calls for.
