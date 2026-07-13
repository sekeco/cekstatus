import { Elysia, t } from "elysia";
import { authPlugin } from "../auth-guard";
import { db } from "../../db";
import { member, user } from "../../db/schema";
import { eq, and } from "drizzle-orm";

const slugParam = t.Object({ slug: t.String() });
const memberIdParam = t.Object({ slug: t.String(), memberId: t.String() });

const memberResponseSchema = t.Object({
  id: t.String(),
  userId: t.String(),
  name: t.String(),
  email: t.String(),
  image: t.Union([t.String(), t.Null()]),
  role: t.String(),
  createdAt: t.String(),
});

export const membersRouter = new Elysia({
  prefix: "/api/organizations/:slug/members",
  tags: ["Members"],
})
  .use(authPlugin)

  // ─── List Members ──────────────────────────────────
  .get(
    "/",
    async ({ organization }) => {
      const rows = await db
        .select({
          id: member.id,
          userId: member.userId,
          name: user.name,
          email: user.email,
          image: user.image,
          role: member.role,
          createdAt: member.createdAt,
        })
        .from(member)
        .innerJoin(user, eq(member.userId, user.id))
        .where(eq(member.organizationId, organization.id))
        .orderBy(member.createdAt);

      return rows.map((row) => ({
        ...row,
        createdAt:
          typeof row.createdAt === "string"
            ? row.createdAt
            : row.createdAt.toISOString(),
      }));
    },
    {
      auth: true,
      params: slugParam,
      response: t.Array(memberResponseSchema),
    },
  )

  // ─── Update Role (Admin only) ──────────────────────
  .patch(
    "/:memberId/role",
    async ({ organization, memberRole, params: { memberId }, body, error }) => {
      // Only owner/admin can change roles
      if (memberRole !== "owner" && memberRole !== "admin") {
        return error(403, {
          message: "Hanya owner atau admin yang bisa mengubah peran anggota",
        });
      }

      const [existing] = await db
        .select()
        .from(member)
        .where(
          and(
            eq(member.id, memberId),
            eq(member.organizationId, organization.id),
          ),
        );

      if (!existing) {
        return error(404, { message: "Anggota tidak ditemukan" });
      }

      // Cannot change owner's role
      if (existing.role === "owner") {
        return error(403, {
          message: "Tidak bisa mengubah peran owner",
        });
      }

      await db
        .update(member)
        .set({ role: body.role })
        .where(eq(member.id, memberId));

      return { success: true };
    },
    {
      auth: true,
      params: memberIdParam,
      body: t.Object({
        role: t.Enum({
          admin: "admin",
          member: "member",
        }),
      }),
      response: t.Object({ success: t.Boolean() }),
    },
  )

  // ─── Remove Member (Admin only) ────────────────────
  .delete(
    "/:memberId",
    async ({ organization, memberRole, params: { memberId }, error }) => {
      if (memberRole !== "owner" && memberRole !== "admin") {
        return error(403, {
          message: "Hanya owner atau admin yang bisa menghapus anggota",
        });
      }

      const [existing] = await db
        .select()
        .from(member)
        .where(
          and(
            eq(member.id, memberId),
            eq(member.organizationId, organization.id),
          ),
        );

      if (!existing) {
        return error(404, { message: "Anggota tidak ditemukan" });
      }

      if (existing.role === "owner") {
        return error(403, {
          message: "Tidak bisa menghapus owner",
        });
      }

      await db
        .delete(member)
        .where(
          and(
            eq(member.id, memberId),
            eq(member.organizationId, organization.id),
          ),
        );

      return { success: true };
    },
    {
      auth: true,
      params: memberIdParam,
      response: t.Object({ success: t.Boolean() }),
    },
  );
