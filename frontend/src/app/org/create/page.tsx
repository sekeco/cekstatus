"use client";

import { useState } from "react";

import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "lucide-react";
import { toast } from "sonner";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

const BUSINESS_TYPES = [
  {
    id: "servis-laptop",
    label: "Servis Laptop",
    desc: "Servis laptop, komputer, printer",
    emoji: "💻",
  },
  {
    id: "laundry",
    label: "Laundry",
    desc: "Cuci kering, setrika, premium",
    emoji: "👕",
  },
  {
    id: "bengkel",
    label: "Bengkel",
    desc: "Servis motor, mobil, ganti oli",
    emoji: "🔧",
  },
  {
    id: "percetakan",
    label: "Percetakan",
    desc: "Cetak foto, binding, desain",
    emoji: "🖨️",
  },
  {
    id: "tailor",
    label: "Tailor",
    desc: "Jahit, obras, revisi",
    emoji: "✂️",
  },
  {
    id: "reparasi-hp",
    label: "Reparasi HP",
    desc: "Ganti LCD, baterai, software",
    emoji: "📱",
  },
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function CreateOrganizationPage() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slugEdited) {
      setSlug(slugify(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !businessType) {
      setError("Nama dan jenis bisnis harus diisi");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: apiError } = await authClient.organization.create({
        name: name.trim(),
        slug: slug || slugify(name),
        metadata: { businessType },
      });

      if (apiError) {
        setError(apiError.message || "Gagal membuat bisnis");
        return;
      }

      if (data) {
        await authClient.organization.setActive({
          organizationId: data.id,
        });

        // Seed default status templates
        try {
          await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/organizations/${slug || slugify(name)}/status-templates/seed`,
            {
              method: "POST",
              credentials: "include",
            },
          );
        } catch {}

        toast.success("Bisnis berhasil dibuat!");
        window.location.href = "/dashboard/default";
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-6 md:p-10">
      <div className="mx-auto flex w-full max-w-lg flex-col justify-center space-y-6">
        {/* Brand */}
        <div className="flex flex-col items-center gap-4 text-center">
          <Logo className="size-8 fill-primary" />
          <div className="space-y-1">
            <h1 className="font-bold text-2xl tracking-tight">Buat Bisnis Baru</h1>
            <p className="text-sm text-muted-foreground">
              Isi data bisnis kamu dan pilih template yang sesuai dengan jenis usaha.
            </p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit}>
              <FieldGroup className="gap-5">
                <Field className="gap-1.5">
                  <FieldLabel htmlFor="org-name">Nama Bisnis *</FieldLabel>
                  <Input
                    id="org-name"
                    placeholder="Misal: Toko Servis ABC"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                  />
                </Field>

                <Field className="gap-1.5">
                  <FieldLabel htmlFor="org-slug">
                    Tautan Profil <span className="ml-1 text-xs text-muted-foreground">(opsional)</span>
                  </FieldLabel>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span className="shrink-0">cekstatus.id/</span>
                    <Input
                      id="org-slug"
                      placeholder="nama-bisnis"
                      value={slug}
                      onChange={(e) => {
                        setSlug(slugify(e.target.value));
                        setSlugEdited(true);
                      }}
                    />
                  </div>
                  <FieldDescription>Otomatis dibuat dari nama bisnis. Bisa disesuaikan.</FieldDescription>
                </Field>

                <Field className="gap-1.5">
                  <FieldLabel>Jenis Bisnis *</FieldLabel>
                  <FieldDescription>
                    Pilih jenis bisnis untuk mendapatkan template status dan warna yang sesuai.
                  </FieldDescription>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {BUSINESS_TYPES.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setBusinessType(type.id)}
                        className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left text-sm transition-colors ${
                          businessType === type.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border hover:bg-accent"
                        }`}
                      >
                        <span className="font-medium">
                          {type.emoji} {type.label}
                          {businessType === type.id && <CheckIcon className="ml-1 inline size-3 text-primary" />}
                        </span>
                        <span className="text-xs text-muted-foreground">{type.desc}</span>
                      </button>
                    ))}
                  </div>
                </Field>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="grid grid-cols-2 items-center gap-3 pt-2">
                  <Button type="button" variant="secondary" onClick={() => window.history.back()} className="gap-1">
                    <ArrowLeftIcon className="size-4" />
                    Kembali
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Membuat..." : "Lanjutkan"}
                    <ArrowRightIcon className="size-4" />
                  </Button>
                </div>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
