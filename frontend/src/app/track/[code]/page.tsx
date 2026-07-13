"use client";

import { use, useEffect, useState } from "react";

import Link from "next/link";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ArrowLeft, Building2, Clock, Clock8, Mail, MapPin, Phone, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface TrackingEvent {
  label: string;
  value: string;
  hexColor: string | null;
  note: string | null;
  createdAt: string;
}

interface TrackingAttachment {
  id: string;
  url: string;
  filename: string | null;
  mimeType: string | null;
  size: number | null;
}

interface TrackingResult {
  found: boolean;
  order?: {
    orderNumber: string;
    label: string | null;
    problemDescription: string;
    estimatedCost: number | null;
    finalCost: number | null;
    etaValue: number | null;
    completedAt: string | null;
    createdAt: string;
    currentStatus: {
      label: string;
      value: string;
      hexColor: string | null;
    };
    events: TrackingEvent[];
    attachments: TrackingAttachment[];
  };
  organization?: {
    name: string;
    slogan?: string | null;
    address?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    email?: string | null;
    website?: string | null;
    businessHours?: string | null;
    logo?: string | null;
  };
  message?: string;
}

function formatDate(iso: string) {
  return format(new Date(iso), "dd MMM yyyy, HH:mm", { locale: idLocale });
}

export default function TrackResultPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [data, setData] = useState<TrackingResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;
    fetch(`${BACKEND_URL}/api/track/${encodeURIComponent(code)}`)
      .then((res) => res.json())
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch(() => {
        setData({ found: false, message: "Gagal terhubung ke server" });
        setLoading(false);
      });
  }, [code]);

  if (loading) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-4 p-6">
            <Skeleton className="mx-auto h-8 w-48" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────
  if (!data?.found) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-6">
        <Card className="w-full max-w-md shadow-sm">
          <CardHeader className="text-center">
            <div className="mb-2 flex justify-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
                <Search className="size-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-xl">Kode Tidak Ditemukan</CardTitle>
            <CardDescription>{data?.message || "Kode yang kamu masukkan tidak ditemukan."}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-center text-muted-foreground text-sm">
              Coba periksa kembali kode tracking atau hubungi toko langsung.
            </p>
            <Link
              href="/track"
              className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 font-medium text-sm transition-colors hover:bg-accent"
            >
              <ArrowLeft className="size-4" />
              Coba Lagi
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { order: o, organization: org } = data;

  return (
    <div className="min-h-svh bg-gradient-to-b from-muted/50 to-muted p-4 md:p-8">
      <div className="mx-auto max-w-lg space-y-4">
        {/* Back */}
        <Link
          href="/track"
          className="inline-flex items-center gap-1 text-muted-foreground text-sm transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Cari ulang
        </Link>

        {/* Status Header */}
        <Card className="shadow-sm">
          <CardContent className="p-6 text-center">
            <p className="mb-2 text-muted-foreground text-xs uppercase tracking-wider">Status Pesanan</p>
            <Badge
              className="px-5 py-2 text-base"
              style={{
                backgroundColor: o?.currentStatus.hexColor || undefined,
                color: o?.currentStatus.hexColor ? "#fff" : undefined,
              }}
            >
              {o?.currentStatus.label}
            </Badge>
            <p className="mt-2 text-muted-foreground text-sm">
              {o?.label || "Pesanan"} — {o?.orderNumber}
            </p>
          </CardContent>
        </Card>

        {/* Detail */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Detail Pesanan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="Kode Tracking" value={o?.orderNumber} mono />
            {o?.label && <DetailRow label="Barang" value={o?.label} />}
            <DetailRow label="Keluhan" value={o?.problemDescription} />
            <DetailRow label="Tanggal Masuk" value={formatDate(o?.createdAt)} />
            {o?.estimatedCost != null && (
              <DetailRow label="Estimasi Biaya" value={`Rp ${Number(o?.estimatedCost).toLocaleString("id-ID")}`} />
            )}
            {o?.finalCost != null && (
              <DetailRow label="Biaya Final" value={`Rp ${Number(o?.finalCost).toLocaleString("id-ID")}`} />
            )}
            {o?.etaValue != null && <DetailRow label="Estimasi Selesai" value={`${o?.etaValue} hari kerja`} />}
            {o?.completedAt && <DetailRow label="Selesai" value={formatDate(o?.completedAt)} />}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4" />
              Riwayat Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {o?.events.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground text-sm">Belum ada riwayat status</p>
            ) : (
              <div className="relative">
                {o?.events.map((event, idx) => (
                  <div key={idx} className="flex gap-3 pb-6 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div
                        className="flex size-6 shrink-0 items-center justify-center rounded-full ring-2 ring-background"
                        style={{
                          backgroundColor: event.hexColor || "#e5e7eb",
                        }}
                      >
                        <div className="size-2 rounded-full bg-white" />
                      </div>
                      {idx < o?.events.length - 1 && <div className="mt-1 w-px flex-1 bg-border" />}
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{event.label}</span>
                        <span className="text-muted-foreground text-xs">{formatDate(event.createdAt)}</span>
                      </div>
                      {event.note && <p className="mt-0.5 text-muted-foreground text-xs">{event.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Photos */}
        {o?.attachments && o?.attachments.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Foto Barang</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {o?.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={`${BACKEND_URL}${att.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group aspect-square overflow-hidden rounded-lg border bg-muted"
                  >
                    <img
                      src={`${BACKEND_URL}${att.url}`}
                      alt={att.filename || "Foto barang"}
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Store Info */}
        {org && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="size-4" />
                {org.name}
              </CardTitle>
            </CardHeader>
            {(org.address || org.phone || org.whatsapp || org.email || org.businessHours) && (
              <CardContent className="space-y-2 text-sm">
                {org.address && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="mt-0.5 size-4 shrink-0" />
                    <span>{org.address}</span>
                  </div>
                )}
                {org.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="size-4 shrink-0" />
                    <a href={`tel:${org.phone}`} className="hover:text-foreground">
                      {org.phone}
                    </a>
                  </div>
                )}
                {org.whatsapp && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="size-4 shrink-0" />
                    <a
                      href={`https://wa.me/${org.whatsapp.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground"
                    >
                      {org.whatsapp} (WA)
                    </a>
                  </div>
                )}
                {org.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="size-4 shrink-0" />
                    <a href={`mailto:${org.email}`} className="hover:text-foreground">
                      {org.email}
                    </a>
                  </div>
                )}
                {org.businessHours && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock8 className="size-4 shrink-0" />
                    <span>{org.businessHours}</span>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        )}

        {/* Footer */}
        <p className="pb-8 text-center text-muted-foreground text-xs">
          Butuh bantuan? Hubungi toko langsung melalui kontak di atas.
        </p>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-border/50 border-b pb-2 last:border-0">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className={`text-right font-medium ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}
