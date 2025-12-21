import { taskQueue } from "src/queues/task.queue";

export const addTaskToQueue = async (taskId: string) => {
  await taskQueue.add("process-task", {
    id: taskId,
  });
};
