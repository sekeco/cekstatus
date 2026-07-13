"use client";

import { useEffect, useState } from "react";

import { ChevronDown, ChevronUp, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyContent, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useActiveOrganization } from "@/lib/auth-client";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface StatusTemplate {
  id: string;
  label: string;
  value: string;
  hexColor: string | null;
  icon: string | null;
  description: string | null;
  sequence: number;
}

const COLOR_PRESETS = [
  "#f97316",
  "#3b82f6",
  "#a855f7",
  "#eab308",
  "#22c55e",
  "#6b7280",
  "#ef4444",
  "#06b6d4",
  "#f43f5e",
  "#10b981",
  "#6366f1",
  "#d946ef",
];

export default function StatusSettingsPage() {
  const { data: org, isPending: orgLoading } = useActiveOrganization();
  const slug = org?.slug;

  const [statuses, setStatuses] = useState<StatusTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editValue, setEditValue] = useState("");
  const [editColor, setEditColor] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const refetchStatuses = () => {
    if (!slug) return;
    fetch(`${BACKEND_URL}/api/organizations/${slug}/status-templates`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data: StatusTemplate[]) => {
        setStatuses(data.sort((a, b) => a.sequence - b.sequence));
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();
    fetch(`${BACKEND_URL}/api/organizations/${slug}/status-templates`, {
      credentials: "include",
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data: StatusTemplate[]) => {
        setStatuses(data.sort((a, b) => a.sequence - b.sequence));
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => controller.abort();
  }, [slug]);

  const openEdit = (status?: StatusTemplate) => {
    if (status) {
      setEditingId(status.id);
      setEditLabel(status.label);
      setEditValue(status.value);
      setEditColor(status.hexColor || "#f97316");
    } else {
      setEditingId(null);
      setEditLabel("");
      setEditValue("");
      setEditColor("#f97316");
    }
    setEditDialog(true);
  };

  const handleSave = async () => {
    if (!slug || !editLabel.trim()) {
      toast.error("Nama status harus diisi");
      return;
    }
    setSaving(true);
    try {
      const body = {
        label: editLabel.trim(),
        value: editValue.trim() || editLabel.trim().toLowerCase().replace(/\s+/g, "-"),
        hexColor: editColor || undefined,
      };
      const res = await fetch(
        `${BACKEND_URL}/api/organizations/${slug}/status-templates${editingId ? `/${editingId}` : ""}`,
        {
          method: editingId ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal menyimpan");
      }
      toast.success(editingId ? "Status berhasil diupdate" : "Status baru ditambahkan");
      setEditDialog(false);
      refetchStatuses();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!slug || !deleteId) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/organizations/${slug}/status-templates/${deleteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal menghapus");
      }
      toast.success("Status berhasil dihapus");
      setDeleteDialog(false);
      setDeleteId(null);
      refetchStatuses();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus");
    }
  };

  // Drag-and-drop
  const move = async (fromIdx: number, toIdx: number) => {
    if (!slug) return;
    const items = [...statuses];
    const [moved] = items.splice(fromIdx, 1);
    items.splice(toIdx, 0, moved);
    setStatuses(items);

    for (let i = 0; i < items.length; i++) {
      await fetch(`${BACKEND_URL}/api/organizations/${slug}/status-templates/${items[i].id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sequence: i }),
      }).catch(() => {});
    }
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    move(dragIdx, idx);
    setDragIdx(idx);
  };

  const handleDragEnd = () => setDragIdx(null);

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (!slug) return null;
  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="@container/main mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Atur Status & Warna</h1>
          <p className="text-sm text-muted-foreground">Seret untuk mengurutkan — klik untuk edit warna & nama</p>
        </div>
        <Button onClick={() => openEdit()} className="gap-2">
          <Plus className="size-4" />
          Tambah Status
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-2">
          {statuses.length === 0 ? (
            <Empty className="border-none py-4">
              <EmptyHeader>
                <EmptyTitle>Belum ada status</EmptyTitle>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" size="sm" onClick={() => openEdit()} className="gap-2">
                  <Plus className="size-4" />
                  Tambah Status Pertama
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            statuses.map((status, idx) => (
              <div
                key={status.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                  dragIdx === idx ? "border-primary opacity-50" : "hover:bg-accent/50"
                } cursor-grab active:cursor-grabbing`}
              >
                <GripVertical className="size-4 shrink-0 text-muted-foreground/50" />
                <div
                  className="size-5 shrink-0 rounded-full ring-1 ring-black/10"
                  style={{
                    backgroundColor: status.hexColor || "#e5e7eb",
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{status.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{status.value}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => move(idx, Math.max(0, idx - 1))}
                    disabled={idx === 0}
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => move(idx, Math.min(statuses.length - 1, idx + 1))}
                    disabled={idx === statuses.length - 1}
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(status)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setDeleteId(status.id);
                      setDeleteDialog(true);
                    }}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Status" : "Tambah Status Baru"}</DialogTitle>
            <DialogDescription>Atur nama, value, dan warna status</DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-4">
            <Field className="gap-1.5">
              <FieldLabel htmlFor="slabel">Nama Status *</FieldLabel>
              <Input
                id="slabel"
                placeholder="Contoh: Dalam Proses"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
              />
            </Field>
            <Field className="gap-1.5">
              <FieldLabel htmlFor="svalue">
                Value
                <span className="ml-1 text-xs text-muted-foreground">(identifier unik)</span>
              </FieldLabel>
              <Input
                id="svalue"
                placeholder="dalam-proses"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
              />
            </Field>
            <Field className="gap-1.5">
              <FieldLabel>Warna</FieldLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-3">
                    <div className="size-6 rounded-md border shadow-sm" style={{ backgroundColor: editColor }} />
                    <span className="font-mono text-xs text-muted-foreground">{editColor}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-fit p-4">
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="size-48 cursor-pointer"
                  />
                </PopoverContent>
              </Popover>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditColor(c)}
                    className={`size-7 rounded-full ring-1 ring-black/10 transition-transform hover:scale-110 ${
                      editColor === c ? "scale-110 ring-2 ring-primary" : ""
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Menyimpan..." : editingId ? "Simpan" : "Tambah"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Status?</DialogTitle>
            <DialogDescription>Status yang sedang dipakai pesanan tidak bisa dihapus.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
