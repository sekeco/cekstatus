"use client";

import { useCallback, useEffect, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  TouchSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { format, subDays } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  FileDown,
  Filter,
  GripVertical,
  Kanban as KanbanIcon,
  Plus,
  PlusIcon,
  RefreshCw,
  Search,
  Table2,
} from "lucide-react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";

import { DateRangePicker } from "@/components/date-range-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, type OrderResponse } from "@/lib/api";
import { useActiveOrganization } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  normal: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};
const PRIORITY_LABELS: Record<string, string> = {
  low: "Rendah",
  normal: "Normal",
  high: "Tinggi",
  urgent: "Urgent",
};

// ─── Kanban Types ─────────────────────────────────────────
interface StatusCol {
  id: string;
  label: string;
  value: string;
  hexColor: string | null;
  items: OrderResponse[];
}

// ─── Sortable Kanban Card ──────────────────────────────────
function SortableOrderCard({ order, onClick }: { order: OrderResponse; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: order.id,
    data: { type: "task", order },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
      }}
      className={cn("touch-none", isDragging && "opacity-30")}
      {...attributes}
      {...listeners}
    >
      <article
        className="flex cursor-pointer flex-col gap-2 rounded-xl border bg-card p-4 text-card-foreground shadow-xs"
        onClick={onClick}
      >
        <div className="min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="min-w-0 truncate font-medium text-sm leading-none">
              {order.label || order.problemDescription}
            </h3>
            <Badge
              variant="secondary"
              className={cn("shrink-0 rounded-md border-transparent px-2 font-medium", PRIORITY_COLORS[order.priority])}
            >
              {PRIORITY_LABELS[order.priority] || order.priority}
            </Badge>
          </div>
          <p className="line-clamp-2 text-muted-foreground text-sm leading-5">{order.problemDescription}</p>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="font-mono text-xs">{order.orderNumber}</span>
          <span>{order.customerName || "-"}</span>
        </div>
      </article>
    </div>
  );
}

