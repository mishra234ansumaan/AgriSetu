import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const dbUrl = new URL(process.env.DATABASE_URL!);

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: dbUrl.hostname,
    port: Number(dbUrl.port || 5432),
    user: decodeURIComponent(dbUrl.username),
    password: decodeURIComponent(dbUrl.password),
    database: dbUrl.pathname.slice(1),
    ssl: true,
  },
});