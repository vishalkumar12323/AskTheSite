import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createConversation } from "@/lib/conversation.api";

export const useCreateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};
