// app/layout.tsx
import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { RoleProvider } from "@/lib/contexts/RoleContext";
import { CountsProvider } from "@/lib/contexts/CountsContext";
import { SidebarProvider } from "@/lib/contexts/SidebarContext";
import { AuthProvider } from "@/lib/contexts/authContext"; // ✅ Add this
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "kLab Program Manager - Unified Dashboard",
  description:
    "Comprehensive role-based dashboard for managing training programs and users at kLab",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen`}>
        <AuthProvider> {/* ✅ Wrap everything in AuthProvider */}
          <RoleProvider>
            <CountsProvider>
              <SidebarProvider>
                <ThemeProvider
                  attribute="class"
                  defaultTheme="system"
                  enableSystem
                  disableTransitionOnChange
                >
                  {children}
                  <Toaster richColors position="top-right" />
                </ThemeProvider>
              </SidebarProvider>
            </CountsProvider>
          </RoleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
