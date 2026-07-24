"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { SettlementHeader } from "@/components/layout/SettlementHeader";
import { LoginGate } from "@/components/layout/LoginGate";

interface SettlementPageShellProps {
  monthLabel: string;
  children: React.ReactNode;
}

export function SettlementPageShell({ monthLabel, children }: SettlementPageShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen">
      <LoginGate visible={false} />
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen((o) => !o)} variant="desktop" />
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen((o) => !o)} variant="overlay" />
      <div className="flex min-w-0 flex-1 flex-col bg-white">
        <SettlementHeader monthLabel={monthLabel} onMenuToggle={() => setSidebarOpen((o) => !o)} />
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
