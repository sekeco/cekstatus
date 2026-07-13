import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema",
  schemaFilter: ["public"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
