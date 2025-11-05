import { db } from "./db";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

async function migrate() {
  console.log("Running migrations...");
  
  const migrationFile = path.join(process.cwd(), "drizzle", "0000_initial.sql");
  const migrationSQL = fs.readFileSync(migrationFile, "utf8");
  
  await db.execute(sql.raw(migrationSQL));
  
  console.log("Migrations completed successfully!");
  process.exit(0);
}

migrate().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
