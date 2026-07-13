import { db } from "../../db";
import {
  order,
  orderEvent,
  orderStatusTemplate,
  customer,
  user,
  organization,
} from "../../db/schema";
import {
  eq,
  and,
  asc,
  desc,
  like,
  or,
  sql,
  count,
  lt,
  gte,
  lte,
} from "drizzle-orm";
import type { CreateOrderInput, UpdateOrderInput, UpdateStatusInput } from "./model";
import { createId } from "@paralleldrive/cuid2";

type OrderRow = typeof order.$inferSelect & {
  customerName?: string | null;
  currentStatusLabel?: string | null;
  currentStatusValue?: string | null;
  currentStatusHexColor?: string | null;
};

function serialize(row: OrderRow) {
  return {
    id: row.id,
    organizationId: row.organizationId,
    orderNumber: row.orderNumber,
    customerId: row.customerId,
    customerName: row.customerName ?? null,
    label: row.label ?? null,
    problemDescription: row.problemDescription,
    estimatedCost: row.estimatedCost ? Number(row.estimatedCost) : null,
    finalCost: row.finalCost ? Number(row.finalCost) : null,
    eta: row.eta
      ? typeof row.eta === "string"
        ? row.eta
        : row.eta.toISOString()
      : null,
    etaValue: row.etaValue ?? null,
    priority: row.priority,
    currency: row.currency,
    internalNotes: row.internalNotes ?? null,
    metadata: row.metadata ?? undefined,
    completedAt: row.completedAt
      ? typeof row.completedAt === "string"
        ? row.completedAt
        : row.completedAt.toISOString()
      : null,
    createdAt:
      typeof row.createdAt === "string"
        ? row.createdAt
        : row.createdAt.toISOString(),
    updatedAt:
      typeof row.updatedAt === "string"
        ? row.updatedAt
        : row.updatedAt.toISOString(),
    currentStatus:
      row.currentStatusLabel
        ? {
            label: row.currentStatusLabel,
            value: row.currentStatusValue ?? "",
            hexColor: row.currentStatusHexColor ?? null,
          }
        : undefined,
  };
}

export class OrderService {
  /**
   * Generate the next order number for an organization.
   * Format: TRK-YYYYMM-NNN
   */
  private async generateOrderNumber(organizationId: string): Promise<string> {
    const now = new Date();
    const prefix = `TRK-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-`;

    // Find the highest number globally for this month
    const [last] = await db
      .select({ num: order.orderNumber })
      .from(order)
      .where(like(order.orderNumber, `${prefix}%`))
      .orderBy(desc(order.orderNumber))
      .limit(1);

    let next = 1;
    if (last) {
      const parts = last.num.split("-");
      next = (parseInt(parts[2] ?? "0", 10) || 0) + 1;
    }

    return `${prefix}${String(next).padStart(3, "0")}`;
  }

  /**
   * Get the first status template as default initial status.
   */
  private async getDefaultStatus(organizationId: string) {
    const [status] = await db
      .select()
      .from(orderStatusTemplate)
      .where(eq(orderStatusTemplate.organizationId, organizationId))
      .orderBy(asc(orderStatusTemplate.sequence))
      .limit(1);
    return status ?? null;
  }

  /**
   * Get a status template by value.
   */
  private async getStatusByValue(organizationId: string, value: string) {
    const [status] = await db
      .select()
      .from(orderStatusTemplate)
      .where(
        and(
          eq(orderStatusTemplate.organizationId, organizationId),
          eq(orderStatusTemplate.value, value),
        ),
      );
    return status ?? null;
  }

