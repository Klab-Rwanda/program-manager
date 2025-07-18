// File: app/facilitator/layout.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/contexts/RoleContext";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar";

// This is a new helper component to manage the content area
function ContentWrapper({ children }: { children: React.ReactNode }) {
  const { isMobile, state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  // This dynamically calculates the width the sidebar is taking up
  const sidebarWidth = isCollapsed ? '80px' : '280px';
  const marginLeft = isMobile ? '0px' : sidebarWidth;

  return (
    <div
      className="flex-1 transition-all duration-300 ease-in-out"
      style={{ marginLeft: marginLeft }}
    >
      {/* The padding is now inside the content area */}
      <div className="p-4 md:p-6">
        {children}
      </div>
    </div>
  );
}

export default function FacilitatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.push("/auth/login");
    } else if (role !== "Facilitator") {
      router.push("/dashboard");
    }
  }, [isAuthenticated, role, router, loading]);

  if (loading || !isAuthenticated || role !== "Facilitator") {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
      <div className="flex h-full min-h-screen">
        <AppSidebar />
        <ContentWrapper>
          {children}
        </ContentWrapper>
      </div>
    </SidebarProvider>
  );
}