import { useQuery } from "@tanstack/react-query";
import { getTaskById } from "@/lib/task.api";

export const useTask = (taskId?: string) => {
  return useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => await getTaskById(taskId!),
    enabled: !!taskId,
    refetchInterval(query) {
      const data = query.state.data;
      if (!data) return 2000;
      return data.status === "COMPLETED" || data.status === "FAILED"
        ? false
        : 2000;
    },
  });
};