  /**
   * List orders with search, filter, pagination.
   */
  async list(
    organizationId: string,
    options: {
      search?: string;
      status?: string;
      priority?: string;
      limit?: number;
      offset?: number;
    } = {},
  ) {
    const {
      search,
      status,
      priority,
      limit = 50,
      offset = 0,
    } = options;

    const conditions = [eq(order.organizationId, organizationId)];

    if (priority) {
      conditions.push(eq(order.priority, priority));
    }

    // For status filter, find orders whose latest event matches
    if (status) {
      // Subquery: find latest event value for each order
      const latestEvent = db
        .select({
          orderId: orderEvent.orderId,
          eventValue: orderEvent.value,
        })
        .from(orderEvent)
        .where(
          eq(orderEvent.orderId, order.id),
        )
        .orderBy(desc(orderEvent.createdAt))
        .limit(1)
        .as("latest_event");

      conditions.push(eq(sql`${latestEvent}.event_value`, status));
    }

    if (search) {
      conditions.push(
        or(
          like(order.orderNumber, `%${search}%`),
          like(order.label ?? "", `%${search}%`),
          like(order.problemDescription, `%${search}%`),
        ),
      );
    }

    // Get total count
    const [totalRow] = await db
      .select({ total: count() })
      .from(order)
      .where(and(...conditions));
    const total = totalRow?.total ?? 0;

    // Get paginated orders with customer name and latest status
    const rows = await db
      .select({
        id: order.id,
        organizationId: order.organizationId,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        customerName: customer.name,
        label: order.label,
        problemDescription: order.problemDescription,
        estimatedCost: order.estimatedCost,
        finalCost: order.finalCost,
        eta: order.eta,
        etaValue: order.etaValue,
        priority: order.priority,
        currency: order.currency,
        internalNotes: order.internalNotes,
        metadata: order.metadata,
        completedAt: order.completedAt,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      })
      .from(order)
      .leftJoin(customer, eq(order.customerId, customer.id))
      .where(and(...conditions))
      .orderBy(desc(order.createdAt))
      .limit(limit)
      .offset(offset);

    // For each order, get the latest status event
    const result = [];
    for (const row of rows) {
      const [latestEvent] = await db
        .select({
          label: orderEvent.label,
          value: orderEvent.value,
          hexColor: orderEvent.hexColor,
        })
        .from(orderEvent)
        .where(eq(orderEvent.orderId, row.id))
        .orderBy(desc(orderEvent.createdAt))
        .limit(1);

      result.push(
        serialize({
          ...row,
          customerName: row.customerName ?? null,
          currentStatusLabel: latestEvent?.label ?? null,
          currentStatusValue: latestEvent?.value ?? null,
          currentStatusHexColor: latestEvent?.hexColor ?? null,
        }),
      );
    }

    return { data: result, total, limit, offset };
  }

  /**
   * Get a single order by ID with full details.
   */
  async getById(organizationId: string, id: string) {
    const [row] = await db
      .select({
        id: order.id,
        organizationId: order.organizationId,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        customerName: customer.name,
        label: order.label,
        problemDescription: order.problemDescription,
        estimatedCost: order.estimatedCost,
        finalCost: order.finalCost,
        eta: order.eta,
        etaValue: order.etaValue,
        priority: order.priority,
        currency: order.currency,
        internalNotes: order.internalNotes,
        metadata: order.metadata,
        completedAt: order.completedAt,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      })
      .from(order)
      .leftJoin(customer, eq(order.customerId, customer.id))
      .where(
        and(
          eq(order.id, id),
          eq(order.organizationId, organizationId),
        ),
      );

    if (!row) return null;

    // Get latest status event
    const [latestEvent] = await db
      .select({
        label: orderEvent.label,
        value: orderEvent.value,
        hexColor: orderEvent.hexColor,
      })
      .from(orderEvent)
      .where(eq(orderEvent.orderId, row.id))
      .orderBy(desc(orderEvent.createdAt))
      .limit(1);

    return serialize({
      ...row,
      customerName: row.customerName ?? null,
      currentStatusLabel: latestEvent?.label ?? null,
      currentStatusValue: latestEvent?.value ?? null,
      currentStatusHexColor: latestEvent?.hexColor ?? null,
    });
  }

  /**
   * Get events/timeline for an order.
   */
  async getEvents(organizationId: string, orderId: string) {
    const [ord] = await db
      .select({ id: order.id })
      .from(order)
      .where(
        and(
          eq(order.id, orderId),
          eq(order.organizationId, organizationId),
        ),
      );
    if (!ord) return null;

    const events = await db
      .select()
      .from(orderEvent)
      .where(eq(orderEvent.orderId, orderId))
      .orderBy(asc(orderEvent.createdAt));

    return events.map((e) => ({
      ...e,
      createdAt:
        typeof e.createdAt === "string"
          ? e.createdAt
          : e.createdAt.toISOString(),
    }));
  }

