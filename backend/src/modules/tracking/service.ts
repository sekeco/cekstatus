import { db } from "../../db";
import { order, organization, orderEvent, member, attachment } from "../../db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

type OrderRow = typeof order.$inferSelect;

function serializeEvent(e: typeof orderEvent.$inferSelect) {
  return {
    ...e,
    createdAt:
      typeof e.createdAt === "string"
        ? e.createdAt
        : e.createdAt.toISOString(),
  };
}

export class TrackingService {
  /**
   * Track an order by its order number (public, no auth).
   * Returns the order with current status, timeline, attachments, and org info.
   */
  async track(orderNumber: string) {
    // 1. Find the order
    // Find the order — order by newest first in case of duplicates
    const [ord] = await db
      .select()
      .from(order)
      .where(eq(order.orderNumber, orderNumber))
      .orderBy(desc(order.createdAt));

    if (!ord) {
      return { found: false as const };
    }

    // 2. Get org settings
    const [org] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, ord.organizationId));

    // 3. Get latest status event
    const [latestEvent] = await db
      .select()
      .from(orderEvent)
      .where(eq(orderEvent.orderId, ord.id))
      .orderBy(desc(orderEvent.createdAt))
      .limit(1);

    // 4. Get all timeline events
    const events = await db
      .select()
      .from(orderEvent)
      .where(eq(orderEvent.orderId, ord.id))
      .orderBy(asc(orderEvent.createdAt));

    // 5. Get attachments (photos)
    const attachments = await db
      .select({
        id: attachment.id,
        url: attachment.url,
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        size: attachment.size,
      })
      .from(attachment)
      .where(
        and(
          eq(attachment.organizationId, ord.organizationId),
          eq(attachment.orderId, ord.id),
        ),
      )
      .orderBy(asc(attachment.createdAt));

    // 6. Parse org metadata for settings
    const orgMeta = org?.metadata ? tryParseJson(org.metadata) : null;

    return {
      found: true as const,
      order: {
        orderNumber: ord.orderNumber,
        label: ord.label,
        problemDescription: ord.problemDescription,
        estimatedCost: ord.estimatedCost
          ? Number(ord.estimatedCost)
          : null,
        finalCost: ord.finalCost ? Number(ord.finalCost) : null,
        etaValue: ord.etaValue,
        completedAt: ord.completedAt
          ? typeof ord.completedAt === "string"
            ? ord.completedAt
            : ord.completedAt.toISOString()
          : null,
        createdAt:
          typeof ord.createdAt === "string"
            ? ord.createdAt
            : ord.createdAt.toISOString(),
        currentStatus: latestEvent
          ? {
              label: latestEvent.label,
              value: latestEvent.value,
              hexColor: latestEvent.hexColor,
            }
          : { label: "Unknown", value: "unknown", hexColor: null },
        events: events.map(serializeEvent),
        attachments: attachments.map((a) => ({
          id: a.id,
          url: a.url,
          filename: a.filename,
          mimeType: a.mimeType,
          size: a.size,
        })),
      },
      organization: org
        ? {
            name: org.name,
            slogan: null as string | null,
            address: null as string | null,
            phone: null as string | null,
            whatsapp: null as string | null,
            email: null as string | null,
            website: null as string | null,
            businessHours: null as string | null,
            logo: org.logo,
          }
        : null,
    };
  }
}

function tryParseJson(str: string | null): Record<string, unknown> | null {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}
