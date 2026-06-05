import { useQuery } from "@tanstack/react-query";
import { listConversations } from "@/lib/conversation.api";

export const useConversations = () => {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: listConversations,
  });
};
