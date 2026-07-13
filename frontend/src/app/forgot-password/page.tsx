"use client";

import { useState } from "react";

import Link from "next/link";

import { Mail, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Masukkan alamat email kamu");
      return;
    }

    setLoading(true);
    try {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message || "Gagal mengirim email reset");
        return;
      }

      setSent(true);
      toast.success("Tautan reset terkirim! Cek email kamu.");
    } catch {
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-6 md:p-10">
      <div className="mx-auto flex w-full max-w-sm flex-col justify-center space-y-6">
        {/* Brand */}
        <div className="flex flex-col items-center gap-4 text-center">
          <Logo className="size-8 fill-primary" />
          <div className="space-y-1">
            <h1 className="font-bold text-2xl tracking-tight">Lupa Kata Sandi</h1>
            <p className="text-sm text-muted-foreground">
              Masukkan email kamu dan kami akan kirim tautan untuk mengatur ulang kata sandi.
            </p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="shadow-sm">
          <CardContent className="flex flex-col gap-4">
            {sent ? (
              <div className="flex flex-col items-center gap-6 py-4 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                  <MailCheck className="size-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <p className="font-medium">Cek email kamu</p>
                  <p className="text-sm text-muted-foreground">
                    Jika akun dengan email tersebut terdaftar, kami sudah mengirim tautan reset. Jangan lupa cek folder
                    spam.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2">
                  <Button variant="outline" onClick={() => setSent(false)} className="w-full">
                    Kirim ulang
                  </Button>
                  <Link
                    href="/login"
                    className="text-center text-sm text-muted-foreground underline underline-offset-4 hover:text-primary"
                  >
                    Kembali ke masuk
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <FieldGroup className="gap-4">
                    <Field className="gap-1.5">
                      <FieldLabel htmlFor="forgot-email">Email</FieldLabel>
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="nama@email.com"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </Field>
                  </FieldGroup>
                  <Button className="w-full gap-2" type="submit" size="lg" disabled={loading}>
                    <Mail className="size-4" />
                    {loading ? "Mengirim..." : "Kirim Tautan Reset"}
                  </Button>
                </form>
                <p className="text-center text-sm text-muted-foreground">
                  Ingat kata sandi?{" "}
                  <Link href="/login" className="font-medium text-primary hover:underline">
                    Kembali ke masuk
                  </Link>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {!sent && (
          <p className="text-center text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Daftar sekarang
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
