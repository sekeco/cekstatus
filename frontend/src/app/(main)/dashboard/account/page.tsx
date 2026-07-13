"use client";

import { useCallback, useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  Lock,
  LogOut,
  Mail,
  RefreshCw,
  Save,
  Smartphone,
  Trash2,
  Unlink,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { authClient, useSession } from "@/lib/auth-client";
import { getInitials } from "@/lib/utils";

export default function AccountPage() {
  const router = useRouter();
  const { data: session, refetch } = useSession();
  const user = session?.user;

  const [loading, setLoading] = useState(true);

  // Profile
  const [name, setName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Email
  const [newEmail, setNewEmail] = useState("");
  const [sendingEmailVerification, setSendingEmailVerification] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Sessions
  const [sessions, setSessions] = useState<
    {
      id: string;
      token: string;
      userAgent?: string | null;
      ipAddress?: string | null;
      createdAt: Date;
      expiresAt: Date;
    }[]
  >([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [revokingSession, setRevokingSession] = useState<string | null>(null);
  const [revokingOthers, setRevokingOthers] = useState(false);

  // Linked Accounts
  const [accounts, setAccounts] = useState<{ id: string; providerId: string; email?: string; createdAt: Date }[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [unlinkingAccount, setUnlinkingAccount] = useState<string | null>(null);

  // Delete account
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setLoading(false);
    }
  }, [user]);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const { data, error } = await authClient.listSessions();
      if (error) throw new Error(error.message);
      setSessions(data || []);
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  const loadAccounts = useCallback(async () => {
    setAccountsLoading(true);
    try {
      const { data, error } = await authClient.listAccounts();
      if (error) throw new Error(error.message);
      setAccounts(data || []);
    } catch (err) {
      console.error("Failed to load accounts:", err);
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadSessions();
      loadAccounts();
    }
  }, [user, loadSessions, loadAccounts]);

  // ─── Profile ───────────────────────────────────────

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      toast.error("Nama tidak boleh kosong");
      return;
    }
    setSavingProfile(true);
    try {
      const { error } = await authClient.updateUser({
        name: name.trim(),
      });
      if (error) throw new Error(error.message);
      toast.success("Profil berhasil diperbarui");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui profil");
    } finally {
      setSavingProfile(false);
    }
  };

  // ─── Email ─────────────────────────────────────────

  const handleSendVerificationEmail = async () => {
    setSendingEmailVerification(true);
    try {
      const { error } = await authClient.sendVerificationEmail({
        email: user!.email,
        callbackURL: `${window.location.origin}/dashboard/account`,
      });
      if (error) throw new Error(error.message);
      toast.success("Email verifikasi telah dikirim, cek inbox Anda");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim email verifikasi");
    } finally {
      setSendingEmailVerification(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) {
      toast.error("Email baru harus diisi");
      return;
    }
    setChangingEmail(true);
    try {
      const { error } = await authClient.changeEmail({
        newEmail: newEmail.trim(),
        callbackURL: `${window.location.origin}/dashboard/account`,
      });
      if (error) throw new Error(error.message);
      toast.success("Email perubahan telah dikirim ke email Anda saat ini. Silakan konfirmasi.");
      setNewEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah email");
    } finally {
      setChangingEmail(false);
    }
  };

  // ─── Password ──────────────────────────────────────

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error("Password saat ini harus diisi");
      return;
    }
    if (!newPassword) {
      toast.error("Password baru harus diisi");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password baru minimal 8 karakter");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (error) throw new Error(error.message);
      toast.success("Password berhasil diubah");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah password");
    } finally {
      setChangingPassword(false);
    }
  };

  // ─── Sessions ──────────────────────────────────────

  const handleRevokeSession = async (token: string) => {
    setRevokingSession(token);
    try {
      const { error } = await authClient.revokeSession({ token });
      if (error) throw new Error(error.message);
      toast.success("Sesi berhasil dihapus");
      loadSessions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus sesi");
    } finally {
      setRevokingSession(null);
    }
  };

  const handleRevokeOtherSessions = async () => {
    setRevokingOthers(true);
    try {
      const { error } = await authClient.revokeOtherSessions();
      if (error) throw new Error(error.message);
      toast.success("Semua sesi lain berhasil dihapus");
      loadSessions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus sesi lain");
    } finally {
      setRevokingOthers(false);
    }
  };

  // ─── Linked Accounts ───────────────────────────────

  const handleLinkGoogle = async () => {
    try {
      const { error } = await authClient.linkSocial({
        provider: "google",
        callbackURL: `${window.location.origin}/dashboard/account`,
      });
      if (error) throw new Error(error.message);
      // Will redirect to Google OAuth, so no toast needed here
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menautkan Google");
    }
  };

  const handleUnlinkAccount = async (providerId: string) => {
    setUnlinkingAccount(providerId);
    try {
      const { error } = await authClient.unlinkAccount({ providerId });
      if (error) throw new Error(error.message);
      toast.success("Akun berhasil dilepaskan");
      loadAccounts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal melepas tautan akun");
    } finally {
      setUnlinkingAccount(null);
    }
  };

  // ─── Delete Account ────────────────────────────────

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { error } = await authClient.deleteUser({
        callbackURL: `${window.location.origin}/goodbye`,
      });
      if (error) throw new Error(error.message);
      toast.success("Email konfirmasi telah dikirim. Cek inbox Anda untuk menghapus akun.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus akun");
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="@container/main mx-auto flex w-full max-w-2xl flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const isEmailVerified = user.emailVerified;
  const hasPasswordAccount = accounts.some((a) => a.providerId === "credential");
  const linkedProviders = accounts.filter((a) => a.providerId !== "credential").map((a) => a.providerId);

  const formatDate = (date: Date | string) =>
    new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));

  const getDeviceIcon = (ua: string | null | undefined) => {
    if (!ua) return <Smartphone className="size-4" />;
    const lower = ua.toLowerCase();
    if (lower.includes("mobile") || lower.includes("android") || lower.includes("iphone"))
      return <Smartphone className="size-4" />;
    return <Monitor className="size-4" />;
  };

  return (
    <div className="@container/main mx-auto flex w-full max-w-2xl flex-col gap-6 pb-12">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Pengaturan Akun</h1>
        <p className="text-sm text-muted-foreground">Kelola profil, keamanan, dan preferensi akun Anda</p>
      </div>

      {/* ═══ Profil ═══ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profil</CardTitle>
          <CardDescription>Nama dan foto profil yang tampil di seluruh aplikasi</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-5">
            <div className="flex items-center gap-4">
              <Avatar className="size-16">
                <AvatarImage src={user.image || undefined} alt={name} />
                <AvatarFallback className="text-lg">{getInitials(name)}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="font-medium text-sm">{name || "User"}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <Field className="gap-1.5">
              <FieldLabel htmlFor="name">Nama Lengkap</FieldLabel>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Anda" />
            </Field>

            <Button onClick={handleUpdateProfile} disabled={savingProfile} className="gap-2">
              {savingProfile ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {savingProfile ? "Menyimpan..." : "Simpan Profil"}
            </Button>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* ═══ Email ═══ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Email</CardTitle>
          <CardDescription>Alamat email terdaftar dan status verifikasi</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-5">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{user.email}</p>
                <div className="flex items-center gap-1.5">
                  {isEmailVerified ? (
                    <>
                      <CheckCircle2 className="size-3.5 text-green-600 dark:text-green-400" />
                      <span className="text-xs text-green-600 dark:text-green-400">Terverifikasi</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="size-3.5 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs text-amber-600 dark:text-amber-400">Belum terverifikasi</span>
                    </>
                  )}
                </div>
              </div>
              {!isEmailVerified && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSendVerificationEmail}
                  disabled={sendingEmailVerification}
                  className="gap-2"
                >
                  {sendingEmailVerification ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="size-3.5" />
                  )}
                  Kirim Ulang Verifikasi
                </Button>
              )}
            </div>

            <Separator />

            <Field className="gap-1.5">
              <FieldLabel htmlFor="newEmail">Ganti Email</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="email-baru@example.com"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={handleChangeEmail}
                  disabled={changingEmail || !newEmail.trim()}
                  className="gap-2 shrink-0"
                >
                  {changingEmail ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                  Ubah
                </Button>
              </div>
              <FieldDescription>Email konfirmasi akan dikirim ke alamat Anda saat ini</FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* ═══ Password ═══ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kata Sandi</CardTitle>
          <CardDescription>Ubah kata sandi akun Anda</CardDescription>
        </CardHeader>
        <CardContent>
          {!hasPasswordAccount ? (
            <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              <p>Anda belum memiliki password (masuk via Google/OAuth).</p>
              <p className="mt-1">Gunakan fitur &quot;Lupa Password&quot; di halaman login untuk membuat password.</p>
            </div>
          ) : (
            <FieldGroup className="gap-5">
              <Field className="gap-1.5">
                <FieldLabel htmlFor="currentPassword">Password Saat Ini</FieldLabel>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </Field>
              <Field className="gap-1.5">
                <FieldLabel htmlFor="newPassword">Password Baru</FieldLabel>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  autoComplete="new-password"
                />
              </Field>
              <Field className="gap-1.5">
                <FieldLabel htmlFor="confirmPassword">Konfirmasi Password Baru</FieldLabel>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  autoComplete="new-password"
                />
              </Field>
              <Button
                onClick={handleChangePassword}
                disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="gap-2"
              >
                {changingPassword ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
                {changingPassword ? "Mengubah..." : "Ubah Password"}
              </Button>
              <p className="text-xs text-muted-foreground">Sesi lain akan dihapus demi keamanan</p>
            </FieldGroup>
          )}
        </CardContent>
      </Card>

      {/* ═══ Akun Tertaut ═══ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Akun Tertaut</CardTitle>
          <CardDescription>Hubungkan akun Google untuk login lebih cepat</CardDescription>
        </CardHeader>
        <CardContent>
          {accountsLoading ? (
            <div className="flex items-center justify-center py-4">
              <Spinner className="size-5" />
            </div>
          ) : (
            <FieldGroup className="gap-3">
              {/* Credential (email/password) */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-muted">
                    <Mail className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Email & Password</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 shrink-0">
                  Terhubung
                </Badge>
              </div>

              {/* Google */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-muted">
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
                  </div>
                  <div>
                    <p className="text-sm font-medium">Google</p>
                    <p className="text-xs text-muted-foreground">
                      {linkedProviders.includes("google") ? "Terhubung" : "Belum terhubung"}
                    </p>
                  </div>
                </div>
                {linkedProviders.includes("google") ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleUnlinkAccount("google")}
                    disabled={unlinkingAccount === "google"}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    {unlinkingAccount === "google" ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Unlink className="size-3.5" />
                    )}
                    Lepas
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleLinkGoogle} className="gap-2">
                    <ExternalLink className="size-3.5" />
                    Hubungkan
                  </Button>
                )}
              </div>
            </FieldGroup>
          )}
        </CardContent>
      </Card>

      {/* ═══ Sesi Aktif ═══ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sesi Aktif</CardTitle>
          <CardDescription>Perangkat yang sedang login ke akun Anda</CardDescription>
        </CardHeader>
        <CardContent>
          {sessionsLoading ? (
            <div className="flex items-center justify-center py-4">
              <Spinner className="size-5" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="py-2 text-center text-sm text-muted-foreground">Tidak ada sesi aktif</p>
          ) : (
            <FieldGroup className="gap-3">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    {getDeviceIcon(s.userAgent)}
                    <div>
                      <p className="text-sm font-medium">
                        {s.userAgent
                          ? s.userAgent.length > 40
                            ? s.userAgent.slice(0, 40) + "..."
                            : s.userAgent
                          : "Perangkat tidak dikenal"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {s.ipAddress && `${s.ipAddress} · `}
                        Login {formatDate(s.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevokeSession(s.token)}
                    disabled={revokingSession === s.token}
                    className="shrink-0 text-destructive hover:text-destructive"
                  >
                    {revokingSession === s.token ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <LogOut className="size-3.5" />
                    )}
                  </Button>
                </div>
              ))}

              {sessions.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRevokeOtherSessions}
                  disabled={revokingOthers}
                  className="gap-2"
                >
                  {revokingOthers ? <Loader2 className="size-3.5 animate-spin" /> : <LogOut className="size-3.5" />}
                  {revokingOthers ? "Menghapus..." : "Hapus Semua Sesi Lain"}
                </Button>
              )}
            </FieldGroup>
          )}
        </CardContent>
      </Card>

      {/* ═══ Bahaya: Hapus Akun ═══ */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Zona Berbahaya</CardTitle>
          <CardDescription>Tindakan ini tidak dapat dibatalkan</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Menghapus akun akan menghilangkan akses ke semua organisasi dan data terkait. Email konfirmasi akan dikirim
            sebelum akun dihapus.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="size-4" />
                Hapus Akun
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus Akun?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini akan mengirim email konfirmasi ke <strong>{user.email}</strong>. Klik link di email untuk
                  menyelesaikan penghapusan akun. Semua data Anda akan dihapus secara permanen.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    "Kirim Konfirmasi Hapus"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}

// Monitor icon yang tidak ada di import lucide
function Monitor(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  );
}
