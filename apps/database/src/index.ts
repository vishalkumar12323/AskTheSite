import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";

export const db = drizzle(process.env.DATABASE_URL!);


// CREATE EXTENSION IF NOT EXISTS "pgcrypto";
// CREATE TYPE status AS ENUM ('PENDING','PROCESSING','COMPLETED','FAILED');