"use client";

import { Fragment } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const LABEL_MAP: Record<string, string> = {
  dashboard: "Dashboard",
  orders: "Pesanan",
  customers: "Pelanggan",
  settings: "Pengaturan",
  new: "Tambah Baru",
  status: "Status & Warna",
  track: "Tracking Publik",
  members: "Anggota",
  "api-keys": "API Keys",
  invoice: "Invoice",
};

/**
 * Contextual labels for dynamic segments (IDs) based on the parent segment.
 */
const DETAIL_LABELS: Record<string, string> = {
  orders: "Detail Pesanan",
  customers: "Detail Pelanggan",
};

/**
 * Check if a segment looks like an auto-generated ID rather than a
 * meaningful route segment (e.g. "odtkcls6zwb4bt0uqz7ei306").
 */
function isIdSegment(segment: string): boolean {
  return segment.length > 8 && !LABEL_MAP[segment];
}

function getLabel(segment: string, parentSegment?: string): string {
  // If it's an ID segment and we have a contextual label for the parent, use it
  if (isIdSegment(segment) && parentSegment && DETAIL_LABELS[parentSegment]) {
    return DETAIL_LABELS[parentSegment];
  }
  return LABEL_MAP[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function BreadcrumbNav() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Don't show breadcrumb on dashboard root
  if (segments.length <= 1) return null;

  const items = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;
    const parentSegment = index > 0 ? segments[index - 1] : undefined;
    const label = getLabel(segment, parentSegment);

    return { href, label, isLast };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => (
          <Fragment key={item.href}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {item.isLast ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
