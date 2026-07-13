"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeftIcon, Check, ChevronsUpDown, PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { api, type CustomerResponse } from "@/lib/api";
import { useActiveOrganization } from "@/lib/auth-client";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function NewOrderPage() {
  const router = useRouter();
  const { data: org, isPending: orgLoading } = useActiveOrganization();
  const slug = org?.slug;

  const [label, setLabel] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customers, setCustomers] = useState<CustomerResponse[]>([]);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [etaValue, setEtaValue] = useState("");
  const [etaUnit, setEtaUnit] = useState("hours");
  const [priority, setPriority] = useState("normal");
  const [internalNotes, setInternalNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);

  // Load org settings for estimation unit
  useEffect(() => {
    if (!slug) return;
    fetch(`${BACKEND_URL}/api/organizations/${slug}/settings`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.defaultEstimationUnit) {
          setEtaUnit(data.defaultEstimationUnit);
        }
      })
      .catch(() => {});
  }, [slug]);

  const selectedCustomer = customers.find((c) => c.id === customerId);

  // Search customers
  useEffect(() => {
    if (!slug) return;
    const timer = setTimeout(async () => {
      try {
        const result = await api.customers.list(slug, {
          search: customerSearch || undefined,
          limit: 10,
        });
        setCustomers(result.data);
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [slug, customerSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!problemDescription.trim()) {
      toast.error("Deskripsi masalah harus diisi");
      return;
    }

    if (!slug) {
      toast.error("Organisasi belum dipilih");
      return;
    }

    setLoading(true);
    try {
      // If new customer, create first
      let finalCustomerId = customerId;
      if (showNewCustomer && customerName.trim()) {
        const newCustomer = await api.customers.create(slug, {
          name: customerName.trim(),
          phone: customerPhone.trim() || undefined,
        });
        finalCustomerId = newCustomer.id;
      }

      const order = await api.orders.create(slug, {
        customerId: finalCustomerId || undefined,
        label: label.trim() || undefined,
        problemDescription: problemDescription.trim(),
        estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
        etaValue: etaValue ? Number(etaValue) : undefined,
        metadata: { etaUnit },
        priority,
        internalNotes: internalNotes.trim() || undefined,
      });

      toast.success("Pesanan berhasil dibuat!");
      router.push(`/dashboard/orders/${order.id}`);
    } catch (err) {
      console.error("Gagal membuat pesanan", err);
      toast.error(err instanceof Error ? err.message : "Gagal membuat pesanan");
    } finally {
      setLoading(false);
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
    <div className="@container/main mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/orders">
            <ArrowLeftIcon className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Tambah Pesanan Baru</h1>
          <p className="text-muted-foreground text-sm">Isi detail pesanan pelanggan</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informasi Pesanan</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup className="gap-5">
              {/* Customer */}
              <Field className="gap-1.5">
                <FieldLabel>Pelanggan</FieldLabel>
                {showNewCustomer ? (
                  <div className="flex items-center gap-2 max-sm:flex-wrap">
                    <Input
                      placeholder="Nama pelanggan"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                    <Input
                      placeholder="No. WhatsApp (opsional)"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                    <Button type="button" variant="secondary" onClick={() => setShowNewCustomer(false)}>
                      Pilih pelanggan existing
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={customerOpen}
                            className="flex-1 justify-between"
                          >
                            {selectedCustomer ? selectedCustomer.name : "Cari pelanggan..."}
                            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                          <Command>
                            <CommandInput
                              placeholder="Cari pelanggan..."
                              value={customerSearch}
                              onValueChange={setCustomerSearch}
                            />
                            <CommandList>
                              <CommandEmpty>
                                <span className="text-muted-foreground">Pelanggan tidak ditemukan</span>
                              </CommandEmpty>
                              <CommandGroup>
                                {customers.map((c) => (
                                  <CommandItem
                                    key={c.id}
                                    value={c.name}
                                    onSelect={() => {
                                      setCustomerId(c.id);
                                      setCustomerSearch(c.name);
                                      setCustomerOpen(false);
                                    }}
                                  >
                                    <div className="flex flex-1 flex-col">
                                      <span>{c.name}</span>
                                      {c.phone && <span className="text-muted-foreground text-xs">{c.phone}</span>}
                                    </div>
                                    {c.orderCount > 0 && (
                                      <span className="text-muted-foreground text-xs">{c.orderCount} pesanan</span>
                                    )}
                                    <Check
                                      className={`ml-auto size-4 ${customerId === c.id ? "opacity-100" : "opacity-0"}`}
                                    />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowNewCustomer(true)}
                        title="Tambah pelanggan baru"
                      >
                        <PlusIcon className="size-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </Field>

              {/* Label / Item Name */}
              <Field className="gap-1.5">
                <FieldLabel htmlFor="order-label">Nama Item</FieldLabel>
                <FieldDescription>Nama barang atau layanan (opsional)</FieldDescription>
                <Input
                  id="order-label"
                  placeholder="Misal: Servis Laptop Acer"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </Field>

              {/* Problem Description */}
              <Field className="gap-1.5">
                <FieldLabel htmlFor="order-desc">Deskripsi Masalah *</FieldLabel>
                <FieldDescription>Jelaskan keluhan atau masalah pelanggan</FieldDescription>
                <Textarea
                  id="order-desc"
                  placeholder="Misal: Laptop tidak bisa booting, layar biru..."
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  required
                  rows={4}
                />
              </Field>

              {/* Priority */}
              <Field className="gap-1.5">
                <FieldLabel htmlFor="order-priority">Prioritas</FieldLabel>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="order-priority" className="w-full">
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

              {/* Estimated Cost */}
              <Field className="gap-1.5">
                <FieldLabel htmlFor="order-cost">Estimasi Biaya (opsional)</FieldLabel>
                <Input
                  id="order-cost"
                  type="number"
                  placeholder="500000"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                />
              </Field>

              {/* ETA */}
              <Field className="gap-1.5">
                <FieldLabel htmlFor="order-eta">Estimasi Pengerjaan</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    id="order-eta"
                    type="number"
                    min={0}
                    placeholder={etaUnit === "hours" ? "3" : "3"}
                    value={etaValue}
                    onChange={(e) => setEtaValue(e.target.value)}
                    className="flex-1"
                  />
                  <div className="flex items-center rounded-md border bg-muted px-3 text-muted-foreground text-sm">
                    {etaUnit === "hours" ? "Jam" : "Hari"}
                  </div>
                </div>
                <FieldDescription>
                  Estimasi waktu pengerjaan dalam {etaUnit === "hours" ? "jam" : "hari"}
                </FieldDescription>
              </Field>

              {/* Internal Notes */}
              <Field className="gap-1.5">
                <FieldLabel htmlFor="order-notes">Catatan Internal (opsional)</FieldLabel>
                <Textarea
                  id="order-notes"
                  placeholder="Catatan untuk teknisi..."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={3}
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button variant="outline" asChild>
            <Link href="/dashboard/orders">Batal</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner className="mr-1 size-4" />
                Menyimpan...
              </>
            ) : (
              "Simpan Pesanan"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
