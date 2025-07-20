"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/RoleContext";
import { SidebarProvider, useSidebar } from "@/lib/contexts/SidebarContext";
import { AppSidebar } from "@/components/layout/sidebar";
import { Menu } from "lucide-react";

// Wrapper for mobile header
function MobileHeader() {
  const { toggleMobileMenu } = useSidebar();
  return (
    <header className="flex md:hidden h-16 items-center gap-2 border-b px-4 bg-card">
      <button
        className="p-2 rounded-lg text-muted-foreground hover:bg-muted"
        onClick={toggleMobileMenu}
      >
        <Menu size={20} />
      </button>
      <h1 className="text-lg font-semibold">Facilitator Panel</h1>
    </header>
  );
}

// Wrapper for main layout content with sidebar margin
function MainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed, isMobile } = useSidebar();
  const sidebarWidth = isCollapsed ? "80px" : "280px";
  const marginLeft = isMobile ? "0" : sidebarWidth;

  return (
    <div
      className="flex-1 flex flex-col transition-all duration-300 ease-in-out"
      style={{ marginLeft }}
    >
      {children}
    </div>
  );
}

// Protect facilitator routes and apply layout
function ProtectedFacilitatorLayout({ children }: { children: React.ReactNode }) {
  const { role, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    } else if (role !== "Facilitator") {
      router.push("/dashboard");
    }
  }, [isAuthenticated, role, router]);

  if (!isAuthenticated || role !== "Facilitator") {
    return null;
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

export default function FacilitatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ProtectedFacilitatorLayout>{children}</ProtectedFacilitatorLayout>
    </SidebarProvider>
  );
}