// ─── Kanban Column ─────────────────────────────────────────
function KanbanColumn({
  column,
  orders,
  onOrderClick,
}: {
  column: StatusCol;
  orders: OrderResponse[];
  onOrderClick: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useSortable({
    id: column.id,
    data: { type: "column", columnId: column.id },
  });

  return (
    <section
      ref={setNodeRef}
      className={cn("flex min-h-0 flex-col rounded-t-xl border bg-muted/50 transition-colors", isOver && "bg-muted/70")}
    >
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            {column.hexColor && <div className="size-2.5 rounded-full" style={{ backgroundColor: column.hexColor }} />}
            <h2 className="truncate font-medium text-base leading-none">{column.label}</h2>
          </div>
          <p className="text-muted-foreground text-sm tabular-nums leading-none">{orders.length} pesanan</p>
        </div>
      </div>

      <SortableContext items={orders.map((o) => o.id)} strategy={verticalListSortingStrategy}>
        <div className="scrollbar-thin flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 pb-3">
          {orders.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-xs text-muted-foreground">
              Tidak ada pesanan
            </div>
          ) : (
            orders.map((order) => (
              <SortableOrderCard key={order.id} order={order} onClick={() => onOrderClick(order.id)} />
            ))
          )}
        </div>
      </SortableContext>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function OrdersPage() {
  const router = useRouter();
  const { data: org, isPending: orgLoading } = useActiveOrganization();
  const slug = org?.slug;

  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusTemplates, setStatusTemplates] = useState<{ label: string; value: string; hexColor: string | null }[]>(
    [],
  );
  const [exporting, setExporting] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [view, setView] = useState<"table" | "kanban">("table");

  // ── Kanban state ────────────────────────────────────────
  const [columns, setColumns] = useState<StatusCol[]>([]);
  const [activeOrder, setActiveOrder] = useState<OrderResponse | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
  );

  const fetchOrders = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const result = await api.orders.list(slug, {
        search: search || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        limit: 100,
        offset: 0,
      });
      setOrders(result.data);
      setTotal(result.total);

      // Build kanban columns
      const statusMap = new Map<string, OrderResponse[]>();
      for (const t of statusTemplates) {
        statusMap.set(t.value, []);
      }
      const noStatus: OrderResponse[] = [];
      for (const order of result.data) {
        const sv = order.currentStatus?.value;
        if (sv && statusMap.has(sv)) {
          statusMap.get(sv)!.push(order);
        } else {
          noStatus.push(order);
        }
      }
      const cols: StatusCol[] = statusTemplates.map((t) => ({
        id: t.value,
        label: t.label,
        value: t.value,
        hexColor: t.hexColor,
        items: statusMap.get(t.value) || [],
      }));
      if (noStatus.length > 0) {
        cols.push({
          id: "no-status",
          label: "Tanpa Status",
          value: "no-status",
          hexColor: "#6b7280",
          items: noStatus,
        });
      }
      setColumns(cols);
    } catch (err) {
      console.error("Gagal mengambil pesanan", err);
    } finally {
      setLoading(false);
    }
  }, [slug, search, statusFilter, priorityFilter, statusTemplates]);

  const fetchStatusTemplates = useCallback(async () => {
    if (!slug) return;
    try {
      const templates = await api.statusTemplates.list(slug);
      setStatusTemplates(templates);
    } catch {}
  }, [slug]);

  useEffect(() => {
    if (slug) {
      fetchStatusTemplates();
    }
  }, [slug, fetchStatusTemplates]);

  useEffect(() => {
    if (slug && statusTemplates.length > 0) {
      fetchOrders();
    }
  }, [slug, statusTemplates.length, fetchOrders]);

  // ── Kanban drag handlers ────────────────────────────────
  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    for (const col of columns) {
      const found = col.items.find((o) => o.id === id);
      if (found) {
        setActiveOrder(found);
        return;
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveOrder(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    let targetCol = columns.find((c) => c.id === overId);
    if (!targetCol) {
      for (const col of columns) {
        if (col.items.find((o) => o.id === overId)) {
          targetCol = col;
          break;
        }
      }
    }
    if (!targetCol || targetCol.id === "no-status") return;

    let sourceCol: StatusCol | undefined;
    for (const col of columns) {
      if (col.items.find((o) => o.id === activeId)) {
        sourceCol = col;
        break;
      }
    }
    if (!sourceCol || sourceCol.id === targetCol.id) return;

    setColumns((prev) =>
      prev.map((col) => {
        if (col.id === sourceCol!.id) {
          return { ...col, items: col.items.filter((o) => o.id !== activeId) };
        }
        if (col.id === targetCol!.id) {
          const moved = sourceCol!.items.find((o) => o.id === activeId);
          if (!moved) return col;
          return {
            ...col,
            items: [
              ...col.items,
              {
                ...moved,
                currentStatus: {
                  label: targetCol!.label,
                  value: targetCol!.value,
                  hexColor: targetCol!.hexColor,
                },
              },
            ],
          };
        }
        return col;
      }),
    );

    try {
      await api.orders.updateStatus(slug!, activeId, {
        status: targetCol.value,
        note: "Dipindahkan via Kanban",
      });
      toast.success(`Dipindahkan ke "${targetCol.label}"`);
    } catch {
      toast.error("Gagal update status");
      fetchOrders();
    }
  };

  const handleExportCSV = async () => {
    if (!slug) return;
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (priorityFilter) params.set("priority", priorityFilter);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/organizations/${slug}/orders/export?${params}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Gagal export");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="?(.+?)"?$/);
      a.download = match?.[1] || `orders-export-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      console.error("Gagal export CSV");
    } finally {
      setExporting(false);
    }
  };

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner className="size-6" />
      </div>
    );
  }

  const isKanban = view === "kanban";

  return (
    <div className={`flex flex-col h-full ${isKanban ? "min-h-0 flex-1" : ""} gap-4 md:gap-6`}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Pesanan</h1>
          <p className="text-sm text-muted-foreground">Kelola semua pesanan pelanggan ({total} total)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={exporting}>
            <FileDown className="mr-1 size-4" />
            {exporting ? "..." : "Export CSV"}
          </Button>
          <Button asChild>
            <Link href="/dashboard/orders/new">
              <PlusIcon className="mr-1 size-4" />
              Tambah Pesanan
            </Link>
          </Button>
        </div>
      </div>

      {/* View Toggle + Filters */}
      <div className="flex flex-col gap-3">
        <Tabs value={view} onValueChange={(v) => setView(v as typeof view)} className="min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="w-full *:data-[slot=tabs-trigger]:flex-1 sm:w-fit sm:*:data-[slot=tabs-trigger]:flex-none">
              <TabsTrigger value="table" className="gap-2">
                <Table2 />
              </TabsTrigger>
              <TabsTrigger value="kanban" className="gap-2">
                <KanbanIcon />
              </TabsTrigger>
            </TabsList>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[160px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari pesanan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-9"
                />
              </div>
              {view === "table" && <DateRangePicker value={dateRange} onChange={setDateRange} />}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-36">
                  <Filter className="mr-1 size-3" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">Semua Status</SelectItem>
                  {statusTemplates.map((st) => (
                    <SelectItem key={st.value} value={st.value}>
                      <span className="flex items-center gap-2">
                        {st.hexColor && (
                          <span
                            className="inline-block size-2.5 rounded-full"
                            style={{ backgroundColor: st.hexColor }}
                          />
                        )}
                        {st.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="h-8 w-32">
                  <SelectValue placeholder="Prioritas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">Semua</SelectItem>
                  <SelectItem value="low">Rendah</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Tinggi</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={fetchOrders}>
                <RefreshCw className="size-3" />
              </Button>
            </div>
          </div>
        </Tabs>
      </div>

      {/* ── Table View ──────────────────────────────────── */}
      {view === "table" && (
        <div className="rounded-xl border overflow-clip">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Pesanan</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioritas</TableHead>
                <TableHead>Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  </TableRow>
                ))
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    <Empty className="border-none">
                      <EmptyHeader>
                        <EmptyTitle>Belum ada pesanan</EmptyTitle>
                      </EmptyHeader>
                      <EmptyContent>
                        <Button asChild variant="outline" size="sm">
                          <Link href="/dashboard/orders/new">Buat Pesanan Baru</Link>
                        </Button>
                      </EmptyContent>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                  >
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{order.customerName || "-"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{order.label || order.problemDescription}</TableCell>
                    <TableCell>
                      {order.currentStatus ? (
                        <Badge
                          style={{
                            backgroundColor: order.currentStatus.hexColor || undefined,
                            color: order.currentStatus.hexColor ? "#fff" : undefined,
                          }}
                        >
                          {order.currentStatus.label}
                        </Badge>
                      ) : (
                        <Badge variant="outline">-</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={PRIORITY_COLORS[order.priority] || ""}>
                        {PRIORITY_LABELS[order.priority] || order.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {format(new Date(order.createdAt), "dd MMM yyyy, HH:mm", {
                        locale: idLocale,
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── Kanban View ─────────────────────────────────── */}
      {isKanban && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Spinner className="size-6" />
            </div>
          ) : columns.length === 0 || columns.every((c) => c.items.length === 0) ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Belum ada pesanan</EmptyTitle>
                <EmptyDescription>Belum ada pesanan untuk ditampilkan di Kanban</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/orders/new">
                    <Plus className="mr-1 size-4" />
                    Buat Pesanan
                  </Link>
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <DndContext
              id="orders-kanban"
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="scrollbar-thin min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden bg-muted/25 [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-1">
                <div
                  className="inline-grid h-full min-w-full gap-4 p-4"
                  style={{
                    gridTemplateColumns: `repeat(${Math.max(columns.length, 1)}, minmax(18rem, 1fr))`,
                  }}
                >
                  {columns.map((col) => (
                    <KanbanColumn
                      key={col.id}
                      column={col}
                      orders={col.items}
                      onOrderClick={(id) => router.push(`/dashboard/orders/${id}`)}
                    />
                  ))}
                </div>
              </div>
              <DragOverlay dropAnimation={null}>
                {activeOrder ? (
                  <article className="w-68 rotate-1 rounded-xl border bg-card p-4 text-card-foreground shadow-lg">
                    <div className="min-w-0 space-y-1">
                      <h3 className="truncate font-medium text-sm leading-none">
                        {activeOrder.label || activeOrder.problemDescription}
                      </h3>
                      <p className="line-clamp-2 text-muted-foreground text-sm leading-5">
                        {activeOrder.problemDescription}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                      <span className="font-mono text-xs">{activeOrder.orderNumber}</span>
                      <span>{activeOrder.customerName || "-"}</span>
                    </div>
                  </article>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      )}
    </div>
  );
}
