import { Elysia, t } from "elysia";
import { authPlugin } from "../auth-guard";
import { db } from "../../db";
import { order, orderEvent, customer } from "../../db/schema";
import {
  eq,
  and,
  desc,
  asc,
  count,
  gte,
  lte,
  sql,
} from "drizzle-orm";

export const dashboardRouter = new Elysia({
  tags: ["Dashboard"],
})
  .use(authPlugin)

  .get(
    "/api/organizations/:slug/dashboard",
    async ({ organization }) => {
      const orgId = organization.id;

      // ─── 1. Total orders ────────────────────────────────
      const [totalRow] = await db
        .select({ total: count() })
        .from(order)
        .where(eq(order.organizationId, orgId));
      const totalOrders = totalRow?.total ?? 0;

      // ─── 2. Status distribution ─────────────────────────
      const ordersWithStatus = await db
        .select({
          id: order.id,
          eventValue: orderEvent.value,
          eventLabel: orderEvent.label,
          eventColor: orderEvent.hexColor,
          eventCreatedAt: orderEvent.createdAt,
        })
        .from(order)
        .leftJoin(orderEvent, eq(orderEvent.orderId, order.id))
        .where(eq(order.organizationId, orgId))
        .orderBy(desc(orderEvent.createdAt));

      const latestStatuses = new Map<
        string,
        { value: string; label: string; color: string | null }
      >();
      for (const row of ordersWithStatus) {
        if (!latestStatuses.has(row.id) && row.eventValue) {
          latestStatuses.set(row.id, {
            value: row.eventValue,
            label: row.eventLabel ?? row.eventValue,
            color: row.eventColor,
          });
        }
      }

      const statusCounts: Record<string, number> = {};
      for (const [, status] of latestStatuses) {
        statusCounts[status.value] = (statusCounts[status.value] || 0) + 1;
      }
      const noStatusCount = totalOrders - latestStatuses.size;

      // ─── 3. Orders completed today ──────────────────────
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const [completedTodayRow] = await db
        .select({ total: count() })
        .from(order)
        .where(
          and(
            eq(order.organizationId, orgId),
            gte(order.completedAt ?? new Date(0), todayStart),
          ),
        );
      const completedToday = completedTodayRow?.total ?? 0;

      // ─── 4. Recent activity ─────────────────────────────
      const recentEvents = await db
        .select({
          id: orderEvent.id,
          label: orderEvent.label,
          value: orderEvent.value,
          hexColor: orderEvent.hexColor,
          note: orderEvent.note,
          createdAt: orderEvent.createdAt,
          orderId: orderEvent.orderId,
          orderNumber: order.orderNumber,
          orderLabel: order.label,
        })
        .from(orderEvent)
        .innerJoin(order, eq(orderEvent.orderId, order.id))
        .where(eq(order.organizationId, orgId))
        .orderBy(desc(orderEvent.createdAt))
        .limit(10);

      // ─── 5. Orders trend (last 30 days) ─────────────────
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
      thirtyDaysAgo.setHours(0, 0, 0, 0);

      const ordersByDate = await db
        .select({
          date: sql<string>`DATE(${order.createdAt})`,
          count: count(),
        })
        .from(order)
        .where(
          and(
            eq(order.organizationId, orgId),
            gte(order.createdAt, thirtyDaysAgo),
          ),
        )
        .groupBy(sql`DATE(${order.createdAt})`)
        .orderBy(sql`DATE(${order.createdAt})`);

      // Fill in missing dates with zero
      const trendMap = new Map<string, number>();
      for (const row of ordersByDate) {
        trendMap.set(row.date, Number(row.count));
      }
      const ordersTrend: { date: string; count: number }[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        ordersTrend.push({ date: key, count: trendMap.get(key) ?? 0 });
      }

      // ─── 6. Average service time ─────────────────────────
      const [avgServiceRow] = await db
        .select({
          avgDays: sql<string>`ROUND(AVG(EXTRACT(EPOCH FROM (${order.completedAt} - ${order.createdAt})) / 86400.0), 1)`,
        })
        .from(order)
        .where(
          and(
            eq(order.organizationId, orgId),
            sql`${order.completedAt} IS NOT NULL`,
          ),
        );
      const averageServiceDays =
        avgServiceRow?.avgDays !== undefined
          ? Number(avgServiceRow.avgDays)
          : null;

      // ─── 7. Top customers ────────────────────────────────
      const topCustomers = await db
        .select({
          name: customer.name,
          phone: customer.phone,
          orderCount: count(),
        })
        .from(customer)
        .innerJoin(order, eq(order.customerId, customer.id))
        .where(eq(order.organizationId, orgId))
        .groupBy(customer.id, customer.name, customer.phone)
        .orderBy(desc(count()))
        .limit(5);

      return {
        totalOrders,
        completedToday,
        statusDistribution: statusCounts,
        ordersWithoutStatus: noStatusCount,
        recentActivity: recentEvents.map((e) => ({
          id: e.id,
          orderId: e.orderId,
          label: e.label,
          value: e.value,
          hexColor: e.hexColor,
          note: e.note,
          createdAt:
            typeof e.createdAt === "string"
              ? e.createdAt
              : e.createdAt.toISOString(),
          orderNumber: e.orderNumber,
          orderLabel: e.orderLabel,
        })),
        ordersTrend,
        averageServiceDays,
        topCustomers: topCustomers.map((c) => ({
          name: c.name,
          phone: c.phone,
          orderCount: Number(c.orderCount),
        })),
      };
    },
    { auth: true },
  );
