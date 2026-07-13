import { t } from "elysia";
import type { Static } from "@sinclair/typebox";

// ─── Create ──────────────────────────────────────────────
export const createOrderSchema = t.Object({
  customerId: t.Optional(t.String()),
  label: t.Optional(t.String({ maxLength: 200 })),
  problemDescription: t.String({ minLength: 1, maxLength: 2000 }),
  estimatedCost: t.Optional(t.Number()),
  finalCost: t.Optional(t.Number()),
  eta: t.Optional(t.String()), // ISO date string
  etaValue: t.Optional(t.Number({ minimum: 0 })),
  priority: t.Optional(t.Enum({ low: "low", normal: "normal", high: "high", urgent: "urgent" })),
  currency: t.Optional(t.String({ maxLength: 10, default: "IDR" })),
  internalNotes: t.Optional(t.String({ maxLength: 2000 })),
  metadata: t.Optional(t.Record(t.String(), t.Any())),
  initialStatus: t.Optional(t.String()), // status value, defaults to first status template
});

export type CreateOrderInput = Static<typeof createOrderSchema>;

// ─── Update ──────────────────────────────────────────────
export const updateOrderSchema = t.Object({
  label: t.Optional(t.String({ maxLength: 200 })),
  problemDescription: t.Optional(t.String({ minLength: 1, maxLength: 2000 })),
  estimatedCost: t.Optional(t.Number()),
  finalCost: t.Optional(t.Number()),
  eta: t.Optional(t.String()),
  etaValue: t.Optional(t.Number({ minimum: 0 })),
  priority: t.Optional(t.Enum({ low: "low", normal: "normal", high: "high", urgent: "urgent" })),
  currency: t.Optional(t.String({ maxLength: 10 })),
  internalNotes: t.Optional(t.String({ maxLength: 2000 })),
  metadata: t.Optional(t.Record(t.String(), t.Any())),
  customerId: t.Optional(t.String()),
});

export type UpdateOrderInput = Static<typeof updateOrderSchema>;

// ─── Update Status ───────────────────────────────────────
export const updateStatusSchema = t.Object({
  status: t.String({ minLength: 1 }),
  note: t.Optional(t.String({ maxLength: 1000 })),
});

export type UpdateStatusInput = Static<typeof updateStatusSchema>;

// ─── Response ────────────────────────────────────────────
export const orderEventResponseSchema = t.Object({
  id: t.String(),
  orderId: t.String(),
  label: t.String(),
  value: t.String(),
  icon: t.Union([t.String(), t.Null()]),
  description: t.Union([t.String(), t.Null()]),
  hexColor: t.Union([t.String(), t.Null()]),
  note: t.Union([t.String(), t.Null()]),
  createdBy: t.Union([t.String(), t.Null()]),
  createdAt: t.String(),
});

export type OrderEventResponse = Static<typeof orderEventResponseSchema>;

export const orderResponseSchema = t.Object({
  id: t.String(),
  organizationId: t.String(),
  orderNumber: t.String(),
  customerId: t.Union([t.String(), t.Null()]),
  customerName: t.Union([t.String(), t.Null()]),
  label: t.Union([t.String(), t.Null()]),
  problemDescription: t.String(),
  estimatedCost: t.Union([t.Number(), t.Null()]),
  finalCost: t.Union([t.Number(), t.Null()]),
  eta: t.Union([t.String(), t.Null()]),
  etaValue: t.Union([t.Number(), t.Null()]),
  priority: t.String(),
  currency: t.String(),
  internalNotes: t.Union([t.String(), t.Null()]),
  metadata: t.Optional(t.Record(t.String(), t.Any())),
  completedAt: t.Union([t.String(), t.Null()]),
  createdAt: t.String(),
  updatedAt: t.String(),
  currentStatus: t.Optional(
    t.Object({
      label: t.String(),
      value: t.String(),
      hexColor: t.Union([t.String(), t.Null()]),
    }),
  ),
});

export type OrderResponse = Static<typeof orderResponseSchema>;

export const orderListResponseSchema = t.Object({
  data: t.Array(orderResponseSchema),
  total: t.Number(),
  limit: t.Number(),
  offset: t.Number(),
});

// ─── Query ───────────────────────────────────────────────
export const listOrdersQuerySchema = t.Object({
  search: t.Optional(t.String({ maxLength: 100 })),
  status: t.Optional(t.String()),
  priority: t.Optional(t.String()),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 50 })),
  offset: t.Optional(t.Number({ minimum: 0, default: 0 })),
});

// ─── Export Query ─────────────────────────────────────────
export const exportQuerySchema = t.Object({
  search: t.Optional(t.String({ maxLength: 100 })),
  status: t.Optional(t.String()),
  priority: t.Optional(t.String()),
  startDate: t.Optional(t.String()),
  endDate: t.Optional(t.String()),
});
