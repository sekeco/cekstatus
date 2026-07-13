import { t } from "elysia";
import type { Static } from "@sinclair/typebox";

// ─── Create ──────────────────────────────────────────────
export const createCustomerSchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
  email: t.Optional(t.String({ format: "email", maxLength: 255 })),
  phone: t.Optional(t.String({ maxLength: 50 })),
  metadata: t.Optional(t.Record(t.String(), t.Any())),
});

export type CreateCustomerInput = Static<typeof createCustomerSchema>;

// ─── Update ──────────────────────────────────────────────
export const updateCustomerSchema = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  email: t.Optional(t.String({ format: "email", maxLength: 255 })),
  phone: t.Optional(t.String({ maxLength: 50 })),
  metadata: t.Optional(t.Record(t.String(), t.Any())),
});

export type UpdateCustomerInput = Static<typeof updateCustomerSchema>;

// ─── Response ────────────────────────────────────────────
export const customerResponseSchema = t.Object({
  id: t.String(),
  organizationId: t.String(),
  name: t.String(),
  email: t.Union([t.String(), t.Null()]),
  phone: t.Union([t.String(), t.Null()]),
  metadata: t.Optional(t.Record(t.String(), t.Any())),
  createdAt: t.String(),
  updatedAt: t.String(),
  orderCount: t.Optional(t.Number()),
});

export type CustomerResponse = Static<typeof customerResponseSchema>;

export const customerListResponseSchema = t.Array(customerResponseSchema);

// ─── Query ───────────────────────────────────────────────
export const listCustomersQuerySchema = t.Object({
  search: t.Optional(t.String({ maxLength: 100 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 50 })),
  offset: t.Optional(t.Number({ minimum: 0, default: 0 })),
});