  /**
   * Create a new order with initial status event.
   */
  async create(
    organizationId: string,
    userId: string,
    input: CreateOrderInput,
  ) {
    const id = createId();
    const orderNumber = await this.generateOrderNumber(organizationId);

    // Get initial status
    let statusTemplate = input.initialStatus
      ? await this.getStatusByValue(organizationId, input.initialStatus)
      : null;
    if (!statusTemplate) {
      statusTemplate = await this.getDefaultStatus(organizationId);
    }

    // Parse eta if provided as string
    const etaDate = input.eta ? new Date(input.eta) : null;

    await db.insert(order).values({
      id,
      organizationId,
      orderNumber,
      customerId: input.customerId ?? null,
      label: input.label ?? null,
      problemDescription: input.problemDescription,
      estimatedCost: input.estimatedCost ? String(input.estimatedCost) : null,
      finalCost: input.finalCost ? String(input.finalCost) : null,
      eta: etaDate,
      etaValue: input.etaValue ?? null,
      priority: input.priority ?? "normal",
      currency: input.currency ?? "IDR",
      internalNotes: input.internalNotes ?? null,
      metadata: input.metadata ?? null,
    });

    // Create initial status event
    if (statusTemplate) {
      await db.insert(orderEvent).values({
        id: createId(),
        orderId: id,
        label: statusTemplate.label,
        value: statusTemplate.value,
        icon: statusTemplate.icon,
        description: statusTemplate.description,
        hexColor: statusTemplate.hexColor,
        note: null,
        createdBy: userId,
      });
    }

    return this.getById(organizationId, id);
  }

  /**
   * Update order details.
   */
  async update(
    organizationId: string,
    id: string,
    input: UpdateOrderInput,
  ) {
    const existing = await this.getById(organizationId, id);
    if (!existing) return null;

    await db
      .update(order)
      .set({
        ...(input.label !== undefined && { label: input.label }),
        ...(input.problemDescription !== undefined && {
          problemDescription: input.problemDescription,
        }),
        ...(input.estimatedCost !== undefined && {
          estimatedCost: String(input.estimatedCost),
        }),
        ...(input.finalCost !== undefined && {
          finalCost: String(input.finalCost),
        }),
        ...(input.eta !== undefined && { eta: input.eta ? new Date(input.eta) : null }),
        ...(input.etaValue !== undefined && { etaValue: input.etaValue }),
        ...(input.priority !== undefined && { priority: input.priority }),
        ...(input.currency !== undefined && { currency: input.currency }),
        ...(input.internalNotes !== undefined && {
          internalNotes: input.internalNotes,
        }),
        ...(input.metadata !== undefined && { metadata: input.metadata }),
        ...(input.customerId !== undefined && { customerId: input.customerId }),
      })
      .where(
        and(
          eq(order.id, id),
          eq(order.organizationId, organizationId),
        ),
      );

    return this.getById(organizationId, id);
  }

  /**
   * Update order status — creates a new OrderEvent entry for the timeline.
   */
  async updateStatus(
    organizationId: string,
    orderId: string,
    userId: string,
    input: UpdateStatusInput,
  ) {
    const [ord] = await db
      .select()
      .from(order)
      .where(
        and(
          eq(order.id, orderId),
          eq(order.organizationId, organizationId),
        ),
      );
    if (!ord) return null;

    // Look up the status template for label/color
    const statusTemplate = await this.getStatusByValue(
      organizationId,
      input.status,
    );

    // Check if status is "selesai" or "diambil" → set completedAt
    const isTerminal =
      input.status === "selesai" || input.status === "diambil";
    if (isTerminal && !ord.completedAt) {
      await db
        .update(order)
        .set({ completedAt: new Date() })
        .where(eq(order.id, orderId));
    } else if (!isTerminal && ord.completedAt) {
      // If moving back from terminal, clear completedAt
      await db
        .update(order)
        .set({ completedAt: null })
        .where(eq(order.id, orderId));
    }

    // Create event
    const eventId = createId();
    await db.insert(orderEvent).values({
      id: eventId,
      orderId,
      label: statusTemplate?.label ?? input.status,
      value: input.status,
      icon: statusTemplate?.icon ?? null,
      description: statusTemplate?.description ?? null,
      hexColor: statusTemplate?.hexColor ?? null,
      note: input.note ?? null,
      createdBy: userId,
    });

    const [event] = await db
      .select()
      .from(orderEvent)
      .where(eq(orderEvent.id, eventId));

    return {
      event: event
        ? {
            ...event,
            createdAt:
              typeof event.createdAt === "string"
                ? event.createdAt
                : event.createdAt.toISOString(),
          }
        : null,
      order: await this.getById(organizationId, orderId),
    };
  }

