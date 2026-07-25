interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** 취소 버튼의 접근성 이름(aria-label). 지정하지 않으면 cancelLabel을 그대로 사용한다. 화면에 동시에 렌더링될 수 있는 다른 "취소" 버튼과 접근성 이름이 겹치지 않도록 구분할 때 사용. */
  cancelAriaLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function Modal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "취소",
  cancelAriaLabel,
  onConfirm,
  onCancel,
  danger = false,
}: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(20,22,18,0.45)]">
      <div className="w-[340px] rounded-xl bg-white p-7 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        <div className="mb-2 text-base font-bold text-[#1a1a1a]">{title}</div>
        {description && <div className="mb-5 text-[13px] leading-[1.5] text-[#6b6b62]">{description}</div>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            aria-label={cancelAriaLabel ?? cancelLabel}
            className="cursor-pointer rounded-md border border-[#e3e1db] bg-white px-4 py-[9px] text-[13px] text-[#37352f]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`cursor-pointer rounded-md border-none px-4 py-[9px] text-[13px] font-semibold text-white ${
              danger ? "bg-[#c0433a]" : "bg-[#2f6f52]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
