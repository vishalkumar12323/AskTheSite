import { conversations, messages, tasks, question } from "@db/db/schema.js";
import { db } from "@db/index.js";
import { eq, desc, sql } from "drizzle-orm";
import { addTaskToQueue } from "./queue.service.js";

/**
 * Create a new conversation with the first question.
 * - Creates conversation record
 * - Creates user message
 * - Creates legacy question + task records
 * - Queues the task for processing
 */
export const createConversationService = async (url: string, qt: string) => {
  const result = await db.transaction(async (tx) => {
    // 1. Create conversation
    const [conv] = await tx.insert(conversations).values({
      url,
      title: qt.slice(0, 100), // Auto-title from first question
    }).returning({ id: conversations.id });

    // 2. Create user message
    const [userMsg] = await tx.insert(messages).values({
      conversationId: conv.id,
      role: "user",
      content: qt,
    }).returning({ id: messages.id });

    // 3. Create legacy question record (backward compat)
    const [newQuestion] = await tx.insert(question).values({
      url,
      question: qt,
    }).returning({ id: question.id });

    // 4. Create task linked to conversation + message
    const [newTask] = await tx.insert(tasks).values({
      status: "PENDING",
      questionId: newQuestion.id,
      conversationId: conv.id,
      messageId: userMsg.id,
    }).returning({ id: tasks.id });

    return { conversationId: conv.id, taskId: newTask.id };
  });

  await addTaskToQueue(result.taskId);
  return result;
};

/**
 * List all conversations with metadata.
 * Ordered by most recently updated first.
 */
export const listConversationsService = async () => {
  const convs = await db.query.conversations.findMany({
    columns: {
      id: true,
      url: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [desc(conversations.updatedAt)],
    with: {
      messages: {
        columns: { id: true },
      },
    },
  });

  return convs.map((c) => ({
    id: c.id,
    url: c.url,
    title: c.title,
    messageCount: c.messages.length,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));
};

/**
 * Get a single conversation with all messages in chronological order.
 */
export const getConversationService = async (id: string) => {
  const conv = await db.query.conversations.findFirst({
    where: eq(conversations.id, id),
    columns: {
      id: true,
      url: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
    with: {
      messages: {
        columns: {
          id: true,
          role: true,
          content: true,
          createdAt: true,
        },
        orderBy: (messages, { asc }) => [asc(messages.createdAt)],
      },
      tasks: {
        columns: {
          id: true,
          status: true,
        },
        orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
        limit: 1,
      },
    },
  });

  return conv;
};

/**
 * Send a follow-up question in an existing conversation.
 * Reuses cached scraped content — no re-scraping needed.
 */
export const addFollowUpService = async (conversationId: string, qt: string) => {
  const conv = await db.query.conversations.findFirst({
    where: eq(conversations.id, conversationId),
    columns: { id: true, url: true },
  });

  if (!conv) throw new Error("Conversation not found");

  const result = await db.transaction(async (tx) => {
    // 1. Add user message
    const [userMsg] = await tx.insert(messages).values({
      conversationId,
      role: "user",
      content: qt,
    }).returning({ id: messages.id });

    // 2. Create legacy question record
    const [newQuestion] = await tx.insert(question).values({
      url: conv.url,
      question: qt,
    }).returning({ id: question.id });

    // 3. Create task
    const [newTask] = await tx.insert(tasks).values({
      status: "PENDING",
      questionId: newQuestion.id,
      conversationId,
      messageId: userMsg.id,
    }).returning({ id: tasks.id });

    // 4. Update conversation's updatedAt
    await tx.update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));

    return { taskId: newTask.id, messageId: userMsg.id };
  });

  await addTaskToQueue(result.taskId);
  return result;
};
