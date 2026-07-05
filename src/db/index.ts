import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";

let db: ReturnType<typeof drizzle> | null = null;

export function getDB() {
  if (!db) {
    const dbFile = process.env.DB_FILE_NAME;
    if (typeof dbFile !== "string")
      throw new Error("No valid DB configuration found in environment.");
    db = drizzle(dbFile);
  }

  return db;
}
