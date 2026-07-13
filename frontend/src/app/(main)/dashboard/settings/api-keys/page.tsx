"use client";

import { useEffect, useState } from "react";

import { Copy, ExternalLink, Key, Plus, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
} from "@/components/ui/dialog";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useActiveOrganization } from "@/lib/auth-client";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface ApiKeyItem {
  id: string;
  name: string | null;
  prefix: string | null;
  start: string | null;
  enabled: boolean;
  createdAt: string;
  expiresAt: string | null;
}

export default function ApiKeysPage() {
  const { data: org, isPending: orgLoading } = useActiveOrganization();
  const slug = org?.slug;
  const orgId = org?.id;

  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdKeyValue, setCreatedKeyValue] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchKeys = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/api-key/list?organizationId=${orgId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Gagal memuat API keys");
      const data = await res.json();
      setKeys((data.apiKeys || data.data || data) as ApiKeyItem[]);
    } catch {
      toast.error("Gagal memuat API keys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orgId) fetchKeys();
  }, [orgId]);

  const handleCreate = async () => {
    if (!orgId || !newKeyName.trim()) {
      toast.error("Nama key harus diisi");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/api-key/create`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          configId: "org-keys",
          organizationId: orgId,
          name: newKeyName.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal membuat API key");
      }
      const data = await res.json();
      setCreatedKeyValue(data.key || data.data?.key);
      setNewKeyName("");
      fetchKeys();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat API key");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/api-key/delete`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configId: "org-keys", keyId: deleteId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal menghapus API key");
      }
      toast.success("API key berhasil dihapus");
      setDeleteOpen(false);
      setDeleteId(null);
      fetchKeys();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus API key");
    } finally {
      setDeleting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Key berhasil disalin");
  };

  const fmtDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <div className="@container/main mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">API Keys</h1>
          <p className="text-sm text-muted-foreground">Kelola kunci API untuk integrasi pihak ketiga</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1 size-4" />
          Buat Key Baru
        </Button>
      </div>

      {/* How to use */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Cara Penggunaan</CardTitle>
          <CardDescription>API key digunakan untuk mengakses data CekStatus dari aplikasi pihak ketiga</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Tambahkan header berikut ke setiap request:</p>
          <pre className="rounded-lg bg-muted p-3 font-mono!">x-api-key: your_api_key_here</pre>
          <p className="text-muted-foreground">
            Dokumentasi API lengkap tersedia di{" "}
            <a
              href={`${BACKEND_URL}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary underline underline-offset-2"
            >
              CekStatus API Docs <ExternalLink className="size-3" />
            </a>
          </p>
        </CardContent>
      </Card>

      {/* Keys Table */}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : keys.length === 0 ? (
        <Card>
          <CardContent>
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Belum ada API key</EmptyTitle>
                <EmptyDescription>Buat API key pertama untuk integrasi</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-1 size-4" />
                  Buat Key Baru
                </Button>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border overflow-clip">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.name || "—"}</TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                      {key.prefix}
                      {key.start}...
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={key.enabled ? "default" : "secondary"}
                      className={
                        key.enabled ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : ""
                      }
                    >
                      {key.enabled ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{fmtDate(key.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setDeleteId(key.id);
                        setDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!open) setCreatedKeyValue(null);
          setCreateOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{createdKeyValue ? "API Key Berhasil Dibuat" : "Buat API Key Baru"}</DialogTitle>
            <DialogDescription>
              {createdKeyValue
                ? "Salin key ini sekarang. Key tidak akan muncul lagi."
                : "Buat kunci API untuk integrasi eksternal"}
            </DialogDescription>
          </DialogHeader>

          {createdKeyValue ? (
            <div className="space-y-4">
              <Alert>
                <TriangleAlert className="size-4" />
                <AlertTitle>Simpan key ini!</AlertTitle>
                <AlertDescription>Kamu tidak akan bisa melihatnya lagi setelah dialog ini ditutup.</AlertDescription>
              </Alert>

              <div className="flex justify-center items-center max-sm:flex-wrap  gap-2">
                <div className="grow rounded-lg bg-muted px-3 py-1.5 font-mono text-sm overflow-x-auto break-all">
                  <code>{createdKeyValue}</code>
                </div>
                <Button variant="outline" onClick={() => copyToClipboard(createdKeyValue)}>
                  <Copy className="size-4" />
                  Salin
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-sm font-medium">Nama Key</label>
              <Input
                placeholder="Contoh: Integrasi Website"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Gunakan nama yang mudah dikenali untuk membedakan setiap key.
              </p>
            </div>
          )}

          <DialogFooter>
            {createdKeyValue ? (
              <Button onClick={() => setCreateOpen(false)}>Selesai, Saya sudah simpan</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleCreate} disabled={creating || !newKeyName.trim()}>
                  {creating ? "Membuat..." : "Buat Key"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus API Key?</DialogTitle>
            <DialogDescription>Aplikasi yang menggunakan key ini tidak akan bisa mengakses API lagi.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
