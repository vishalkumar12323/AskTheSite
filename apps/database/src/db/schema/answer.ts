import * as pg from "drizzle-orm/pg-core";
import { tasks } from "./task";

export const answer = pg.pgTable("answer", {
    id: pg.uuid("id").defaultRandom().primaryKey(),
    aiAnswer: pg.text("ai_answer"),
    errMessage: pg.text("err_message"),
    websiteUrl: pg.text("website_url"),
    websiteLogo: pg.text("website_logo"),
    websiteHomeUrl: pg.text("website_home_url"),
    websiteSignupUrl: pg.text("website_signup_url"),
    
    taskId: pg.uuid("task_id").notNull().references(() => tasks.id),
    createdAt: pg.timestamp("created_at", {withTimezone: true}).defaultNow(),
    updatedAt: pg.timestamp("updated_at", {withTimezone: true}).defaultNow(),
});