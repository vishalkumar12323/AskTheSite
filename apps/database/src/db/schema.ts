import { relations } from "drizzle-orm";
import * as pg from "drizzle-orm/pg-core";


const taskStatusEnum = pg.pgEnum("status", [
    "PENDING",
    "PROCESSING",
    "COMPLETED",
    "FAILED",
]);

export const tasks = pg.pgTable("tasks", {
    id: pg.uuid("id").defaultRandom().primaryKey(),
    status: taskStatusEnum("status").notNull().default("PENDING"),

    questionId: pg.uuid("question_id").notNull().references(() => question.id),
    createdAt: pg.timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),

    updatedAt: pg.timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull(),

}, (table) => ({
    statusIdx: pg.index("tasks_status_idx").on(table.status),
    createdAtIdx: pg.index("tasks_created_at_idx").on(table.createdAt),
}))


export const question = pg.pgTable("question", {
    id: pg.uuid("id").defaultRandom().primaryKey(),
    url: pg.text("url").notNull(),
    question: pg.text("question").notNull(),
    createdAt: pg.timestamp("created_at", {withTimezone: true}),
    updatedAt: pg.timestamp("updated_at", {withTimezone: true})
}, (t) => ({
    questionIdx: pg.index("question_idx").on(t.question),
}));

export const answer = pg.pgTable("answer", {
    id: pg.uuid("id").defaultRandom().primaryKey(),
    aiAnswer: pg.text("ai_answer"),
    errMessage: pg.text("err_message"),
    websiteUrl: pg.text("website_url"),
    websiteLogo: pg.text("website_logo"),
    websiteSignupUrl: pg.text("website_signup_url"),
    
    taskId: pg.uuid("task_id").notNull().references(() => tasks.id),
    createdAt: pg.timestamp("created_at", {withTimezone: true}).defaultNow(),
    updatedAt: pg.timestamp("updated_at", {withTimezone: true}).defaultNow(),
});

export const answersRelations = relations(answer, ({ one }) => ({
  // Answer belongs to ONE Task
  task: one(tasks, {
    fields: [answer.taskId], 
    references: [tasks.id], 
  }),
}));


export const questionRelation = relations(question, ({one}) => ({
    question: one(tasks)
}));

























export const taskRelations = relations(tasks, ({ one }) => ({
    question: one(question, {
        fields: [tasks.questionId],
        references: [question.id]
    }),
    answer: one(answer),
}));