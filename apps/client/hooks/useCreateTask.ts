import { useMutation } from "@tanstack/react-query";
import { createTask } from "@/lib/task.api";

export const useCreateTask = () => {
  return useMutation({
    mutationFn: createTask,
  });
};
