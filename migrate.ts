import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "../shared/schema";

// Database connection for migrations
async function runMigration() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  console.log("Running database migrations...");
  
  // Use a separate connection for migrations
  const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(migrationClient, { schema });
  
  try {
    // Create tables directly based on schema
    await migrate(db, { migrationsFolder: "drizzle" });
    console.log("Database migrations completed successfully!");
  } catch (error) {
    console.error("Error running migrations:", error);
    process.exit(1);
  } finally {
    await migrationClient.end();
  }
}

runMigration().catch(console.error);