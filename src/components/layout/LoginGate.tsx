interface LoginGateProps {
  visible: boolean;
}

/** 로그인 게이트 화면. 실제 인증/OAuth는 이번 범위 밖 — 버튼 클릭 동작 없음. */
export function LoginGate({ visible }: LoginGateProps) {
  if (!visible) return null;
  return (
    <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center gap-3.5 bg-white p-10 text-center">
      <div className="h-10 w-10 rounded-[10px] bg-[#2f6f52]" />
      <div className="text-[19px] font-bold text-[#1a1a1a]">로그인이 필요해요</div>
      <div className="text-[13px] leading-[1.6] text-[#6b6b62]">
        이 페이지는 구글 로그인 후에 이용할 수 있어요.
        <br />
        로그인하면 원래 보려던 페이지로 이동해요.
      </div>
      <button
        type="button"
        className="cursor-pointer rounded-lg border border-[#d8d5cc] bg-white px-5 py-2.5 text-[13.5px] font-semibold text-[#37352f]"
      >
        Google로 로그인
      </button>
    </div>
  );
}
