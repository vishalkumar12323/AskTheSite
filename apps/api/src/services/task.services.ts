import { tasks } from "../../../database/src/db/schema.js";
import { db } from "../../../database/src/index.js";
import { eq } from "drizzle-orm";
import { addTaskToQueue } from "./queue.service.js";

export const createTaskService = async (url: string, question: string) => {
  const task = await db
    .insert(tasks)
    .values({ url, question })
    .returning({ id: tasks.id });

  await addTaskToQueue(task[0].id);
  return task;
};

export const getTaskService = async (id: string) => {
  const task = await db.select().from(tasks).where(eq(tasks.id, id));
  if (!task) throw new Error("Task not found");
  return task;
};
