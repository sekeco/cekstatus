import { t } from "elysia";
import type { Static } from "@sinclair/typebox";

export const trackingParamsSchema = t.Object({
  orderNumber: t.String({ minLength: 1 }),
});

export const trackingEventSchema = t.Object({
  label: t.String(),
  value: t.String(),
  hexColor: t.Union([t.String(), t.Null()]),
  note: t.Union([t.String(), t.Null()]),
  createdAt: t.String(),
});

export const trackingResponseSchema = t.Object({
  found: t.Boolean(),
  order: t.Optional(
    t.Object({
      orderNumber: t.String(),
      label: t.Union([t.String(), t.Null()]),
      problemDescription: t.String(),
      estimatedCost: t.Union([t.Number(), t.Null()]),
      finalCost: t.Union([t.Number(), t.Null()]),
      etaValue: t.Union([t.Number(), t.Null()]),
      completedAt: t.Union([t.String(), t.Null()]),
      createdAt: t.String(),
      currentStatus: t.Object({
        label: t.String(),
        value: t.String(),
        hexColor: t.Union([t.String(), t.Null()]),
      }),
      events: t.Array(trackingEventSchema),
      attachments: t.Array(
        t.Object({
          id: t.String(),
          url: t.String(),
          filename: t.Union([t.String(), t.Null()]),
          mimeType: t.Union([t.String(), t.Null()]),
          size: t.Union([t.Number(), t.Null()]),
        }),
      ),
    }),
  ),
  organization: t.Optional(
    t.Object({
      name: t.String(),
      slogan: t.Optional(t.String()),
      address: t.Optional(t.String()),
      phone: t.Optional(t.String()),
      whatsapp: t.Optional(t.String()),
      email: t.Optional(t.String()),
      website: t.Optional(t.String()),
      businessHours: t.Optional(t.String()),
      logo: t.Optional(t.String()),
    }),
  ),
});
