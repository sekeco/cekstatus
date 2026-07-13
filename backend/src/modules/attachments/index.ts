import { Elysia, t } from "elysia";
import { authPlugin } from "../auth-guard";
import { AttachmentService } from "./service";
import {
  orderParamsSchema,
  attachmentParamsSchema,
  uploadBodySchema,
  attachmentResponseSchema,
  deleteResponseSchema,
} from "./model";

const service = new AttachmentService();

export const attachmentsRouter = new Elysia({
  prefix: "/api/organizations/:slug/orders/:id/attachments",
  name: "attachments",
  tags: ["Attachments"],
})
  .use(authPlugin)
  .model({
    "attachment.upload": uploadBodySchema,
    "attachment.response": attachmentResponseSchema,
    "attachment.delete": deleteResponseSchema,
  })

  // ─── Upload ──────────────────────────────────────
  .post(
    "/",
    async ({ body: { file }, organization, params: { id }, error }) => {
      const result = await service.upload(organization.id, id, file);
      if (!result) {
        return error(404, { message: "Order tidak ditemukan" });
      }
      return result;
    },
    {
      auth: true,
      params: orderParamsSchema,
      body: "attachment.upload",
      response: "attachment.response",
    },
  )

  // ─── List ────────────────────────────────────────
  .get(
    "/",
    async ({ organization, params: { id }, error }) => {
      const result = await service.list(organization.id, id);
      if (result === null) {
        return error(404, { message: "Order tidak ditemukan" });
      }
      return result;
    },
    {
      auth: true,
      params: orderParamsSchema,
      response: t.Array(attachmentResponseSchema),
    },
  )

  // ─── Delete ──────────────────────────────────────
  .delete(
    "/:attachmentId",
    async ({ organization, params: { attachmentId }, error }) => {
      const deleted = await service.delete(
        organization.id,
        attachmentId,
      );
      if (!deleted) {
        return error(404, { message: "Attachment tidak ditemukan" });
      }
      return { success: true };
    },
    {
      auth: true,
      params: attachmentParamsSchema,
      response: "attachment.delete",
    },
  );
