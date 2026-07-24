"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface SettlementHeaderProps {
  monthLabel: string;
  onMenuToggle: () => void;
}

/** 정산월 헤더: 게시/발송 상태는 이 컴포넌트 로컬 state로만 시뮬레이션한다(Supabase 미연동). */
export function SettlementHeader({ monthLabel, onMenuToggle }: SettlementHeaderProps) {
  const [published, setPublished] = useState(false);
  const [sent, setSent] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendHint, setSendHint] = useState(false);

  const handleSendClick = () => {
    if (!published) {
      setSendHint(true);
      setTimeout(() => setSendHint(false), 1100);
      return;
    }
    setShowSendModal(true);
  };

  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-[#e3e1db] bg-white px-6 py-4 lg:px-6">
      <button
        type="button"
        aria-label="사이드바 메뉴 열기"
        onClick={onMenuToggle}
        className="flex min-h-[44px] min-w-[44px] items-center justify-center border-none bg-transparent text-2xl text-[#6b6b62] lg:hidden"
      >
        ☰
      </button>
      <div className="text-2xl font-bold whitespace-nowrap text-[#1a1a1a]">관리비 정산</div>
      <select
        defaultValue={monthLabel}
        className="h-[35px] rounded-md border border-[#e3e1db] bg-white px-3 text-[13px] font-semibold text-[#1a1a1a]"
      >
        <option>{monthLabel}</option>
      </select>
      <div className="flex-1" />
      <a
        href="#"
        className="inline-flex h-[35px] items-center gap-1 rounded-md border border-[#d8d5cc] px-4 text-[13px] font-semibold text-[#37352f] no-underline"
      >
        입주자용 페이지로 이동
        <ExternalLink width={13} height={13} />
      </a>
      <button
        type="button"
        onClick={() => setShowPublishConfirm(true)}
        className={`inline-flex h-[35px] cursor-pointer items-center gap-1.5 rounded-md border-none px-4 text-[13px] font-bold ${
          published ? "bg-[#eaf2ee] text-[#2f6f52]" : "bg-[#2f6f52] text-white"
        }`}
      >
        {published ? "게시 중" : "게시하기 전"}
      </button>
      <div
        className="relative"
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
        description="입주자들에게 이번 달 관리비 정산 결과 알림이 발송돼요."
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
