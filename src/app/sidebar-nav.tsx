"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

export function SidebarNav() {
  const pathname = usePathname();
  const isTenantsActive = pathname.startsWith("/houses");

  return (
    <nav className="flex flex-col">
      <span className="px-6 pb-2 text-[11px] font-semibold uppercase tracking-wide text-[#8a8781]">
        운영
      </span>
      <span className="mr-4 flex cursor-not-allowed items-center gap-2.5 rounded-r-[5px] py-2.5 pl-6 text-sm font-medium text-[#8a8781] hover:bg-white/5">
        관리비 정산
      </span>
      <Link
        href="/houses"
        className={cn(
          "flex items-center gap-2.5 rounded-l-[5px] py-2.5 pl-6 pr-3 text-sm font-medium",
          isTenantsActive
            ? "bg-[#f6f5f4] text-[#1a1a1a]"
            : "text-[#8a8781] hover:bg-white/5",
        )}
      >
        입주자 관리
      </Link>
    </nav>
  );
}
