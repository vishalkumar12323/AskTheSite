import { api } from "./api";

export interface CreateTaskPayload {
  url: string;
  question: string;
}

export interface Task {
  id: string;
  url: string;
  question: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  aiAnswer?: string;
  errorMessage?: string;
  createdAt: string;
}

export const createTask = async (
  payload: CreateTaskPayload
): Promise<{ taskId: string }> => {
  const { data } = await api.post("/tasks", payload);
  return data;
};

export const getTaskById = async (taskId: string): Promise<Task> => {
  const { data } = await api.get(`/tasks/:${taskId}`);
  return data;
};
