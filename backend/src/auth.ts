import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";
import { organization } from "better-auth/plugins";
import { apiKey } from "@better-auth/api-key";
import { sendEmail } from "./lib/email";
import { StatusTemplateService } from "./modules/status-templates/service";

const statusTemplateService = new StatusTemplateService();

export const auth = betterAuth({
  baseURL: process.env.BACKEND_URL || "http://localhost:8000",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: 256,
    sendResetPassword: async ({ user, url }, request) => {
      await sendEmail({
        to: user.email,
        subject: "Reset password CekStatus",
        text: `Klik link berikut untuk reset password: ${url}`,
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }, request) => {
      await sendEmail({
        to: user.email,
        subject: "Verifikasi email CekStatus",
        text: `Klik link berikut untuk verifikasi email: ${url}`,
      });
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },
  plugins: [
    apiKey({
      configId: "org-keys",
      defaultPrefix: "cekstatus_",
      references: "organization",
      enableMetadata: true,
      rateLimit: {
        enabled: true,
        timeWindow: 1000 * 60 * 60,
        maxRequests: 1000,
      },
    }),
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 1,
      membershipLimit: 2,
      creatorRole: "owner",
      defaultOrganizationIdField: "slug",
      invitationExpiresIn: 60 * 60 * 24 * 7, // 7 days
      sendInvitationEmail: async (data) => {
        const { email, organization, inviter, invitation } = data;
        await sendEmail({
          to: email,
          subject: `Bergabung dengan ${organization.name} di CekStatus`,
          text: `${inviter.user.name} mengundang Anda bergabung dengan ${organization.name}. Klik: ${process.env.FRONTEND_URL || "http://localhost:3000"}/accept-invite?id=${invitation.id}`,
        });
      },
      hooks: {
        organization: {
          afterCreate: async ({ organization: org }) => {
            try {
              console.log("afterCreate hook fired for org:", org.id, org.name);
              const metadata =
                typeof org.metadata === "string"
                  ? tryParseJson(org.metadata)
                  : (org.metadata as Record<string, unknown> | null);
              console.log("Parsed metadata:", metadata);
              const businessType =
                (metadata?.businessType as string) || "lainnya";
              console.log("Business type:", businessType);
              await statusTemplateService.seedDefaults(org.id, businessType);
              console.log("Seeded status templates successfully");
            } catch (err) {
              console.error("Failed to seed status templates:", err);
            }
          },
        },
      },
    }),
  ],
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, newEmail, url, token }, request) => {
        await sendEmail({
          to: user.email,
          subject: "Konfirmasi perubahan email CekStatus",
          text: `Klik link berikut untuk menyetujui perubahan email ke ${newEmail}: ${url}`,
        });
      },
    },
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, url, token }, request) => {
        await sendEmail({
          to: user.email,
          subject: "Konfirmasi hapus akun CekStatus",
          text: `Klik link berikut untuk menghapus akun Anda: ${url}`,
        });
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    crossSubDomainCookies: {
      enabled: false,
    },
  },
  rateLimit: {
    enabled: true,
    window: 60, // 1 minute
    max: 100,
  },
  trustedOrigins: [process.env.FRONTEND_URL || "http://localhost:3000"],
});

function tryParseJson(str: string | null): Record<string, unknown> | null {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}
