"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";

/**
 * 섹션 헤더가 스크롤 컨테이너 상단에 실제로 "붙었는지"(sticky pinned) 판정한다.
 * 원본 Claude Design 목업의 checkStuck() 로직과 동일한 기준: 컨테이너를 조금이라도
 * 스크롤했고(scrollTop > 0.5), 헤더의 상단이 컨테이너 상단과 거의 같은 위치일 때만 true.
 */
export function useStuckHeader(
  scrollRef: RefObject<HTMLElement | null>,
  headerRef: RefObject<HTMLElement | null>,
): boolean {
  const [stuck, setStuck] = useState(false);

  const check = useCallback(() => {
    const container = scrollRef.current;
    const header = headerRef.current;
    if (!container || !header) return;
    const containerTop = container.getBoundingClientRect().top;
    const isStuck = container.scrollTop > 0.5 && header.getBoundingClientRect().top <= containerTop + 0.5;
    setStuck((prev) => (prev === isStuck ? prev : isStuck));
  }, [scrollRef, headerRef]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.addEventListener("scroll", check);
    return () => container.removeEventListener("scroll", check);
  }, [scrollRef, check]);

  return stuck;
}
