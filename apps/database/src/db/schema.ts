import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { taskStatusEnum } from "./enums.js";

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    url: text("url").notNull(),
    question: text("question").notNull(),

    status: taskStatusEnum("status").notNull().default("PENDING"),

    aiAnswer: text("ai_answer"),
    errorMessage: text("error_message"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    statusIdx: index("tasks_status_idx").on(table.status),
    createdAtIdx: index("tasks_created_at_idx").on(table.createdAt),
  })
);
