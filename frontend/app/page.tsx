"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/lib/contexts/RoleContext";
import { Loader2 } from "lucide-react";

export default function RootPage() {
  const { isAuthenticated } = useRole();
  const router = useRouter();

  useEffect(() => {
    // This effect runs on the client-side to check the authentication status.
    // The `isAuthenticated` value is read from the RoleContext, which checks localStorage.
    
    if (isAuthenticated === null) {
      // Still determining auth status, do nothing yet.
      // The loading screen below will be shown.
      return;
    }

    if (isAuthenticated) {
      // If the user is authenticated, send them to their main dashboard view.
      // We use '/dashboard/user-management' as the generic entry point because the
      // component there will render the correct dashboard based on role.
      router.replace("/dashboard/user-management");
    } else {
      // If the user is not authenticated, send them to the login page.
      router.replace("/auth/login");
    }
  }, [isAuthenticated, router]);

  // Render a full-page loading spinner while the redirect logic is processing.
  // This prevents any flicker of content and provides a better user experience.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
}