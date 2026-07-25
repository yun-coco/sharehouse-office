interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  variant: "desktop" | "tablet" | "overlay";
}

/**
 * 사이드바. "입주자 관리" 링크는 UI로만 존재하고 클릭 동작 없음(이번 이식 범위 밖 화면).
 * variant: desktop(lg 이상, 상시 노출 자리) / tablet(md~lg, 투명 배경 오버레이) / overlay(md 미만 모바일, 어두운 배경 50% 폭 드로어).
 * open=false면 세 variant 모두 사이드바 본문이 사라지고, 같은 위치에 플로팅 햄버거 버튼만 남는다
 * (원본의 sidebarHidden 상태 — 데스크톱도 예외 없이 숨김 가능).
 */
export function Sidebar({ open, onToggle, variant }: SidebarProps) {
  const toggleLabel = open ? "사이드바 닫기" : "사이드바 열기";
  const isFixedWidth = variant === "desktop" || variant === "tablet";

  if (!open) {
    return (
      <div className="absolute top-3 left-2.5 z-40">
        <button
          type="button"
          aria-label={toggleLabel}
          onClick={onToggle}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center border-none bg-transparent text-2xl text-[#6b6b62]"
        >
          ☰
        </button>
      </div>
    );
  }

  const content = (
    <div
      className={`flex h-full flex-shrink-0 flex-col gap-0.5 bg-[#fbfbfa] px-3.5 pt-3 pb-6 ${
        isFixedWidth ? "w-[230px]" : "w-full"
      }`}
    >
      <div className="mb-2.5 flex items-center px-2.5">
        <button
          type="button"
          aria-label={toggleLabel}
          onClick={onToggle}
          className="-ml-3.5 flex min-h-[44px] min-w-[44px] items-center justify-center border-none bg-transparent text-2xl text-[#6b6b62]"
        >
          ☰
        </button>
      </div>
      <div className="mb-4 flex items-center gap-2 px-2.5 font-bold text-[#1a1a1a]">
        <span className="h-[18px] w-[18px] flex-shrink-0 rounded-[5px] bg-[#2f6f52]" />
        <span className="text-lg">하운 쉐어하우스</span>
      </div>
      <div className="flex items-center gap-2 rounded-md bg-[#eaf2ee] px-2.5 py-2 font-bold text-[#2f6f52]">
        <span className="w-[18px] flex-shrink-0 text-center">📊</span>
        관리비 정산
      </div>
      <a
        href="#"
        className="flex items-center gap-2 rounded-md px-2.5 py-2 font-medium text-[#6b6b62] no-underline"
      >
        <span className="w-[18px] flex-shrink-0 text-center">🏠</span>
        입주자 관리
      </a>
    </div>
  );

  if (variant === "desktop") {
    return <div className="border-r border-[#edece9]">{content}</div>;
  }

  const backdropClass = variant === "tablet" ? "bg-transparent" : "bg-[rgba(20,22,18,0.45)]";
  const drawerWidthClass = variant === "tablet" ? "w-[230px]" : "w-1/2";
  const drawerPositionClass = variant === "tablet" ? "absolute top-0 left-0 shadow-[2px_0_16px_rgba(0,0,0,0.18)]" : "";

  return (
    <div className={`fixed inset-0 z-40 ${backdropClass}`} data-testid="sidebar-backdrop" onClick={onToggle}>
      <div
        data-testid="sidebar-drawer"
        className={`h-full ${drawerWidthClass} ${drawerPositionClass} ${
          variant === "overlay" ? "shadow-[2px_0_16px_rgba(0,0,0,0.18)]" : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </div>
    </div>
  );
}
