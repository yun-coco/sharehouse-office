interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  variant: "desktop" | "tablet" | "overlay";
}

/**
 * 사이드바. "입주자 관리" 링크는 UI로만 존재하고 클릭 동작 없음(이번 이식 범위 밖 화면).
 * variant: desktop(lg 이상, 상시 노출) / tablet(md~lg, 투명 배경 오버레이) / overlay(md 미만 모바일, 어두운 배경 50% 폭 드로어).
 */
export function Sidebar({ open, onToggle, variant }: SidebarProps) {
  const toggleLabel = open ? "사이드바 닫기" : "사이드바 열기";
  const isFixedWidth = variant === "desktop" || variant === "tablet";

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
    return <div className="hidden border-r border-[#edece9] lg:block">{content}</div>;
  }

  if (!open) return null;

  const backdropClass = variant === "tablet" ? "bg-transparent" : "bg-[rgba(20,22,18,0.45)]";
  const drawerWidthClass = variant === "tablet" ? "w-[230px]" : "w-1/2";

  return (
    <div className={`fixed inset-0 z-40 ${backdropClass}`} data-testid="sidebar-backdrop" onClick={onToggle}>
      <div
        data-testid="sidebar-drawer"
        className={`h-full ${drawerWidthClass} shadow-[2px_0_16px_rgba(0,0,0,0.18)]`}
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </div>
    </div>
  );
}
