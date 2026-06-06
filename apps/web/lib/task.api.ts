import { api } from "./api";
import type { CreateTaskPayload, Task } from "./task.types";

// Re-export so existing imports from this file continue to work
export type { CreateTaskPayload, Task };

export const createTask = async (
  payload: CreateTaskPayload
): Promise<{ taskId: string }> => {
  const { data } = await api.post("/tasks", payload);
  return data;
};

export const getTaskById = async (taskId: string): Promise<Task> => {
  const { data } = await api.get(`/tasks/${taskId}`);
  return data;
};
