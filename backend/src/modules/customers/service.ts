import { db } from "../../db";
import { customer, order } from "../../db/schema";
import { eq, and, asc, like, or, sql, count } from "drizzle-orm";
import type { CreateCustomerInput, UpdateCustomerInput } from "./model";
import { createId } from "@paralleldrive/cuid2";

type CustomerRow = typeof customer.$inferSelect;

function serialize(row: CustomerRow & { orderCount?: number }) {
  return {
    ...row,
    createdAt:
      typeof row.createdAt === "string"
        ? row.createdAt
        : row.createdAt.toISOString(),
    updatedAt:
      typeof row.updatedAt === "string"
        ? row.updatedAt
        : row.updatedAt.toISOString(),
    metadata: row.metadata ?? undefined,
  };
}

export class CustomerService {
  /**
   * List customers with optional search + pagination.
   */
  async list(
    organizationId: string,
    options: { search?: string; limit?: number; offset?: number } = {},
  ) {
    const { search, limit = 50, offset = 0 } = options;

    const conditions = [eq(customer.organizationId, organizationId)];

    if (search) {
      conditions.push(
        or(
          like(customer.name, `%${search}%`),
          like(customer.email ?? "", `%${search}%`),
          like(customer.phone ?? "", `%${search}%`),
        ),
      );
    }

    const rows = await db
      .select({
        id: customer.id,
        organizationId: customer.organizationId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        metadata: customer.metadata,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
        orderCount: sql<number>`count(${order.id})::int`,
      })
      .from(customer)
      .leftJoin(order, eq(order.customerId, customer.id))
      .where(and(...conditions))
      .groupBy(customer.id)
      .orderBy(asc(customer.name))
      .limit(limit)
      .offset(offset);

    return rows.map(serialize);
  }

  /**
   * Get total count of customers (for pagination).
   */
  async count(
    organizationId: string,
    search?: string,
  ): Promise<number> {
    const conditions = [eq(customer.organizationId, organizationId)];

    if (search) {
      conditions.push(
        or(
          like(customer.name, `%${search}%`),
          like(customer.email ?? "", `%${search}%`),
          like(customer.phone ?? "", `%${search}%`),
        ),
      );
    }

    const [row] = await db
      .select({ total: count() })
      .from(customer)
      .where(and(...conditions));

    return row?.total ?? 0;
  }

  /**
   * Get a single customer by ID.
   */
  async getById(organizationId: string, id: string) {
    const [row] = await db
      .select({
        id: customer.id,
        organizationId: customer.organizationId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        metadata: customer.metadata,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
        orderCount: sql<number>`count(${order.id})::int`,
      })
      .from(customer)
      .leftJoin(order, eq(order.customerId, customer.id))
      .where(
        and(
          eq(customer.id, id),
          eq(customer.organizationId, organizationId),
        ),
      )
      .groupBy(customer.id);

    return row ? serialize(row) : null;
  }

  /**
   * Create a new customer.
   */
  async create(organizationId: string, input: CreateCustomerInput) {
    const id = createId();

    await db.insert(customer).values({
      id,
      organizationId,
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      metadata: input.metadata ?? null,
    });

    return this.getById(organizationId, id);
  }

  /**
   * Update an existing customer.
   */
  async update(
    organizationId: string,
    id: string,
    input: UpdateCustomerInput,
  ) {
    const existing = await this.getById(organizationId, id);
    if (!existing) return null;

    await db
      .update(customer)
      .set({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.email !== undefined && { email: input.email ?? null }),
        ...(input.phone !== undefined && { phone: input.phone ?? null }),
        ...(input.metadata !== undefined && { metadata: input.metadata ?? null }),
      })
      .where(
        and(
          eq(customer.id, id),
          eq(customer.organizationId, organizationId),
        ),
      );

    return this.getById(organizationId, id);
  }

  /**
   * Delete a customer. Fails if customer has active orders.
   */
  async delete(organizationId: string, id: string) {
    const existing = await this.getById(organizationId, id);
    if (!existing) return { deleted: false, reason: "not_found" as const };

    // Check for active orders
    if ((existing.orderCount ?? 0) > 0) {
      return {
        deleted: false,
        reason: "has_orders" as const,
        orderCount: existing.orderCount,
      };
    }

    await db
      .delete(customer)
      .where(
        and(
          eq(customer.id, id),
          eq(customer.organizationId, organizationId),
        ),
      );

    return { deleted: true, reason: null as string | null };
  }
}
