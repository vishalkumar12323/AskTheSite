import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getTaskById } from "@/lib/task.api";
import { useSocket } from "@/hooks/useSocket";

export const useTask = (taskId: string) => {
  const queryClient = useQueryClient();
  const { update } = useSocket(taskId);


  const query = useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => await getTaskById(taskId!),
    enabled: !!taskId
  });

  useEffect(() => {
    if (update?.status === "COMPLETED" || update?.status === "FAILED") {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    }
  }, [update, taskId, queryClient]);

  return { ...query, liveUpdate: update };
};
