"use client";

import { useRef, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { SettlementHeader } from "@/components/layout/SettlementHeader";
import { LoginGate } from "@/components/layout/LoginGate";
import { ScrollContainerProvider } from "@/components/layout/ScrollContainerContext";

interface SettlementPageShellProps {
  monthLabel: string;
  children: React.ReactNode;
}

export function SettlementPageShell({ monthLabel, children }: SettlementPageShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative flex h-screen">
      <LoginGate visible={false} />
      <div className="hidden lg:block">
        <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen((o) => !o)} variant="desktop" />
      </div>
      <div className="hidden md:block lg:hidden">
        <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen((o) => !o)} variant="tablet" />
      </div>
      <div className="md:hidden">
        <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen((o) => !o)} variant="overlay" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col bg-white">
        <SettlementHeader monthLabel={monthLabel} />
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
          <ScrollContainerProvider value={scrollRef}>{children}</ScrollContainerProvider>
        </div>
      </div>
    </div>
  );
}
