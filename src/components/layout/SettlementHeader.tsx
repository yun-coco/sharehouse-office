"use client";

import { useState } from "react";
import { ExternalLink, MoreVertical } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface SettlementHeaderProps {
  monthLabel: string;
}

const MONTH_LABELS = ["2026-05", "2026-06", "2026-07", "2026-08", "2026-09"].map(
  (m) => `${Number(m.slice(0, 4))}년 ${Number(m.slice(5))}월`,
);

/**
 * 정산월 헤더: 게시/발송 상태는 이 컴포넌트 로컬 state로만 시뮬레이션한다(Supabase 미연동).
 * 햄버거 메뉴 토글은 이 컴포넌트가 아니라 Sidebar 자체가 담당한다(원본 구조: 숨김 상태일 때
 * 페이지 최상단에 뜨는 플로팅 버튼, 열림 상태일 때 사이드바 내부 버튼 — 헤더에는 없음).
 */
export function SettlementHeader({ monthLabel }: SettlementHeaderProps) {
  const [published, setPublished] = useState(false);
  const [sent, setSent] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendHint, setSendHint] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleSendClick = () => {
    if (!published) {
      setSendHint(true);
      setTimeout(() => setSendHint(false), 1100);
      return;
    }
    setShowSendModal(true);
  };

  const menuPublishClick = () => {
    setShowMobileMenu(false);
    setShowPublishConfirm(true);
  };

  const menuSendClick = () => {
    setShowMobileMenu(false);
    handleSendClick();
  };

  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-[#e3e1db] bg-white px-[25px] pt-[55px] pb-4">
      <div className="text-2xl font-bold whitespace-nowrap text-[#1a1a1a]">관리비 정산</div>
      <select
        defaultValue={monthLabel}
        className="h-[35px] rounded-md border border-[#e3e1db] bg-white px-3 text-[13px] font-semibold text-[#1a1a1a]"
      >
        {MONTH_LABELS.map((label) => (
          <option key={label} value={label}>
            {label}
          </option>
        ))}
      </select>
      <div className="flex-1" />
      <a
        href="#"
        className="hidden h-[35px] items-center gap-1 rounded-md border border-[#d8d5cc] px-4 text-[13px] font-semibold text-[#37352f] no-underline md:inline-flex"
      >
        입주자용 페이지로 이동
        <ExternalLink width={13} height={13} />
      </a>
      <button
        type="button"
        onClick={() => setShowPublishConfirm(true)}
        className={`hidden h-[35px] cursor-pointer items-center gap-1.5 rounded-md border-none px-4 text-[13px] font-bold md:inline-flex ${
          published ? "bg-[#eaf2ee] text-[#2f6f52]" : "bg-[#2f6f52] text-white"
        }`}
      >
        <span
          data-testid="publish-dot"
          className={`inline-block h-[7px] w-[7px] flex-shrink-0 rounded-full ${
            published ? "bg-[#2f6f52]" : "border-[1.5px] border-current opacity-60"
          }`}
        />
        {published ? "게시 중" : "게시하기 전"}
      </button>
      <div
        className="relative hidden md:block"
        onClick={handleSendClick}
        onMouseEnter={() => !published && setSendHint(true)}
        onMouseLeave={() => setSendHint(false)}
      >
        <button
          type="button"
          disabled={!published}
          className={`h-[35px] rounded-md border-none px-4 text-[13px] font-bold whitespace-nowrap ${
            published
              ? sent
                ? "cursor-pointer bg-[#eaf2ee] text-[#2f6f52]"
                : "cursor-pointer bg-[#1a1a1a] text-white"
              : "cursor-not-allowed bg-[#e2e0d8] text-[#a8a89c]"
          }`}
        >
          {sent ? "✓ 발송 완료" : "정산 결과 발송"}
        </button>
        {sendHint && (
          <div className="absolute top-[calc(100%+6px)] right-0 z-20 rounded-md bg-[#1c231f] px-2.5 py-1.5 text-xs whitespace-nowrap text-white">
            게시 후 발송할 수 있습니다
          </div>
        )}
      </div>

      <div className="relative md:hidden">
        <button
          type="button"
          aria-label="더 보기"
          onClick={() => setShowMobileMenu((v) => !v)}
          className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center border-none bg-transparent text-[#6b6b62]"
        >
          <MoreVertical width={20} height={20} />
        </button>
        {showMobileMenu && (
          <>
            <div className="fixed inset-0 z-[150]" onClick={() => setShowMobileMenu(false)} />
            <div
              className="absolute top-[calc(100%+4px)] right-0 z-[200] flex w-[210px] flex-col gap-0.5 rounded-lg bg-white p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.18)]"
              onClick={(e) => e.stopPropagation()}
            >
              <a
                href="#"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-1.5 rounded-md px-3 py-2.5 text-[13px] font-semibold text-[#37352f] no-underline"
              >
                입주자용 페이지로 이동
                <ExternalLink width={13} height={13} />
              </a>
              <button
                type="button"
                onClick={menuPublishClick}
                className="flex cursor-pointer items-center gap-1.5 rounded-md border-none bg-transparent px-3 py-2.5 text-left text-[13px] font-semibold text-[#37352f]"
              >
                <span
                  className={`inline-block h-[7px] w-[7px] flex-shrink-0 rounded-full ${
                    published ? "bg-[#2f6f52]" : "border-[1.5px] border-current opacity-60"
                  }`}
                />
                {published ? "게시 중" : "게시하기 전"}
              </button>
              <button
                type="button"
                onClick={menuSendClick}
                className="cursor-pointer rounded-md border-none bg-transparent px-3 py-2.5 text-left text-[13px] font-semibold text-[#37352f]"
              >
                {sent ? "✓ 발송 완료" : "정산 결과 발송"}
              </button>
            </div>
          </>
        )}
      </div>

      <Modal
        open={showPublishConfirm}
        title={published ? "게시를 취소할까요?" : "관리비 정산을 게시할까요?"}
        description={
          published
            ? "입주자용 페이지에서 이번 달 정산 결과가 더 이상 보이지 않아요."
            : "입주자용 페이지에 이번 달 관리비 정산 결과가 공개돼요."
        }
        confirmLabel={published ? "게시 취소하기" : "게시하기"}
        onConfirm={() => {
          setPublished((p) => !p);
          setShowPublishConfirm(false);
        }}
        onCancel={() => setShowPublishConfirm(false)}
      />

      <Modal
        open={showSendModal}
        title="정산 결과를 발송할까요?"
        description="입주자들에게 이번 달 관리비 정산 결과 알림이 발송돼요. (이 프로토타입에서는 실제 발송 대신 화면으로만 보여드려요)"
        confirmLabel="발송하기"
        onConfirm={() => {
          setSent(true);
          setShowSendModal(false);
        }}
        onCancel={() => setShowSendModal(false)}
      />
    </div>
  );
}
