interface ModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
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
  onConfirm,
  onCancel,
  danger = false,
}: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(20,22,18,0.45)]">
      <div className="w-[340px] rounded-xl bg-white p-7 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        <div className="mb-2 text-base font-bold text-[#1a1a1a]">{title}</div>
        <div className="mb-5 text-[13px] leading-relaxed text-[#6b6b62]">{description}</div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-md border border-[#e3e1db] bg-white px-4 py-2 text-[13px] text-[#37352f]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`cursor-pointer rounded-md border-none px-4 py-2 text-[13px] font-semibold text-white ${
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
