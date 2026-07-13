import { Elysia, t } from "elysia";
import { authPlugin } from "../auth-guard";
import { db } from "../../db";
import { organization as orgTable } from "../../db/schema";
import { eq } from "drizzle-orm";

const profileSchema = t.Object({
  slogan: t.Optional(t.String({ maxLength: 200 })),
  address: t.Optional(t.String({ maxLength: 500 })),
  phone: t.Optional(t.String({ maxLength: 50 })),
  whatsapp: t.Optional(t.String({ maxLength: 50 })),
  email: t.Optional(t.String({ maxLength: 255 })),
  website: t.Optional(t.String({ maxLength: 255 })),
  businessHours: t.Optional(t.String({ maxLength: 200 })),
  defaultEstimationUnit: t.Optional(t.Union([t.Literal("hours"), t.Literal("days")])),
});

const settingFields = [
  "slogan", "address", "phone", "whatsapp",
  "email", "website", "businessHours", "defaultEstimationUnit",
] as const;

export const settingsRouter = new Elysia({
  tags: ["Settings"],
})
  .use(authPlugin)

  // ─── Get settings ──────────────────────────────────────
  .get(
    "/api/organizations/:slug/settings",
    async ({ organization }) => {
      const [org] = await db
        .select()
        .from(orgTable)
        .where(eq(orgTable.id, organization.id));

      if (!org) {
        return { name: organization.name, slug: organization.slug };
      }

      const meta = tryParseJson(org.metadata);
      return {
        name: org.name,
        slug: org.slug,
        businessType: organization.businessType,
        ...pick(meta ?? {}, settingFields),
      };
    },
    { auth: true },
  )

  // ─── Update settings ───────────────────────────────────
  .patch(
    "/api/organizations/:slug/settings",
    async ({ organization, body }) => {
      const [org] = await db
        .select()
        .from(orgTable)
        .where(eq(orgTable.id, organization.id));

      if (!org) {
        return { success: false, message: "Organization not found" };
      }

      const existingMeta = tryParseJson(org.metadata) ?? {};
      const updatedMeta = { ...existingMeta, ...body };

      await db
        .update(orgTable)
        .set({ metadata: JSON.stringify(updatedMeta) })
        .where(eq(orgTable.id, organization.id));

      return { success: true, ...pick(updatedMeta, settingFields) };
    },
    {
      auth: true,
      body: profileSchema,
    },
  );

function tryParseJson(str: string | null): Record<string, unknown> | null {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function pick<T extends Record<string, unknown>, K extends keyof T & string>(
  obj: T,
  keys: readonly K[],
): Record<K, T[K]> {
  const result = {} as Record<K, T[K]>;
  for (const key of keys) {
    if (key in obj) result[key] = obj[key];
  }
  return result;
}
