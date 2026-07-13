import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./index";

const migrationsFolder =
  process.env.DRIZZLE_MIGRATIONS_DIR || "./drizzle";

async function runMigrations() {
  console.log(`Running Drizzle migrations from ${migrationsFolder}...`);
  await migrate(db, { migrationsFolder });
  console.log("Migrations applied successfully");
}

// When run directly as entrypoint
if (import.meta.main) {
  runMigrations()
    .then(() => pool.end())
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}

export { runMigrations };
