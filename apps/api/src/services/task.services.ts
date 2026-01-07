import { question, tasks } from "../../../database/src/db/schema";
import { db } from "../../../database/src/index.js";
import { eq } from "drizzle-orm";
import { addTaskToQueue } from "./queue.service.js";

export const createTaskService = async (url: string, qt: string) => {
  const taskId = await db.transaction(async (tx) => {
    // Inserting question and returing its id.
    const [newQuestion] = await tx.insert(question).values({
      url, question: qt
    }).returning({id: question.id});

    const [newTask] = await tx.insert(tasks).values({
      questionId: newQuestion.id,
      status: "PENDING",
    }).returning({id: tasks.id});

    return newTask.id;
  });

  await addTaskToQueue(taskId);
  return taskId;
};

export const getTaskService = async (id: string) => {
  const task = await db.select().from(tasks).where(eq(tasks.id, id));
  if (!task) throw new Error("Task not found");
  return task;
};
