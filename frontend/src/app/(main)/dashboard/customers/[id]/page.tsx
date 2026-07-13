"use client";

import { use, useEffect, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeftIcon, Calendar, Mail, Pencil, Phone, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMemberRole } from "@/hooks/use-member-role";
import { api, type CustomerResponse, type OrderResponse } from "@/lib/api";
import { useActiveOrganization } from "@/lib/auth-client";

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: org, isPending: orgLoading } = useActiveOrganization();
  const slug = org?.slug;

  const [customer, setCustomer] = useState<CustomerResponse | null>(null);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { isAdmin } = useMemberRole();

  const loadData = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const [cust, ords] = await Promise.all([api.customers.getById(slug, id), api.orders.list(slug, {})]);
      setCustomer(cust);
      setOrders(ords.data.filter((o) => o.customerId === id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memuat data");
      router.push("/dashboard/customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug && id) loadData();
  }, [slug, id]);

  const openEdit = () => {
    if (!customer) return;
    setEditName(customer.name);
    setEditEmail(customer.email || "");
    setEditPhone(customer.phone || "");
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!slug || !id || !editName.trim()) {
      toast.error("Nama harus diisi");
      return;
    }
    if (!slug) return;
    setSaving(true);
    try {
      await api.customers.update(slug, id, {
        name: editName.trim(),
        email: editEmail.trim() || null,
        phone: editPhone.trim() || null,
      });
      toast.success("Pelanggan berhasil diupdate");
      setEditOpen(false);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!slug || !id) return;
    if ((customer?.orderCount ?? 0) > 0) {
      toast.error(`Pelanggan memiliki ${customer?.orderCount} pesanan — hapus dulu pesanannya`);
      setDeleteOpen(false);
      return;
    }
    setDeleting(true);
    try {
      await api.customers.delete(slug, id);
      toast.success("Pelanggan berhasil dihapus");
      router.push("/dashboard/customers");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus");
    } finally {
      setDeleting(false);
    }
  };

  if (orgLoading || loading) {
    return (
      <div className="@container/main flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="@container/main mx-auto flex w-full max-w-3xl flex-col gap-4">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild className="gap-1">
          <Link href="/dashboard/customers">
            <ArrowLeftIcon className="size-4" />
            Kembali
          </Link>
        </Button>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <Button variant="outline" className="gap-1" onClick={openEdit}>
                <Pencil className="size-4" />
                Edit
              </Button>
              <Button variant="outline" className="gap-1 text-destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="size-4" />
                Hapus
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{customer.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {customer.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="size-4" />
              {customer.email}
            </div>
          )}
          {customer.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="size-4" />
              {customer.phone}
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="size-4" />
            Pelanggan sejak{" "}
            {new Date(customer.createdAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
          <div className="pt-2 text-lg font-bold">{customer.orderCount} pesanan</div>
        </CardContent>
      </Card>

      {/* Order History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riwayat Pesanan</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada pesanan dari pelanggan ini.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Barang</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                  >
                    <TableCell className="font-mono text-xs">{order.orderNumber}</TableCell>
                    <TableCell>{order.label || "—"}</TableCell>
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
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pelanggan</DialogTitle>
            <DialogDescription>Ubah data pelanggan</DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-4">
            <Field className="gap-1.5">
              <FieldLabel htmlFor="ename">Nama *</FieldLabel>
              <Input id="ename" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </Field>
            <Field className="gap-1.5">
              <FieldLabel htmlFor="eemail">Email</FieldLabel>
              <Input id="eemail" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </Field>
            <Field className="gap-1.5">
              <FieldLabel htmlFor="ephone">No. HP</FieldLabel>
              <Input id="ephone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Pelanggan?</DialogTitle>
            <DialogDescription>
              {(customer?.orderCount ?? 0) > 0
                ? `Pelanggan memiliki ${customer?.orderCount} pesanan. Hapus dulu pesanannya sebelum menghapus pelanggan.`
                : "Yakin akan menghapus pelanggan ini? Data tidak bisa dikembalikan."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={(customer?.orderCount ?? 0) > 0 || deleting}>
              {deleting ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
