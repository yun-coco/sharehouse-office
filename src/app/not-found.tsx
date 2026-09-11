import Link from "next/link";
import { Button } from "@/ui/atoms/button";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-6">
      <p className="text-sm text-[#8a8781]">존재하지 않는 경로입니다.</p>
      <Button nativeButton={false} render={<Link href="/" />}>
        홈으로 돌아가기
      </Button>
    </div>
  );
}
