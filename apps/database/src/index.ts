import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import * as postgres from "postgres";
import * as schema from "./db/schema"


const connectionURI = process.env.DATABASE_URL!;

const client = postgres(connectionURI);

export const db = drizzle(client, {schema})


// CREATE EXTENSION IF NOT EXISTS "pgcrypto";
// CREATE TYPE status AS ENUM ('PENDING','PROCESSING','COMPLETED','FAILED');