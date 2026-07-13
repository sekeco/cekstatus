"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, activeOrganizationId } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && activeOrganizationId) {
      router.replace("/dashboard/default");
    } else if (isAuthenticated && !activeOrganizationId) {
      router.replace("/org/select");
    } else {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, activeOrganizationId, router]);

  return null;
}
