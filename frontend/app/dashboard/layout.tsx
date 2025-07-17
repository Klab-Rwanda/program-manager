"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/lib/contexts/RoleContext";
import { getRoleDisplayName } from "@/lib/roles";

import { AppSidebar } from "@/components/layout/sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"; // Assuming these are your custom components
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role, isAuthenticated, user } = useRole();
  const router = useRouter();

  useEffect(() => {
    // This effect runs on the client side after the component mounts.
    // It checks if the user is authenticated. If not, it redirects them to the login page.
    if (!localStorage.getItem('isAuthenticated')) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  // While the authentication status is being determined (e.g., from localStorage),
  // show a loading state to prevent a flash of unstyled or incorrect content.
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Once authenticated, render the full dashboard layout.
  return (
    <SidebarProvider>
      <div className="flex h-full min-h-screen">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background px-4 sticky top-0 z-10">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <h1 className="text-lg font-semibold">
                    {/* Display the role name dynamically */}
                    {role ? getRoleDisplayName(role) : 'Dashboard'}
                </h1>
            </div>
            {/* You could add a User Profile button here as well if needed */}
          </header>

          <main className="flex-1 p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}