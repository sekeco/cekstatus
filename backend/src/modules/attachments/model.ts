import { t } from "elysia";

/**
 * Slug + order ID params
 */
export const orderParamsSchema = t.Object({
  slug: t.String(),
  id: t.String(),
});

/**
 * Slug + order ID + attachment ID params
 */
export const attachmentParamsSchema = t.Object({
  slug: t.String(),
  id: t.String(),
  attachmentId: t.String(),
});

/**
 * Upload file body — validated by Elysia's built-in multipart parser
 */
export const uploadBodySchema = t.Object({
  file: t.File({
    type: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    maxSize: "5m",
  }),
});

/**
 * Single attachment response
 */
export const attachmentResponseSchema = t.Object({
  id: t.String(),
  url: t.String(),
  filename: t.Union([t.String(), t.Null()]),
  mimeType: t.Union([t.String(), t.Null()]),
  size: t.Union([t.Number(), t.Null()]),
  createdAt: t.String(),
});

/**
 * Delete response
 */
export const deleteResponseSchema = t.Object({
  success: t.Boolean(),
});

// ── Inferred types ──────────────────────────────────
export type UploadBody = typeof uploadBodySchema.static;
export type AttachmentResponse = typeof attachmentResponseSchema.static;
export type DeleteResponse = typeof deleteResponseSchema.static;
