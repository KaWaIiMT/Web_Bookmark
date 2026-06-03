import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "MarkBox — AI 智能书签管理",
  description: "一键收藏，AI 自动整理归类，语义搜索找到一切",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-[#f5f3f0] text-[#2c2c2c] antialiased">
        <SessionProvider>
          <TooltipProvider>
            {children}
            <Toaster position="bottom-center" richColors />
          </TooltipProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
