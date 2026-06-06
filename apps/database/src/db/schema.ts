import { relations, type InferSelectModel } from "drizzle-orm";
import * as pg from "drizzle-orm/pg-core";


const taskStatusEnum = pg.pgEnum("status", [
    "PENDING",
    "PROCESSING",
    "COMPLETED",
    "FAILED",
]);

// ─── Conversations ──────────────────────────────────────────────
// Groups related Q&A about the same URL
export const conversations = pg.pgTable("conversations", {
    id: pg.uuid("id").defaultRandom().primaryKey(),
    url: pg.text("url").notNull(),
    title: pg.text("title"),  // Auto-generated from first question
    scrapedContent: pg.text("scraped_content"),  // Cached scraped content
    scrapedAt: pg.timestamp("scraped_at", { withTimezone: true }),
    createdAt: pg.timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: pg.timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Messages ────────────────────────────────────────────────────
// Individual Q&A messages within a conversation
const messageRoleEnum = pg.pgEnum("message_role", ["user", "assistant"]);

export const messages = pg.pgTable("messages", {
    id: pg.uuid("id").defaultRandom().primaryKey(),
    conversationId: pg.uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
    role: messageRoleEnum("role").notNull(),
    content: pg.text("content").notNull(),
    createdAt: pg.timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    conversationIdx: pg.index("messages_conversation_id_idx").on(table.conversationId),
    createdAtIdx: pg.index("messages_created_at_idx").on(table.createdAt),
}));

// ─── Tasks ───────────────────────────────────────────────────────
export const tasks = pg.pgTable("tasks", {
    id: pg.uuid("id").defaultRandom().primaryKey(),
    status: taskStatusEnum("status").notNull().default("PENDING"),

    questionId: pg.uuid("question_id").notNull().references(() => question.id),

    // Link to conversation system (optional for backward compat)
    conversationId: pg.uuid("conversation_id").references(() => conversations.id),
    messageId: pg.uuid("message_id").references(() => messages.id),

    createdAt: pg.timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),

    updatedAt: pg.timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull(),

}, (table) => ({
    statusIdx: pg.index("tasks_status_idx").on(table.status),
    createdAtIdx: pg.index("tasks_created_at_idx").on(table.createdAt),
    conversationIdx: pg.index("tasks_conversation_id_idx").on(table.conversationId),
}))

// ─── Question (legacy) ──────────────────────────────────────────
export const question = pg.pgTable("question", {
    id: pg.uuid("id").defaultRandom().primaryKey(),
    url: pg.text("url").notNull(),
    question: pg.text("question").notNull(),
    createdAt: pg.timestamp("created_at", {withTimezone: true}).defaultNow().notNull(),
    updatedAt: pg.timestamp("updated_at", {withTimezone: true}).defaultNow().notNull()
}, (t) => ({
    questionIdx: pg.index("question_idx").on(t.question),
}));

// ─── Answer (legacy) ────────────────────────────────────────────
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

// ─── Relations ───────────────────────────────────────────────────

export const conversationsRelations = relations(conversations, ({ many }) => ({
    messages: many(messages),
    tasks: many(tasks),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
    conversation: one(conversations, {
        fields: [messages.conversationId],
        references: [conversations.id],
    }),
}));

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
    conversation: one(conversations, {
        fields: [tasks.conversationId],
        references: [conversations.id],
    }),
    message: one(messages, {
        fields: [tasks.messageId],
        references: [messages.id],
    }),
}));

// ─── Inferred TypeScript types ───────────────────────────────────
// Use these in the API, worker, and web app to avoid manual type drift.

export type Conversation = InferSelectModel<typeof conversations>;
export type Message = InferSelectModel<typeof messages>;
export type Task = InferSelectModel<typeof tasks>;
export type Question = InferSelectModel<typeof question>;
export type Answer = InferSelectModel<typeof answer>;

/** The status values a task can hold. */
export type TaskStatus = Task["status"]; // "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"