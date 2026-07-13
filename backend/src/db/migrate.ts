import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./index";

const migrationsFolder =
  process.env.DRIZZLE_MIGRATIONS_DIR || "./drizzle";

async function runMigrations() {
  try {
    console.log(`⏳ Running Drizzle migrations from ${migrationsFolder}...`);
    await migrate(db, { migrationsFolder });
    console.log("✅ Migrations applied successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

export { runMigrations };
