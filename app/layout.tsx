import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { RoleProvider } from "@/lib/contexts/RoleContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "kLab Program Manager - Unified Dashboard",
  description: "Comprehensive role-based dashboard for managing training programs and users at kLab",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen`}>
        <RoleProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            {children}
          </ThemeProvider>
        </RoleProvider>
      </body>
    </html>
  )
} 