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
import { NotificationProvider } from "@/lib/contexts/NotificationContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "kLab Program Manager - Unified Dashboard",
  description:
    "Comprehensive role-based dashboard for managing training programs and users at kLab",
  generator: "v0.dev",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/favicons/apple-touch-icon.png",
  },
  manifest: "/favicons/site.webmanifest",
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
                <NotificationProvider>
                <ThemeProvider
                  attribute="class"
                  defaultTheme="system"
                  enableSystem
                  disableTransitionOnChange
                >
                  {children}
                  <Toaster richColors position="top-right" />
                </ThemeProvider>
                </NotificationProvider>
              </SidebarProvider>
            </CountsProvider>
          </RoleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
