"use client";

import { useEffect, useState } from "react";

import { Building2, Clock, Save, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useActiveOrganization } from "@/lib/auth-client";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function SettingsPage() {
  const { data: org, isPending: orgLoading } = useActiveOrganization();
  const slug = org?.slug;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [slogan, setSlogan] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [businessHours, setBusinessHours] = useState("");
  const [defaultEstimationUnit, setDefaultEstimationUnit] = useState("hours");

  useEffect(() => {
    if (!slug) return;
    fetch(`${BACKEND_URL}/api/organizations/${slug}/settings`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => {
        setName(data.name || "");
        setSlogan(data.slogan || "");
        setAddress(data.address || "");
        setPhone(data.phone || "");
        setWhatsapp(data.whatsapp || "");
        setEmail(data.email || "");
        setWebsite(data.website || "");
        setBusinessHours(data.businessHours || "");
        setDefaultEstimationUnit(data.defaultEstimationUnit || "hours");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleSave = async () => {
    if (!slug) return;
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/organizations/${slug}/settings`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slogan: slogan || undefined,
          address: address || undefined,
          phone: phone || undefined,
          whatsapp: whatsapp || undefined,
          email: email || undefined,
          website: website || undefined,
          businessHours: businessHours || undefined,
          defaultEstimationUnit: defaultEstimationUnit || undefined,
        }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      toast.success("Pengaturan berhasil disimpan");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
    }
  };

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (!slug) return null;

  if (loading) {
    return (
      <div className="@container/main mx-auto flex w-full max-w-2xl flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="@container/main mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Pengaturan Toko</h1>
        <p className="text-muted-foreground text-sm">Informasi yang tampil di halaman tracking publik pelanggan</p>
      </div>

      <Card>
        <CardContent>
          <FieldGroup className="gap-5">
            <Field className="gap-1.5">
              <FieldLabel>Nama Toko</FieldLabel>
              <Input value={name} disabled className="bg-muted" />
              <FieldDescription>Nama bisnis — hubungi admin untuk mengganti</FieldDescription>
            </Field>
            <Field className="gap-1.5">
              <FieldLabel htmlFor="slogan">Slogan</FieldLabel>
              <Input
                id="slogan"
                placeholder="Solusi Servis Laptop Terpercaya"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
              />
            </Field>
            <Field className="gap-1.5">
              <FieldLabel htmlFor="address">Alamat</FieldLabel>
              <Textarea
                id="address"
                placeholder="Jl. Kaliurang KM 4,5 Yogyakarta"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field className="gap-1.5">
                <FieldLabel htmlFor="phone">No. Telepon</FieldLabel>
                <Input id="phone" placeholder="0274-7654321" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </Field>
              <Field className="gap-1.5">
                <FieldLabel htmlFor="whatsapp">WhatsApp</FieldLabel>
                <Input
                  id="whatsapp"
                  placeholder="08123456789"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field className="gap-1.5">
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="info@toko.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field className="gap-1.5">
                <FieldLabel htmlFor="website">Website</FieldLabel>
                <Input
                  id="website"
                  placeholder="www.toko.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </Field>
            </div>
            <Field className="gap-1.5">
              <FieldLabel htmlFor="hours">Jam Operasional</FieldLabel>
              <Input
                id="hours"
                placeholder="Sen-Sab 09:00-20:00"
                value={businessHours}
                onChange={(e) => setBusinessHours(e.target.value)}
              />
            </Field>

            <Separator />

            <div>
              <h2 className="mb-1 font-medium text-sm">Estimasi Pengerjaan</h2>
              <p className="mb-3 text-muted-foreground text-xs">
                Satuan default untuk estimasi waktu pengerjaan pesanan baru
              </p>
            </div>
            <Field className="gap-1.5">
              <FieldLabel htmlFor="estimation-unit">Satuan Default</FieldLabel>
              <Select value={defaultEstimationUnit} onValueChange={setDefaultEstimationUnit}>
                <SelectTrigger id="estimation-unit" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hours">
                    <span className="flex items-center gap-2">
                      <Clock className="size-3.5" />
                      Jam
                    </span>
                  </SelectItem>
                  <SelectItem value="days">
                    <span className="flex items-center gap-2">
                      <Clock className="size-3.5" />
                      Hari
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FieldDescription>
                {defaultEstimationUnit === "hours"
                  ? "Estimasi akan ditampilkan dalam jam (contoh: 3 jam)"
                  : "Estimasi akan ditampilkan dalam hari (contoh: 3 hari)"}
              </FieldDescription>
            </Field>

            <Button onClick={handleSave} className="w-full gap-2" disabled={saving}>
              <Save className="size-4" />
              {saving ? "Menyimpan..." : "Simpan Pengaturan"}
            </Button>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview Halaman Tracking</CardTitle>
          <CardDescription>Begini tampilannya di pelanggan saat melacak pesanan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border bg-card p-6">
            <div className="mx-auto max-w-xs space-y-1 text-center">
              <div className="flex justify-center">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Building2 className="size-6" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg">{name}</h3>
                {slogan && <p className="text-muted-foreground text-sm">{slogan}</p>}
              </div>
              <div className="py-2">
                <div className="flex items-center justify-center gap-2 rounded-lg border p-3 text-left text-sm">
                  <Search className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">Masukkan kode tracking...</span>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-1 text-sm">
                {phone && <span>{phone}</span>}
                {whatsapp && <span>{whatsapp}</span>}
                {email && <span>{email}</span>}
              </div>
              {address && <p className="text-muted-foreground">{address}</p>}
              {businessHours && <p className="text-muted-foreground">{businessHours}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
