"use client";

import { createContext, type ReactNode, useContext, useEffect } from "react";

import { usePathname, useRouter } from "next/navigation";

import { useSession } from "@/lib/auth-client";

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  } | null;
  activeOrganizationId: string | null | undefined;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  activeOrganizationId: null,
});

export function useAuth() {
  return useContext(AuthContext);
}

const PUBLIC_PATHS = ["/login", "/register", "/track", "/forgot-password", "/reset-password"];
const AUTH_ONLY_REDIRECT = ["/login", "/register", "/forgot-password", "/reset-password"];
const ORG_PATHS = ["/org/select", "/org/create"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname?.startsWith(p));
  const isOrgPath = ORG_PATHS.some((p) => pathname?.startsWith(p));

  useEffect(() => {
    if (isPending) return;

    if (!session) {
      // Not authenticated → redirect to login (unless already on public path)
      if (!isPublicPath && !isOrgPath) {
        router.replace("/login");
      }
      return;
    }

    // Authenticated but on login/forgot/reset → redirect away
    const isAuthRedirectPath = AUTH_ONLY_REDIRECT.some((p) => pathname?.startsWith(p));
    if (isAuthRedirectPath) {
      router.replace("/dashboard/default");
      return;
    }

    // Authenticated but no active organization → redirect to org select
    const activeOrgId = session.session.activeOrganizationId;
    if (!activeOrgId && !isOrgPath) {
      router.replace("/org/select");
      return;
    }

    // Authenticated, has active org, but on org path → redirect to dashboard
    if (isOrgPath && activeOrgId) {
      router.replace("/dashboard/default");
      return;
    }
  }, [session, isPending, isPublicPath, isOrgPath, router, pathname]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!session,
        isLoading: isPending,
        user: session?.user ?? null,
        activeOrganizationId: session?.session?.activeOrganizationId ?? null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
