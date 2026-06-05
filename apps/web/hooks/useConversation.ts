import { useQuery } from "@tanstack/react-query";
import { getConversation } from "@/lib/conversation.api";

export const useConversation = (id: string | null) => {
  return useQuery({
    queryKey: ["conversation", id],
    queryFn: () => getConversation(id!),
    enabled: !!id,
  });
};
