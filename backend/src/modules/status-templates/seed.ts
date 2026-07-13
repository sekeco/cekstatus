import { Elysia } from "elysia";
import { authPlugin } from "../auth-guard";
import { StatusTemplateService } from "./service";

const service = new StatusTemplateService();

export const statusSeedRouter = new Elysia({
  tags: ["Status"],
})
  .use(authPlugin)

  // Called by frontend after creating an org via Better Auth
  .post(
    "/api/organizations/:slug/status-templates/seed",
    async ({ organization }) => {
      await service.seedDefaults(
        organization.id,
        organization.businessType || "lainnya",
      );
      const templates = await service.list(organization.id);
      return {
        seeded: true,
        count: templates.length,
        templates,
      };
    },
    { auth: true },
  );
