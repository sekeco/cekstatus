"use client";

import { useEffect, useState } from "react";

import { Crown, Shield, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { authClient, useActiveOrganization } from "@/lib/auth-client";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Teknisi",
};

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  member: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export default function MembersPage() {
  const { data: org, isPending: orgLoading } = useActiveOrganization();
  const { data: session } = authClient.useSession();
  const slug = org?.slug;

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string>("member");

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);

  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [newRole, setNewRole] = useState("");
  const [updatingRole, setUpdatingRole] = useState(false);

  const refreshMembers = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/organizations/${slug}/members`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Gagal memuat anggota");
      const data: Member[] = await res.json();
      setMembers(data);
      if (session?.user) {
        const me = data.find((m) => m.userId === session.user.id);
        if (me) setCurrentUserRole(me.role);
      }
    } catch {
      toast.error("Gagal memuat anggota tim");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) refreshMembers();
  }, [slug, session?.user?.id]);

  const isAdmin = currentUserRole === "owner" || currentUserRole === "admin";

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Masukkan email");
      return;
    }
    setInviting(true);
    try {
      const { error } = await authClient.organization.inviteMember({
        email: inviteEmail.trim(),
        role: inviteRole as "admin" | "member",
      });
      if (error) {
        toast.error(error.message || "Gagal mengundang");
        return;
      }
      toast.success(`Undangan berhasil dikirim ke ${inviteEmail.trim()}`);
      setInviteOpen(false);
      setInviteEmail("");
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedMember || !newRole || !slug) return;
    setUpdatingRole(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/organizations/${slug}/members/${selectedMember.id}/role`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal mengubah peran");
      }
      toast.success("Peran berhasil diubah");
      setRoleDialogOpen(false);
      refreshMembers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah peran");
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleRemove = async (member: Member) => {
    if (!slug) return;
    if (!confirm(`Yakin akan menghapus ${member.name} dari tim?`)) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/organizations/${slug}/members/${member.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal menghapus anggota");
      }
      toast.success(`${member.name} berhasil dihapus dari tim`);
      refreshMembers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus anggota");
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

  return (
    <div className="@container/main mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Anggota Tim</h1>
          <p className="text-sm text-muted-foreground">{members.length} anggota — kelola tim dan peran</p>
        </div>
        {isAdmin && (
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-1 size-4" />
                Undang Anggota
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Undang Anggota Baru</DialogTitle>
                <DialogDescription>Masukkan email anggota yang ingin diundang</DialogDescription>
              </DialogHeader>
              <FieldGroup className="gap-4">
                <Field className="gap-1.5">
                  <FieldLabel htmlFor="invite-email">Email</FieldLabel>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="nama@email.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </Field>
                <Field className="gap-1.5">
                  <FieldLabel>Peran</FieldLabel>
                  <Select value={inviteRole} onValueChange={(v) => v && setInviteRole(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Teknisi</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
                  {inviting ? "Mengundang..." : "Kirim Undangan"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <Card>
          <CardContent>
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Belum ada anggota</EmptyTitle>
                <EmptyDescription>Undang anggota tim untuk mulai berkolaborasi</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border overflow-clip">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead>Bergabung</TableHead>
                {isAdmin && <TableHead className="text-right">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-medium">{m.name}</span>
                        {m.role === "owner" && <Crown className="ml-1 inline size-3 text-yellow-500" />}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.email}</TableCell>
                  <TableCell>
                    <Badge className={`font-medium ${ROLE_COLORS[m.role] || ""}`} variant="outline">
                      {ROLE_LABELS[m.role] || m.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(m.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      {m.role !== "owner" && (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedMember(m);
                              setNewRole(m.role === "admin" ? "member" : "admin");
                              setRoleDialogOpen(true);
                            }}
                          >
                            <Shield className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleRemove(m)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Role change dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Peran</DialogTitle>
            <DialogDescription>{selectedMember?.name} — ubah peran anggota tim</DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-4">
            <Field className="gap-1.5">
              <FieldLabel>Peran Baru</FieldLabel>
              <Select value={newRole} onValueChange={(v) => v && setNewRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin — bisa kelola semua</SelectItem>
                  <SelectItem value="member">Teknisi — hanya lihat & update status</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleRoleChange} disabled={updatingRole}>
              {updatingRole ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
