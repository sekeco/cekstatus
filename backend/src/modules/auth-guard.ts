import { Elysia } from "elysia";
import { auth } from "../auth";
import { db } from "../db";
import { member, organization } from "../db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Auth plugin with macro for Elysia.
 *
 * Supports both session cookies and x-api-key headers.
 *
 * Usage:
 *   .use(authPlugin)
 *   .get("/path", ({ user, organization }) => ..., { auth: true })
 *
 * Provides `user`, `organization`, and `memberRole` in context
 * when `{ auth: true }` is set on a route.
 */
export const authPlugin = new Elysia({ name: "auth-plugin" })
  .macro({
    auth: {
      async resolve({ status, request: { headers }, params }) {
        const slug = (params as Record<string, string>)?.slug;

        // ─── Try API key auth first ──────────────────────
        const apiKey = headers.get("x-api-key");
        if (apiKey) {
          try {
            const result = await auth.api.verifyApiKey({
              body: { key: apiKey, configId: "org-keys" },
              headers,
            });

            if (result?.valid && result.key?.referenceId) {
              const orgId = result.key.referenceId;

              // If slug provided, verify it matches
              if (slug) {
                const [org] = await db
                  .select()
                  .from(organization)
                  .where(eq(organization.slug, slug));

                if (!org || org.id !== orgId) {
                  return status(404, {
                    message: "Organization not found",
                  });
                }

                const orgMeta = tryParseJson(org.metadata);
                return {
                  user: { id: "", name: "API Key", email: "" },
                  organization: {
                    id: org.id,
                    name: org.name,
                    slug: org.slug,
                    businessType: orgMeta?.businessType ?? null,
                  },
                  memberRole: "api",
                };
              }

              // No slug - just verify key is valid for some org
              const [org] = await db
                .select()
                .from(organization)
                .where(eq(organization.id, orgId));

              if (!org) {
                return status(404, {
                  message: "Organization not found",
                });
              }

              const orgMeta = tryParseJson(org.metadata);
              return {
                user: { id: "", name: "API Key", email: "" },
                organization: {
                  id: org.id,
                  name: org.name,
                  slug: org.slug,
                  businessType: orgMeta?.businessType ?? null,
                },
                memberRole: "api",
              };
            }
          } catch {
            // API key invalid, fall through to session auth
          }
        }

        // ─── Session cookie auth ─────────────────────────
        const session = await auth.api.getSession({ headers });
        if (!session?.user) {
          return status(401, { message: "Unauthorized — please login" });
        }

        // If no slug in path, just provide user (no org context needed)
        if (!slug) {
          return {
            user: session.user,
          };
        }

        // Organization lookup
        const [org] = await db
          .select()
          .from(organization)
          .where(eq(organization.slug, slug));

        if (!org) {
          return status(404, { message: "Organization not found" });
        }

        // Membership check
        const [membership] = await db
          .select()
          .from(member)
          .where(
            and(
              eq(member.organizationId, org.id),
              eq(member.userId, session.user.id),
            ),
          );

        if (!membership) {
          return status(403, {
            message: "You are not a member of this organization",
          });
        }

        const orgMetadata = tryParseJson(org.metadata);

        return {
          user: session.user,
          organization: {
            id: org.id,
            name: org.name,
            slug: org.slug,
            businessType: orgMetadata?.businessType ?? null,
          },
          memberRole: membership.role,
        };
      },
    },
  });

function tryParseJson(str: string | null): Record<string, unknown> | null {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}
