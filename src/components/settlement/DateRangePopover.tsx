"use client";

import { useState } from "react";

interface DateRangePopoverProps {
  value: string | null;
  onChange: (date: string) => void;
  placeholder: string;
  anchor: "left" | "right";
  allowClear?: boolean;
  onClear?: () => void;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * 버튼+팝오버 캘린더. CLAUDE.md 규칙: 날짜 범위 입력은 항상 이 컴포넌트로 통일,
 * 팝오버는 트리거 기준 left:0(시작일)/right:0(종료일)로 앵커링해 가장자리 잘림 방지.
 */
export function DateRangePopover({
  value,
  onChange,
  placeholder,
  anchor,
  allowClear = false,
  onClear,
}: DateRangePopoverProps) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => (value ?? new Date().toISOString().slice(0, 10)).slice(0, 7));

  const label = value ? value.replaceAll("-", ".") : placeholder;
  const [year, month] = viewMonth.split("-").map(Number);
  const firstDow = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const todayStr = new Date().toISOString().slice(0, 10);

  const cells: { day: number; dateStr: string | null }[] = [];
  for (let i = 0; i < firstDow; i++) cells.push({ day: 0, dateStr: null });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, dateStr: `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
  }

  const anchorClass = anchor === "left" ? "left-0" : "right-0";

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`h-[30px] cursor-pointer rounded-md border border-[#e3e1db] bg-white px-2 text-center text-[13px] ${
          value ? "text-[#1a1a1a]" : "text-[#a8a89c]"
        }`}
      >
        {label}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[150]" onClick={() => setOpen(false)} />
          <div
            className={`absolute top-[34px] ${anchorClass} z-[200] w-[236px] rounded-2xl bg-white p-4 text-left shadow-[0_20px_50px_rgba(0,0,0,0.25)]`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[15px] font-bold text-[#1a1a1a]">
                {year}년 {month}월
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label="이전 달"
                  onClick={() => {
                    const d = new Date(year, month - 2, 1);
                    setViewMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
                  }}
                  className="cursor-pointer border-none bg-transparent text-[#37352f]"
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label="다음 달"
                  onClick={() => {
                    const d = new Date(year, month, 1);
                    setViewMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
                  }}
                  className="cursor-pointer border-none bg-transparent text-[#37352f]"
                >
                  ↓
                </button>
              </div>
            </div>
            <div className="mb-1 grid grid-cols-7 gap-0.5">
              {WEEKDAYS.map((wd) => (
                <div key={wd} className="py-0.5 text-center text-[11px] font-semibold text-[#a8a89c]">
                  {wd}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((c, i) =>
                c.dateStr ? (
                  <button
                    key={c.dateStr}
                    type="button"
                    onClick={() => {
                      onChange(c.dateStr!);
                      setOpen(false);
                    }}
                    className={`rounded-lg py-1.5 text-center text-[12.5px] ${
                      c.dateStr === value
                        ? "bg-[#2f6f52] font-bold text-white"
                        : c.dateStr === todayStr
                          ? "cursor-pointer border border-[#b7b5aa] font-semibold text-[#1a1a1a]"
                          : "cursor-pointer text-[#37352f]"
                    }`}
                  >
                    {c.day}
                  </button>
                ) : (
                  <div key={`empty-${i}`} />
                ),
              )}
            </div>
            {allowClear && (
              <div className="mt-2.5 border-t border-[#edece9] pt-2.5 text-center">
                <button
                  type="button"
                  onClick={() => {
                    onClear?.();
                    setOpen(false);
                  }}
                  className="cursor-pointer border-none bg-transparent text-[12.5px] text-[#9b9a97] underline"
                >
                  제거하기
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
