import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendFollowUp } from "@/lib/conversation.api";

export const useSendFollowUp = (conversationId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (question: string) => {
      if (!conversationId) throw new Error("No active conversation");
      return sendFollowUp(conversationId, question);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      if (conversationId) {
        queryClient.invalidateQueries({
          queryKey: ["conversation", conversationId],
        });
      }
    },
  });
};
