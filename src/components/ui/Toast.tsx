interface ToastProps {
  message: string;
  variant: "warning" | "info";
}

export function Toast({ message, variant }: ToastProps) {
  const bgClass = variant === "warning" ? "bg-[#c0433a]" : "bg-[#1c231f]";
  return (
    <div className={`rounded-[9px] ${bgClass} px-5 py-3 text-[13px] whitespace-nowrap text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)]`}>
      {message}
    </div>
  );
}

interface ToastStackProps {
  toasts: { id: string; message: string; variant: "warning" | "info" }[];
}

export function ToastStack({ toasts }: ToastStackProps) {
  return (
    <div className="fixed top-6 left-1/2 z-[1200] flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} variant={t.variant} />
      ))}
    </div>
  );
}
