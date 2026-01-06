import * as pg from "drizzle-orm/pg-core";
import { tasks } from "./task";

export const question = pg.pgTable("question", {
    id: pg.uuid("id").defaultRandom().primaryKey(),
    url: pg.text("url").notNull(),
    question: pg.text("question").notNull(),
    taskId: pg.uuid('task_id').notNull().references(() => tasks.id),
    createdAt: pg.timestamp("created_at", {withTimezone: true}),
    updatedAt: pg.timestamp("updated_at", {withTimezone: true})
}, (t) => ({
    questionIdx: pg.index("question_idx").on(t.question),
}));