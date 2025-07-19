// app/dashboard/layout.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/RoleContext";
import { useSidebar } from "@/lib/contexts/SidebarContext"; // Import the new context
import { AppSidebar } from "@/components/layout/sidebar"; // Your sidebar component
import { Menu } from 'lucide-react';

// A wrapper component to handle the main content's margin
function MainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed, isMobile } = useSidebar();
  const sidebarWidth = isCollapsed ? '80px' : '280px';
  const marginLeft = isMobile ? '0' : sidebarWidth;

  return (
    <div
      className="flex-1 flex flex-col transition-all duration-300 ease-in-out"
      style={{ marginLeft }}
    >
      {children}
    </div>
  );
}

// A wrapper for the mobile header
function MobileHeader() {
    const { toggleMobileMenu } = useSidebar();
    return (
        <header className="flex md:hidden h-16 shrink-0 items-center gap-2 border-b px-4 bg-card">
            <button
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted"
              onClick={toggleMobileMenu}
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold">Dashboard</h1>
        </header>
    );
}


function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null; // or a loading spinner
  }

  return (
    <div className="flex h-full min-h-screen bg-background">
      <AppSidebar />
      <MainContent>
        <MobileHeader />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </MainContent>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardContent>{children}</DashboardContent>;
}