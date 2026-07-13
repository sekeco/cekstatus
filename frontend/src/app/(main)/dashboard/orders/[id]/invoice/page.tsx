"use client";

import { use, useEffect, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ArrowLeft, ExternalLink, Printer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type OrderDetailResponse, type StatusEventItem } from "@/lib/api";
import { useActiveOrganization } from "@/lib/auth-client";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: org, isPending: orgLoading } = useActiveOrganization();
  const slug = org?.slug;

  const [order, setOrder] = useState<OrderDetailResponse | null>(null);
  const [events, setEvents] = useState<StatusEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [orgWhatsapp, setOrgWhatsapp] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [orgSlogan, setOrgSlogan] = useState("");

  useEffect(() => {
    if (!slug || !id) return;
    const loadData = async () => {
      setLoading(true);
      try {
        const [orderData, eventsData] = await Promise.all([
          api.orders.getById(slug, id),
          api.orders.getEvents(slug, id),
        ]);
        setOrder(orderData);
        setEvents(eventsData);

        const settingsRes = await fetch(`${BACKEND_URL}/api/organizations/${slug}/settings`, {
          credentials: "include",
        });
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          setOrgName(settings.name || "");
          setOrgAddress(settings.address || "");
          setOrgPhone(settings.phone || "");
          setOrgWhatsapp(settings.whatsapp || "");
          setOrgEmail(settings.email || "");
          setOrgSlogan(settings.slogan || "");
        }
      } catch (err) {
        console.error("Gagal memuat invoice", err);
        router.push(`/dashboard/orders/${id}`);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [slug, id, router]);

  const fmt = (iso: string) => format(new Date(iso), "dd MMMM yyyy, HH:mm", { locale: idLocale });
  const fmtShort = (iso: string) => format(new Date(iso), "dd MMMM yyyy", { locale: idLocale });

  const handlePrint = () => window.print();

  if (orgLoading || loading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!order) return null;

  const rp = (v: number | null) => (v != null ? `Rp ${Number(v).toLocaleString("id-ID")}` : "—");

  return (
    <>
      {/* Action bar */}
      <div className="no-print mb-4 flex items-center justify-between">
        <Button variant="ghost" asChild className="gap-1">
          <Link href={`/dashboard/orders/${id}`}>
            <ArrowLeft className="size-4" />
            Kembali
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/track/${order.orderNumber}`} target="_blank">
              <ExternalLink className="mr-1 size-4" />
              Tracking
            </Link>
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-1 size-4" />
            Cetak / PDF
          </Button>
        </div>
      </div>

      {/* Invoice */}
      <div className="mx-auto max-w-3xl">
        <div className="rounded-xl border bg-card p-8 shadow-sm">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h2 className="font-bold text-xl">{orgName || "CekStatus"}</h2>
              {orgSlogan && <p className="mt-1 text-muted-foreground text-sm">{orgSlogan}</p>}
            </div>
            <div className="text-right">
              <h1 className="font-bold text-lg">INVOICE</h1>
              <p className="font-mono text-muted-foreground text-xs">{order.orderNumber}</p>
              <p className="mt-2 text-xs">
                <Link
                  href={`/track/${order.orderNumber}`}
                  className="text-primary underline underline-offset-2"
                  target="_blank"
                >
                  Lacak pesanan →
                </Link>
              </p>
            </div>
          </div>

          {/* Store + Customer */}
          <div className="mb-6 grid grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="mb-1 font-semibold">Dari:</h3>
              <p>{orgName || "—"}</p>
              {orgAddress && <p className="text-muted-foreground">{orgAddress}</p>}
              {orgPhone && <p className="text-muted-foreground">Telp: {orgPhone}</p>}
              {orgWhatsapp && <p className="text-muted-foreground">WA: {orgWhatsapp}</p>}
              {orgEmail && <p className="text-muted-foreground">{orgEmail}</p>}
            </div>
            <div className="text-right">
              <h3 className="mb-1 font-semibold">Pelanggan:</h3>
              <p>{order.customerName || "—"}</p>
              <p className="text-muted-foreground">Masuk: {fmtShort(order.createdAt)}</p>
              {order.completedAt && <p className="text-muted-foreground">Selesai: {fmtShort(order.completedAt)}</p>}
            </div>
          </div>

          {/* Status */}
          <div className="mb-6">
            {order.currentStatus && (
              <Badge
                className="px-4 py-1.5 text-sm"
                style={{
                  backgroundColor: order.currentStatus.hexColor || undefined,
                  color: order.currentStatus.hexColor ? "#fff" : undefined,
                }}
              >
                {order.currentStatus.label}
              </Badge>
            )}
          </div>

          {/* Table */}
          <table className="mb-6 w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-semibold">Barang</th>
                <th className="pb-2 font-semibold">Keluhan</th>
                <th className="pb-2 text-right font-semibold">Estimasi</th>
                <th className="pb-2 text-right font-semibold">Biaya</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3">{order.label || "—"}</td>
                <td className="py-3">{order.problemDescription}</td>
                <td className="py-3 text-right">{rp(order.estimatedCost)}</td>
                <td className="py-3 text-right font-medium">{rp(order.finalCost)}</td>
              </tr>
            </tbody>
          </table>

          {/* Info */}
          <div className="mb-6 grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Prioritas</span>
              <p className="font-medium capitalize">{order.priority}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Estimasi Selesai</span>
              <p className="font-medium">
                {order.etaValue != null
                  ? `${order.etaValue} ${(order.metadata && (order.metadata as Record<string, string>)?.etaUnit) === "hours" ? "jam" : "hari"}`
                  : "—"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Status</span>
              <p className="font-medium">{order.currentStatus?.label || "—"}</p>
            </div>
          </div>

          {order.internalNotes && (
            <div className="mb-6 rounded-lg bg-muted p-3 text-sm">
              <span className="font-medium">Catatan:</span>
              <p className="mt-1 text-muted-foreground">{order.internalNotes}</p>
            </div>
          )}

          {/* Timeline */}
          <div className="border-t pt-6">
            <h3 className="mb-3 font-semibold text-sm">Riwayat Status</h3>
            {events.length === 0 ? (
              <p className="text-muted-foreground text-sm">Belum ada riwayat</p>
            ) : (
              <div className="space-y-2">
                {events.map((event, idx) => (
                  <div key={event.id || idx} className="flex items-start gap-3 text-sm">
                    <div
                      className="mt-1.5 size-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: event.hexColor || "#e5e7eb",
                      }}
                    />
                    <div className="flex-1">
                      <span className="font-medium">{event.label}</span>
                      {event.note && (
                        <span className="text-muted-foreground">
                          {" — "}
                          {event.note}
                        </span>
                      )}
                      <p className="text-muted-foreground text-xs">{fmt(event.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 border-t pt-4 text-center text-muted-foreground text-xs">
            <p>Invoice dibuat otomatis oleh CekStatus</p>
            <p className="mt-1">{orgName && `${orgName} • `}Butuh bantuan? Hubungi toko.</p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          @page { margin: 1.5cm; }
        }
      `}</style>
    </>
  );
}
