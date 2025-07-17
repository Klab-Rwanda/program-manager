"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/lib/contexts/RoleContext";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function FacilitatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role, isAuthenticated } = useRole();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = React.useState<boolean | null>(null);

  useEffect(() => {
    // If auth state is known
    if (isAuthenticated !== null) {
      if (!isAuthenticated) {
        router.push("/auth/login");
      } else if (role !== "facilitator") {
        // User is logged in but is not a facilitator
        setIsAuthorized(false);
      } else {
        // User is logged in and is a facilitator
        setIsAuthorized(true);
      }
    }
  }, [isAuthenticated, role, router]);

  // Show a loading spinner while we verify the role
  if (isAuthorized === null) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show an "Access Denied" message if the role is incorrect
  if (!isAuthorized) {
    return (
        <div className="p-4">
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>
                    You do not have permission to view this page. Redirecting to your dashboard...
                </AlertDescription>
            </Alert>
        </div>
    );
  }

  // If authorized, render the children pages (e.g., /facilitator/courses)
  return <>{children}</>;
}