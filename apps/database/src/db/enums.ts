import { pgEnum } from "drizzle-orm/pg-core";

export const taskStatusEnum = pgEnum("task_status", [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);
