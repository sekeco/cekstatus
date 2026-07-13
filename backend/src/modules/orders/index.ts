import { Elysia, t } from "elysia";
import { authPlugin } from "../auth-guard";
import { OrderService } from "./service";
import {
  createOrderSchema,
  updateOrderSchema,
  updateStatusSchema,
  orderResponseSchema,
  orderListResponseSchema,
  orderEventResponseSchema,
  listOrdersQuerySchema,
  exportQuerySchema,
} from "./model";

const service = new OrderService();

// Shared param schemas — include `slug` from parent prefix
const slugParam = t.Object({ slug: t.String() });
const idParam = t.Object({ slug: t.String(), id: t.String() });

export const ordersRouter = new Elysia({
  prefix: "/api/organizations/:slug/orders",
  tags: ["Orders"],
})
  .use(authPlugin)

  // ─── List ──────────────────────────────────────────────
  .get(
    "/",
    async ({ organization, query }) => {
      return service.list(organization.id, query);
    },
    {
      auth: true,
      params: slugParam,
      query: listOrdersQuerySchema,
      response: orderListResponseSchema,
    },
  )

  // ─── Get by ID ─────────────────────────────────────────
  .get(
    "/:id",
    async ({ organization, params: { id }, error }) => {
      const row = await service.getById(organization.id, id);
      if (!row) return error(404, { message: "Order not found" });
      return row;
    },
    {
      auth: true,
      params: idParam,
      response: orderResponseSchema,
    },
  )

  // ─── Get Events (Timeline) ────────────────────────────
  .get(
    "/:id/events",
    async ({ organization, params: { id }, error }) => {
      const events = await service.getEvents(organization.id, id);
      if (events === null) return error(404, { message: "Order not found" });
      return events;
    },
    {
      auth: true,
      params: idParam,
      response: t.Array(orderEventResponseSchema),
    },
  )

  // ─── Create ────────────────────────────────────────────
  .post(
    "/",
    async ({ organization, user, body }) => {
      return service.create(organization.id, user.id, body);
    },
    {
      auth: true,
      params: slugParam,
      body: createOrderSchema,
      response: orderResponseSchema,
    },
  )

  // ─── Update ────────────────────────────────────────────
  .patch(
    "/:id",
    async ({ organization, params: { id }, body, error }) => {
      const updated = await service.update(organization.id, id, body);
      if (!updated) return error(404, { message: "Order not found" });
      return updated;
    },
    {
      auth: true,
      params: idParam,
      body: updateOrderSchema,
      response: orderResponseSchema,
    },
  )

  // ─── Update Status ─────────────────────────────────────
  .patch(
    "/:id/status",
    async ({ organization, user, params: { id }, body, error }) => {
      const result = await service.updateStatus(
        organization.id,
        id,
        user.id,
        body,
      );
      if (!result) return error(404, { message: "Order not found" });
      return result;
    },
    {
      auth: true,
      params: idParam,
      body: updateStatusSchema,
      response: t.Object({
        event: orderEventResponseSchema,
        order: orderResponseSchema,
      }),
    },
  )

  // ─── Export CSV ─────────────────────────────────────────
  .get(
    "/export",
    async ({ organization, query, set }) => {
      const result = await service.exportCSV(organization.id, query);
      set.headers["Content-Type"] = "text/csv; charset=utf-8";
      set.headers["Content-Disposition"] = `attachment; filename="${result.filename}"`;
      return result.csv;
    },
    {
      auth: true,
      params: slugParam,
      query: exportQuerySchema,
    },
  )

  // ─── Delete ────────────────────────────────────────────
  .delete(
    "/:id",
    async ({ organization, params: { id }, error }) => {
      const deleted = await service.delete(organization.id, id);
      if (!deleted) return error(404, { message: "Order not found" });
      return { success: true };
    },
    {
      auth: true,
      params: idParam,
      response: t.Object({ success: t.Boolean() }),
    },
  );
