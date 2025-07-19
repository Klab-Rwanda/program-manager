"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/RoleContext";

export default function FacilitatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
    // Ensure only facilitators can access this layout
    if (isAuthenticated && role !== "facilitator") {
      router.push("/dashboard");
    }
  }, [isAuthenticated, role, router]);

  if (!isAuthenticated || role !== "facilitator") {
    return null;
  }

  return <>{children}</>;
} 