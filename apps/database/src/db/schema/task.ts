import * as pg from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm"
import { question } from "./question";
import { answer } from "./answer";

const taskStatusEnum = pg.pgEnum("status", [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);


export const tasks = pg.pgTable(
  "tasks",
  {
    id: pg.uuid("id").defaultRandom().primaryKey(),
    status: taskStatusEnum("status").notNull().default("PENDING"),

    questionId: pg.uuid("question_id").notNull().references(() => question.id),
    createdAt: pg.timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: pg.timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    statusIdx: pg.index("tasks_status_idx").on(table.status),
    createdAtIdx: pg.index("tasks_created_at_idx").on(table.createdAt),
  })
);

export const taskRelations = relations(tasks, ({one}) => ({
  question: one(question, {
    fields: [tasks.questionId],
    references: [question.id]
  }),
  answer: one(answer),
}));