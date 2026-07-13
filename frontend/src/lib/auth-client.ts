import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000",
  plugins: [organizationClient()],
});

export const { signUp, signIn, signOut, useSession, organization, useListOrganizations, useActiveOrganization } =
  authClient;
