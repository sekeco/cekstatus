import { Elysia, t } from "elysia";
import { authPlugin } from "../auth-guard";
import { CustomerService } from "./service";
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerResponseSchema,
  customerListResponseSchema,
  listCustomersQuerySchema,
} from "./model";

const slugParam = t.Object({ slug: t.String() });
const idParam = t.Object({ slug: t.String(), id: t.String() });

const service = new CustomerService();

export const customersRouter = new Elysia({
  prefix: "/api/organizations/:slug/customers",
  tags: ["Customers"],
})
  .use(authPlugin)

  // ─── List ──────────────────────────────────────────────
  .get(
    "/",
    async ({ organization, query }) => {
      const rows = await service.list(organization.id, query);
      const total = await service.count(organization.id, query.search);
      return { data: rows, total, limit: query.limit ?? 50, offset: query.offset ?? 0 };
    },
    {
      auth: true,
      params: slugParam,
      query: listCustomersQuerySchema,
    },
  )

  // ─── Get by ID ─────────────────────────────────────────
  .get(
    "/:id",
    async ({ organization, params: { id }, error }) => {
      const row = await service.getById(organization.id, id);
      if (!row) return error(404, { message: "Customer not found" });
      return row;
    },
    {
      auth: true,
      params: idParam,
      response: customerResponseSchema,
    },
  )

  // ─── Create ────────────────────────────────────────────
  .post(
    "/",
    async ({ organization, body }) => {
      return service.create(organization.id, body);
    },
    {
      auth: true,
      params: slugParam,
      body: createCustomerSchema,
      response: customerResponseSchema,
    },
  )

  // ─── Update ────────────────────────────────────────────
  .patch(
    "/:id",
    async ({ organization, params: { id }, body, error }) => {
      const updated = await service.update(organization.id, id, body);
      if (!updated) return error(404, { message: "Customer not found" });
      return updated;
    },
    {
      auth: true,
      params: idParam,
      body: updateCustomerSchema,
      response: customerResponseSchema,
    },
  )

  // ─── Delete ────────────────────────────────────────────
  .delete(
    "/:id",
    async ({ organization, params: { id }, error }) => {
      const result = await service.delete(organization.id, id);
      if (!result.deleted) {
        if (result.reason === "not_found") {
          return error(404, { message: "Customer not found" });
        }
        if (result.reason === "has_orders") {
          return error(409, {
            message: `Customer has ${result.orderCount} active order(s). Remove them first.`,
          });
        }
      }
      return { success: true };
    },
    {
      auth: true,
      params: idParam,
      response: t.Object({ success: t.Boolean() }),
    },
  );
