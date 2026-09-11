import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SidebarNav } from "./sidebar-nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "쉐어하우스 오피스",
  description: "쉐어하우스 관리사무소",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="grid min-h-screen grid-cols-[248px_1fr]">
          <aside className="flex flex-col gap-7 bg-[#21201e] py-6 text-[#d8d5d0]">
            <Link href="/" className="flex items-center gap-2.5 px-6">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-white">
                쉐
              </div>
              <span className="text-[15px] font-semibold text-white">
                쉐어하우스 오피스
              </span>
            </Link>

            <SidebarNav />

            <div className="mt-auto flex items-center gap-2.5 rounded-md bg-white/5 px-3 py-2.5">
              <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-[#62aef0] to-primary" />
              <div className="flex flex-col leading-tight">
                <span className="text-[13px] font-semibold text-white">
                  운영자
                </span>
                <span className="text-xs text-[#8a8781]">개발 모드</span>
              </div>
            </div>
          </aside>

          <main className="flex flex-col bg-[#f6f5f4]">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
