"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Share pages are public and don't need theme switching or auth providers.
  // Skipping ThemeProvider also avoids the React 19 "script tag inside component" error.
  if (pathname.startsWith("/share")) {
    return <>{children}</>;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <SessionProvider>
        <TooltipProvider>
          {children}
          <Toaster position="bottom-center" richColors />
        </TooltipProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
