import { Elysia, status } from "elysia";
import { t } from "elysia";
import { db } from "../../db";
import { organization as orgTable } from "../../db/schema";
import { eq } from "drizzle-orm";
import { TrackingService } from "./service";
import { trackingParamsSchema, trackingResponseSchema } from "./model";

const service = new TrackingService();

const settingFields = [
  "slogan", "address", "phone", "whatsapp",
  "email", "website", "businessHours",
] as const;

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

const publicOrgResponseSchema = t.Object({
  name: t.String(),
  slug: t.String(),
  logo: t.Union([t.String(), t.Null()]),
  businessType: t.Union([t.String(), t.Null()]),
  slogan: t.Optional(t.String()),
  address: t.Optional(t.String()),
  phone: t.Optional(t.String()),
  whatsapp: t.Optional(t.String()),
  email: t.Optional(t.String()),
  website: t.Optional(t.String()),
  businessHours: t.Optional(t.String()),
});

export const trackingRouter = new Elysia({
  tags: ["Tracking"],
})

  // ─── Public org profile — no auth required ─────────────
  .get(
    "/api/organizations/:slug/public",
    async ({ params: { slug }, set }) => {
      const [org] = await db
        .select()
        .from(orgTable)
        .where(eq(orgTable.slug, slug));

      if (!org) {
        set.status = 404;
        return { message: "Toko tidak ditemukan" };
      }

      const meta = tryParseJson(org.metadata) ?? {};

      return {
        name: org.name,
        slug: org.slug,
        logo: org.logo,
        businessType: org.businessType,
        ...pick(meta as Record<string, unknown>, settingFields),
      };
    },
    {
      params: t.Object({ slug: t.String() }),
    },
  )

  // ─── Public tracking — no auth required ────────────────
  .get(
    "/api/track/:orderNumber",
    async ({ params: { orderNumber }, set }) => {
      const result = await service.track(orderNumber);
      if (!result.found) {
        set.status = 404;
        return {
          found: false,
          message: "Kode tracking tidak ditemukan.",
        };
      }
      return result;
    },
    {
      params: trackingParamsSchema,
    },
  );
