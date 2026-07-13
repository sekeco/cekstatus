import {
  CircleUser,
  ExternalLink,
  FileSpreadsheet,
  KeyRound,
  LayoutDashboard,
  type LucideIcon,
  Package,
  Palette,
  PlusCircle,
  Settings,
  UserCog,
  Users,
  UsersRound,
} from "lucide-react";

export type NavBadge = "new" | "soon";

export interface NavSubItem {
  id: string;
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

interface NavItemBase {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

export interface NavMainLinkItem extends NavItemBase {
  url: string;
  subItems?: never;
}

export interface NavMainParentItem extends NavItemBase {
  subItems: NavSubItem[];
}

export type NavMainItem = NavMainLinkItem | NavMainParentItem;

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Menu Utama",
    items: [
      {
        id: "dashboard",
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        id: "orders",
        title: "Pesanan",
        icon: Package,
        subItems: [
          { id: "orders-all", title: "Semua Pesanan", url: "/dashboard/orders", icon: FileSpreadsheet },
          { id: "orders-new", title: "Tambah Pesanan", url: "/dashboard/orders/new", icon: PlusCircle },
        ],
      },
      {
        id: "customers",
        title: "Pelanggan",
        url: "/dashboard/customers",
        icon: Users,
      },
      {
        id: "tracking",
        title: "Tracking Publik",
        url: "/track",
        icon: ExternalLink,
        newTab: true,
      },
    ],
  },
  {
    id: 2,
    label: "Sistem",
    items: [
      {
        id: "account",
        title: "Akun",
        url: "/dashboard/account",
        icon: CircleUser,
      },
      {
        id: "settings",
        title: "Pengaturan",
        icon: Settings,
        subItems: [
          { id: "settings-profile", title: "Profil Bisnis", url: "/dashboard/settings", icon: UserCog },
          { id: "settings-status", title: "Status & Warna", url: "/dashboard/settings/status", icon: Palette },
          { id: "settings-members", title: "Tim", url: "/dashboard/settings/members", icon: UsersRound },
          { id: "settings-api-keys", title: "API Keys", url: "/dashboard/settings/api-keys", icon: KeyRound },
        ],
      },
    ],
  },
];
