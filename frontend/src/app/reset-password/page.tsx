"use client";

import { Suspense, useState } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { AlertCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Kata sandi minimal 8 karakter");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Kata sandi tidak cocok");
      return;
    }

    setLoading(true);
    try {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token: token || "",
      });

      if (error) {
        toast.error(error.message || "Gagal mengatur ulang kata sandi");
        return;
      }

      setSuccess(true);
      toast.success("Kata sandi berhasil diatur ulang!");
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-6 py-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
          <ShieldCheck className="size-8 text-green-600 dark:text-green-400" />
        </div>
        <div className="space-y-2">
          <p className="font-medium">Kata sandi berhasil diatur ulang!</p>
          <p className="text-sm text-muted-foreground">Mengarahkan kamu ke halaman masuk...</p>
        </div>
        <Link
          href="/login"
          className="text-sm font-medium text-primary underline underline-offset-4 hover:text-primary"
        >
          Masuk sekarang
        </Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-6 py-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="size-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <p className="font-medium">Tautan tidak valid</p>
          <p className="text-sm text-muted-foreground">
            Tautan reset kata sandi ini tidak valid atau sudah kedaluwarsa.
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-primary underline underline-offset-4 hover:text-primary"
        >
          Minta tautan baru
        </Link>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FieldGroup className="gap-4">
        <Field className="gap-1.5">
          <FieldLabel htmlFor="new-password">Kata Sandi Baru</FieldLabel>
          <Input
            id="new-password"
            type="password"
            placeholder="Min. 8 karakter"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </Field>
        <Field className="gap-1.5">
          <FieldLabel htmlFor="confirm-password">Konfirmasi Kata Sandi</FieldLabel>
          <Input
            id="confirm-password"
            type="password"
            placeholder="Ulangi kata sandi"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </Field>
      </FieldGroup>
      <Button className="w-full gap-2" type="submit" size="lg" disabled={loading}>
        {loading ? "Mengatur ulang..." : "Atur Ulang Kata Sandi"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-6 md:p-10">
      <div className="mx-auto flex w-full max-w-sm flex-col justify-center space-y-6">
        {/* Brand */}
        <div className="flex flex-col items-center gap-4 text-center">
          <Logo className="size-8 fill-primary" />
          <div className="space-y-1">
            <h1 className="font-bold text-2xl tracking-tight">Atur Ulang Kata Sandi</h1>
            <p className="text-sm text-muted-foreground">
              Pilih kata sandi kuat yang belum pernah kamu gunakan sebelumnya.
            </p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="shadow-sm">
          <CardContent className="flex flex-col gap-4">
            <Suspense fallback={<p className="py-8 text-center text-sm text-muted-foreground">Memuat...</p>}>
              <ResetPasswordForm />
            </Suspense>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Kembali ke masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
