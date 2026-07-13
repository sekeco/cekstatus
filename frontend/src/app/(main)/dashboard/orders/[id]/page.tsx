"use client";

import { use, useEffect, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  ArrowLeftIcon,
  CheckCircle2,
  CircleOff,
  Clock,
  Copy,
  Droplets,
  Edit3,
  ExternalLink,
  FileText,
  ImageIcon,
  MessageSquare,
  Package,
  PenTool,
  Printer,
  Ruler,
  SearchCheck,
  SearchX,
  Upload,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { InvoiceModal } from "@/components/invoice-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList,
  FileUploadTrigger,
} from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { type AttachmentResponse, api, type OrderDetailResponse, type StatusEventItem } from "@/lib/api";
import { useActiveOrganization } from "@/lib/auth-client";

// Base URL for public/frontend links (tracking page, etc.)
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
// Backend URL for media (uploaded images served by backend)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const PRIORITY_LABELS: Record<string, string> = {
  low: "Rendah",
  normal: "Normal",
  high: "Tinggi",
  urgent: "Urgent",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  normal: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

function StatusIcon({ icon }: { icon: string | null }) {
  switch (icon) {
    case "Clock":
      return <Clock className="size-4" />;
    case "CheckCircle2":
      return <CheckCircle2 className="size-4" />;
    case "Wrench":
      return <Wrench className="size-4" />;
    case "CircleOff":
      return <CircleOff className="size-4" />;
    case "SearchCheck":
      return <SearchCheck className="size-4" />;
    case "Package":
      return <Package className="size-4" />;
    case "Droplets":
      return <Droplets className="size-4" />;
    case "PenTool":
      return <PenTool className="size-4" />;
    case "Printer":
      return <Printer className="size-4" />;
    case "Ruler":
      return <Ruler className="size-4" />;
    default:
      return <Clock className="size-4" />;
  }
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const _router = useRouter();
  const { id } = use(params);
  const { data: org, isPending: orgLoading } = useActiveOrganization();
  const slug = org?.slug;

  const [order, setOrder] = useState<OrderDetailResponse | null>(null);
  const [events, setEvents] = useState<StatusEventItem[]>([]);
  const [statusTemplates, setStatusTemplates] = useState<{ label: string; value: string; hexColor: string | null }[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [orgSlogan, setOrgSlogan] = useState("");
  const [attachments, setAttachments] = useState<AttachmentResponse[]>([]);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editLabel, setEditLabel] = useState("");
  const [editProblemDescription, setEditProblemDescription] = useState("");
  const [editEstimatedCost, setEditEstimatedCost] = useState("");
  const [editFinalCost, setEditFinalCost] = useState("");
  const [editEtaValue, setEditEtaValue] = useState("");
  const [editPriority, setEditPriority] = useState("normal");
  const [editInternalNotes, setEditInternalNotes] = useState("");
  const [orgEstimationUnit, setOrgEstimationUnit] = useState("hours");

  useEffect(() => {
    if (!slug || !id) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [orderData, eventsData, templates, atts] = await Promise.all([
          api.orders.getById(slug, id),
          api.orders.getEvents(slug, id),
          api.statusTemplates.list(slug),
          api.attachments.list(slug, id),
        ]);
        setAttachments(atts);
        setOrder(orderData);
        setEvents(eventsData);
        setStatusTemplates(templates);
        // Load org settings for invoice & estimation unit
        try {
          const settingsRes = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/organizations/${slug}/settings`,
            { credentials: "include" },
          );
          if (settingsRes.ok) {
            const s = await settingsRes.json();
            setOrgName(s.name || "");
            setOrgAddress(s.address || "");
            setOrgPhone(s.phone || "");
            setOrgSlogan(s.slogan || "");
            setOrgEstimationUnit(s.defaultEstimationUnit || "hours");
          }
        } catch {}
      } catch (err) {
        console.error("Gagal mengambil detail pesanan", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug, id]);

  const handleOpenEdit = () => {
    if (!order) return;
    setEditLabel(order.label || "");
    setEditProblemDescription(order.problemDescription);
    setEditEstimatedCost(order.estimatedCost ? String(order.estimatedCost) : "");
    setEditFinalCost(order.finalCost ? String(order.finalCost) : "");
    setEditEtaValue(order.etaValue ? String(order.etaValue) : "");
    setEditPriority(order.priority);
    setEditInternalNotes(order.internalNotes || "");
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!slug || !id) return;
    setEditSaving(true);
    try {
      const unit = (order?.metadata && (order.metadata as Record<string, string>)?.etaUnit) || orgEstimationUnit;
      const updated = await api.orders.update(slug, id, {
        label: editLabel.trim() || null,
        problemDescription: editProblemDescription.trim(),
        estimatedCost: editEstimatedCost ? Number(editEstimatedCost) : null,
        finalCost: editFinalCost ? Number(editFinalCost) : null,
        etaValue: editEtaValue ? Number(editEtaValue) : null,
        priority: editPriority,
        internalNotes: editInternalNotes.trim() || null,
        metadata: { etaUnit: unit },
      });
      setOrder(updated as OrderDetailResponse);
      toast.success("Pesanan berhasil diperbarui!");
      setEditDialogOpen(false);
    } catch (err) {
      console.error("Gagal update pesanan", err);
      toast.error(err instanceof Error ? err.message : "Gagal update pesanan");
    } finally {
      setEditSaving(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!slug || !id || !selectedStatus) return;
    setSaving(true);
    try {
      const result = await api.orders.updateStatus(slug, id, {
        status: selectedStatus,
        note: statusNote.trim() || undefined,
      });
      setOrder(result.order as OrderDetailResponse);
      setEvents((prev) => [result.event, ...prev]);
      toast.success("Status berhasil diupdate!");
      setStatusDialogOpen(false);
      setStatusNote("");
    } catch (err) {
      console.error("Gagal update status", err);
      toast.error(err instanceof Error ? err.message : "Gagal update status");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: order?.currency || "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (orgLoading || loading) {
    return (
      <div className="@container/main space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchX />
          </EmptyMedia>
          <EmptyTitle>Pesanan tidak ditemukan</EmptyTitle>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild variant="outline">
            <Link href="/dashboard/orders">Kembali</Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  const currentStatus = order.currentStatus;

  return (
    <div className="@container/main space-y-6">
      {/* Back + Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/orders">
              <ArrowLeftIcon className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-semibold text-2xl tracking-tight">{order.orderNumber}</h1>
              {currentStatus && (
                <Badge
                  style={{
                    backgroundColor: currentStatus.hexColor || undefined,
                    color: currentStatus.hexColor ? "#fff" : undefined,
                  }}
                >
                  {currentStatus.label}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">{order.label || order.problemDescription}</p>
          </div>
        </div>
        <div className="grow" />
        <Button variant="outline" className="gap-2" onClick={handleOpenEdit}>
          <Edit3 className="size-4" />
          Edit
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => setInvoiceOpen(true)}>
          <FileText className="size-4" />
          Lihat Invoice
        </Button>
        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Edit3 className="mr-1 size-4" />
              Update Status
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Update Status Pesanan</DialogTitle>
              <DialogDescription>
                {order.orderNumber} — {order.label || order.problemDescription}
              </DialogDescription>
            </DialogHeader>
            <FieldGroup className="gap-4">
              <Field className="gap-1.5">
                <FieldLabel>Status Baru</FieldLabel>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
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
              </Field>
              <Field className="gap-1.5">
                <FieldLabel>Catatan (opsional)</FieldLabel>
                <Textarea
                  placeholder="Tambahkan catatan..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={3}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button onClick={handleUpdateStatus} disabled={!selectedStatus || saving}>
                {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Pesanan</DialogTitle>
              <DialogDescription>{order.orderNumber}</DialogDescription>
            </DialogHeader>
            <FieldGroup className="gap-4">
              <Field className="gap-1.5">
                <FieldLabel htmlFor="edit-label">Nama Item</FieldLabel>
                <Input
                  id="edit-label"
                  placeholder="Servis Laptop Acer"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                />
              </Field>
              <Field className="gap-1.5">
                <FieldLabel htmlFor="edit-desc">Deskripsi Masalah</FieldLabel>
                <Textarea
                  id="edit-desc"
                  value={editProblemDescription}
                  onChange={(e) => setEditProblemDescription(e.target.value)}
                  rows={3}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field className="gap-1.5">
                  <FieldLabel htmlFor="edit-est-cost">Estimasi Biaya</FieldLabel>
                  <Input
                    id="edit-est-cost"
                    type="number"
                    placeholder="500000"
                    value={editEstimatedCost}
                    onChange={(e) => setEditEstimatedCost(e.target.value)}
                  />
                </Field>
                <Field className="gap-1.5">
                  <FieldLabel htmlFor="edit-final-cost">Biaya Final</FieldLabel>
                  <Input
                    id="edit-final-cost"
                    type="number"
                    placeholder="500000"
                    value={editFinalCost}
                    onChange={(e) => setEditFinalCost(e.target.value)}
                  />
                </Field>
              </div>
              <Field className="gap-1.5">
                <FieldLabel htmlFor="edit-eta">Estimasi Pengerjaan</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    id="edit-eta"
                    type="number"
                    min={0}
                    placeholder="3"
                    value={editEtaValue}
                    onChange={(e) => setEditEtaValue(e.target.value)}
                    className="flex-1"
                  />
                  <div className="flex items-center rounded-md border bg-muted px-3 text-muted-foreground text-sm">
                    {orgEstimationUnit === "hours" ? "Jam" : "Hari"}
                  </div>
                </div>
              </Field>
              <Field className="gap-1.5">
                <FieldLabel htmlFor="edit-priority">Prioritas</FieldLabel>
                <Select value={editPriority} onValueChange={setEditPriority}>
                  <SelectTrigger id="edit-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Rendah</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Tinggi</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field className="gap-1.5">
                <FieldLabel htmlFor="edit-notes">Catatan Internal</FieldLabel>
                <Textarea
                  id="edit-notes"
                  placeholder="Catatan untuk teknisi..."
                  value={editInternalNotes}
                  onChange={(e) => setEditInternalNotes(e.target.value)}
                  rows={2}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleSaveEdit} disabled={editSaving}>
                {editSaving ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Detail Card */}
          <Card>
            <CardHeader>
              <CardTitle>Detail Pesanan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-xs">Pelanggan</p>
                  <p className="font-medium">{order.customerName || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Prioritas</p>
                  <Badge variant="secondary" className={PRIORITY_COLORS[order.priority] || ""}>
                    {PRIORITY_LABELS[order.priority] || order.priority}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Estimasi Biaya</p>
                  <p className="font-medium">{formatCurrency(order.estimatedCost)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Biaya Final</p>
                  <p className="font-medium">{formatCurrency(order.finalCost)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Estimasi</p>
                  <p className="font-medium">
                    {order.etaValue != null
                      ? (() => {
                          const unit =
                            (order.metadata && (order.metadata as Record<string, string>)?.etaUnit) ||
                            orgEstimationUnit;
                          const label = unit === "hours" ? "jam" : "hari";
                          return `${order.etaValue} ${label}`;
                        })()
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Tanggal Masuk</p>
                  <p className="font-medium">
                    {format(new Date(order.createdAt), "dd MMM yyyy, HH:mm", {
                      locale: idLocale,
                    })}
                  </p>
                </div>
                {order.completedAt && (
                  <div>
                    <p className="text-muted-foreground text-xs">Tanggal Selesai</p>
                    <p className="font-medium">
                      {format(new Date(order.completedAt), "dd MMM yyyy, HH:mm", {
                        locale: idLocale,
                      })}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-muted-foreground text-xs">Deskripsi Masalah</p>
                <p className="text-sm">{order.problemDescription}</p>
              </div>

              {order.internalNotes && (
                <div className="mt-4 space-y-2 rounded-lg bg-muted/50 p-3">
                  <p className="flex items-center gap-1 font-medium text-muted-foreground text-xs">
                    <MessageSquare className="size-3" />
                    Catatan Internal
                  </p>
                  <p className="text-sm">{order.internalNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Photo Gallery */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="size-4" />
                Foto Barang
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Gallery */}
              {attachments.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {attachments.map((att) => (
                    <div key={att.id} className="group relative">
                      <a
                        href={`${BACKEND_URL}${att.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block aspect-square overflow-hidden rounded-lg border bg-muted"
                      >
                        <img
                          src={`${BACKEND_URL}${att.url}`}
                          alt={att.filename || "Foto"}
                          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </a>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await api.attachments.delete(slug!, id, att.id);
                            setAttachments((prev) => prev.filter((a) => a.id !== att.id));
                            toast.success("Foto dihapus");
                          } catch {
                            toast.error("Gagal menghapus foto");
                          }
                        }}
                        className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-background/80 opacity-0 shadow-xs transition-opacity hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-muted-foreground text-sm">Belum ada foto</p>
              )}
              {/* Upload */}
              <FileUpload
                maxFiles={5}
                maxSize={5 * 1024 * 1024}
                accept="image/*"
                value={uploadFiles}
                onValueChange={setUploadFiles}
                onFileReject={(file, msg) =>
                  toast(msg, {
                    description: `"${file.name}" ditolak`,
                  })
                }
              >
                <FileUploadDropzone>
                  <div className="flex flex-col items-center gap-1 py-2 text-center">
                    <Upload className="size-5 text-muted-foreground" />
                    <p className="text-muted-foreground text-xs">Drag & drop foto di sini</p>
                  </div>
                  <FileUploadTrigger asChild>
                    <Button variant="outline" size="sm" className="mt-1">
                      Pilih File
                    </Button>
                  </FileUploadTrigger>
                </FileUploadDropzone>
                <FileUploadList>
                  {uploadFiles.map((file, index) => (
                    <FileUploadItem key={index} value={file}>
                      <FileUploadItemPreview />
                      <FileUploadItemMetadata />
                      <FileUploadItemDelete asChild>
                        <Button variant="ghost" size="icon" className="size-7">
                          <X />
                        </Button>
                      </FileUploadItemDelete>
                    </FileUploadItem>
                  ))}
                </FileUploadList>

                {uploadFiles.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      onClick={async () => {
                        let successCount = 0;
                        let _failCount = 0;
                        for (const file of uploadFiles) {
                          try {
                            await api.attachments.upload(slug!, id, file);
                            successCount++;
                          } catch (err) {
                            _failCount++;
                            toast.error(err instanceof Error ? err.message : "Gagal upload");
                          }
                        }
                        setUploadFiles([]);
                        if (successCount > 0) {
                          const atts = await api.attachments.list(slug!, id);
                          setAttachments(atts);
                          toast.success(`${successCount} foto berhasil diupload`);
                        }
                      }}
                    >
                      <Upload className="mr-1 size-3" />
                      Upload {uploadFiles.length} file
                    </Button>
                  </div>
                )}
              </FileUpload>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          {/* Tracking Link */}
          <Card>
            <CardHeader>
              <CardTitle>Tracking Publik</CardTitle>
              <CardDescription>Bagikan link ini ke pelanggan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input value={`${FRONTEND_URL}/track/${order.orderNumber}`} readOnly />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    navigator.clipboard.writeText(`${FRONTEND_URL}/track/${order.orderNumber}`);
                    toast.success("Link tracking disalin!");
                  }}
                >
                  <Copy className="size-3.5" />
                  Salin
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => window.open(`${FRONTEND_URL}/track/${order.orderNumber}`, "_blank")}
                >
                  <ExternalLink className="size-3.5" />
                  Buka Tab Baru
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Ringkasan Status */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-muted-foreground text-xs">Status Saat Ini</p>
                <div className="mt-1 flex items-center gap-2">
                  {currentStatus && (
                    <Badge
                      style={{
                        backgroundColor: currentStatus.hexColor || undefined,
                        color: currentStatus.hexColor ? "#fff" : undefined,
                      }}
                    >
                      {currentStatus.label}
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Total Events</p>
                <p className="font-medium">{events.length}</p>
              </div>
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Status</CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="py-4 text-center text-muted-foreground text-sm">Belum ada riwayat status</p>
              ) : (
                <div className="relative space-y-0">
                  {events.map((event, index) => (
                    <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
                      {/* Timeline line */}
                      {index < events.length - 1 && (
                        <div className="absolute top-7 left-[15px] h-full w-px bg-border" />
                      )}
                      {/* Timeline dot */}
                      <div
                        className="relative z-10 mt-1 flex size-8 shrink-0 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: event.hexColor || "hsl(var(--muted))",
                          color: event.hexColor ? "#fff" : undefined,
                        }}
                      >
                        <StatusIcon icon={event.icon} />
                      </div>
                      {/* Content */}
                      <div className="flex-1 pt-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{event.label}</span>
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {format(new Date(event.createdAt), "dd MMM yyyy, HH:mm", {
                            locale: idLocale,
                          })}
                        </p>
                        {event.note && <p className="text-muted-foreground text-sm">{event.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          {/* Invoice Modal */}
          <InvoiceModal
            open={invoiceOpen}
            onOpenChange={setInvoiceOpen}
            order={order}
            events={events}
            orgName={orgName}
            orgAddress={orgAddress}
            orgPhone={orgPhone}
            orgSlogan={orgSlogan}
          />
        </div>
      </div>
    </div>
  );
}
