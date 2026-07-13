"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { CircleUser, CommandIcon, LogOut, Moon, Package, PlusCircle, Search, Settings, Sun, Users } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useSidebar } from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

// ─── Types ───────────────────────────────────────────────────────────────────

type ItemIcon = React.ComponentType<{ className?: string }>;

interface BaseItem {
  id: string;
  label: string;
  icon?: ItemIcon;
  disabled?: boolean;
}

interface LinkItem extends BaseItem {
  kind: "link";
  url: string;
  newTab?: boolean;
}

interface ActionItem extends BaseItem {
  kind: "action";
  action: () => void;
}

type PaletteItem = LinkItem | ActionItem;

interface PaletteGroup {
  id: string;
  heading: string;
  items: PaletteItem[];
}

// ─── Sidebar items → palette items ──────────────────────────────────────────

const sidebarGroupLabels = new Set(sidebarItems.flatMap((g) => (g.label ? [g.label] : [])));

function getSubItemGroup(groupLabel: string | undefined, itemTitle: string) {
  return sidebarGroupLabels.has(itemTitle) ? (groupLabel ?? "Other") : itemTitle;
}

function sidebarToPalette(): PaletteGroup[] {
  return sidebarItems.map((group) => ({
    id: `nav-${group.id}`,
    heading: group.label ?? "Navigasi",
    items: group.items.flatMap((item) => {
      if (item.subItems) {
        return item.subItems.map(
          (sub): LinkItem => ({
            kind: "link",
            id: sub.id,
            label: sub.title,
            url: sub.url,
            icon: (sub.icon ?? item.icon) as ItemIcon | undefined,
            disabled: sub.disabled,
            newTab: sub.newTab,
          }),
        );
      }
      return {
        kind: "link" as const,
        id: item.id,
        label: item.title,
        url: item.url,
        icon: item.icon as ItemIcon | undefined,
        disabled: item.disabled,
        newTab: item.newTab,
      };
    }),
  }));
}

// ─── Actions & Account groups (injected) ────────────────────────────────────

function createActionGroups(toggleTheme: () => void, currentThemeMode: string): PaletteGroup[] {
  return [
    {
      id: "actions",
      heading: "Tindakan",
      items: [
        {
          kind: "link",
          id: "new-order",
          label: "Buat Pesanan Baru",
          url: "/dashboard/orders/new",
          icon: PlusCircle,
        },
        {
          kind: "action",
          id: "toggle-theme",
          label:
            currentThemeMode === "dark" ? "Mode Terang" : currentThemeMode === "light" ? "Mode Gelap" : "Ganti Tema",
          icon: currentThemeMode === "dark" ? Sun : Moon,
          action: toggleTheme,
        },
        {
          kind: "link",
          id: "search-orders",
          label: "Cari Pesanan ...",
          url: "/dashboard/orders",
          icon: Package,
        },
        {
          kind: "link",
          id: "search-customers",
          label: "Cari Pelanggan ...",
          url: "/dashboard/customers",
          icon: Users,
        },
      ],
    },
  ];
}

function createAccountGroup(handleSignOut: () => void): PaletteGroup[] {
  return [
    {
      id: "account",
      heading: "Akun",
      items: [
        {
          kind: "link",
          id: "profile",
          label: "Profil",
          url: "/dashboard/settings",
          icon: CircleUser,
        },
        {
          kind: "link",
          id: "settings",
          label: "Pengaturan",
          url: "/dashboard/settings",
          icon: Settings,
        },
        {
          kind: "action",
          id: "signout",
          label: "Keluar",
          icon: LogOut,
          action: handleSignOut,
        },
      ],
    },
  ];
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SearchDialog() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  const { themeMode, setPreference } = usePreferencesStore(
    useShallow((s) => ({
      themeMode: s.values.theme_mode,
      setPreference: s.setPreference,
    })),
  );

  const { state } = useSidebar();

  // Register global keyboard shortcut ⌘K
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
  };

  const handleSignOut = async () => {
    handleOpenChange(false);
    await authClient.signOut();
    router.replace("/login");
  };

  const toggleTheme = () => {
    const modes = ["light", "dark", "system"] as const;
    const currentIndex = modes.indexOf(themeMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setPreference("theme_mode", nextMode);
    handleOpenChange(false);
  };

  // Build all palette groups (memoised so they don't re-compute on every render)
  const allGroups = React.useMemo(() => {
    const nav = sidebarToPalette();
    const actions = createActionGroups(toggleTheme, themeMode);
    const account = createAccountGroup(handleSignOut);
    return [...actions, ...nav, ...account];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeMode]);

  const handleSelect = (item: PaletteItem) => {
    if (item.disabled) return;

    if (item.kind === "action") {
      item.action();
      return;
    }

    handleOpenChange(false);
    if (item.newTab) {
      window.open(item.url, "_blank", "noopener,noreferrer");
    } else {
      router.push(item.url);
    }
  };

  return (
    <>
      <Button
        onClick={() => handleOpenChange(true)}
        variant="secondary"
        className={state === "collapsed" ? "justify-center ps" : "w-full"}
        size={state === "collapsed" ? "icon" : "default"}
      >
        <CommandIcon className="shrink-0 -ms-0.75" />
        {state !== "collapsed" && (
          <>
            Cari
            <span className="grow" />
            <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium text-[10px]">
              <span className="text-xs">⌘</span>K
            </kbd>
          </>
        )}
      </Button>
      <CommandDialog open={open} onOpenChange={handleOpenChange}>
        <Command>
          <CommandInput placeholder="Cari menu, pesanan, pelanggan…" />
          <CommandList>
            <CommandEmpty>Tidak ditemukan.</CommandEmpty>
            {allGroups.map((group, idx) => (
              <React.Fragment key={group.id}>
                {idx > 0 && <CommandSeparator />}
                <CommandGroup heading={group.heading}>
                  {group.items.map((item) => (
                    <CommandItem
                      key={item.id}
                      disabled={item.disabled}
                      value={`${group.heading} ${item.label}`}
                      onSelect={() => handleSelect(item)}
                    >
                      {item.icon && <item.icon />}
                      <span>{item.label}</span>
                      {item.kind === "link" && item.id === "new-order" && <CommandShortcut>⌘N</CommandShortcut>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </React.Fragment>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
