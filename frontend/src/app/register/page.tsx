"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Nama lengkap harus diisi");
      return;
    }
    if (!email.trim()) {
      toast.error("Email harus diisi");
      return;
    }
    if (password.length < 8) {
      toast.error("Kata sandi minimal 8 karakter");
      return;
    }

    setLoading(true);
    try {
      await authClient.signUp.email(
        { name, email, password },
        {
          onSuccess: () => {
            toast.success("Akun berhasil dibuat!");
            window.location.href = "/";
          },
          onError: (ctx) => {
            toast.error(ctx.error.message || "Gagal membuat akun");
          },
        },
      );
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
            <h1 className="font-bold text-2xl tracking-tight">Buat Akun</h1>
            <p className="text-sm text-muted-foreground">Daftar gratis. Tidak perlu kartu kredit.</p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="shadow-sm">
          <CardContent className="flex flex-col gap-4">
            <form noValidate onSubmit={handleRegister} className="flex flex-col gap-4">
              <FieldGroup className="gap-4">
                <Field className="gap-1.5">
                  <FieldLabel htmlFor="register-name">Nama Lengkap</FieldLabel>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Budi Santoso"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Field>
                <Field className="gap-1.5">
                  <FieldLabel htmlFor="register-email">Email</FieldLabel>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="nama@email.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Field>
                <Field className="gap-1.5">
                  <FieldLabel htmlFor="register-password">Kata Sandi</FieldLabel>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Min. 8 karakter"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </Field>
              </FieldGroup>
              <Button className="w-full gap-2" type="submit" size="lg" disabled={loading}>
                <UserPlus className="size-4" />
                {loading ? "Mendaftarkan..." : "Daftar"}
              </Button>
            </form>

            <div className="relative flex items-center gap-2">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">atau daftar dengan</span>
              <Separator className="flex-1" />
            </div>

            <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="lg"
              className="w-full gap-2"
              onClick={() =>
                authClient.signIn.social({
                  provider: "google",
                  callbackURL: "/",
                })
              }
            >
              <svg className="size-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full gap-2"
              onClick={() =>
                authClient.signIn.social({
                  provider: "github",
                  callbackURL: "/",
                })
              }
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
