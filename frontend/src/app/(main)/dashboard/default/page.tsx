"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Ellipsis,
  type LucideIcon,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import { Area, CartesianGrid, ComposedChart, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useActiveOrganization } from "@/lib/auth-client";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface DashboardData {
  totalOrders: number;
  completedToday: number;
  statusDistribution: Record<string, number>;
  ordersWithoutStatus: number;
  recentActivity: {
    id: string;
    orderId: string;
    label: string;
    value: string;
    hexColor: string | null;
    note: string | null;
    createdAt: string;
    orderNumber: string;
    orderLabel: string | null;
  }[];
  ordersTrend: { date: string; count: number }[];
  averageServiceDays: number | null;
  topCustomers: { name: string; phone: string | null; orderCount: number }[];
}

const chartConfig = {
  orders: {
    label: "Pesanan",
    theme: {
      light: "hsl(var(--primary))",
      dark: "hsl(var(--primary))",
    },
  },
} satisfies ChartConfig;

function getStatusCount(dist: Record<string, number>, values: string[]) {
  return values.reduce((sum, v) => sum + (dist[v] ?? 0), 0);
}

const PROCESS_STATUSES = [
  "diperiksa",
  "dalam-proses",
  "diservis",
  "dicuci",
  "dijahit",
  "diperbaiki",
  "tunggu-part",
  "menunggu-sparepart",
  "disortir",
  "didesain",
  "cetak",
  "diukur",
  "diproses",
  "menunggu-sparepart",
];
const DONE_STATUSES = ["selesai", "siap"];

