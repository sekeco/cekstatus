import { Elysia, t } from "elysia";
import { authPlugin } from "../auth-guard";
import { db } from "../../db";
import {
  order,
  orderEvent,
  organization as orgTable,
  member,
  user,
} from "../../db/schema";
import {
  eq,
  and,
  desc,
  count,
  gte,
  sql,
} from "drizzle-orm";
import { sendEmail } from "../../lib/email";

/**
 * Daily / periodic report generator for organization owners.
 *
 * POST /api/organizations/:slug/dashboard/report
 * Scans recent data and sends a rekap email to admin members.
 */
export const reportRouter = new Elysia({
  tags: ["Reports"],
})
  .use(authPlugin)

  .post(
    "/api/organizations/:slug/dashboard/report",
    async ({ organization }) => {
      const orgId = organization.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      // ─── Stats ──────────────────────────────────────────
      const [totalRow] = await db
        .select({ total: count() })
        .from(order)
        .where(eq(order.organizationId, orgId));
      const totalOrders = totalRow?.total ?? 0;

      const [newThisWeekRow] = await db
        .select({ total: count() })
        .from(order)
        .where(
          and(
            eq(order.organizationId, orgId),
            gte(order.createdAt, weekAgo),
          ),
        );
      const newThisWeek = newThisWeekRow?.total ?? 0;

      const [completedTodayRow] = await db
        .select({ total: count() })
        .from(order)
        .where(
          and(
            eq(order.organizationId, orgId),
            gte(order.createdAt, today),
            sql`${order.completedAt} IS NOT NULL`,
          ),
        );
      const completedToday = completedTodayRow?.total ?? 0;

      // ─── Get admin members ──────────────────────────────
      const admins = await db
        .select({ email: user.email, name: user.name })
        .from(member)
        .innerJoin(user, eq(member.userId, user.id))
        .where(
          and(
            eq(member.organizationId, orgId),
            sql`${member.role} IN ('owner', 'admin')`,
          ),
        );

      const [org] = await db
        .select({ name: orgTable.name })
        .from(orgTable)
        .where(eq(orgTable.id, orgId));

      const businessName = org?.name ?? "Bisnis";

      // ─── Send email to each admin ───────────────────────
      const subject = `📊 Rekap ${businessName} — ${today.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`;
      const text = `
Halo!

Berikut rekap bisnis ${businessName}:

├─ Total Pesanan: ${totalOrders}
├─ Pesanan Baru (7 hari): ${newThisWeek}
├─ Selesai Hari Ini: ${completedToday}

Butuh laporan lengkap? Buka dashboard:
${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard

— CekStatus
      `.trim();

      for (const admin of admins) {
        if (admin.email) {
          await sendEmail({ to: admin.email, subject, text });
        }
      }

      return {
        sent: true,
        recipients: admins.length,
        stats: { totalOrders, newThisWeek, completedToday },
      };
    },
    {
      auth: true,
      response: t.Object({
        sent: t.Boolean(),
        recipients: t.Number(),
        stats: t.Object({
          totalOrders: t.Number(),
          newThisWeek: t.Number(),
          completedToday: t.Number(),
        }),
      }),
    },
  );
