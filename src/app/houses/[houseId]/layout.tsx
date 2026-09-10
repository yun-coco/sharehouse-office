import type { ReactNode } from "react";

export default function HouseLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-[248px_1fr]">
      <aside className="flex flex-col gap-7 bg-[#21201e] py-6 text-[#d8d5d0]">
        <div className="flex items-center gap-2.5 px-6">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-white">
            쉐
          </div>
          <span className="text-[15px] font-semibold text-white">
            쉐어하우스 오피스
          </span>
        </div>

        <nav className="flex flex-col">
          <span className="px-6 pb-2 text-[11px] font-semibold uppercase tracking-wide text-[#8a8781]">
            운영
          </span>
          <span className="mr-4 flex items-center gap-2.5 rounded-r-[5px] py-2.5 pl-6 text-sm font-medium text-[#8a8781]">
            관리비 정산
          </span>
          <a
            href="#"
            className="flex items-center gap-2.5 rounded-l-[5px] bg-[#f6f5f4] py-2.5 pl-6 pr-3 text-sm font-medium text-[#1a1a1a]"
          >
            입주자 관리
          </a>
        </nav>

        <div className="mt-auto flex items-center gap-2.5 rounded-md bg-white/5 px-3 py-2.5">
          <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-[#62aef0] to-primary" />
          <div className="flex flex-col leading-tight">
            <span className="text-[13px] font-semibold text-white">운영자</span>
            <span className="text-xs text-[#8a8781]">개발 모드</span>
          </div>
        </div>
      </aside>

      <main className="flex flex-col bg-[#f6f5f4]">{children}</main>
    </div>
  );
}
