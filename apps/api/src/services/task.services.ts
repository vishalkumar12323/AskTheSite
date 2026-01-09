import {answer, question, tasks} from "@db/db/schema.js";
import {db} from "@db/index.js";
import { eq } from "drizzle-orm";
import { addTaskToQueue } from "./queue.service.js";

export const createTaskService = async (url: string, qt: string) => {
  const taskId = await db.transaction(async(tx) => {
    const [newQuestion] = await tx.insert(question).values({
      url,
      question: qt
    }).returning({id: question.id});

    const [newTask] = await tx.insert(tasks).values({
      status: "PENDING", questionId: newQuestion.id
    }).returning({id: tasks.id});

    return newTask.id;
  });

  await addTaskToQueue(taskId);
  return taskId;
};

export const getTaskService = async (id: string) => {
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, id),
    columns: {
      id: true,
      status: true,
      createdAt: true
    },
    with: {
      question: {
        columns: {
          id: true,
          question: true,
          url: true,
          createdAt: true
        }
      },
      answer: true
    }
  });

  return task;
};
