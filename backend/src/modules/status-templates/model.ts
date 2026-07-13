import { t } from "elysia";
import type { Static } from "@sinclair/typebox";

/**
 * Status template model — validation schemas for status CRUD.
 */

// ─── Create ──────────────────────────────────────────────
export const createStatusSchema = t.Object({
  label: t.String({ minLength: 1, maxLength: 50 }),
  value: t.String({ minLength: 1, maxLength: 50 }),
  icon: t.Optional(t.String({ maxLength: 50 })),
  description: t.Optional(t.String({ maxLength: 200 })),
  hexColor: t.Optional(
    t.String({
      pattern: "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$",
    }),
  ),
  sequence: t.Optional(t.Number({ minimum: 0 })),
});

export type CreateStatusInput = Static<typeof createStatusSchema>;

// ─── Update ──────────────────────────────────────────────
export const updateStatusSchema = t.Object({
  label: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
  value: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
  icon: t.Optional(t.String({ maxLength: 50 })),
  description: t.Optional(t.String({ maxLength: 200 })),
  hexColor: t.Optional(
    t.String({
      pattern: "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$",
    }),
  ),
  sequence: t.Optional(t.Number({ minimum: 0 })),
});

export type UpdateStatusInput = Static<typeof updateStatusSchema>;

// ─── Response ────────────────────────────────────────────
export const statusResponseSchema = t.Object({
  id: t.String(),
  organizationId: t.String(),
  label: t.String(),
  value: t.String(),
  icon: t.Union([t.String(), t.Null()]),
  description: t.Union([t.String(), t.Null()]),
  hexColor: t.Union([t.String(), t.Null()]),
  sequence: t.Number(),
  createdAt: t.String(),
});

export type StatusResponse = Static<typeof statusResponseSchema>;

export const statusListResponseSchema = t.Array(statusResponseSchema);