export default function DashboardPage() {
  const router = useRouter();
  const { data: org, isPending: orgLoading } = useActiveOrganization();
  const slug = org?.slug;
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/organizations/${slug}/dashboard`, { credentials: "include" });
      if (!res.ok) throw new Error("Gagal memuat dashboard");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) fetchDashboard();
  }, [slug]);

  const totalOrders = data?.totalOrders ?? 0;
  const antrian = getStatusCount(data?.statusDistribution ?? {}, ["antrian"]);
  const dalamProses = getStatusCount(data?.statusDistribution ?? {}, PROCESS_STATUSES);
  const selesaiHariIni = data?.completedToday ?? 0;
  const avgDays = data?.averageServiceDays;

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-semibold text-2xl tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Ringkasan kondisi bisnis dan tren pesanan</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDashboard} disabled={loading}>
          {loading ? <Spinner className="mr-1 size-4" /> : <RefreshCw className="mr-1 size-4" />}
          Refresh
        </Button>
      </div>

      {/* KPI Strip */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/10">
          <div className="grid divide-y *:data-[slot=card]:rounded-none *:data-[slot=card]:ring-0 md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
            <KpiCard
              title="Antrian"
              value={antrian.toLocaleString("id-ID")}
              icon={Clock}
              badge={antrian > 0 ? { text: `${antrian} menunggu`, variant: "warn" } : undefined}
            />
            <KpiCard title="Dalam Proses" value={dalamProses.toLocaleString("id-ID")} icon={Activity} />
            <KpiCard
              title="Selesai Hari Ini"
              value={selesaiHariIni.toLocaleString("id-ID")}
              icon={CheckCircle2}
              badge={selesaiHariIni > 0 ? { text: "✅", variant: "success" } : undefined}
            />
            <KpiCard title="Rata-rata Servis" value={avgDays != null ? `${avgDays} hr` : "—"} icon={TrendingUp} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Orders Trend Chart (Task 16.1) */}
        <div className="xl:col-span-7">
          <Card>
            <CardHeader>
              <CardTitle className="font-normal text-muted-foreground text-sm">Tren Pesanan</CardTitle>
              <CardDescription className="text-foreground text-xl tabular-nums leading-none tracking-tight">
                30 Hari Terakhir
              </CardDescription>
              <CardAction>
                <Ellipsis className="size-4" />
              </CardAction>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : !data?.ordersTrend?.length ? (
                <Empty className="h-64 border-none">
                  <EmptyHeader>
                    <EmptyTitle>Belum ada data tren</EmptyTitle>
                    <EmptyDescription>Data tren 30 hari terakhir akan muncul di sini</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <ChartContainer config={chartConfig} className="h-64 w-full">
                  <ComposedChart data={data.ordersTrend} margin={{ bottom: 0, left: 0, right: 0, top: 0 }}>
                    <defs>
                      <filter id="trend-glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feFlood floodColor="var(--color-orders)" floodOpacity="0.3" />
                        <feComposite in2="blur" operator="in" />
                        <feMerge>
                          <feMergeNode />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="4 4" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10 }}
                      tickMargin={8}
                      tickFormatter={(val: string) => {
                        const d = new Date(val + "T00:00:00");
                        return format(d, "dd MMM", { locale: idLocale });
                      }}
                      interval="preserveStartEnd"
                    />
                    <YAxis hide allowDecimals={false} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(label) => {
                            const str = String(label ?? "");
                            const d = new Date(str + "T00:00:00");
                            return format(d, "dd MMM yyyy", {
                              locale: idLocale,
                            });
                          }}
                          formatter={(value) => {
                            const num = Number(value ?? 0);
                            return (
                              <div className="flex items-center gap-2">
                                <div className="size-2.5 shrink-0 rounded-[2px] bg-(--color-orders)" />
                                <span>Pesanan: {num}</span>
                              </div>
                            );
                          }}
                        />
                      }
                      cursor={{
                        stroke: "var(--border)",
                        strokeDasharray: "4 4",
                      }}
                    />
                    <Area
                      dataKey="count"
                      fill="none"
                      name="orders"
                      stroke="var(--color-orders)"
                      strokeWidth={2}
                      type="monotone"
                      filter="url(#trend-glow)"
                      dot={false}
                      activeDot={{
                        r: 4,
                        fill: "var(--background)",
                        stroke: "var(--color-orders)",
                        strokeWidth: 2,
                      }}
                    />
                  </ComposedChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status Distribution */}
        <div className="xl:col-span-5">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="font-normal text-muted-foreground text-sm">Sebaran Status</CardTitle>
              <CardDescription className="text-foreground text-xl tabular-nums leading-none tracking-tight">
                {totalOrders} Total
              </CardDescription>
              <CardAction>
                <Ellipsis className="size-4" />
              </CardAction>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : !data || Object.keys(data.statusDistribution).length === 0 ? (
                <Empty className="h-48 border-none">
                  <EmptyHeader>
                    <EmptyTitle>Belum ada data</EmptyTitle>
                    <EmptyDescription>Distribusi status pesanan akan muncul di sini</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="space-y-4">
                  {Object.entries(data.statusDistribution).map(([value, count]) => {
                    const total = data.totalOrders || 1;
                    const pct = Math.round((count / total) * 100);
                    const activity = data.recentActivity.find((a) => a.value === value);
                    return (
                      <div key={value} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium capitalize">{activity?.label ?? value}</span>
                          <span className="text-muted-foreground tabular-nums">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: activity?.hexColor || "hsl(var(--primary))",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {data.ordersWithoutStatus > 0 && (
                    <p className="pt-1 text-xs text-muted-foreground">
                      {data.ordersWithoutStatus} pesanan tanpa status
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Recent Activity */}
        <div className="xl:col-span-7">
          <Card>
            <CardHeader>
              <CardTitle className="font-normal text-muted-foreground text-sm">Aktivitas Terbaru</CardTitle>
              <CardDescription className="text-foreground text-xl tabular-nums leading-none tracking-tight">
                {data?.recentActivity?.length ?? 0} Event
              </CardDescription>
              <CardAction>
                <Ellipsis className="size-4" />
              </CardAction>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !data?.recentActivity?.length ? (
                <Empty className="h-48 border-none">
                  <EmptyHeader>
                    <EmptyTitle>Belum ada aktivitas</EmptyTitle>
                    <EmptyDescription>Aktivitas terbaru akan muncul di sini</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="space-y-1">
                  {data.recentActivity.slice(0, 8).map((event) => (
                    <div
                      key={event.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/50"
                      onClick={() => router.push(`/dashboard/orders/${event.orderId}`)}
                    >
                      <div
                        className="flex size-8 shrink-0 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: event.hexColor || "hsl(var(--muted))",
                        }}
                      >
                        <Activity className="size-4 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">
                          <span className="font-medium">{event.orderLabel || event.orderNumber}</span>
                          <span className="text-muted-foreground">
                            {" — "}
                            {event.label}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(event.createdAt), "dd MMM HH:mm", {
                            locale: idLocale,
                          })}
                          {event.note && ` — ${event.note}`}
                        </p>
                      </div>
                      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Customers (Task 16.3) */}
        <div className="xl:col-span-5">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="font-normal text-muted-foreground text-sm">Pelanggan Teratas</CardTitle>
              <CardDescription className="text-foreground text-xl tabular-nums leading-none tracking-tight">
                {data?.topCustomers?.length ?? 0} Pelanggan
              </CardDescription>
              <CardAction>
                <Users className="size-4" />
              </CardAction>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : !data?.topCustomers?.length ? (
                <Empty className="h-48 border-none">
                  <EmptyHeader>
                    <EmptyTitle>Belum ada data pelanggan</EmptyTitle>
                    <EmptyDescription>Data pelanggan teratas akan muncul di sini</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="space-y-2">
                  {data.topCustomers.map((c, i) => (
                    <div
                      key={c.name}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/50"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium tabular-nums">
                        {i + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{c.name}</p>
                        {c.phone && <p className="truncate text-xs text-muted-foreground">{c.phone}</p>}
                      </div>
                      <Badge variant="outline" className="shrink-0 tabular-nums">
                        {c.orderCount}x
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
  badge,
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  badge?: { text: string; variant: "success" | "warn" };
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal text-sm text-muted-foreground">{title}</CardTitle>
        <CardAction className="grid size-6 place-items-center rounded-sm bg-muted">
          <Icon className="size-3 text-foreground" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className="font-bold text-2xl leading-none tracking-tight tabular-nums">{value}</span>
          {badge && (
            <Badge
              className={
                badge.variant === "success"
                  ? "bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300"
                  : "bg-orange-500/10 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300"
              }
            >
              {badge.text}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
