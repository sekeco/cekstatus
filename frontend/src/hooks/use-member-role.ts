"use client";

import { useEffect, useState } from "react";

import { authClient, useActiveOrganization } from "@/lib/auth-client";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export function useMemberRole() {
  const { data: org } = useActiveOrganization();
  const { data: session } = authClient.useSession();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!org?.slug || !session?.user?.id) {
      setLoading(false);
      return;
    }

    fetch(`${BACKEND_URL}/api/organizations/${org.slug}/members`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((members: { userId: string; role: string }[]) => {
        if (cancelled) return;
        const me = members.find((m) => m.userId === session.user.id);
        setRole(me?.role ?? "member");
      })
      .catch(() => {
        if (!cancelled) setRole("member");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [org?.slug, session?.user?.id]);

  return {
    role,
    isAdmin: role === "owner" || role === "admin",
    isOwner: role === "owner",
    isMember: role === "member",
    loading,
  };
}