  /**
   * Export orders as CSV.
   */
  async exportCSV(
    organizationId: string,
    options: {
      search?: string;
      status?: string;
      priority?: string;
      startDate?: string;
      endDate?: string;
    } = {},
  ) {
    const { search, status, priority, startDate, endDate } = options;

    // Get org name for the report
    const [org] = await db
      .select({ name: organization.name })
      .from(organization)
      .where(eq(organization.id, organizationId));

    const conditions = [eq(order.organizationId, organizationId)];

    if (priority) {
      conditions.push(eq(order.priority, priority));
    }

    // Date range filter — berdasarkan createdAt
    if (startDate) {
      conditions.push(gte(order.createdAt, new Date(startDate)));
    }
    if (endDate) {
      // Set to end of day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(order.createdAt, end));
    }

    if (status) {
      const latestEvent = db
        .select({
          orderId: orderEvent.orderId,
          eventValue: orderEvent.value,
        })
        .from(orderEvent)
        .where(eq(orderEvent.orderId, order.id))
        .orderBy(desc(orderEvent.createdAt))
        .limit(1)
        .as("latest_event");

      conditions.push(eq(sql`${latestEvent}.event_value`, status));
    }

    if (search) {
      conditions.push(
        or(
          like(order.orderNumber, `%${search}%`),
          like(order.label ?? "", `%${search}%`),
          like(order.problemDescription, `%${search}%`),
        ),
      );
    }

    const rows = await db
      .select({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: customer.name,
        label: order.label,
        problemDescription: order.problemDescription,
        estimatedCost: order.estimatedCost,
        finalCost: order.finalCost,
        etaValue: order.etaValue,
        priority: order.priority,
        internalNotes: order.internalNotes,
        completedAt: order.completedAt,
        createdAt: order.createdAt,
      })
      .from(order)
      .leftJoin(customer, eq(order.customerId, customer.id))
      .where(and(...conditions))
      .orderBy(desc(order.createdAt));

    // Map latest status per order
    const result = [];
    for (const row of rows) {
      const [latestEvent] = await db
        .select({
          label: orderEvent.label,
          value: orderEvent.value,
          hexColor: orderEvent.hexColor,
        })
        .from(orderEvent)
        .where(eq(orderEvent.orderId, row.id))
        .orderBy(desc(orderEvent.createdAt))
        .limit(1);

      const fmtDate = (d: Date | string | null) => {
        if (!d) return "";
        const dt = typeof d === "string" ? new Date(d) : d;
        return dt.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      };

      const estimated = row.estimatedCost ? Number(row.estimatedCost) : null;
      const final = row.finalCost ? Number(row.finalCost) : null;

      result.push({
        "Kode Tracking": row.orderNumber,
        Pelanggan: row.customerName ?? "-",
        Barang: row.label ?? "-",
        Keluhan: row.problemDescription,
        Status: latestEvent?.label ?? "-",
        Prioritas: row.priority,
        "Estimasi Biaya": estimated ? `Rp ${estimated.toLocaleString("id-ID")}` : "-",
        "Biaya Final": final ? `Rp ${final.toLocaleString("id-ID")}` : "-",
        Estimasi: row.etaValue ? String(row.etaValue) : "-",
        Catatan: row.internalNotes ?? "-",
        "Tanggal Masuk": fmtDate(row.createdAt),
        "Tanggal Selesai": fmtDate(row.completedAt),
      });
    }

    // Build CSV
    const headers = Object.keys(result[0] ?? {});
    const escapeCSV = (val: string) => {
      if (val.includes(",") || val.includes('"') || val.includes("\n")) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const lines: string[] = [];
    // BOM for Excel UTF-8 support
    lines.push("\uFEFF");
    // Report header
    const dateStr = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    lines.push(`Laporan Pesanan - ${org?.name ?? ""}`);
    lines.push(`Tanggal export: ${dateStr}`);
    lines.push("");
    // Column headers
    lines.push(headers.join(","));
    // Data rows
    for (const row of result) {
      const values = headers.map((h) => escapeCSV(String((row as Record<string, string>)[h] ?? "")));
      lines.push(values.join(","));
    }

    // Summary
    lines.push("");
    lines.push(`Total Pesanan,${result.length}`);

    return {
      csv: lines.join("\n"),
      filename: `laporan-pesanan-${org?.name?.toLowerCase().replace(/\s+/g, "-") ?? "export"}-${new Date().toISOString().slice(0, 10)}.csv`,
    };
  }

  /**
   * Delete an order and its events.
   */
  async delete(organizationId: string, id: string) {
    const existing = await this.getById(organizationId, id);
    if (!existing) return false;

    await db
      .delete(order)
      .where(
        and(
          eq(order.id, id),
          eq(order.organizationId, organizationId),
        ),
      );

    return true;
  }
}
