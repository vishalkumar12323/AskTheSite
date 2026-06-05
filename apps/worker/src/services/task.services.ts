import { db } from "@db/index.js";
import { answer, tasks, messages, conversations } from "@db/db/schema.js";
import { eq } from "drizzle-orm";

export const markProcessing = async (taskId: string) => {
  await db
    .update(tasks)
    .set({ status: "PROCESSING", updatedAt: new Date() })
    .where(eq(tasks.id, taskId));
};

export const markCompleted = async (taskId: string, aiAnswer: string, conversationId?: string) => {
  await db.transaction(async (tx) => {
    await tx.update(tasks)
      .set({ status: "COMPLETED", updatedAt: new Date() })
      .where(eq(tasks.id, taskId));

    await tx.insert(answer).values({ aiAnswer, taskId });

    // Save the AI answer as an assistant message in the conversation
    if (conversationId) {
      await tx.insert(messages).values({
        conversationId,
        role: "assistant",
        content: aiAnswer,
      });

      // Update conversation's updatedAt
      await tx.update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));
    }
  });
};

export const markFailed = async (taskId: string, errMessage: string) => {
  await db.transaction(async (tx) => {
    await tx.update(tasks)
      .set({ status: "FAILED", updatedAt: new Date() })
      .where(eq(tasks.id, taskId));

    await tx.insert(answer).values({ errMessage, taskId });

    // Save error as an assistant message so user sees it in chat
    const task = await tx.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
      columns: { conversationId: true },
    });

    if (task?.conversationId) {
      await tx.insert(messages).values({
        conversationId: task.conversationId,
        role: "assistant",
        content: `❌ Error: ${errMessage}`,
      });
    }
  });
};
