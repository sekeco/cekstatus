import { Elysia, t } from "elysia";
import { authPlugin } from "../auth-guard";
import { StatusTemplateService } from "./service";
import {
  createStatusSchema,
  updateStatusSchema,
  statusListResponseSchema,
  statusResponseSchema,
} from "./model";

const service = new StatusTemplateService();

export const statusTemplatesRouter = new Elysia({
  prefix: "/api/organizations/:slug/status-templates",
  tags: ["Status"],
})
  .use(authPlugin)

  // ─── List ──────────────────────────────────────────────
  .get(
    "/",
    async ({ organization }) => {
      return service.list(organization.id);
    },
    {
      auth: true,
      response: statusListResponseSchema,
    },
  )

  // ─── Get by ID ─────────────────────────────────────────
  .get(
    "/:id",
    async ({ organization, params: { id }, error }) => {
      const status = await service.getById(organization.id, id);
      if (!status) return error(404, { message: "Status not found" });
      return status;
    },
    {
      auth: true,
      params: t.Object({ id: t.String() }),
      response: statusResponseSchema,
    },
  )

  // ─── Create ────────────────────────────────────────────
  .post(
    "/",
    async ({ organization, body, error }) => {
      const existingList = await service.list(organization.id);
      if (existingList.some((s) => s.value === body.value)) {
        return error(409, { message: `Status "${body.value}" already exists` });
      }
      return service.create(organization.id, body);
    },
    {
      auth: true,
      body: createStatusSchema,
      response: statusResponseSchema,
    },
  )

  // ─── Update ────────────────────────────────────────────
  .patch(
    "/:id",
    async ({ organization, params: { id }, body, error }) => {
      const updated = await service.update(organization.id, id, body);
      if (!updated) return error(404, { message: "Status not found" });
      return updated;
    },
    {
      auth: true,
      params: t.Object({ id: t.String() }),
      body: updateStatusSchema,
      response: statusResponseSchema,
    },
  )

  // ─── Delete ────────────────────────────────────────────
  .delete(
    "/:id",
    async ({ organization, params: { id }, error }) => {
      const deleted = await service.delete(organization.id, id);
      if (!deleted) return error(404, { message: "Status not found" });
      return { success: true };
    },
    {
      auth: true,
      params: t.Object({ id: t.String() }),
      response: t.Object({ success: t.Boolean() }),
    },
  );
