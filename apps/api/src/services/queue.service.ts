import { taskQueue } from "../queues/task.queue.js";

export const addTaskToQueue = async (taskId: string) => {
  await taskQueue.add("process-task", {
    id: taskId,
  });
};
