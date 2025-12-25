CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE TYPE status AS ENUM ('PENDING','PROCESSING','COMPLETED','FAILED');

CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"question" text NOT NULL,
	"status" "status" DEFAULT 'PENDING' NOT NULL,
	"ai_answer" text,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tasks_created_at_idx" ON "tasks" USING btree ("created_at");