"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Building2Icon, Check, ChevronsUpDown, PlusIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { authClient, useActiveOrganization, useListOrganizations } from "@/lib/auth-client";
import { getInitials } from "@/lib/utils";

export function OrgSwitcher() {
  const router = useRouter();
  const { state } = useSidebar();
  const { data: orgs, isPending: orgsLoading } = useListOrganizations();
  const { data: activeOrg } = useActiveOrganization();
  const [switching, setSwitching] = useState(false);

  const handleSwitch = async (orgId: string) => {
    setSwitching(true);
    try {
      await authClient.organization.setActive({ organizationId: orgId });
      router.refresh();
    } catch (err) {
      console.error("Gagal ganti organisasi", err);
    } finally {
      setSwitching(false);
    }
  };

  const currentOrg = activeOrg;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip={currentOrg?.name ?? "Pilih Bisnis"}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              variant="outline"
            >
              <Building2Icon className={state === "collapsed" ? "mx-auto" : ""} />
              {state !== "collapsed" && (
                <>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{currentOrg?.name ?? "Pilih Bisnis"}</span>
                    <span className="truncate text-xs text-muted-foreground">Bisnis aktif</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            {orgsLoading ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">Memuat...</div>
            ) : orgs && orgs.length > 0 ? (
              <>
                {orgs.map((org) => (
                  <DropdownMenuItem
                    key={org.id}
                    onClick={() => handleSwitch(org.id)}
                    disabled={switching || org.id === currentOrg?.id}
                    className="gap-2 p-2"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="rounded-lg">{getInitials(org.name)}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{org.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {org.metadata && typeof org.metadata === "object" && "businessType" in (org.metadata as object)
                          ? (org.metadata as { businessType?: string }).businessType
                          : ""}
                      </span>
                    </div>
                    {org.id === currentOrg?.id && <Check className="ml-auto size-4 text-primary" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </>
            ) : null}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>
                    <DropdownMenuItem
                      disabled
                      className="gap-2 p-2 opacity-50"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <PlusIcon className="size-4" />
                      Tambah Bisnis
                    </DropdownMenuItem>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Hanya 1 bisnis yang diizinkan</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
