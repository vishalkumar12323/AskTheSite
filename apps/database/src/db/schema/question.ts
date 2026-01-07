import * as pg from "drizzle-orm/pg-core";
import { tasks } from "./task";
import { relations } from "drizzle-orm";

export const question = pg.pgTable("question", {
    id: pg.uuid("id").defaultRandom().primaryKey(),
    url: pg.text("url").notNull(),
    question: pg.text("question").notNull(),
    createdAt: pg.timestamp("created_at", {withTimezone: true}),
    updatedAt: pg.timestamp("updated_at", {withTimezone: true})
}, (t) => ({
    questionIdx: pg.index("question_idx").on(t.question),
}));


export const questionRelation = relations(question, ({one}) => ({
    question: one(tasks)
}));