import { db } from "@db/index.js";
import { tasks, conversations, messages } from "@db/db/schema.js";
import { eq, asc } from "drizzle-orm";

import {
  markCompleted,
  markFailed,
  markProcessing,
} from "./services/task.services.js";
import { askAI } from "./services/ai.service.js";
import { scrapeWebsite } from "./services/scrape.service.js";

import { redisConnection } from "./config/redis.js"

export const processTaskJobs = async (taskId: string) => {
  try {
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
      columns: {
        id: true,
        conversationId: true,
        messageId: true,
      },
      with: {
        question: {
          columns: {
            url: true,
            question: true,
          }
        }
      }
    });

    if (!task) throw new Error("Task not found.");

    const conversationId = task.conversationId;

    await markProcessing(taskId);
    await redisConnection.publish(`task:${taskId}`, JSON.stringify({
      status: "PROCESSING",
      stage: "ANALYZING",
      progress: 25,
      taskId,
      conversationId,
    }));

    // ─── Scraping (with conversation cache) ─────────────────────
    let webContent: string;

    if (conversationId) {
      // Check if conversation already has cached scraped content
      const conv = await db.query.conversations.findFirst({
        where: eq(conversations.id, conversationId),
        columns: { scrapedContent: true, scrapedAt: true },
      });

      if (conv?.scrapedContent) {
        // Reuse cached content — skip scraping!
        console.log(`♻️ Reusing cached scraped content for conversation ${conversationId}`);
        webContent = conv.scrapedContent;
      } else {
        // First question in this conversation — scrape and cache
        webContent = await scrapeWebsite(task.question.url);
        await db.update(conversations)
          .set({
            scrapedContent: webContent,
            scrapedAt: new Date(),
          })
          .where(eq(conversations.id, conversationId));
      }
    } else {
      // Legacy task without conversation — scrape normally
      webContent = await scrapeWebsite(task.question.url);
    }

    await redisConnection.publish(`task:${taskId}`, JSON.stringify({
      status: "PROCESSING",
      stage: "SCRAPING",
      progress: 40,
      taskId,
      conversationId,
    }));

    // ─── Build conversation context ─────────────────────────────
    let previousMessages: { role: string; content: string }[] = [];

    if (conversationId) {
      const convMessages = await db.query.messages.findMany({
        where: eq(messages.conversationId, conversationId),
        columns: {
          role: true,
          content: true,
          createdAt: true,
        },
        orderBy: [asc(messages.createdAt)],
      });

      // Include up to last 20 messages as context (10 Q&A pairs)
      // Exclude the current question (last user message) since we pass it separately
      previousMessages = convMessages
        .slice(0, -1) // Remove the current question
        .slice(-20);  // Keep last 20 messages
    }

    // ─── AI answer generation ───────────────────────────────────
    const aiAns = await askAI(webContent, task.question.question, previousMessages);

    await redisConnection.publish(`task:${taskId}`, JSON.stringify({
      status: "PROCESSING",
      stage: "AI_THINKING",
      progress: 60,
      taskId,
      conversationId,
    }));

    // ─── Save results ───────────────────────────────────────────
    await markCompleted(taskId, aiAns, conversationId ?? undefined);

    await redisConnection.publish(`task:${taskId}`, JSON.stringify({
      status: "COMPLETED",
      stage: "GENERATING",
      progress: 100,
      taskId,
      conversationId,
      answer: aiAns,
    }));

  } catch (error: any) {
    console.error("❌ Job failed:", error);

    // Attempt to get conversationId for the error event
    let conversationId: string | null = null;
    try {
      const task = await db.query.tasks.findFirst({
        where: eq(tasks.id, taskId),
        columns: { conversationId: true },
      });
      conversationId = task?.conversationId ?? null;
    } catch {}

    await markFailed(taskId, error.message);
    await redisConnection.publish(`task:${taskId}`, JSON.stringify({
      status: "FAILED",
      error: error.message,
      taskId,
      conversationId,
    }));

    throw error;
  }
};
