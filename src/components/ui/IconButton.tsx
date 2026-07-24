import type { LucideIcon } from "lucide-react";

interface IconButtonProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  variant?: "neutral" | "danger";
  size?: number;
}

/** CLAUDE.md 아이콘 규칙: 44x44 터치 타깃, 배경/테두리 없음. */
export function IconButton({ icon: Icon, label, onClick, variant = "neutral", size = 17 }: IconButtonProps) {
  const colorClass = variant === "danger" ? "text-[#e0483c]" : "text-[#6b6b62]";
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center border-none bg-transparent ${colorClass} cursor-pointer`}
    >
      <Icon width={size} height={size} />
    </button>
  );
}
