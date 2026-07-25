"use client";

import { createContext, useContext, type RefObject } from "react";

const ScrollContainerContext = createContext<RefObject<HTMLDivElement | null> | null>(null);

export const ScrollContainerProvider = ScrollContainerContext.Provider;

/**
 * 정산 화면의 스크롤 컨테이너 ref. sticky 섹션 헤더가 실제로 붙었는지 판정할 때 사용한다.
 * Provider 밖에서 쓰이면(예: 섹션 컴포넌트 단독 테스트/스토리) null을 반환한다 — 이 경우
 * useStuckHeader는 항상 stuck=false로 동작해 sticky 테두리 없이도 정상 렌더링된다.
 */
export function useScrollContainerRef(): RefObject<HTMLDivElement | null> {
  const ref = useContext(ScrollContainerContext);
  return ref ?? { current: null };
}
