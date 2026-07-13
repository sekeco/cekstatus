"use client";

import { useCallback, useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Mail, Phone, PlusIcon, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, type CustomerResponse } from "@/lib/api";
import { useActiveOrganization } from "@/lib/auth-client";

export default function CustomersPage() {
  const router = useRouter();
  const { data: org, isPending: orgLoading } = useActiveOrganization();
  const slug = org?.slug;

  const [customers, setCustomers] = useState<CustomerResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const result = await api.customers.list(slug, {
        search: search || undefined,
      });
      setCustomers(result.data);
      setTotal(result.total);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memuat pelanggan");
    } finally {
      setLoading(false);
    }
  }, [slug, search]);

  useEffect(() => {
    if (slug) fetchCustomers();
  }, [slug, search, fetchCustomers]);

  const handleCreate = async () => {
    if (!newName.trim() || !slug) return;
    setSubmitting(true);
    try {
      await api.customers.create(slug, {
        name: newName.trim(),
        email: newEmail.trim() || undefined,
        phone: newPhone.trim() || undefined,
      });
      toast.success(`Pelanggan "${newName.trim()}" ditambahkan`);
      setDialogOpen(false);
      setNewName("");
      setNewEmail("");
      setNewPhone("");
      fetchCustomers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menambah pelanggan");
    } finally {
      setSubmitting(false);
    }
  };

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Pelanggan</h1>
          <p className="text-sm text-muted-foreground">Total {total} pelanggan</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-1 size-4" />
              Tambah Pelanggan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Pelanggan Baru</DialogTitle>
              <DialogDescription>Masukkan data pelanggan baru</DialogDescription>
            </DialogHeader>
            <FieldGroup className="gap-4">
              <Field className="gap-1.5">
                <FieldLabel htmlFor="cname">Nama *</FieldLabel>
                <Input
                  id="cname"
                  placeholder="Nama lengkap"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </Field>
              <Field className="gap-1.5">
                <FieldLabel htmlFor="cemail">Email</FieldLabel>
                <Input
                  id="cemail"
                  type="email"
                  placeholder="email@domain.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </Field>
              <Field className="gap-1.5">
                <FieldLabel htmlFor="cphone">No. HP</FieldLabel>
                <Input
                  id="cphone"
                  placeholder="08123456789"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleCreate} disabled={submitting || !newName.trim()}>
                {submitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari nama, email, atau no. HP..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" onClick={fetchCustomers}>
          <RefreshCw className="size-4" />
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-clip">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Kontak</TableHead>
              <TableHead className="text-center">Total Pesanan</TableHead>
              <TableHead>Bergabung</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center">
                  <Empty className="border-none">
                    <EmptyHeader>
                      <EmptyTitle>{search ? "Tidak ada pelanggan yang cocok" : "Belum ada pelanggan"}</EmptyTitle>
                      <EmptyDescription>
                        {search ? "Coba gunakan kata kunci lain" : "Tambahkan pelanggan baru untuk memulai"}
                      </EmptyDescription>
                    </EmptyHeader>
                    {!search && (
                      <EmptyContent>
                        <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
                          <PlusIcon className="mr-1 size-4" />
                          Tambah Pelanggan
                        </Button>
                      </EmptyContent>
                    )}
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              customers.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/dashboard/customers/${c.id}`)}
                >
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5 text-sm text-muted-foreground">
                      {c.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="size-3" />
                          {c.email}
                        </span>
                      )}
                      {c.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="size-3" />
                          {c.phone}
                        </span>
                      )}
                      {!c.email && !c.phone && <span className="text-xs">—</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{c.orderCount}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
