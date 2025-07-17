import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { RoleProvider } from "@/lib/contexts/RoleContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "kLab Program Manager - Unified Dashboard",
  description: "Comprehensive role-based dashboard for managing training programs and users at kLab",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // --- THE FIX: Add suppressHydrationWarning to the <html> tag ---
    // This tells React to ignore this specific type of hydration mismatch,
    // which is commonly caused by browser extensions like Grammarly.
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <RoleProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </RoleProvider>
      </body>
    </html>
  );
}